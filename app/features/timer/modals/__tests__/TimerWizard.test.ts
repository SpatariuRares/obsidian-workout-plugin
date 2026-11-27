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
import { InsertTimerModal } from "@app/features/timer/modals/InsertTimerModal";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { timerBlock } from "@app/features/timer/timerBlock";
import { openWizard } from "@app/features/modals/base/__tests__/wizardHarness";
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
  "autoStart: true",
  "```",
].join("\n");

function openEdit(note = NOTE) {
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
  const params = timerBlock.parse(note.split("\n").slice(1, -1).join("\n")).params;
  const modal = new EditTimerModal(app, plugin, params, { sourcePath: "Leg day.md" });
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();
  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find((b) => b.textContent === text);
  const tab = (n: number) =>
    contentEl.querySelectorAll<HTMLButtonElement>(".workout-wizard-step")[n - 1];
  const visible = () =>
    [...contentEl.querySelectorAll<HTMLElement>("[data-step-id]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.stepId);
  const field = (label: string) =>
    [...contentEl.querySelectorAll(".workout-field-with-adjust")]
      .find((el) => el.textContent?.includes(label))!
      .querySelector("input")!;
  return { state, contentEl, button, tab, visible, field, close };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("InsertTimerModal wizard", () => {
  it("opens on the timing step of two", () => {
    const { visible, contentEl } = openWizard(InsertTimerModal);

    expect(visible()).toEqual(["timing"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 2 }),
    );
  });

  it("blocks Next and the options tab while the duration is invalid, with the error under it", () => {
    const { visible, next, field, contentEl, tab } = openWizard(InsertTimerModal);
    field(t("modal.duration")).value = "";
    field(t("modal.duration")).dispatchEvent(new Event("input", { bubbles: true }));

    expect(tab(2).disabled).toBe(true);
    next();

    expect(visible()).toEqual(["timing"]);
    expect(contentEl.querySelector(".workout-wizard-error")).not.toBeNull();
    expect(document.activeElement).toBe(field(t("modal.duration")));
  });

  it("keeps what was typed when going Back", () => {
    const { visible, next, field, button } = openWizard(InsertTimerModal);
    field(t("modal.duration")).value = "45";

    next();
    expect(visible()).toEqual(["options"]);
    button(t("wizard.back"))!.click();

    expect(visible()).toEqual(["timing"]);
    expect(field(t("modal.duration")).value).toBe("45");
  });

  it("inserts the block with its id from the last step, and Cancel writes nothing", () => {
    const { next, field, button, inserted, close } = openWizard(InsertTimerModal);
    field(t("modal.duration")).value = "45";
    next();
    button(t("modal.buttons.cancel"))!.click();
    expect(inserted).toEqual([]);
    expect(close).toHaveBeenCalled();

    button(t("modal.buttons.insertTimer"))!.click();

    expect(inserted).toHaveLength(1);
    const body = /```workout-timer\n([\s\S]*?)```/.exec(inserted[0])![1];
    expect(body).toMatch(/^id: /m);
    expect(timerBlock.parse(body).params).toMatchObject({ type: "countdown", duration: 45 });
  });

  it("does not require a duration for a stopwatch", () => {
    const { visible, next, contentEl } = openWizard(InsertTimerModal);
    [...contentEl.querySelectorAll<HTMLButtonElement>(".workout-modal-type-chips button")]
      .find((b) => b.textContent === t("timer.stopwatch"))!
      .click();

    next();

    expect(visible()).toEqual(["options"]);
  });
});

describe("EditTimerModal wizard", () => {
  it("prefills both steps and opens every step from the stepper", () => {
    const { visible, tab, field, contentEl } = openEdit();

    expect(field(t("modal.duration")).value).toBe("90");
    tab(2).click();
    expect(visible()).toEqual(["options"]);
    expect(
      contentEl.querySelector<HTMLInputElement>("[data-step-id='options'] input[type='text']")!.value,
    ).toBe("Squat");
  });

  it("offers Update on both steps and patches only the changed line", async () => {
    const { state, button, tab, field, close } = openEdit();
    expect(button(t("modal.buttons.updateTimer"))).toBeDefined();
    field(t("modal.duration")).value = "120";
    tab(2).click();
    expect(button(t("modal.buttons.updateTimer"))).toBeDefined();

    button(t("modal.buttons.updateTimer"))!.click();
    await flush();

    expect(state.content).toBe(NOTE.replace("duration: 90", "duration: 120"));
    expect(close).toHaveBeenCalled();
  });

  it("leaves the note unchanged when nothing changed", async () => {
    const { state, button } = openEdit();

    button(t("modal.buttons.updateTimer"))!.click();
    await flush();

    expect(state.content).toBe(NOTE);
  });
});
