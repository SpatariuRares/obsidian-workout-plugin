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
import { CreateExerciseSectionModal } from "@app/features/modals/exercise/CreateExerciseSectionModal";
import { readWorkoutNote } from "@app/services/notes/WorkoutNote";
import { timerBlock } from "@app/features/timer/timerBlock";
import { tableBlock } from "@app/features/tables/tableBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { LocalizationService, t } from "@app/i18n";

beforeAll(() => LocalizationService.initialize({} as never));

function openModal() {
  const replaceRange = jest.fn();
  const editor = { getCursor: () => ({ line: 0, ch: 0 }), replaceRange };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({
        file: { path: "Leg day.md", basename: "Leg day" },
        editor,
      }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const modal = new CreateExerciseSectionModal(app, plugin);
  const contentEl = createObsidianContainer();
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();

  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find(
      (b) => b.textContent === text,
    )!;
  const exerciseInput = () =>
    contentEl.querySelectorAll<HTMLInputElement>('input[type="text"]')[0];
  const workoutInput = () =>
    contentEl.querySelectorAll<HTMLInputElement>('input[type="text"]')[1];
  const checkbox = (id: string) =>
    contentEl.querySelector<HTMLInputElement>(`#${id}`)!;
  const inserted = () => {
    const code = replaceRange.mock.calls[0]?.[0] as string;
    return readWorkoutNote(code).blocks;
  };
  return {
    modal,
    contentEl,
    close,
    replaceRange,
    button,
    exerciseInput,
    workoutInput,
    checkbox,
    inserted,
  };
}

describe("CreateExerciseSectionModal", () => {
  it("shows its title and the create and cancel buttons", () => {
    const { contentEl, button } = openModal();
    expect(contentEl.querySelector("h2")?.textContent).toBe(
      t("modal.titles.createExerciseSection"),
    );
    expect(button(t("modal.buttons.createSection"))).toBeDefined();
    expect(button(t("modal.buttons.cancel"))).toBeDefined();
  });

  it("inserts a timer block with an id and a log block for the exercise", () => {
    const { button, exerciseInput, inserted, close } = openModal();
    exerciseInput().value = "Squat";
    button(t("modal.buttons.createSection")).click();

    const blocks = inserted();
    const timer = blocks.find((b) => b.type === "workout-timer")!;
    const timerParams = timerBlock.parse(timer.body).params;
    expect(timerParams.id).toEqual(expect.any(String));
    expect(timerParams.exercise).toBe("Squat");

    const log = blocks.find((b) => b.type === "workout-log")!;
    const logParams = tableBlock.parse(log.body).params;
    expect(logParams.id).toEqual(expect.any(String));
    expect(logParams.id).not.toBe(timerParams.id);
    expect(logParams.exercise).toBe("Squat");
    expect(close).toHaveBeenCalled();
  });

  it("writes the current note as workout when the toggle is on", () => {
    const { button, exerciseInput, workoutInput, checkbox, inserted } =
      openModal();
    exerciseInput().value = "Squat";
    const toggle = checkbox("currentWorkout");
    toggle.checked = true;
    toggle.dispatchEvent(new Event("change"));
    expect(workoutInput().value).toBe("Leg day");
    expect(workoutInput().disabled).toBe(true);

    button(t("modal.buttons.createSection")).click();
    const log = inserted().find((b) => b.type === "workout-log")!;
    expect(tableBlock.parse(log.body).params.workout).toBe("Leg day");
  });

  it("leaves out the timer and the log when they are unticked", () => {
    const { button, exerciseInput, checkbox, replaceRange } = openModal();
    exerciseInput().value = "Squat";
    checkbox("showTimer").checked = false;
    checkbox("showLog").checked = false;
    button(t("modal.buttons.createSection")).click();

    const code = replaceRange.mock.calls[0][0] as string;
    expect(readWorkoutNote(code).blocks).toHaveLength(0);
    expect(code).toContain("Squat");
  });

  it("inserts nothing and stays open without an exercise", () => {
    const { button, replaceRange, close } = openModal();
    expect(() => button(t("modal.buttons.createSection")).click()).not.toThrow();
    expect(replaceRange).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });

  it("closes on cancel without inserting", () => {
    const { button, replaceRange, close } = openModal();
    button(t("modal.buttons.cancel")).click();
    expect(close).toHaveBeenCalled();
    expect(replaceRange).not.toHaveBeenCalled();
  });
});
