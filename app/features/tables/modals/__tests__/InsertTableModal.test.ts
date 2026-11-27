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
import { InsertTableModal } from "@app/features/tables/modals/InsertTableModal";
import { openWizard } from "@app/features/modals/base/__tests__/wizardHarness";
import { tableBlock } from "@app/features/tables/tableBlock";
import { t } from "@app/i18n";

function open() {
  const wizard = openWizard(InsertTableModal);
  const chip = (label: string) =>
    [...wizard.contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip-group button")].find(
      (b) => b.textContent === label,
    )!;
  const exerciseInput = () =>
    wizard.contentEl.querySelector<HTMLInputElement>(
      ".workout-target-exercise input[type='text']",
    )!;
  const workoutInput = () =>
    wizard.contentEl.querySelector<HTMLInputElement>(".workout-target-workout input")!;
  const type = (el: HTMLInputElement, value: string) => {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const params = () => {
    const body = /```workout-log\n([\s\S]*?)```/.exec(wizard.inserted[0])?.[1] ?? "";
    return tableBlock.parse(body).params;
  };
  return { ...wizard, chip, exerciseInput, workoutInput, type, params };
}

describe("InsertTableModal wizard", () => {
  it("opens on the first of three steps with the counter", () => {
    const { visible, contentEl } = open();

    expect(visible()).toEqual(["target"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 3 }),
    );
  });

  it("asks for both fields of the exercise + workout type, under the field", () => {
    const { visible, next, contentEl, exerciseInput } = open();

    next();

    expect(visible()).toEqual(["target"]);
    expect(contentEl.querySelector(".workout-wizard-error")!.textContent).toBe(
      t("modal.notices.validationCombinedMode"),
    );
    expect(document.activeElement).toBe(exerciseInput());
  });

  it("blocks a later stepper tab while the target is incomplete, and keeps typed values on Back", () => {
    const { visible, tab, next, exerciseInput, workoutInput, type, button } = open();

    tab(3).click();
    expect(visible()).toEqual(["target"]);

    type(exerciseInput(), "Squat");
    type(workoutInput(), "Leg day");
    next();
    expect(visible()).toEqual(["display"]);

    button(t("wizard.back"))!.click();
    expect(exerciseInput().value).toBe("Squat");
    expect(workoutInput().value).toBe("Leg day");
  });

  it("does not ask for anything when all logs are picked", () => {
    const { visible, next, chip } = open();

    chip(t("modal.selectOptions.allLogs")).click();
    next();

    expect(visible()).toEqual(["display"]);
  });

  it("inserts the block with its generated id and the typed parameters", () => {
    const { inserted, next, exerciseInput, workoutInput, type, field, button, close } = open();
    type(exerciseInput(), "Squat");
    type(workoutInput(), "Leg day");
    next();
    field(t("modal.dateRange")).value = "14";
    next();

    button(t("modal.buttons.insertTable"))!.click();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatch(/id: /);
    const body = /```workout-log\n([\s\S]*?)```/.exec(inserted[0])![1];
    const params = tableBlock.parse(body).params;
    expect(params).toMatchObject({ exercise: "Squat", workout: "Leg day", dateRange: 14 });
    expect(close).toHaveBeenCalled();
  });

  it("Cancel on any step inserts nothing", () => {
    const { inserted, next, exerciseInput, workoutInput, type, button, close } = open();
    type(exerciseInput(), "Squat");
    type(workoutInput(), "Leg day");
    next();

    button(t("modal.buttons.cancel"))!.click();

    expect(inserted).toEqual([]);
    expect(close).toHaveBeenCalled();
  });
});
