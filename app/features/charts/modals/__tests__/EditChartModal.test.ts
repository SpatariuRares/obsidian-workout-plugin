/** @jest-environment jsdom */
import { App, TFile } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { EditChartModal } from "@app/features/charts/modals/EditChartModal";
import { chartBlock } from "@app/features/charts/chartBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const NOTE = [
  "# Leg day",
  "```workout-chart",
  "chartType: exercise",
  "exercise: Squat",
  "# keep me",
  "type: weight",
  "dateRange: 60",
  "```",
].join("\n");

async function openModal(note = NOTE, withId = false) {
  const state = { content: note };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: {
      getAbstractFileByPath: (path: string) =>
        Object.assign(new TFile(), { path }),
      process: jest.fn(async (_file: unknown, fn: (c: string) => string) => {
        state.content = fn(state.content);
      }),
      getMarkdownFiles: () => [],
    },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { defaultExactMatch: false, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
      getExerciseDefinition: async () => null,
    }),
  } as unknown as WorkoutPluginContext;

  const body = note.split("\n").slice(2, -1).join("\n");
  const parsed = chartBlock.parse(body);
  const params = { ...chartBlock.defaults, ...parsed.params };
  const modal = new EditChartModal(app, plugin, params, {
    sourcePath: "Leg day.md",
    matchWithoutId: withId ? undefined : { body },
    invalidKeys: parsed.invalidKeys,
  });
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();
  // The update button appears once the data types are read
  await new Promise((resolve) => setTimeout(resolve, 0));

  const update = () =>
    [...contentEl.querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.buttons.updateChart"))!
      .click();
  return { state, contentEl, update };
}

describe("EditChartModal", () => {
  it("shows the block's values in the form", async () => {
    const { contentEl } = await openModal();
    const inputs = [...contentEl.querySelectorAll<HTMLInputElement>("input")];
    expect(inputs.some((i) => i.value === "Squat")).toBe(true);
    expect(inputs.some((i) => i.value === "60")).toBe(true);
  });

  it("leaves the note as typed when nothing changed", async () => {
    const { state, update } = await openModal();
    update();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.content.replace(/^id: .*\n/m, "")).toContain(
      "# keep me",
    );
    expect(state.content).toContain("type: weight");
    expect(state.content).toContain("dateRange: 60");
  });

  it("patches only the changed parameter and gives the block an id", async () => {
    const { state, contentEl, update } = await openModal();
    const range = [
      ...contentEl.querySelectorAll<HTMLInputElement>("input"),
    ].find((i) => i.value === "60")!;
    range.value = "90";
    update();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.content).toContain("dateRange: 90");
    expect(state.content).toContain("# keep me");
    expect(state.content).toMatch(/^id: \S+$/m);
  });

  it("rewrites a parameter that was invalid even if the form is left as it opened", async () => {
    const broken = [
      "# Leg day",
      "```workout-chart",
      "exercise: Squat",
      "dateRange: soon",
      "```",
    ].join("\n");
    const { state, update } = await openModal(broken);
    update();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(state.content).not.toContain("soon");
    expect(state.content).not.toContain("dateRange");
  });

  describe("chart and data type", () => {
    const groups = (contentEl: HTMLElement) => [
      ...contentEl.querySelectorAll<HTMLElement>(".workout-chip-group"),
    ];
    const pressedLabels = (group: HTMLElement) =>
      [...group.querySelectorAll("button")]
        .filter((b) => b.getAttribute("aria-pressed") === "true")
        .map((b) => b.textContent);

    it("opens on the block's chart type with one data type pressed, without a select", async () => {
      const { contentEl } = await openModal();
      const [chartType, dataType] = groups(contentEl);

      expect(pressedLabels(chartType)).toEqual([t("modal.selectOptions.specificExercise")]);
      expect(pressedLabels(dataType)).toHaveLength(1);
      expect(contentEl.querySelector("select")).toBeNull();
      expect(
        contentEl.querySelector(".workout-target-exercise")!.classList,
      ).not.toContain("workout-display-none");
    });

    it("hides the exercise field once the whole workout is picked", async () => {
      const { contentEl } = await openModal();
      const [chartType] = groups(contentEl);

      [...chartType.querySelectorAll("button")]
        .find((b) => b.textContent === t("modal.selectOptions.completeWorkout"))!
        .click();

      expect(
        contentEl.querySelector(".workout-target-exercise")!.classList,
      ).toContain("workout-display-none");
    });

    it("writes the data type picked", async () => {
      const { state, contentEl, update } = await openModal();
      const [, dataType] = groups(contentEl);
      const other = [...dataType.querySelectorAll("button")].find(
        (b) => b.getAttribute("aria-pressed") !== "true",
      )!;

      other.click();
      update();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(state.content).not.toContain("type: weight");
      expect(state.content).toMatch(/^type: \w+$/m);
    });
  });
});
