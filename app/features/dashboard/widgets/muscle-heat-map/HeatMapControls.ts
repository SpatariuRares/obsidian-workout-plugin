import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type WorkoutChartsPlugin from "main";
import type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

type RenderCallback = (
  _canvasContainer: HTMLElement,
  _data: WorkoutLogData[],
  _options: MuscleHeatMapOptions,
  _infoPanel: HTMLElement,
  _plugin: WorkoutChartsPlugin,
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
    renderCallback: RenderCallback,
  ): MuscleHeatMapOptions {
    const controlsEl = container.createEl("div", {
      cls: "workout-heatmap-controls",
    });

    // Time frame toggle
    const timeFrameEl = controlsEl.createEl("div", {
      cls: "workout-frame-toggle",
    });

    const weekBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.week"),
      className: "workout-toggle-btn active",
      variant: "secondary",
      ariaLabel: t("timeperiods.week"),
    });

    const monthBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.month"),
      className: "workout-toggle-btn",
      variant: "secondary",
      ariaLabel: t("timeperiods.month"),
    });

    const yearBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.year"),
      className: "workout-toggle-btn",
      variant: "secondary",
      ariaLabel: t("timeperiods.year"),
    });

    // View toggle
    const viewToggleEl = controlsEl.createEl("div", {
      cls: "workout-frame-toggle",
    });

    const frontBtn = Button.create(viewToggleEl, {
      text: t("general.front"),
      className: "workout-toggle-btn active",
      variant: "secondary",
      ariaLabel: t("general.front"),
    });

    const backBtn = Button.create(viewToggleEl, {
      text: t("general.back"),
      className: "workout-toggle-btn",
      variant: "secondary",
      ariaLabel: t("general.back"),
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
          plugin,
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
          plugin,
        );
      });
    });

    return currentOptions;
  }
}
