/** @jest-environment jsdom */
jest.mock("@app/components/atoms/Feedback", () => ({
  Feedback: { renderWarning: jest.fn(), renderError: jest.fn() },
}));
jest.mock("@app/features/modals/log/LogCallouts", () => ({
  LogCallouts: {
    renderCreateLogButtonForExercise: jest.fn(),
    renderNoMatchMessage: jest.fn(),
  },
}));

import { BaseView } from "@app/features/common/views/BaseView";
import { Feedback } from "@app/components/atoms/Feedback";
import { VIEW_TYPES } from "@app/types/ViewTypes";
import { CHART_TYPE } from "@app/types/WorkoutConfigTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

class TestView extends BaseView {
  noFilteredData(titlePrefix: string, chartType?: CHART_TYPE) {
    this.handleNoFilteredData(
      document.createElement("div"),
      { chartType },
      titlePrefix,
      VIEW_TYPES.CHART,
    );
  }
}

describe("BaseView.handleNoFilteredData", () => {
  const view = new TestView({} as WorkoutPluginContext);

  it("names the workout that has no data", () => {
    view.noFilteredData("Leg Day", CHART_TYPE.WORKOUT);
    expect(Feedback.renderWarning).toHaveBeenCalledWith(
      expect.anything(),
      t("codeBlocks.noDataForWorkout", { workout: "Leg Day" }),
    );
  });

  it("names the exercise and the workout of a combined filter", () => {
    view.noFilteredData("Squat + Notes/Leg Day.md");
    expect(Feedback.renderWarning).toHaveBeenCalledWith(
      expect.anything(),
      t("codeBlocks.noDataForExerciseInWorkout", {
        exercise: "Squat",
        workout: "Leg Day",
      }),
    );
  });
});
