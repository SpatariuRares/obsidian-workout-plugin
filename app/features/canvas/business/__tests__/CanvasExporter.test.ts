import { TFile, TFolder } from "obsidian";
import { CanvasExporter } from "@app/features/canvas/business/CanvasExporter";
import type { CanvasExportOptions } from "@app/features/canvas/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";

const mockFindGroups = jest.fn();
// t() echoes key and params, so tests can check the formatted values
jest.mock("@app/i18n", () => ({
  t: (key: string, params?: Record<string, unknown>) =>
    params
      ? `${key}(${Object.entries(params)
          .map(([k, v]) => `${k}=${String(v)}`)
          .join(",")})`
      : key,
}));
jest.mock(
  "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper",
  () => ({
    MuscleTagMapper: jest.fn().mockImplementation(() => ({
      findMuscleGroupsFromTags: (...args: unknown[]) =>
        mockFindGroups(...args),
    })),
  }),
);

const baseOptions: CanvasExportOptions = {
  layout: "horizontal",
  includeDurations: false,
  includeStats: false,
  connectSupersets: true,
};

function makeFile(
  basename: string,
  parentPath: string | null = "Workouts",
): TFile {
  const file = new TFile() as TFile & { parent: unknown };
  file.basename = basename;
  file.path = parentPath ? `${parentPath}/${basename}.md` : `${basename}.md`;
  if (parentPath !== null) {
    const parent = new TFolder();
    parent.path = parentPath;
    file.parent = parent;
  } else {
    file.parent = null;
  }
  return file;
}

function timerBlock(lines: string[]): string {
  return "```workout-timer\n" + lines.join("\n") + "\n```\n";
}

