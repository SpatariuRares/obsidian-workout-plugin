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

function openModal() {
  const state = { content: NOTE };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
    },
    vault: {
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

  const params = timerBlock.parse(NOTE.split("\n").slice(1, -1).join("\n")).params;
  const modal = new EditTimerModal(app, plugin, params);
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
});
