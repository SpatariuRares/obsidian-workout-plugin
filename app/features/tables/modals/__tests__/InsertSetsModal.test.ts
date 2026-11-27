/** @jest-environment jsdom */
import { App, Notice } from "obsidian";

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
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import {
  openWizard,
  blockParams,
} from "@app/features/modals/base/__tests__/wizardHarness";
import { LocalizationService, t } from "@app/i18n";
import { FormatUtils } from "@app/utils/FormatUtils";
import {
  defaultProtocolEntries,
  protocolHelp,
} from "@app/services/protocols/ProtocolCatalog";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";

beforeAll(() => {
  LocalizationService.initialize({} as never);
});

function setFieldValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function openSetsWizard(exercises = ["Bench Press", "Bent Over Row", "Squat", "Plank", "Calf Raise"]) {
  const pages = exercises.map((name) => ({
    file: { basename: name, path: `Exercises/${name}.md` },
    names: [name],
  }));
  return openWizard(InsertSetsModal, {
    settings: {
      weightUnit: "kg",
      customProtocols: defaultProtocolEntries(),
    },
    getExerciseLibrary: () => ({ pages: () => pages, find: () => undefined }),
  });
}

describe("InsertSetsModal wizard", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.clearAllMocks();
  });

  it("opens on the exercise step", () => {
    const { visible, contentEl } = openSetsWizard();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 3 }),
    );
  });

  it("asks for an exercise before moving on, under the field, and unlocks on autocomplete change", () => {
    const { visible, next, contentEl, exercise, tab } = openSetsWizard();

    expect(tab(2).disabled).toBe(true);
    expect(tab(3).disabled).toBe(true);

    next();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe(
      t("modal.notices.validChooseExercise"),
    );
    expect(exercise().getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(exercise());

    // Autocomplete suggestion click dispatches "change", NOT "input"
    exercise().value = "Bench";
    exercise().dispatchEvent(new Event("input", { bubbles: true }));
    const suggestion = contentEl.querySelector<HTMLElement>(
      ".workout-exercise-autocomplete-suggestion",
    );
    expect(suggestion).not.toBeNull();
    suggestion!.click();

    expect(exercise().value).toBe("Bench Press");
    expect(contentEl.querySelector(".workout-wizard-error")).toBeNull();
    expect(tab(2).disabled).toBe(false);
    expect(tab(3).disabled).toBe(false);
  });

  it("does not let the stepper skip to Rest without an exercise", () => {
    const { visible, tab } = openSetsWizard();

    tab(3).click();

    expect(visible()).toEqual(["exercise"]);
  });

  it("jumps from the stepper once the exercise is chosen", () => {
    const { visible, tab, exercise } = openSetsWizard();
    setFieldValue(exercise(), "Squat");

    tab(3).click();

    expect(visible()).toEqual(["rest"]);
  });

  it("names the exercise on the plan step", () => {
    const { panel, next, exercise } = openSetsWizard();
    exercise().value = "Squat";

    next();

    expect(panel("plan").textContent).toContain(
      t("sets.wizard.planningFor", { exercise: "Squat" }),
    );
    expect(panel("plan").textContent).toContain(t("modal.labels.plannedSets"));
    expect(panel("plan").textContent).toContain(t("modal.labels.targetReps"));
  });

  it("has no quick rest presets, only the adjust field", () => {
    const { panel } = openSetsWizard();

    expect(panel("rest").querySelector(".workout-chip-group")).toBeNull();
    expect(panel("rest").querySelectorAll(".workout-field-with-adjust")).toHaveLength(1);
  });

  it("reviews the choices on the last step", () => {
    const w = openSetsWizard();
    w.exercise().value = "Squat";
    w.next();
    w.field(t("modal.labels.targetReps")).value = "8";
    w.next();
    w.field(t("sets.restLabel")).value = "90";
    w.field(t("sets.restLabel")).dispatchEvent(new Event("input", { bubbles: true }));

    const review = w.panel("rest").querySelector(".workout-wizard-review")!.textContent!;

    expect(review).toContain("Squat");
    expect(review).toContain("8");
    expect(review).toContain(t("sets.wizard.restValue", { seconds: 90 }));
  });

  it("inserts the block with the typed values and an id, then closes", () => {
    const w = openSetsWizard();
    w.exercise().value = "Squat";
    w.next();
    w.field(t("modal.labels.plannedSets")).value = "4";
    w.next();
    w.field(t("sets.restLabel")).value = "60";

    w.button(t("modal.buttons.insertSets"))!.click();

    expect(w.inserted).toHaveLength(1);
    expect(blockParams(w.inserted[0])).toMatchObject({
      exercise: "Squat",
      sets: 4,
      rest: 60,
      id: expect.any(String),
    });
    expect(w.inserted[0]).not.toContain("workout:");
    expect(Notice).toHaveBeenCalledWith(t("modal.notices.setsInserted"));
    expect(w.close).toHaveBeenCalled();
  });

  it("keeps values typed on a step when going back and forward", () => {
    const w = openSetsWizard();
    w.exercise().value = "Squat";
    w.next();
    w.field(t("modal.labels.plannedSets")).value = "5";
    w.next();
    w.button(t("wizard.back"))!.click();

    expect(w.field(t("modal.labels.plannedSets")).value).toBe("5");
  });

  it("blocks a direct submit without an exercise", () => {
    const w = openSetsWizard();
    const modal = w.modal as unknown as { submit(): void };

    modal.submit();

    expect(w.inserted).toHaveLength(0);
    expect(w.close).not.toHaveBeenCalled();
  });

  it("cancel inserts nothing", () => {
    const w = openSetsWizard();
    w.exercise().value = "Squat";

    w.button(t("modal.buttons.cancel"))!.click();

    expect(w.inserted).toHaveLength(0);
    expect(w.close).toHaveBeenCalled();
  });

  it("omits zero plan/rest fields and standard protocol from YAML", () => {
    const w = openSetsWizard();
    setFieldValue(w.exercise(), "Pull-up");
    w.next();
    setFieldValue(w.field(t("modal.labels.plannedSets")), "0");
    setFieldValue(w.field(t("modal.labels.targetReps")), "10");
    w.next();
    setFieldValue(w.field(t("sets.restLabel")), "-15");

    const review = w.panel("rest").querySelector(".workout-wizard-review")!.textContent!;
    expect(review).toContain(t("sets.wizard.restSectionTimer"));

    w.button(t("modal.buttons.insertSets"))!.click();
    expect(w.inserted[0]).not.toContain("sets:");
    expect(w.inserted[0]).not.toContain("rest:");
    expect(w.inserted[0]).not.toContain("protocol:");
    expect(w.inserted[0]).toContain("targetReps: 10");
  });

  it("renders ProtocolPicker excluding warm-up with protocolHelp hint, updates Step 2 context, and writes non-standard protocol", () => {
    const w = openSetsWizard(["Leg Extension", "Bench Press"]);

    const chipTexts = [
      ...w.panel("exercise").querySelectorAll<HTMLButtonElement>(
        ".workout-protocol-picker .workout-chip",
      ),
    ].map((c) => c.textContent?.trim());
    expect(chipTexts).toContain(t("modal.selectOptions.standard"));
    expect(chipTexts).toContain(t("modal.selectOptions.dropSet"));
    expect(chipTexts).toContain(t("modal.selectOptions.superset"));
    expect(chipTexts).not.toContain(t("modal.selectOptions.warmup"));

    const helpEl = w.panel("exercise").querySelector<HTMLElement>(".workout-protocol-help");
    expect(helpEl).not.toBeNull();
    expect(helpEl!.hidden).toBe(true);

    // Pick Drop set -> help hint appears
    w.button(t("modal.selectOptions.dropSet"))!.click();
    expect(helpEl!.hidden).toBe(false);
    expect(helpEl!.textContent).toBe(protocolHelp(WorkoutProtocol.DROP_SET));

    setFieldValue(w.exercise(), "Leg Extension");

    // Step 2 context reflects protocol + exercise
    w.next();
    expect(w.panel("plan").querySelector(".workout-wizard-context")?.textContent).toBe(
      `${t("modal.selectOptions.dropSet")} · Leg Extension`,
    );

    // Step 3 Review and submit
    w.next();
    expect(w.panel("rest").querySelector(".workout-wizard-review")!.textContent).toContain(
      t("modal.selectOptions.dropSet"),
    );

    w.button(t("modal.buttons.insertSets"))!.click();
    expect(blockParams(w.inserted[0])).toMatchObject({
      exercise: "Leg Extension",
      protocol: WorkoutProtocol.DROP_SET,
    });
  });

  it("toggles Step 1 to ordered Superset Exercises list with preserve/focus, dynamic labels, reorder, delete > 2, and empty-slot validation", () => {
    const w = openSetsWizard();
    setFieldValue(w.exercise(), "Bench Press");

    // Switch Single -> Superset: preserves A, ensures 2 slots, focuses empty B
    w.button(t("modal.selectOptions.superset"))!.click();

    const getSlotInputs = () => [
      ...w.panel("exercise").querySelectorAll<HTMLInputElement>(
        ".workout-superset-slot input[type='text']",
      ),
    ];

    let slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(2);
    expect(slotInputs[0].value).toBe("Bench Press");
    expect(slotInputs[1].value).toBe("");
    expect(document.activeElement).toBe(slotInputs[1]);

    expect(w.panel("exercise").querySelector(".workout-superset-count")?.textContent).toBe(
      t("modal.wizard.groupLabel.superset", { count: 2 }),
    );
    expect(w.panel("exercise").querySelectorAll(".workout-delete-button")).toHaveLength(0);

    // Step 2 & Step 3 locked while slot B is empty
    expect(w.tab(2).disabled).toBe(true);

    // Clicking Next validates slots, shows inline error under empty slot B, focuses it
    w.next();
    expect(w.visible()).toEqual(["exercise"]);
    const errorEl = w.panel("exercise").querySelector<HTMLElement>(".workout-wizard-error");
    expect(errorEl).not.toBeNull();
    expect(errorEl!.textContent).toBe(t("modal.wizard.chooseExerciseSlot", { letter: "B" }));
    expect(slotInputs[1].getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(slotInputs[1]);

    // Autocomplete suggestion click ("change" event) clears slot B error and unlocks steps
    slotInputs[1].value = "Bent";
    slotInputs[1].dispatchEvent(new Event("input", { bubbles: true }));
    const suggestion = w.panel("exercise").querySelectorAll<HTMLElement>(
      ".workout-superset-slot .workout-exercise-autocomplete-suggestion",
    );
    expect(suggestion.length).toBeGreaterThan(0);
    suggestion[0].click();

    expect(slotInputs[1].value).toBe("Bent Over Row");
    expect(w.panel("exercise").querySelector(".workout-wizard-error")).toBeNull();
    expect(w.tab(2).disabled).toBe(false);

    // Add 3rd and 4th exercises -> Triset · 3, Giant set · 4, DeleteButton appears when > 2
    w.button(t("modal.wizard.addExercise"))!.click();
    slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(3);
    expect(document.activeElement).toBe(slotInputs[2]);
    expect(w.panel("exercise").querySelector(".workout-superset-count")?.textContent).toBe(
      t("modal.wizard.groupLabel.triset", { count: 3 }),
    );
    expect(w.panel("exercise").querySelectorAll(".workout-delete-button")).toHaveLength(3);
    setFieldValue(slotInputs[2], "Plank");

    w.button(t("modal.wizard.addExercise"))!.click();
    slotInputs = getSlotInputs();
    expect(slotInputs).toHaveLength(4);
    expect(w.panel("exercise").querySelector(".workout-superset-count")?.textContent).toBe(
      t("modal.wizard.groupLabel.giantSet", { count: 4 }),
    );
    setFieldValue(slotInputs[3], "Calf Raise");

    // Reorder: move B up to A
    w.panel("exercise")
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
    w.panel("exercise")
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.removeExercise", { letter: "D" })}"]`,
      )!
      .click();
    expect(getSlotInputs()).toHaveLength(3);
    w.panel("exercise")
      .querySelector<HTMLButtonElement>(
        `button[aria-label="${t("modal.wizard.removeExercise", { letter: "C" })}"]`,
      )!
      .click();
    expect(getSlotInputs()).toHaveLength(2);
    expect(w.panel("exercise").querySelectorAll(".workout-delete-button")).toHaveLength(0);

    // Switch Superset -> Single preserves Exercise A ("Bent Over Row")
    w.button(t("modal.selectOptions.standard"))!.click();
    expect(w.exercise().value).toBe("Bent Over Row");
  });

  it("adapts Step 2 Plan for warm-up sets (0-10) in single mode and Rounds + Warm-up rounds without targets in superset mode", () => {
    const w = openSetsWizard();

    setFieldValue(w.exercise(), "Bench Press");
    w.next();

    const warmupSetsInput = w.field(t("modal.wizard.warmupSets"));
    expect(warmupSetsInput.value).toBe("0");
    expect(w.panel("plan").textContent).toContain(t("modal.wizard.warmupHelper"));

    setFieldValue(warmupSetsInput, "2");
    w.next();
    expect(w.panel("rest").querySelector(".workout-wizard-review")!.textContent).toContain("2");

    // Go back to Step 1 and switch to Superset
    w.button(t("wizard.back"))!.click();
    w.button(t("wizard.back"))!.click();
    w.button(t("modal.selectOptions.superset"))!.click();

    const slotInputs = w.panel("exercise").querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(slotInputs[1], "Bent Over Row");
    w.next();

    expect(w.panel("plan").querySelector(".workout-wizard-context")?.textContent).toBe(
      `${t("modal.selectOptions.superset")} · Bench Press + Bent Over Row`,
    );

    const roundsInput = w.field(t("modal.rounds"));
    expect(roundsInput.value).toBe("3");
    const warmupRoundsInput = w.field(t("modal.wizard.warmupRounds"));
    expect(warmupRoundsInput.value).toBe("2");
    expect(w.panel("plan").textContent).not.toContain(t("modal.labels.plannedSets"));
    expect(w.panel("plan").textContent).not.toContain(
      t("modal.labels.targetWeight", { unit: "kg" }),
    );
    expect(w.panel("plan").textContent).not.toContain(t("modal.labels.targetReps"));
    expect(w.panel("plan").textContent).toContain(t("modal.wizard.supersetTargetsNote"));

    // Verify single mode insert with warmups: 2
    w.button(t("wizard.back"))!.click();
    w.button(t("modal.selectOptions.dropSet"))!.click();
    w.next();
    w.next();
    w.button(t("modal.buttons.insertSets"))!.click();

    expect(blockParams(w.inserted[0])).toMatchObject({
      exercise: "Bench Press",
      protocol: WorkoutProtocol.DROP_SET,
      warmups: 2,
    });
  });

  it("renders Superset Step 3 with restBetween + Round rest fallback hint + live rhythm preview, and serializes superset block", () => {
    const w = openSetsWizard();

    w.button(t("modal.selectOptions.superset"))!.click();
    const slotInputs = w.panel("exercise").querySelectorAll<HTMLInputElement>(
      ".workout-superset-slot input[type='text']",
    );
    setFieldValue(slotInputs[0], "Bench Press");
    setFieldValue(slotInputs[1], "Bent Over Row");

    w.tab(3).click();

    // No protocol/preset chips on Step 3
    expect(w.panel("rest").querySelectorAll(".workout-chip")).toHaveLength(0);

    const restBetweenInput = w.field(t("modal.wizard.restBetweenLabel"));
    const roundRestInput = w.field(t("modal.wizard.restRoundLabel"));
    expect(restBetweenInput.value).toBe("0");
    expect(roundRestInput.value).toBe("0");

    const rhythmEl = w.panel("rest").querySelector<HTMLElement>(
      ".workout-wizard-rhythm-preview",
    );
    expect(rhythmEl).not.toBeNull();
    expect(rhythmEl!.textContent).toContain("A");
    expect(rhythmEl!.textContent).toContain("B");
    expect(rhythmEl!.textContent).toContain(t("modal.wizard.rhythmNextRoundNoTimer"));

    // Paired 90s: restBetween = 90 while rest = 0 -> fallback hint + live rhythm preview
    setFieldValue(restBetweenInput, "90");
    expect(roundRestInput.value).toBe("");
    expect(roundRestInput.placeholder).toBe("90");
    expect(w.panel("rest").textContent).toContain(
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

    const reviewText = w.panel("rest").querySelector(".workout-wizard-review")!.textContent!;
    expect(reviewText).toContain("Bench Press + Bent Over Row");
    expect(reviewText).toContain(FormatUtils.formatDuration(30));
    expect(reviewText).toContain(FormatUtils.formatDuration(120));

    w.button(t("modal.buttons.insertSets"))!.click();
    const parsed = blockParams(w.inserted[0]);
    expect(parsed).toMatchObject({
      exercises: ["Bench Press", "Bent Over Row"],
      protocol: WorkoutProtocol.SUPERSET,
      sets: 3,
      restBetween: 30,
      rest: 120,
    });
    expect(w.inserted[0]).not.toContain("exercise:");
    expect(w.inserted[0]).not.toContain("targetWeight:");
    expect(w.inserted[0]).not.toContain("targetReps:");
    expect(w.inserted[0]).not.toContain("warmups:");
    expect(w.close).toHaveBeenCalledTimes(1);
  });
});
