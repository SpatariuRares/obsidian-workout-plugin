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
import { InsertTimerModal } from "@app/features/timer/modals/InsertTimerModal";
import { TIMER_TYPE, type TimerPresetConfig } from "@app/features/timer/types";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const PRESETS: Record<string, TimerPresetConfig> = {
  Rest: { name: "Rest", type: TIMER_TYPE.COUNTDOWN, duration: 120, showControls: true, sound: true },
  Tabata: {
    name: "Tabata",
    type: TIMER_TYPE.INTERVAL,
    duration: 20,
    rest: 10,
    rounds: 8,
    showControls: true,
    sound: true,
  },
};

function openModal(defaultTimerPreset: string | null = null) {
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { timerPresets: PRESETS, defaultTimerPreset, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const modal = new InsertTimerModal(app, plugin);
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();

  const presetGroup = () =>
    [...contentEl.querySelectorAll<HTMLElement>(".workout-chip-group")].find(
      (g) => g.querySelector(".workout-chip-group-label")?.textContent === t("modal.sections.preset"),
    )!;
  const presetChips = () =>
    [...presetGroup().querySelectorAll<HTMLButtonElement>("button")].map((b) => b.textContent);
  const chip = (text: string) =>
    [...contentEl.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent === text)!;
  const params = () =>
    (modal as unknown as { collectParams(): { preset?: string; type: string; duration?: number } })
      .collectParams();
  return { contentEl, presetGroup, presetChips, chip, params };
}

describe("InsertTimerModal preset choice", () => {
  it("offers the presets of the picked type, after a None chip", () => {
    const { presetChips, chip } = openModal();

    expect(presetChips()).toEqual([t("settings.options.none"), "Rest"]);
    chip(t("timer.interval")).click();
    expect(presetChips()).toEqual([t("settings.options.none"), "Tabata"]);
  });

  it("opens on the default preset and writes it", () => {
    const { chip, params } = openModal("Tabata");

    expect(chip("Tabata").getAttribute("aria-pressed")).toBe("true");
    expect(params()).toMatchObject({ preset: "Tabata", type: TIMER_TYPE.INTERVAL, rounds: 8 });
  });

  it("applies a picked preset, and drops it when picked again or with None", () => {
    const { chip, params } = openModal();

    chip("Rest").click();
    expect(params()).toMatchObject({ preset: "Rest", duration: 120 });

    chip("Rest").click();
    expect(params().preset).toBeUndefined();
    expect(chip(t("settings.options.none")).getAttribute("aria-pressed")).toBe("true");

    chip("Rest").click();
    chip(t("settings.options.none")).click();
    expect(params().preset).toBeUndefined();
  });

  it("drops a preset of another type when the type changes", () => {
    const { chip, params } = openModal("Tabata");

    chip(t("timer.countdown")).click();
    expect(params().preset).toBeUndefined();
    expect(chip("Rest").getAttribute("aria-pressed")).toBe("false");
  });

  it("hides the choice when no preset has the picked type", () => {
    const { chip, presetGroup } = openModal();

    chip(t("timer.stopwatch")).click();
    expect(presetGroup().closest(".workout-display-none")).not.toBeNull();
    chip(t("timer.countdown")).click();
    expect(presetGroup().closest(".workout-display-none")).toBeNull();
  });
});
