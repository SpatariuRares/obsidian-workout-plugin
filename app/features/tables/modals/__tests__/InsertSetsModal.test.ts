/** @jest-environment jsdom */
import { App, MarkdownView, Notice, TFile } from "obsidian";
import { LocalizationService, t } from "@app/i18n";
import { FormatUtils } from "@app/utils/FormatUtils";
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import { setsBlock } from "@app/features/tables/setsBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

function createTestEnv(options?: { exercises?: string[]; noteContent?: string }) {
  const editor = {
    getCursor: jest.fn(() => ({ line: 0, ch: 0 })),
    replaceRange: jest.fn(),
  };
  const noteState = { content: options?.noteContent ?? "" };
  const pages = (options?.exercises ?? ["Bench Press", "Squat"]).map((name) => ({
    file: { basename: name, path: `Exercises/${name}.md` },
    names: [name],
  }));

  const activeView = Object.assign(new MarkdownView(), {
    file: { path: "Workouts/Push Day.md", basename: "Push Day" },
    editor,
  });

  const app = {
    workspace: {
      getActiveViewOfType: jest.fn(() => activeView),
      getActiveFile: jest.fn(() => activeView.file),
    },
    vault: {
      getMarkdownFiles: jest.fn(() => []),
      getAbstractFileByPath: jest.fn((path: string) =>
        Object.assign(new TFile(), { path }),
      ),
      process: jest.fn(async (_file: unknown, fn: (c: string) => string) => {
        noteState.content = fn(noteState.content);
      }),
    },
    metadataCache: {
      getFileCache: jest.fn(() => null),
    },
  } as unknown as App;

  const plugin = {
    app,
    settings: {
      weightUnit: "kg",
      timerPresets: {},
      defaultTimerPreset: null,
      recentExercises: [],
    },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => pages, find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => pages.map((p) => p.file.basename),
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  return { app, plugin, editor, noteState };
}

function mountModal<T extends { contentEl: HTMLElement; onOpen(): void }>(
  modal: T,
) {
  const contentEl = createObsidianContainer();
  document.body.appendChild(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  modal.onOpen();
  return { modal, contentEl, close };
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const btn = [...root.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  if (!btn) throw new Error(`Button "${text}" not found`);
  return btn;
}

beforeAll(() => {
  LocalizationService.initialize({} as never);
});

function adjustFieldInput(root: HTMLElement, labelText: string): HTMLInputElement {
  const container = [
    ...root.querySelectorAll<HTMLElement>(".workout-field-with-adjust"),
  ].find((el) => el.textContent?.includes(labelText));
  if (!container) throw new Error(`AdjustField "${labelText}" not found`);
  return container.querySelector<HTMLInputElement>("input")!;
}

function setFieldValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("InsertSetsModal wizard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("blocks Step 1 advancing when exercise is empty, showing inline error and focusing input, then unlocks on autocomplete change", () => {
    const { app, plugin } = createTestEnv({ exercises: ["Bench Press", "Squat"] });
    const { contentEl } = mountModal(new InsertSetsModal(app, plugin));

    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));

    const stepBtns = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-wizard-step-btn",
      ),
    ];
    expect(stepBtns[1].disabled).toBe(true);
    expect(stepBtns[2].disabled).toBe(true);

    // Try advancing via Next while exercise is empty
    buttonByText(contentEl, t("modal.buttons.next")).click();

    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));

    const exerciseInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    const errorEl = contentEl.querySelector<HTMLElement>(
      ".workout-field-error",
    );
    expect(errorEl).not.toBeNull();
    expect(errorEl!.hidden).toBe(false);
    expect(errorEl!.textContent).toBe(t("modal.notices.validChooseExercise"));
    expect(exerciseInput.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(exerciseInput);

    // Autocomplete suggestion click dispatches "change", NOT "input"
    exerciseInput.value = "Bench";
    exerciseInput.dispatchEvent(new Event("input", { bubbles: true }));
    const suggestion = contentEl.querySelector<HTMLElement>(
      ".workout-exercise-autocomplete-suggestion",
    );
    expect(suggestion).not.toBeNull();
    suggestion!.click();

    expect(exerciseInput.value).toBe("Bench Press");
    expect(errorEl!.hidden).toBe(true);
    expect(stepBtns[1].disabled).toBe(false);
    expect(stepBtns[2].disabled).toBe(false);
  });

  it("jumps directly to Plan showing exercise context and PlanFields, then Step 3 shows Rest AdjustField only + Review inset and preserves state across transitions", () => {
    const { app, plugin, editor } = createTestEnv();
    const { contentEl, close } = mountModal(new InsertSetsModal(app, plugin));

    const inputsOnStep1 = contentEl.querySelectorAll<HTMLInputElement>(
      "input[type='text']",
    );
    setFieldValue(inputsOnStep1[0], "Bench Press");
    setFieldValue(inputsOnStep1[1], "Upper A");

    // Jump directly to Step 2 via stepper
    const stepBtns = contentEl.querySelectorAll<HTMLButtonElement>(
      ".workout-wizard-step-btn",
    );
    stepBtns[1].click();

    expect(
      contentEl.querySelector(".workout-wizard-context-line")?.textContent,
    ).toBe("Bench Press");

    const setsInput = adjustFieldInput(contentEl, t("modal.labels.plannedSets"));
    const weightInput = adjustFieldInput(
      contentEl,
      t("modal.labels.targetWeight", { unit: "kg" }),
    );
    const repsInput = adjustFieldInput(contentEl, t("modal.labels.targetReps"));

    expect(setsInput.value).toBe("3");
    setFieldValue(setsInput, "4");
    setFieldValue(weightInput, "85");
    setFieldValue(repsInput, "8");

    // Advance to Step 3
    buttonByText(contentEl, t("modal.buttons.next")).click();

    // No quick timer preset chips on Step 3
    expect(contentEl.querySelectorAll(".workout-chip")).toHaveLength(0);
    expect(contentEl.querySelector(".workout-chip-group")).toBeNull();

    const restInput = adjustFieldInput(contentEl, t("sets.restLabel"));
    expect(restInput.value).toBe("0");

    // Review inset has no nested cards and reflects current values
    const reviewInset = contentEl.querySelector<HTMLElement>(
      ".workout-wizard-review-inset",
    );
    expect(reviewInset).not.toBeNull();
    expect(reviewInset!.querySelector(".workout-modal-section")).toBeNull();
    expect(reviewInset!.textContent).toContain("Bench Press");
    expect(reviewInset!.textContent).toContain("Upper A");
    expect(reviewInset!.textContent).toContain("4");

    // Increment rest via +15 button and check live Review update
    const incBtn = restInput
      .closest(".workout-number-field")!
      .querySelectorAll<HTMLButtonElement>(".workout-number-field-step")[1];
    incBtn.click();
    incBtn.click();
    expect(restInput.value).toBe("30");
    expect(reviewInset!.textContent).toContain(FormatUtils.formatDuration(30));

    // Step backward to Step 2 and Step 1, verifying state is preserved
    buttonByText(contentEl, t("modal.buttons.back")).click();
    expect(
      adjustFieldInput(contentEl, t("modal.labels.plannedSets")).value,
    ).toBe("4");
    expect(
      adjustFieldInput(
        contentEl,
        t("modal.labels.targetWeight", { unit: "kg" }),
      ).value,
    ).toBe("85");
    expect(
      adjustFieldInput(contentEl, t("modal.labels.targetReps")).value,
    ).toBe("8");

    buttonByText(contentEl, t("modal.buttons.back")).click();
    const step1InputsBack = contentEl.querySelectorAll<HTMLInputElement>(
      "input[type='text']",
    );
    expect(step1InputsBack[0].value).toBe("Bench Press");
    expect(step1InputsBack[1].value).toBe("Upper A");

    // Jump straight back to Step 3 and submit
    contentEl
      .querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn")[2]
      .click();
    expect(adjustFieldInput(contentEl, t("sets.restLabel")).value).toBe("30");

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();

    expect(editor.replaceRange).toHaveBeenCalledTimes(1);
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    expect(setsBlock.parse(body).params).toMatchObject({
      id: expect.any(String),
      exercise: "Bench Press",
      workout: "Upper A",
      sets: 4,
      targetWeight: 85,
      targetReps: 8,
      rest: 30,
    });
    expect(Notice).toHaveBeenCalledWith(t("modal.notices.setsInserted"));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("supports AddExerciseBlockModal with defaultRest = 90 and inserts heading + workout-sets block", () => {
    const { app, plugin, editor } = createTestEnv();
    const { contentEl, close } = mountModal(
      new AddExerciseBlockModal(app, plugin),
    );

    const exerciseInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(exerciseInput, "Romanian Deadlift");

    // Jump to Step 3 via stepper
    contentEl
      .querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn")[2]
      .click();

    const restInput = adjustFieldInput(contentEl, t("sets.restLabel"));
    expect(restInput.value).toBe("90");
    expect(
      contentEl.querySelector(".workout-wizard-review-inset")?.textContent,
    ).toContain(FormatUtils.formatDuration(90));

    buttonByText(contentEl, t("modal.buttons.insertExerciseBlock")).click();

    expect(editor.replaceRange).toHaveBeenCalledTimes(1);
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    expect(
      inserted.startsWith("## Romanian Deadlift\n\n```workout-sets\n"),
    ).toBe(true);
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    expect(setsBlock.parse(body).params).toMatchObject({
      id: expect.any(String),
      exercise: "Romanian Deadlift",
      sets: 3,
      rest: 90,
    });
    expect(inserted).not.toContain("workout:");
    expect(Notice).toHaveBeenCalledWith(
      t("modal.notices.exerciseBlockInserted"),
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("keeps EditSetsModal compiling and patching only changed params across wizard steps", async () => {
    const note = [
      "# Push Day",
      "```workout-sets",
      "id: ws-1",
      "exercise: Bench Press",
      "# keep comment",
      "sets: 4",
      "rest: 90",
      "```",
    ].join("\n");
    const { app, plugin, noteState } = createTestEnv({ noteContent: note });
    const params = {
      id: "ws-1",
      exercise: "Bench Press",
      sets: 4,
      rest: 90,
    };
    const { contentEl, close } = mountModal(
      new EditSetsModal(app, plugin, params, { sourcePath: "Push Day.md" }),
    );

    // Step 1 pre-filled so Step 2 & Step 3 are immediately reachable
    const stepBtns = contentEl.querySelectorAll<HTMLButtonElement>(
      ".workout-wizard-step-btn",
    );
    expect(stepBtns[1].disabled).toBe(false);
    expect(stepBtns[2].disabled).toBe(false);

    // Jump to Step 3 and change rest from 90 to 120
    stepBtns[2].click();
    const restInput = adjustFieldInput(contentEl, t("sets.restLabel"));
    expect(restInput.value).toBe("90");
    setFieldValue(restInput, "120");

    buttonByText(contentEl, t("modal.buttons.update")).click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(close).toHaveBeenCalledTimes(1);
    expect(noteState.content).toContain("rest: 120");
    expect(noteState.content).toContain("# keep comment");
    expect(noteState.content).toContain("sets: 4");
  });

  it("omits zero plan/rest fields from YAML and shows fallback labels in Review", () => {
    const { app, plugin, editor } = createTestEnv();
    const { contentEl } = mountModal(new InsertSetsModal(app, plugin));

    const exerciseInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(exerciseInput, "Pull-up");

    buttonByText(contentEl, t("modal.buttons.next")).click();
    setFieldValue(adjustFieldInput(contentEl, t("modal.labels.plannedSets")), "0");
    setFieldValue(adjustFieldInput(contentEl, t("modal.labels.targetReps")), "10");

    buttonByText(contentEl, t("modal.buttons.next")).click();
    const restInput = adjustFieldInput(contentEl, t("sets.restLabel"));
    setFieldValue(restInput, "-15");

    const reviewText = contentEl.querySelector(
      ".workout-wizard-review-inset",
    )?.textContent;
    expect(reviewText).toContain(t("modal.wizard.review.lastTime"));
    expect(reviewText).toContain(
      t("modal.wizard.review.targetReps", { reps: 10 }),
    );
    expect(reviewText).toContain(t("modal.wizard.review.sectionTimer"));

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    expect(inserted).not.toContain("sets:");
    expect(inserted).not.toContain("rest:");
    expect(inserted).toContain("targetReps: 10");
  });
});
