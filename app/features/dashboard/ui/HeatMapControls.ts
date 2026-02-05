import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import type { MuscleHeatMapOptions } from "@app/features/dashboard/types";
import { Button } from "@app/components/atoms";

type RenderCallback = (
  _canvasContainer: HTMLElement,
  _data: WorkoutLogData[],
  _options: MuscleHeatMapOptions,
  _infoPanel: HTMLElement,
  _plugin: WorkoutChartsPlugin
) => Promise<void>;

/**
 * Manages UI controls for the muscle heat map
 */
export class HeatMapControls {
  /**
   * Create and setup all heat map controls
   */
  static create(
    container: HTMLElement,
    data: WorkoutLogData[],
    canvasContainer: HTMLElement,
    infoPanel: HTMLElement,
    plugin: WorkoutChartsPlugin,
    renderCallback: RenderCallback
  ): MuscleHeatMapOptions {
    const controlsEl = container.createEl("div", {
      cls: "workout-heatmap-controls",
    });

    // Time frame toggle
    const timeFrameEl = controlsEl.createEl("div", {
      cls: "workout-frame-toggle",
    });

    const weekBtn = Button.create(timeFrameEl, {
      text: CONSTANTS.WORKOUT.TIME_PERIODS.WEEK,
      className: "workout-toggle-btn active",
      ariaLabel: CONSTANTS.WORKOUT.TIME_PERIODS.WEEK,
    });

    const monthBtn = Button.create(timeFrameEl, {
      text: CONSTANTS.WORKOUT.TIME_PERIODS.MONTH,
      className: "workout-toggle-btn",
      ariaLabel: CONSTANTS.WORKOUT.TIME_PERIODS.MONTH,
    });

    const yearBtn = Button.create(timeFrameEl, {
      text: CONSTANTS.WORKOUT.TIME_PERIODS.YEAR,
      className: "workout-toggle-btn",
      ariaLabel: CONSTANTS.WORKOUT.TIME_PERIODS.YEAR,
    });

    // View toggle
    const viewToggleEl = controlsEl.createEl("div", {
      cls: "workout-frame-toggle",
    });

    const frontBtn = Button.create(viewToggleEl, {
      text: CONSTANTS.WORKOUT.UI.LABELS.FRONT,
      className: "workout-toggle-btn active",
      ariaLabel: CONSTANTS.WORKOUT.UI.LABELS.FRONT,
    });

    const backBtn = Button.create(viewToggleEl, {
      text: CONSTANTS.WORKOUT.UI.LABELS.BACK,
      className: "workout-toggle-btn",
      ariaLabel: CONSTANTS.WORKOUT.UI.LABELS.BACK,
    });

    // Current options state
    const currentOptions: MuscleHeatMapOptions = {
      timeFrame: "week",
      view: "front",
    };

    // Setup time frame event listeners
    [weekBtn, monthBtn, yearBtn].forEach((btn, index) => {
      Button.onClick(btn, () => {
        [weekBtn, monthBtn, yearBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.timeFrame = ["week", "month", "year"][index] as
          | "week"
          | "month"
          | "year";
        void renderCallback(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    // Setup view toggle event listeners
    [frontBtn, backBtn].forEach((btn, index) => {
      Button.onClick(btn, () => {
        [frontBtn, backBtn].forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.view = ["front", "back"][index] as "front" | "back";
        void renderCallback(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin
        );
      });
    });

    return currentOptions;
  }
}
