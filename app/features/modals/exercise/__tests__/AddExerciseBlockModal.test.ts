/** @jest-environment jsdom */
import { App } from "obsidian";

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
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { TIMER_TYPE } from "@app/features/timer/types";
import { t } from "@app/i18n";

const TEMPLATE =
  "## {{exercise}}\nduration: {{duration}}\nworkout: {{workout}}\npreset: {{preset}}\n{{exercise}}";

function openModal(defaultTimerPreset: string | null = null) {
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const preset = (name: string) => ({
    name,
    type: TIMER_TYPE.COUNTDOWN,
    duration: 60,
    showControls: true,
    sound: true,
  });
  const plugin = {
    app,
    settings: {
      timerPresets: { Rest: preset("Rest"), Long: preset("Long") },
      defaultTimerPreset,
      recentExercises: [],
      exerciseBlockTemplate: TEMPLATE,
    },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const modal = new AddExerciseBlockModal(app, plugin);
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();
  const generate = () =>
    (modal as unknown as { generateCode(): string }).generateCode();
  const chip = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text)!;
  const exercise = () =>
    contentEl.querySelector<HTMLInputElement>("input[type='text']")!;
  return { contentEl, generate, chip, exercise };
}

describe("AddExerciseBlockModal", () => {
  it("titles its sections in the current language", () => {
    const { contentEl } = openModal();
    const titles = [...contentEl.querySelectorAll("h3")].map((h) => h.textContent);
    expect(titles).toEqual([
      t("modal.sections.exercise"),
      t("modal.sections.timer"),
      t("modal.sections.workout"),
    ]);
  });

  it("offers the saved presets as chips, with the default one picked", () => {
    const { chip, contentEl } = openModal("Long");
    expect(contentEl.textContent).toContain(t("modal.timerPreset"));
    expect(chip("Long").getAttribute("aria-pressed")).toBe("true");
    expect(chip("Rest").getAttribute("aria-pressed")).toBe("false");
    expect(chip(t("settings.options.none"))).toBeDefined();
  });

  it("fills every placeholder of the template, with the picked preset", () => {
    const { generate, chip, exercise } = openModal("Long");
    exercise().value = "Squat";
    chip("Rest").click();

    expect(generate()).toBe(
      "## Squat\nduration: 90\nworkout: Leg day\npreset: Rest\nSquat",
    );
  });

  it("writes no preset when None is picked", () => {
    const { generate, chip, exercise } = openModal("Long");
    exercise().value = "Squat";
    chip(t("settings.options.none")).click();

    expect(generate()).toContain("preset: \n");
  });

  it("writes no preset when the picked preset is clicked again", () => {
    const { generate, chip, exercise } = openModal("Long");
    exercise().value = "Squat";
    chip("Long").click();

    expect(chip(t("settings.options.none")).getAttribute("aria-pressed")).toBe("true");
    expect(generate()).toContain("preset: \n");
  });
});
