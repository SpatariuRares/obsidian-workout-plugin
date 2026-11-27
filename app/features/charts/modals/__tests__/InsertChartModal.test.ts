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
import { InsertChartModal } from "@app/features/charts/modals/InsertChartModal";
import { chartBlock } from "@app/features/charts/chartBlock";
import { openWizard } from "@app/features/modals/base/__tests__/wizardHarness";
import { t } from "@app/i18n";

function paramsOf(code: string) {
  const body = /```workout-chart\n([\s\S]*?)```/.exec(code)?.[1] ?? "";
  return chartBlock.parse(body).params;
}

describe("InsertChartModal wizard", () => {
  it("opens on the chart type step of three", () => {
    const { visible, contentEl } = openWizard(InsertChartModal);

    expect(visible()).toEqual(["chartType"]);
    expect(contentEl.querySelector(".workout-wizard-counter")!.textContent).toBe(
      t("wizard.stepCounter", { current: 1, total: 3 }),
    );
  });

  it("walks the three steps and inserts the block with its id", () => {
    const { visible, next, panel, field, button, inserted, close } =
      openWizard(InsertChartModal);

    [...panel("chartType").querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.selectOptions.specificExercise"))!
      .click();
    next();
    expect(visible()).toEqual(["data"]);
    panel("data").querySelector<HTMLInputElement>("input[type='text']")!.value = "Squat";
    field(t("modal.daysRange")).value = "45";
    next();
    expect(visible()).toEqual(["display"]);
    button(t("modal.buttons.insertChart"))!.click();

    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatch(/^id: \S+$/m);
    const params = paramsOf(inserted[0]);
    expect(params.exercise).toBe("Squat");
    expect(params.dateRange).toBe(45);
    expect(close).toHaveBeenCalled();
  });

  it("keeps what was typed when going Back", () => {
    const { next, panel, button } = openWizard(InsertChartModal);

    next();
    const exercise = panel("data").querySelector<HTMLInputElement>("input[type='text']")!;
    exercise.value = "Bench Press";
    next();
    button(t("wizard.back"))!.click();

    expect(exercise.value).toBe("Bench Press");
  });

  it("writes nothing when cancelled on any step", () => {
    const { next, button, inserted, close } = openWizard(InsertChartModal);

    next();
    button(t("modal.buttons.cancel"))!.click();

    expect(inserted).toEqual([]);
    expect(close).toHaveBeenCalled();
  });
});
