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
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { timerBlock } from "@app/features/timer/timerBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const NOTE = [
  "```workout-timer",
  "id: t1",
  "# rest between sets",
  "type: countdown",
  "duration: 90",
  "exercise: Squat",
  "workout: Leg day",
  "autoStart: true",
  "showControls: true",
  "sound: true",
  "```",
].join("\n");

function openModal(note = NOTE) {
  const state = { content: note };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
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
    settings: { timerPresets: {}, defaultTimerPreset: null, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const params = timerBlock.parse(note.split("\n").slice(1, -1).join("\n")).params;
  const modal = new EditTimerModal(app, plugin, params, {
    sourcePath: "Leg day.md",
  });
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();

  const update = () =>
    [...contentEl.querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.buttons.updateTimer"))!
      .click();
  return { state, contentEl, update };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("EditTimerModal", () => {
  it("rewrites only the duration and keeps autoStart, workout and comments", async () => {
    const { state, contentEl, update } = openModal();
    const duration = [...contentEl.querySelectorAll<HTMLInputElement>("input")].find(
      (el) => el.value === "90",
    )!;

    duration.value = "120";
    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("duration: 90", "duration: 120"));
  });

  it("leaves the block untouched when nothing changed", async () => {
    const { state, update } = openModal();

    update();
    await flush();

    expect(state.content).toBe(NOTE);
  });

  it("writes the work of an interval to the duration line the block already uses", async () => {
    const interval = [
      "```workout-timer",
      "id: t1",
      "type: interval",
      "duration: 20",
      "rest: 10",
      "rounds: 8",
      "```",
    ].join("\n");
    const { state, contentEl, update } = openModal(interval);
    const work = [...contentEl.querySelectorAll<HTMLInputElement>("input")].find(
      (input) => input.value === "20",
    )!;

    work.value = "30";
    update();
    await flush();

    expect(state.content).toBe(interval.replace("duration: 20", "duration: 30"));
  });

  it("opens an interval block on the interval chip, with rest and rounds shown", () => {
    const interval = [
      "```workout-timer",
      "id: t1",
      "type: interval",
      "duration: 20",
      "rest: 10",
      "rounds: 8",
      "```",
    ].join("\n");
    const { contentEl } = openModal(interval);
    const pressed = [...contentEl.querySelectorAll(".workout-modal-type-chips button")]
      .filter((b) => b.getAttribute("aria-pressed") === "true")
      .map((b) => b.textContent);
    const hidden = [...contentEl.querySelectorAll(".workout-field-with-adjust")].filter((el) =>
      el.classList.contains("workout-display-none"),
    );

    expect(pressed).toEqual([t("timer.interval")]);
    expect(hidden).toHaveLength(0);
  });

  it("keeps a preset that is no longer in the settings, picked", async () => {
    const note = NOTE.replace("type: countdown", "preset: Gone\ntype: countdown");
    const { state, contentEl, update } = openModal(note);
    const gone = [...contentEl.querySelectorAll<HTMLButtonElement>("button")].find(
      (b) => b.textContent === "Gone",
    )!;
    expect(gone.getAttribute("aria-pressed")).toBe("true");

    [...contentEl.querySelectorAll<HTMLInputElement>("input")].find((el) => el.value === "90")!
      .value = "60";
    update();
    await flush();

    expect(state.content).toBe(note.replace("duration: 90", "duration: 60"));
  });

  it("hides the duration when the stopwatch is picked", () => {
    const { contentEl } = openModal();
    const stopwatch = [...contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip-group button")]
      .find((b) => b.textContent === t("timer.stopwatch"))!;

    stopwatch.click();

    const shown = [...contentEl.querySelectorAll(".workout-field-with-adjust")].filter(
      (el) => !el.classList.contains("workout-display-none"),
    );
    expect(shown).toHaveLength(0);
  });
});
