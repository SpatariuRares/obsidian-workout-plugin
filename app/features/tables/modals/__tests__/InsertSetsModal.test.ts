/** @jest-environment jsdom */
import { App, MarkdownView, Notice, TFile } from "obsidian";
import { LocalizationService, t } from "@app/i18n";
import { FormatUtils } from "@app/utils/FormatUtils";
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { EditSetsModal } from "@app/features/tables/modals/EditSetsModal";
import { setsBlock } from "@app/features/tables/setsBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import {
  defaultProtocolEntries,
  protocolHelp,
} from "@app/services/protocols/ProtocolCatalog";
import {
  WorkoutProtocol,
  type CustomProtocolConfig,
} from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

function createTestEnv(options?: {
  exercises?: string[];
  noteContent?: string;
  customProtocols?: CustomProtocolConfig[];
}) {
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
      customProtocols: options?.customProtocols ?? defaultProtocolEntries(),
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
    expect(reviewInset!.textContent).toContain(
      t("logs.weightedSet", { weight: 85, unit: "kg", reps: 8 }),
    );

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
    expect(reviewText).toContain(t("session.targetReps", { reps: 10 }));
    expect(reviewText).toContain(t("modal.wizard.review.sectionTimer"));

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    expect(inserted).not.toContain("sets:");
    expect(inserted).not.toContain("rest:");
    expect(inserted).not.toContain("protocol:");
    expect(inserted).toContain("targetReps: 10");
  });

  it("renders ProtocolPicker excluding warm-up with protocolHelp hint, updates Step 2 context, and writes non-standard protocol", () => {
    const { app, plugin, editor } = createTestEnv({
      exercises: ["Leg Extension", "Bench Press"],
    });
    const { contentEl } = mountModal(new InsertSetsModal(app, plugin));

    const chipTexts = [
      ...contentEl.querySelectorAll<HTMLButtonElement>(
        ".workout-protocol-picker .workout-chip",
      ),
    ].map((c) => c.textContent?.trim());
    expect(chipTexts).toContain(t("modal.selectOptions.standard"));
    expect(chipTexts).toContain(t("modal.selectOptions.dropSet"));
    expect(chipTexts).toContain(t("modal.selectOptions.superset"));
    expect(chipTexts).not.toContain(t("modal.selectOptions.warmup"));

    const helpEl = contentEl.querySelector<HTMLElement>(".workout-protocol-help");
    expect(helpEl).not.toBeNull();
    expect(helpEl!.hidden).toBe(true);

    // Pick Drop set -> help hint appears
    buttonByText(contentEl, t("modal.selectOptions.dropSet")).click();
    expect(helpEl!.hidden).toBe(false);
    expect(helpEl!.textContent).toBe(protocolHelp(WorkoutProtocol.DROP_SET));

    const exerciseInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(exerciseInput, "Leg Extension");

    // Step 2 context reflects protocol + exercise
    buttonByText(contentEl, t("modal.buttons.next")).click();
    expect(
      contentEl.querySelector(".workout-wizard-context-line")?.textContent,
    ).toBe(`${t("modal.selectOptions.dropSet")} · Leg Extension`);

    // Step 3 Review and submit
    buttonByText(contentEl, t("modal.buttons.next")).click();
    const reviewText = contentEl.querySelector(
      ".workout-wizard-review-inset",
    )?.textContent;
    expect(reviewText).toContain(t("modal.selectOptions.dropSet"));

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    expect(setsBlock.parse(body).params).toMatchObject({
      exercise: "Leg Extension",
      protocol: WorkoutProtocol.DROP_SET,
    });
  });

  it("toggles Step 1 to ordered Superset Exercises list with preserve/focus, dynamic labels, reorder, delete > 2, and empty-slot validation", () => {
    const { app, plugin } = createTestEnv({
      exercises: ["Bench Press", "Bent Over Row", "Plank", "Calf Raise"],
    });
    const { contentEl } = mountModal(new InsertSetsModal(app, plugin));

    // Type Exercise A in single mode
    const singleInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(singleInput, "Bench Press");

    // Switch Single -> Superset: preserves A, ensures 2 slots, focuses empty B
    buttonByText(contentEl, t("modal.selectOptions.superset")).click();

    const getSlotInputs = () =>
      [
        ...contentEl.querySelectorAll<HTMLInputElement>(
          ".workout-superset-slot input[type='text']",
        ),
      ];

    let slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(2);
    expect(slotInputs[0].value).toBe("Bench Press");
    expect(slotInputs[1].value).toBe("");
    expect(document.activeElement).toBe(slotInputs[1]);

    expect(
      contentEl.querySelector(".workout-superset-count")?.textContent,
    ).toBe(t("modal.wizard.groupLabel.superset", { count: 2 }));
    expect(
      contentEl.querySelectorAll(".workout-delete-button"),
    ).toHaveLength(0);

    // Step 2 & Step 3 locked while slot B is empty
    const stepBtns = contentEl.querySelectorAll<HTMLButtonElement>(
      ".workout-wizard-step-btn",
    );
    expect(stepBtns[1].disabled).toBe(true);

    // Clicking Next validates slots, shows inline error under empty slot B, focuses it
    buttonByText(contentEl, t("modal.buttons.next")).click();
    expect(
      contentEl.querySelector(".workout-wizard-step-meta")?.textContent,
    ).toBe(t("modal.wizard.stepOf", { current: 1, total: 3 }));
    const slotErrors = contentEl.querySelectorAll<HTMLElement>(
      ".workout-superset-slot .workout-field-error",
    );
    expect(slotErrors[0].hidden).toBe(true);
    expect(slotErrors[1].hidden).toBe(false);
    expect(slotErrors[1].textContent).toBe(
      t("modal.wizard.chooseExerciseSlot", { letter: "B" }),
    );
    expect(slotInputs[1].getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(slotInputs[1]);

    // Autocomplete suggestion click ("change" event) clears slot B error and unlocks steps
    slotInputs[1].value = "Bent";
    slotInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    const suggestion = contentEl.querySelectorAll<HTMLElement>(
      ".workout-superset-slot .workout-exercise-autocomplete-suggestion",
    );
    expect(suggestion.length).toBeGreaterThan(0);
    suggestion[0].click();

    expect(slotInputs[1].value).toBe("Bent Over Row");
    expect(slotErrors[1].hidden).toBe(true);
    expect(stepBtns[1].disabled).toBe(false);

    // Add 3rd and 4th exercises -> Triset · 3, Giant set · 4, DeleteButton appears when > 2
    buttonByText(contentEl, t("modal.wizard.addExercise")).click();
    slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(3);
    expect(document.activeElement).toBe(slotInputs[2]);
    expect(
      contentEl.querySelector(".workout-superset-count")?.textContent,
    ).toBe(t("modal.wizard.groupLabel.triset", { count: 3 }));
    expect(
      contentEl.querySelectorAll(".workout-delete-button"),
    ).toHaveLength(3);
    setFieldValue(slotInputs[2], "Plank");

    buttonByText(contentEl, t("modal.wizard.addExercise")).click();
    slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(4);
    expect(
      contentEl.querySelector(".workout-superset-count")?.textContent,
    ).toBe(t("modal.wizard.groupLabel.giantSet", { count: 4 }));
    setFieldValue(slotInputs[3], "Calf Raise");

    // Reorder: move B up to A
    contentEl
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.moveExerciseUp", { letter: "B" })}"]`,
      )!
      .click();
    slotInputs = getSlotInputs();
    expect(slotInputs.map((i) => i.value)).toEqual([
      "Bent Over Row",
      "Bench Press",
      "Plank",
      "Calf Raise",
    ]);

    // Remove D and C -> back to 2 slots with no DeleteButton
    contentEl
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.removeExercise", { letter: "D" })}"]`,
      )!
      .click();
    expect(getSlotInputs()).toHaveLength(3);
    contentEl
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.removeExercise", { letter: "C" })}"]`,
      )!
      .click();
    expect(getSlotInputs()).toHaveLength(2);
    expect(
      contentEl.querySelectorAll(".workout-delete-button"),
    ).toHaveLength(0);

    // Switch Superset -> Single preserves Exercise A ("Bent Over Row")
    buttonByText(contentEl, t("modal.selectOptions.standard")).click();
    const singleBack = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    expect(singleBack.value).toBe("Bent Over Row");
  });

  it("adapts Step 2 Plan for warm-up sets (0-10) in single mode and Rounds + Warm-up rounds without targets in superset mode", () => {
    const { app, plugin, editor } = createTestEnv({
      exercises: ["Bench Press", "Bent Over Row"],
    });
    const { contentEl } = mountModal(new InsertSetsModal(app, plugin));

    // Single mode: Bench Press with 2 warm-ups
    const singleInput = contentEl.querySelector<HTMLInputElement>(
      "input[type='text']",
    )!;
    setFieldValue(singleInput, "Bench Press");

    buttonByText(contentEl, t("modal.buttons.next")).click();

    const warmupSetsInput = adjustFieldInput(
      contentEl,
      t("modal.wizard.warmupSets"),
    );
    expect(warmupSetsInput.value).toBe("0");
    expect(contentEl.textContent).toContain(t("modal.wizard.warmupHelper"));

    // Increment warm-ups to 2 and test max clamp at 10
    setFieldValue(warmupSetsInput, "2");

    buttonByText(contentEl, t("modal.buttons.next")).click();
    expect(
      contentEl.querySelector(".workout-wizard-review-inset")?.textContent,
    ).toContain(t("modal.wizard.review.warmupsMany", { count: 2 }));

    // Go back to Step 1 and switch to Superset
    buttonByText(contentEl, t("modal.buttons.back")).click();
    buttonByText(contentEl, t("modal.buttons.back")).click();
    buttonByText(contentEl, t("modal.selectOptions.superset")).click();

    const slotInputs = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(slotInputs[1], "Bent Over Row");

    buttonByText(contentEl, t("modal.buttons.next")).click();

    expect(
      contentEl.querySelector(".workout-wizard-context-line")?.textContent,
    ).toBe(`${t("modal.selectOptions.superset")} · Bench Press + Bent Over Row`);

    // Rounds & Warm-up rounds shown; Target weight & Target reps hidden; quiet Last time note shown
    const roundsInput = adjustFieldInput(contentEl, t("modal.rounds"));
    expect(roundsInput.value).toBe("3");
    const warmupRoundsInput = adjustFieldInput(
      contentEl,
      t("modal.wizard.warmupRounds"),
    );
    expect(warmupRoundsInput.value).toBe("2");
    expect(contentEl.textContent).not.toContain(
      t("modal.labels.plannedSets"),
    );
    expect(contentEl.textContent).not.toContain(
      t("modal.labels.targetWeight", { unit: "kg" }),
    );
    expect(contentEl.textContent).not.toContain(t("modal.labels.targetReps"));
    expect(contentEl.textContent).toContain(
      t("modal.wizard.supersetTargetsNote"),
    );

    // Also verify single mode insert with warmups: 2
    buttonByText(contentEl, t("modal.buttons.back")).click();
    buttonByText(contentEl, t("modal.selectOptions.dropSet")).click();
    buttonByText(contentEl, t("modal.buttons.next")).click();
    buttonByText(contentEl, t("modal.buttons.next")).click();
    buttonByText(contentEl, t("modal.buttons.insertSets")).click();

    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    expect(setsBlock.parse(body).params).toMatchObject({
      exercise: "Bench Press",
      protocol: WorkoutProtocol.DROP_SET,
      warmups: 2,
    });
  });

  it("renders Superset Step 3 with restBetween + Round rest fallback hint + live rhythm preview, and serializes superset block", () => {
    const { app, plugin, editor } = createTestEnv({
      exercises: ["Bench Press", "Bent Over Row"],
    });
    const { contentEl, close } = mountModal(new InsertSetsModal(app, plugin));

    buttonByText(contentEl, t("modal.selectOptions.superset")).click();
    const slotInputs = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(slotInputs[0], "Bench Press");
    setFieldValue(slotInputs[1], "Bent Over Row");

    contentEl
      .querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn")[2]
      .click();

    // No chips on Step 3
    expect(contentEl.querySelectorAll(".workout-chip")).toHaveLength(0);

    const restBetweenInput = adjustFieldInput(
      contentEl,
      t("modal.wizard.restBetweenLabel"),
    );
    const roundRestInput = adjustFieldInput(
      contentEl,
      t("modal.wizard.restRoundLabel"),
    );
    expect(restBetweenInput.value).toBe("0");
    expect(roundRestInput.value).toBe("0");

    const rhythmEl = contentEl.querySelector<HTMLElement>(
      ".workout-wizard-rhythm-preview",
    );
    expect(rhythmEl).not.toBeNull();
    expect(rhythmEl!.textContent).toContain("A");
    expect(rhythmEl!.textContent).toContain("B");
    expect(rhythmEl!.textContent).toContain(
      t("modal.wizard.rhythmNextRoundNoTimer"),
    );

    // Paired 90s: restBetween = 90 while rest = 0 -> fallback hint + live rhythm preview
    setFieldValue(restBetweenInput, "90");
    expect(roundRestInput.value).toBe("");
    expect(roundRestInput.placeholder).toBe("90");
    expect(contentEl.textContent).toContain(
      t("modal.wizard.restRoundFallbackHelper", {
        duration: FormatUtils.formatDuration(90),
      }),
    );
    expect(rhythmEl!.textContent).toBe(
      `A → ${FormatUtils.formatDuration(90)} → B → ${FormatUtils.formatDuration(90)} → ${t("modal.wizard.rhythmNextRound")}`,
    );

    // Clicking + on empty Round rest steps from the live restBetween suggestion (90 -> 105)
    const roundRestInc = roundRestInput
      .closest(".workout-number-field")!
      .querySelectorAll<HTMLButtonElement>(".workout-number-field-step")[1];
    roundRestInc.click();
    expect(roundRestInput.value).toBe("105");

    // Override Round rest to 120s and Rest between to 30s
    setFieldValue(restBetweenInput, "30");
    setFieldValue(roundRestInput, "120");
    expect(rhythmEl!.textContent).toBe(
      `A → ${FormatUtils.formatDuration(30)} → B → ${FormatUtils.formatDuration(120)} → ${t("modal.wizard.rhythmNextRound")}`,
    );

    const reviewText = contentEl.querySelector(
      ".workout-wizard-review-inset",
    )?.textContent;
    expect(reviewText).toContain("Bench Press + Bent Over Row");
    expect(reviewText).toContain(FormatUtils.formatDuration(30));
    expect(reviewText).toContain(FormatUtils.formatDuration(120));

    buttonByText(contentEl, t("modal.buttons.insertSets")).click();
    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    const parsed = setsBlock.parse(body).params;
    expect(parsed).toMatchObject({
      exercises: ["Bench Press", "Bent Over Row"],
      protocol: WorkoutProtocol.SUPERSET,
      sets: 3,
      restBetween: 30,
      rest: 120,
    });
    expect(inserted).not.toContain("exercise:");
    expect(inserted).not.toContain("targetWeight:");
    expect(inserted).not.toContain("targetReps:");
    expect(inserted).not.toContain("warmups:");
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("generates ## A + B heading for AddExerciseBlockModal in Superset mode", () => {
    const { app, plugin, editor } = createTestEnv({
      exercises: ["Bench Press", "Bent Over Row", "Plank"],
    });
    const { contentEl } = mountModal(new AddExerciseBlockModal(app, plugin));

    buttonByText(contentEl, t("modal.selectOptions.superset")).click();
    const slotInputs = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(slotInputs[0], "Bench Press");
    setFieldValue(slotInputs[1], "Bent Over Row");

    buttonByText(contentEl, t("modal.wizard.addExercise")).click();
    const updatedSlots = contentEl.querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(updatedSlots[2], "Plank");

    contentEl
      .querySelectorAll<HTMLButtonElement>(".workout-wizard-step-btn")[2]
      .click();
    buttonByText(contentEl, t("modal.buttons.insertExerciseBlock")).click();

    const [inserted] = editor.replaceRange.mock.calls[0] as [string, unknown];
    expect(
      inserted.startsWith("## Bench Press + Bent Over Row + Plank\n\n```workout-sets\n"),
    ).toBe(true);
    const body = /```workout-sets\n([\s\S]*?)```/.exec(inserted)?.[1] ?? "";
    expect(setsBlock.parse(body).params).toMatchObject({
      exercises: ["Bench Press", "Bent Over Row", "Plank"],
      protocol: WorkoutProtocol.SUPERSET,
      rest: 90,
    });
    expect(inserted).not.toContain("restBetween:");
  });
});