describe("CanvasExporter.exportToCanvas", () => {
  let vault: {
    read: jest.Mock;
    create: jest.Mock;
    modify: jest.Mock;
    getAbstractFileByPath: jest.Mock;
    getFileByPath: jest.Mock;
  };
  let api: { getExerciseStats: jest.Mock };
  let exporter: CanvasExporter;

  const setContent = (content: string) => vault.read.mockResolvedValue(content);
  const written = (): { nodes: any[]; edges: any[] } =>
    JSON.parse(vault.create.mock.calls[0][1]);

  beforeEach(() => {
    mockFindGroups.mockReset().mockResolvedValue([]);
    vault = {
      read: jest.fn(),
      create: jest.fn().mockResolvedValue(undefined),
      modify: jest.fn().mockResolvedValue(undefined),
      getAbstractFileByPath: jest.fn().mockReturnValue(null),
      getFileByPath: jest.fn().mockReturnValue(null),
    };
    api = { getExerciseStats: jest.fn() };
    exporter = new CanvasExporter(
      { vault } as any,
      api as any,
      {} as any,
      { exerciseFolderPath: "Exercises" } as any,
    );
  });

  describe("errors", () => {
    it("should throw when the workout file contains no exercises", async () => {
      setContent("just some plain text");

      await expect(exporter.exportToCanvas(makeFile("Empty"))).rejects.toThrow(
        "No exercises found",
      );
      expect(vault.create).not.toHaveBeenCalled();
      expect(vault.modify).not.toHaveBeenCalled();
    });

    it("should propagate read errors", async () => {
      vault.read.mockRejectedValue(new Error("read failed"));

      await expect(exporter.exportToCanvas(makeFile("W"))).rejects.toThrow(
        "read failed",
      );
    });

    it("should propagate vault create errors", async () => {
      setContent("## Squat");
      vault.create.mockRejectedValue(new Error("disk full"));

      await expect(exporter.exportToCanvas(makeFile("W"))).rejects.toThrow(
        "disk full",
      );
    });
  });

  describe("file path and existing-file handling", () => {
    it("should create the canvas next to the workout file", async () => {
      setContent("## Squat");

      const path = await exporter.exportToCanvas(makeFile("Leg Day"));

      expect(path).toBe("Workouts/Leg Day.canvas");
      expect(vault.getAbstractFileByPath).toHaveBeenCalledWith(
        "Workouts/Leg Day.canvas",
      );
      expect(vault.create).toHaveBeenCalledWith(
        "Workouts/Leg Day.canvas",
        expect.any(String),
      );
    });

    it("should use only the file name when the workout file has no parent", async () => {
      setContent("## Squat");

      const path = await exporter.exportToCanvas(makeFile("Root", null));

      expect(path).toBe("Root.canvas");
      expect(vault.create).toHaveBeenCalledWith("Root.canvas", expect.any(String));
    });

    it("should modify the existing canvas file instead of creating a new one", async () => {
      setContent("## Squat");
      const existing = new TFile();
      vault.getAbstractFileByPath.mockReturnValue(existing);

      await exporter.exportToCanvas(makeFile("Leg Day"));

      expect(vault.modify).toHaveBeenCalledWith(existing, expect.any(String));
      expect(vault.create).not.toHaveBeenCalled();
    });

    it("should create a new file when the existing path is not a file", async () => {
      setContent("## Squat");
      vault.getAbstractFileByPath.mockReturnValue(new TFolder());

      await exporter.exportToCanvas(makeFile("Leg Day"));

      expect(vault.create).toHaveBeenCalledTimes(1);
      expect(vault.modify).not.toHaveBeenCalled();
    });

    it("should write valid pretty-printed JSON with nodes and edges", async () => {
      setContent("## Squat");

      await exporter.exportToCanvas(makeFile("W"));

      const raw = vault.create.mock.calls[0][1] as string;
      expect(raw).toContain("\n  ");
      const data = JSON.parse(raw);
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(Array.isArray(data.edges)).toBe(true);
    });

    it("should use the default options when none are provided", async () => {
      setContent(
        timerBlock(["exercise: A", "superset: true"]) +
          timerBlock(["exercise: B", "superset: true"]),
      );

      await exporter.exportToCanvas(makeFile("W"));

      const data = written();
      expect(data.edges).toHaveLength(1);
      expect(api.getExerciseStats).not.toHaveBeenCalled();
    });
  });

  describe("exercise extraction", () => {
    it("should extract exercise from workout-timer blocks", async () => {
      setContent(timerBlock(["exercise: Bench Press", "duration: 90"]));

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeDurations: true,
      });

      const node = written().nodes[0];
      expect(node.text).toContain("## Bench Press");
      expect(node.text).toContain("canvas.duration(duration=1m 30s)");
    });

    it("should extract exercises from H2 headers", async () => {
      setContent("## Squat\n\n## Deadlift\n");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes.map((n) => n.text.split("\n")[0])).toEqual([
        "## Squat",
        "## Deadlift",
      ]);
    });

    it.each([
      "Notes",
      "Summary",
      "Warm-up",
      "Warmup",
      "Cooldown",
      "Stretching",
      "Workout plan",
      "Overview",
    ])("should skip the non-exercise header %s", async (header) => {
      setContent(`## ${header}\n\n## Squat\n`);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      const nodes = written().nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].text).toContain("## Squat");
    });

    it("should deduplicate exercises case-insensitively across sources", async () => {
      setContent(
        timerBlock(["exercise: Squat"]) + "## squat\n\n[[SQUAT]]\n## Squat\n",
      );

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes).toHaveLength(1);
    });

    it("should extract wiki links without folders as exercises", async () => {
      setContent("Do [[Pull Up]] and [[Dip|dips]].");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes.map((n) => n.text.split("\n")[0])).toEqual([
        "## Pull Up",
        "## Dip",
      ]);
    });

    it("should include links inside the exercise folder only when the file exists", async () => {
      setContent("[[Exercises/Row]] [[Exercises/Missing]]");
      vault.getFileByPath.mockImplementation((p: string) =>
        p === "Exercises/Row.md" ? new TFile() : null,
      );

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      const nodes = written().nodes;
      expect(nodes).toHaveLength(1);
      expect(nodes[0].text).toContain("## Row");
    });

    it("should ignore links to folders outside the exercise folder", async () => {
      setContent("[[Other/Place/Thing]]");

      await expect(
        exporter.exportToCanvas(makeFile("W"), baseOptions),
      ).rejects.toThrow("No exercises found");
    });

    it("should not append .md twice when the link already has it", async () => {
      setContent("[[Exercises/Row.md]]");
      vault.getFileByPath.mockReturnValue(new TFile());

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(vault.getFileByPath).toHaveBeenCalledWith("Exercises/Row.md");
      expect(written().nodes[0].text).toContain("## Row");
      expect(written().nodes[0].text).not.toContain("Row.md");
    });

    it("should skip timer blocks with no exercise line", async () => {
      setContent(timerBlock(["duration: 30"]) + "## Squat");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes).toHaveLength(1);
    });
  });

  describe("node content and colors", () => {
    it("should capitalize and join muscle groups in the node text", async () => {
      setContent("## Squat");
      mockFindGroups.mockResolvedValue(["quads", "glutes"]);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].text).toBe("## Squat\n\n*Quads, Glutes*");
    });

    it("should omit the muscle line when no muscle groups are found", async () => {
      setContent("## Squat");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].text).toBe("## Squat");
    });

    it("should color by the first recognized muscle group", async () => {
      setContent("## Squat");
      mockFindGroups.mockResolvedValue(["unknown", "Chest", "back"]);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].color).toBe("1");
    });

    it("should use the default color when no group is recognized", async () => {
      setContent("## Squat");
      mockFindGroups.mockResolvedValue(["mystery"]);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].color).toBe("5");
    });

    it("should format durations under a minute in seconds", async () => {
      setContent(timerBlock(["exercise: Plank", "duration: 45"]));

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeDurations: true,
      });

      expect(written().nodes[0].text).toContain("canvas.duration(duration=45s)");
    });

    it("should not include durations unless enabled", async () => {
      setContent(timerBlock(["exercise: Plank", "duration: 45"]));

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].text).not.toContain("canvas.duration");
    });

    it("should produce unique node ids with the node index", async () => {
      setContent("## A\n## B\n## C\n");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      const ids = written().nodes.map((n) => n.id);
      expect(new Set(ids).size).toBe(3);
      ids.forEach((id, i) => expect(id).toMatch(new RegExp(`^node-${i}-`)));
    });
  });

  describe("stats", () => {
    const stats = (over: object = {}) => ({
      totalSets: 5,
      prWeight: 100,
      prReps: 5,
      trend: "stable",
      ...over,
    });

    it("should include best (PR) stats and use the taller node height", async () => {
      setContent("## Squat");
      api.getExerciseStats.mockResolvedValue(stats());

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeStats: true,
      });

      const node = written().nodes[0];
      expect(api.getExerciseStats).toHaveBeenCalledWith("Squat");
      expect(node.height).toBe(150);
      expect(node.text).toContain(
        `canvas.best(weight=100,unit=${ParameterUtils.getWeightUnit()},reps=5)`,
      );
      expect(node.text).not.toMatch(/📈|📉/);
    });

    it.each([
      ["up", "📈"],
      ["down", "📉"],
    ])("should add a trend emoji when trend is %s", async (trend, emoji) => {
      setContent("## Squat");
      api.getExerciseStats.mockResolvedValue(stats({ trend }));

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeStats: true,
      });

      expect(written().nodes[0].text).toContain(emoji);
    });

    it("should skip stats when the exercise has no sets", async () => {
      setContent("## Squat");
      api.getExerciseStats.mockResolvedValue(stats({ totalSets: 0 }));

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeStats: true,
      });

      expect(written().nodes[0].text).not.toContain("canvas.best");
    });

    it("should continue when fetching stats fails", async () => {
      setContent("## Squat\n## Row");
      api.getExerciseStats
        .mockRejectedValueOnce(new Error("boom"))
        .mockResolvedValueOnce(stats());

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        includeStats: true,
      });

      const nodes = written().nodes;
      expect(nodes[0].text).not.toContain("canvas.best");
      expect(nodes[1].text).toContain("canvas.best");
    });

    it("should use the normal node height when stats are disabled", async () => {
      setContent("## Squat");

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().nodes[0].height).toBe(100);
      expect(written().nodes[0].width).toBe(250);
    });
  });

  describe("layouts", () => {
    const names = ["A", "B", "C", "D", "E", "F"];
    const body = names.map((n) => `## ${n}`).join("\n");

    it("should wrap horizontal layout after four nodes per row", async () => {
      setContent(body);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      const pos = written().nodes.map((n) => [n.x, n.y]);
      expect(pos).toEqual([
        [0, 0],
        [300, 0],
        [600, 0],
        [900, 0],
        [0, 130],
        [300, 130],
      ]);
    });

    it("should use a single column in vertical layout", async () => {
      setContent("## A\n## B\n## C");

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        layout: "vertical",
      });

      expect(written().nodes.map((n) => [n.x, n.y])).toEqual([
        [0, 0],
        [0, 130],
        [0, 260],
      ]);
    });

    it("should scale vertical spacing with the stats node height", async () => {
      setContent("## A\n## B");
      api.getExerciseStats.mockResolvedValue({ totalSets: 0 });

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        layout: "vertical",
        includeStats: true,
      });

      expect(written().nodes[1].y).toBe(180);
    });

    it("should group nodes in columns by primary muscle group", async () => {
      setContent("## A\n## B\n## C\n## D");
      mockFindGroups
        .mockResolvedValueOnce(["chest"])
        .mockResolvedValueOnce(["back"])
        .mockResolvedValueOnce(["chest"])
        .mockResolvedValueOnce([]);

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        layout: "grouped",
      });

      // chest column 0, back column 1, "other" column 2; original order kept
      expect(written().nodes.map((n) => [n.x, n.y])).toEqual([
        [0, 0],
        [330, 0],
        [0, 130],
        [660, 0],
      ]);
    });

    it("should fall back to horizontal layout for an unknown layout type", async () => {
      setContent(body);

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        layout: "diagonal" as any,
      });

      expect(written().nodes[4]).toMatchObject({ x: 0, y: 130 });
    });
  });

  describe("superset edges", () => {
    const content =
      timerBlock(["exercise: A", "superset: true"]) +
      timerBlock(["exercise: B", "superset: true"]) +
      timerBlock(["exercise: C"]);

    it("should connect consecutive superset exercises left to right", async () => {
      setContent(content);

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      const { nodes, edges } = written();
      expect(edges).toHaveLength(1);
      expect(edges[0]).toMatchObject({
        fromNode: nodes[0].id,
        toNode: nodes[1].id,
        fromSide: "right",
        toSide: "left",
        toEnd: "arrow",
        color: "6",
        label: "superset",
      });
      expect(edges[0].id).toMatch(/^edge-0-/);
    });

    it("should connect top to bottom in vertical layout", async () => {
      setContent(content);

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        layout: "vertical",
      });

      expect(written().edges[0]).toMatchObject({
        fromSide: "bottom",
        toSide: "top",
      });
    });

    it("should create no edges when connectSupersets is disabled", async () => {
      setContent(content);

      await exporter.exportToCanvas(makeFile("W"), {
        ...baseOptions,
        connectSupersets: false,
      });

      expect(written().edges).toEqual([]);
    });

    it("should not connect a superset exercise to a non-superset neighbor", async () => {
      setContent(
        timerBlock(["exercise: A", "superset: true"]) +
          timerBlock(["exercise: B"]),
      );

      await exporter.exportToCanvas(makeFile("W"), baseOptions);

      expect(written().edges).toEqual([]);
    });
  });
});
