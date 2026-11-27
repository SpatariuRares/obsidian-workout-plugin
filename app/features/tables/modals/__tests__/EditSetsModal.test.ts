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
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import { setsBlock } from "@app/features/tables/setsBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const NOTE = [
  "# Leg day",
  "```workout-sets",
  "id: s1",
  "exercise: Squat",
  "# heavy week",
  "workout: Leg Day",
  "sets: 4",
  "targetReps: 8",
  "targetWeight: 100",
  "rest: 90",
  "```",
].join("\n");

function openModal(note = NOTE) {
  const state = { content: note };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: {
      getAbstractFileByPath: (path: string) => Object.assign(new TFile(), { path }),
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

  const body = note.split("\n").slice(2, -1).join("\n");
  const params = { ...setsBlock.defaults, ...setsBlock.parse(body).params };
  const modal = new EditSetsModal(app, plugin, params, { sourcePath: "Leg day.md" });
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();

  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text) as
      | HTMLButtonElement
      | undefined;
  const field = (label: string) =>
    [...contentEl.querySelectorAll(".workout-field-with-adjust")]
      .find((el) => el.textContent?.includes(label))!
      .querySelector("input")!;
  const tab = (n: number) =>
    contentEl.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")[n - 1];
  const visible = () =>
    [...contentEl.querySelectorAll<HTMLElement>("[data-step-id]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.stepId);
  const exercise = () =>
    contentEl
      .querySelector<HTMLElement>("[data-step-id='exercise']")!
      .querySelector<HTMLInputElement>("input[type='text']")!;
  const update = () => button(t("modal.buttons.update"))!.click();
  return { state, contentEl, button, field, tab, visible, exercise, update, close };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("EditSetsModal wizard", () => {
  it("prefills the exercise, plan and rest steps", () => {
    const { exercise, field } = openModal();

    expect(exercise().value).toBe("Squat");
    expect(field(t("modal.labels.plannedSets")).value).toBe("4");
    expect(field(t("sets.restLabel")).value).toBe("90");
  });

  it("opens on step 1 and lets the stepper jump to Plan and Rest at once", () => {
    const { visible, tab } = openModal();

    expect(visible()).toEqual(["exercise"]);
    tab(2).click();
    expect(visible()).toEqual(["plan"]);
    tab(3).click();
    expect(visible()).toEqual(["rest"]);
  });

  it("shows Update beside Next on steps 1 and 2 and as primary on step 3", () => {
    const { button, tab } = openModal();

    expect(button(t("modal.buttons.update"))).toBeDefined();
    expect(button(t("wizard.next"))).toBeDefined();
    tab(2).click();
    expect(button(t("modal.buttons.update"))).toBeDefined();
    expect(button(t("wizard.next"))).toBeDefined();
    tab(3).click();
    expect(button(t("modal.buttons.update"))).toBeDefined();
    expect(button(t("wizard.next"))).toBeUndefined();
  });

  it("leaves the note as it is when nothing changed", async () => {
    const { state, update } = openModal();

    update();
    await flush();

    expect(state.content).toBe(NOTE);
  });

  it("patches only the rest changed on step 3, keeping comments", async () => {
    const { state, tab, field, update, close } = openModal();
    tab(3).click();

    field(t("sets.restLabel")).value = "120";
    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("rest: 90", "rest: 120"));
    expect(close).toHaveBeenCalled();
  });

  it("updates straight from step 1 with a changed exercise", async () => {
    const { state, exercise, update } = openModal();

    exercise().value = "Front squat";
    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("exercise: Squat", "exercise: Front squat"));
  });

  it("updates from step 2 with a changed plan", async () => {
    const { state, tab, field, update } = openModal();
    tab(2).click();

    field(t("modal.labels.plannedSets")).value = "5";
    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("sets: 4", "sets: 5"));
  });

  it("blocks Update with an empty exercise and shows the error", async () => {
    const { state, exercise, update, contentEl, visible, close } = openModal();
    exercise().value = "";

    update();
    await flush();

    expect(state.content).toBe(NOTE);
    expect(close).not.toHaveBeenCalled();
    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe(
      t("modal.notices.validChooseExercise"),
    );
  });

  it("brings the user back to the exercise step when Update fails from Rest", async () => {
    const { state, exercise, tab, update, visible } = openModal();
    exercise().value = "";
    tab(3).click();

    update();
    await flush();

    expect(state.content).toBe(NOTE);
    expect(visible()).toEqual(["exercise"]);
  });
});
