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
import { InsertSetsModal } from "@app/features/tables/modals/InsertSetsModal";
import { openWizard, blockParams } from "@app/features/modals/base/__tests__/wizardHarness";
import { t } from "@app/i18n";

describe("InsertSetsModal wizard", () => {
  it("opens on the exercise step", () => {
    const { visible, contentEl } = openWizard(InsertSetsModal);

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 3 }),
    );
  });

  it("asks for an exercise before moving on, under the field", () => {
    const { visible, next, contentEl, exercise } = openWizard(InsertSetsModal);

    next();

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe(
      t("modal.notices.validChooseExercise"),
    );
    expect(document.activeElement).toBe(exercise());
  });

  it("does not let the stepper skip to Rest without an exercise", () => {
    const { visible, tab } = openWizard(InsertSetsModal);

    tab(3).click();

    expect(visible()).toEqual(["exercise"]);
  });

  it("jumps from the stepper once the exercise is chosen", () => {
    const { visible, tab, exercise } = openWizard(InsertSetsModal);
    exercise().value = "Squat";

    tab(3).click();

    expect(visible()).toEqual(["rest"]);
  });

  it("names the exercise on the plan step", () => {
    const { panel, next, exercise } = openWizard(InsertSetsModal);
    exercise().value = "Squat";

    next();

    expect(panel("plan").textContent).toContain(t("sets.wizard.planningFor", { exercise: "Squat" }));
    expect(panel("plan").textContent).toContain(t("modal.labels.plannedSets"));
    expect(panel("plan").textContent).toContain(t("modal.labels.targetReps"));
  });

  it("has no quick rest presets, only the adjust field", () => {
    const { panel } = openWizard(InsertSetsModal);

    expect(panel("rest").querySelector(".workout-chip-group")).toBeNull();
    expect(panel("rest").querySelectorAll(".workout-field-with-adjust")).toHaveLength(1);
  });

  it("reviews the choices on the last step", () => {
    const w = openWizard(InsertSetsModal);
    w.exercise().value = "Squat";
    w.next();
    w.field(t("modal.labels.targetReps")).value = "8";
    w.next();
    w.field(t("sets.restLabel")).value = "90";
    w.field(t("sets.restLabel")).dispatchEvent(new Event("input"));

    const review = w.panel("rest").querySelector(".workout-wizard-review")!.textContent!;

    expect(review).toContain("Squat");
    expect(review).toContain("8");
    expect(review).toContain(t("sets.wizard.restValue", { seconds: 90 }));
  });

  it("inserts the block with the typed values and an id, then closes", () => {
    const w = openWizard(InsertSetsModal);
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
    expect(w.close).toHaveBeenCalled();
  });

  it("keeps values typed on a step when going back and forward", () => {
    const w = openWizard(InsertSetsModal);
    w.exercise().value = "Squat";
    w.next();
    w.field(t("modal.labels.plannedSets")).value = "5";
    w.next();
    w.button(t("wizard.back"))!.click();

    expect(w.field(t("modal.labels.plannedSets")).value).toBe("5");
  });

  it("cancel inserts nothing", () => {
    const w = openWizard(InsertSetsModal);
    w.exercise().value = "Squat";

    w.button(t("modal.buttons.cancel"))!.click();

    expect(w.inserted).toHaveLength(0);
    expect(w.close).toHaveBeenCalled();
  });
});
