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
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { openWizard, blockParams } from "@app/features/modals/base/__tests__/wizardHarness";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import { t } from "@app/i18n";

/** Walks the three steps and presses Insert */
function insertExercise(name: string) {
  const w = openWizard(AddExerciseBlockModal);
  w.exercise().value = name;
  w.next();
  w.next();
  w.button(t("modal.buttons.insertExerciseBlock"))!.click();
  return w;
}

describe("AddExerciseBlockModal", () => {
  it("uses the same three steps", () => {
    const { visible, contentEl } = openWizard(AddExerciseBlockModal);

    expect(visible()).toEqual(["exercise"]);
    expect(contentEl.querySelectorAll(".workout-wizard-step")).toHaveLength(3);
  });

  it("writes the exercise's section with its workout-sets block", () => {
    const { inserted } = insertExercise("Squat");

    expect(inserted[0].startsWith("## Squat\n\n```workout-sets\n")).toBe(true);
    expect(blockParams(inserted[0])).toMatchObject({ exercise: "Squat", sets: 3, rest: 90 });
  });

  it("gives the block an id, so it can be edited later", () => {
    const { inserted } = insertExercise("Squat");

    expect(blockParams(inserted[0])).toMatchObject({ id: expect.any(String) });
  });

  it("leaves the workout out, so the block follows the note's name", () => {
    const { inserted } = insertExercise("Squat");

    expect(inserted[0]).not.toContain("workout:");
  });

  it("asks for an exercise and inserts nothing without one", () => {
    const w = openWizard(AddExerciseBlockModal);

    w.next();

    expect(w.contentEl.querySelector(".workout-wizard-error")).not.toBeNull();
    expect(w.inserted).toHaveLength(0);
  });

  it("writes ## A + B + C heading and superset block with defaultRest = 90", () => {
    const w = openWizard(AddExerciseBlockModal, {
      settings: { customProtocols: defaultProtocolEntries() },
    });
    w.button(t("modal.selectOptions.superset"))!.click();

    const slots = () =>
      w.panel("exercise").querySelectorAll<HTMLInputElement>(
        ".workout-superset-slot input[type='text']",
      );
    slots()[0].value = "Bench Press";
    slots()[0].dispatchEvent(new Event("input", { bubbles: true }));
    slots()[1].value = "Bent Over Row";
    slots()[1].dispatchEvent(new Event("input", { bubbles: true }));

    w.button(t("modal.wizard.addExercise"))!.click();
    slots()[2].value = "Plank";
    slots()[2].dispatchEvent(new Event("input", { bubbles: true }));

    w.tab(3).click();
    w.button(t("modal.buttons.insertExerciseBlock"))!.click();

    expect(
      w.inserted[0].startsWith("## Bench Press + Bent Over Row + Plank\n\n```workout-sets\n"),
    ).toBe(true);
    expect(blockParams(w.inserted[0])).toMatchObject({
      exercises: ["Bench Press", "Bent Over Row", "Plank"],
      protocol: "superset",
      rest: 90,
    });
    expect(w.inserted[0]).not.toContain("restBetween:");
  });
});
