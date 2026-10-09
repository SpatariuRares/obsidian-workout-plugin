import { TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { WorkoutFileAnalyzer } from "@app/features/duration/services/WorkoutFileAnalyzer";

type Settings = {
  csvLogFilePath?: string;
  repDuration?: number;
  defaultRepsPerSet?: number;
  setDuration?: number;
};

const makeFile = (path: string): TFile => {
  const f = new TFile();
  f.path = path;
  return f;
};

const WORKOUT_PATH = "Workouts/Push Day.md";
const CSV_PATH = DEFAULT_SETTINGS.csvLogFilePath;
const HEADER =
  "date,exercise,reps,weight,volume,origine,workout,timestamp,notes";

const row = (date: string, workout: string, ts: number | string) =>
  `${date},Bench,5,100,500,,${workout},${ts},`;

const setup = (
  files: Record<string, string>,
  settings: Settings = {},
) => {
  const read = jest.fn(async (file: TFile) => {
    if (!(file.path in files)) throw new Error("boom");
    return files[file.path];
  });
  const plugin = {
    settings,
    app: {
      vault: {
        getAbstractFileByPath: jest.fn((p: string) =>
          p in files ? makeFile(p) : null,
        ),
        read,
      },
    },
  };
  const analyzer = new WorkoutFileAnalyzer(
    plugin as unknown as ConstructorParameters<
      typeof WorkoutFileAnalyzer
    >[0],
  );
  return { analyzer, plugin, read };
};

const analyze = (
  md: string,
  settings: Settings = {},
  csv?: string,
) => {
  const files: Record<string, string> = { [WORKOUT_PATH]: md };
  if (csv !== undefined) files[CSV_PATH] = csv;
  return setup(files, settings).analyzer.analyzeWorkoutFile(
    WORKOUT_PATH,
  );
};

describe("WorkoutFileAnalyzer", () => {
  describe("file access", () => {
    it("should return an error result when the workout file is missing", async () => {
      const { analyzer } = setup({});
      const result = await analyzer.analyzeWorkoutFile("nope.md");
      expect(result.success).toBe(false);
      expect(result.error).toContain("nope.md");
      expect(result.workoutPath).toBe("nope.md");
    });

    it("should return an error result when reading the file throws", async () => {
      const { analyzer, plugin } = setup({ [WORKOUT_PATH]: "x" });
      plugin.app.vault.read.mockRejectedValueOnce(new Error("disk"));
      const result = await analyzer.analyzeWorkoutFile(WORKOUT_PATH);
      expect(result.success).toBe(false);
      expect(result.error).toContain("disk");
    });

    it("should succeed with zero totals when the file has no workout blocks", async () => {
      const result = await analyze("## Notes\nJust text\n");
      expect(result.success).toBe(true);
      expect(result.setCount).toBe(0);
      expect(result.totalDuration).toBe(0);
    });
  });

  describe("section parsing", () => {
    it("should multiply rest timers and set time by the set count in the header", async () => {
      const md = [
        "## Squat",
        "### 3 sets x 10 reps",
        "```workout-timer",
        "duration: 90",
        "```",
        "```workout-log",
        "```",
      ].join("\n");
      const r = await analyze(md);
      expect(r.setCount).toBe(3);
      expect(r.totalRestTime).toBe(270);
      expect(r.restPeriodCount).toBe(3);
      expect(r.totalSetTime).toBe(150); // 3 * 10 reps * 5s
      expect(r.totalDuration).toBe(420);
    });

    it("should use the average of a reps range", async () => {
      const md = "## A\n### 2 series x 8-12 reps\n```workout-log\n```";
      const r = await analyze(md);
      expect(r.totalSetTime).toBe(2 * 10 * 5);
    });

    it("should honour a custom rep duration", async () => {
      const md = "## A\n### 2 sets x 10 reps\n```workout-log\n```";
      const r = await analyze(md, { repDuration: 3 });
      expect(r.totalSetTime).toBe(60);
    });

    it("should fall back to the log limit when no set header exists", async () => {
      const md = "## A\n```workout-log\nlimit: 4\n```";
      const r = await analyze(md);
      expect(r.setCount).toBe(4);
      expect(r.totalSetTime).toBe(4 * 60);
    });

    it("should default to one set when nothing indicates the count", async () => {
      const r = await analyze("## A\n```workout-log\n```");
      expect(r.setCount).toBe(1);
      expect(r.totalSetTime).toBe(60);
    });

    it("should treat unreasonable set counts as one set", async () => {
      const r = await analyze("## A\n### 2023 sets\n```workout-log\n```");
      expect(r.setCount).toBe(1);
    });

    it("should ignore reps followed by a time unit and use the set duration", async () => {
      const md = "## A\n### 2 sets x 30 sec\n```workout-log\n```";
      const r = await analyze(md, { setDuration: 40 });
      expect(r.totalSetTime).toBe(80);
    });

    it("should use default reps per set when no reps are in the text", async () => {
      const md = "## A\n### 2 sets\n```workout-log\n```";
      const r = await analyze(md, { defaultRepsPerSet: 8 });
      expect(r.totalSetTime).toBe(2 * 8 * 5);
    });

    it("should sum multiple timers in one section per set", async () => {
      const md = [
        "## A",
        "### 2 sets",
        "```workout-timer",
        "duration: 30",
        "```",
        "```workout-timer",
        "duration: 60",
        "```",
      ].join("\n");
      const r = await analyze(md);
      expect(r.totalRestTime).toBe(180);
      expect(r.restPeriodCount).toBe(4);
    });

    it("should ignore timers without a positive duration", async () => {
      const md =
        "## A\n```workout-timer\ntype: stopwatch\n```\n```workout-timer\nduration: 0\n```";
      const r = await analyze(md);
      expect(r.totalRestTime).toBe(0);
      expect(r.restPeriodCount).toBe(0);
    });

    it("should skip sections without workout blocks and sum the rest", async () => {
      const md = [
        "## Intro",
        "text",
        "## A",
        "### 2 sets",
        "```workout-log",
        "```",
        "## B",
        "### 3 sets",
        "```workout-log",
        "```",
      ].join("\n");
      const r = await analyze(md);
      expect(r.setCount).toBe(5);
    });
  });

  describe("historical duration", () => {
    const md = "## A\n```workout-log\n```";

    it("should leave historical fields unset when the CSV file is missing", async () => {
      const r = await analyze(md);
      expect(r.success).toBe(true);
      expect(r.historicalDuration).toBeUndefined();
    });

    it("should compute duration from min and max timestamps of the session", async () => {
      const csv = [
        HEADER,
        row("2024-01-01", "Push Day", 1_000_000),
        row("2024-01-01", "Push Day", 1_900_000),
        row("2024-01-01", "Push Day", 2_800_000),
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.historicalDuration).toBe(1800);
      expect(r.lastSessionDate).toBe("2024-01-01");
    });

    it("should pick the most recent session with at least two timestamps", async () => {
      const csv = [
        HEADER,
        row("2024-01-01", "Push Day", 1_000_000),
        row("2024-01-01", "Push Day", 1_900_000),
        row("2024-01-03", "Push Day", 5_000_000),
        row("2024-01-02", "Push Day", 3_000_000),
        row("2024-01-02", "Push Day", 4_200_000),
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.lastSessionDate).toBe("2024-01-02");
      expect(r.historicalDuration).toBe(1200);
    });

    it("should skip sessions outside the 5 minute to 5 hour window", async () => {
      const csv = [
        HEADER,
        row("2024-01-01", "Push Day", 0 + 1),
        row("2024-01-01", "Push Day", 1 + 1_800_000),
        row("2024-01-02", "Push Day", 1),
        row("2024-01-02", "Push Day", 100_001), // 100s
        row("2024-01-03", "Push Day", 1),
        row("2024-01-03", "Push Day", 20_000_001), // > 5h
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.lastSessionDate).toBe("2024-01-01");
    });

    it("should group ISO datetime dates by their date part", async () => {
      const csv = [
        HEADER,
        row("2024-01-01T08:00:00", "Push Day", 1_000_000),
        row("2024-01-01T09:00:00", "Push Day", 2_000_000),
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.lastSessionDate).toBe("2024-01-01");
      expect(r.historicalDuration).toBe(1000);
    });

    it("should ignore rows from other workouts, bad timestamps and short rows", async () => {
      const csv = [
        HEADER,
        row("2024-01-01", "Pull Day", 1_000_000),
        row("2024-01-01", "Pull Day", 2_000_000),
        row("2024-01-02", "Push Day", "abc"),
        row("2024-01-02", "Push Day", 0),
        row("2024-01-02", "Push Day", -5),
        "2024-01-02,Bench,5,100,500,,Push Day",
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.historicalDuration).toBeUndefined();
    });

    it("should match quoted workout names including commas", async () => {
      const path = "Workouts/Push, Day.md";
      const csv = [
        HEADER,
        `2024-01-01,Bench,5,100,500,,"Push, Day",1000000,`,
        `2024-01-01,Bench,5,100,500,,"Push, Day",1900000,`,
      ].join("\n");
      const { analyzer } = setup({
        [path]: "## A\n```workout-log\n```",
        [CSV_PATH]: csv,
      });
      const r = await analyzer.analyzeWorkoutFile(path);
      expect(r.historicalDuration).toBe(900);
    });

    it("should strip stray surrounding quotes from the logged workout", async () => {
      const csv = [
        HEADER,
        `2024-01-01,Bench,5,100,500,,'Push Day',1000000,`,
        `2024-01-01,Bench,5,100,500,,'Push Day',1900000,`,
      ].join("\n");
      const r = await analyze(md, {}, csv);
      expect(r.historicalDuration).toBe(900);
    });

    it("should read the CSV from the configured path", async () => {
      const csv = [
        HEADER,
        row("2024-01-01", "Push Day", 1_000_000),
        row("2024-01-01", "Push Day", 1_900_000),
      ].join("\n");
      const { analyzer } = setup(
        { [WORKOUT_PATH]: md, "custom/logs.csv": csv },
        { csvLogFilePath: "custom/logs.csv" },
      );
      const r = await analyzer.analyzeWorkoutFile(WORKOUT_PATH);
      expect(r.historicalDuration).toBe(900);
    });

    it("should not fail the analysis when reading the CSV throws", async () => {
      const { analyzer, plugin } = setup({
        [WORKOUT_PATH]: md,
        [CSV_PATH]: HEADER,
      });
      plugin.app.vault.read
        .mockResolvedValueOnce(md)
        .mockRejectedValueOnce(new Error("csv"));
      const r = await analyzer.analyzeWorkoutFile(WORKOUT_PATH);
      expect(r.success).toBe(true);
      expect(r.historicalDuration).toBeUndefined();
    });
  });
});
