import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type {
  HeatMapMetric,
  MuscleHeatMapOptions,
} from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { Button, BUTTONVARIANT } from "@app/components/atoms";
import { t } from "@app/i18n";

type RenderCallback = (
  _canvasContainer: HTMLElement,
  _data: WorkoutLogData[],
  _options: MuscleHeatMapOptions,
  _infoPanel: HTMLElement,
  _plugin: WorkoutPluginContext,
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
    plugin: WorkoutPluginContext,
    renderCallback: RenderCallback,
    /** What the toggles start on */
    initial: MuscleHeatMapOptions = {
      timeFrame: "week",
      view: "front",
      metric: "volume",
    },
  ): MuscleHeatMapOptions {
    const controlsEl = container.createDiv({
      cls: "workout-heatmap-controls",
    });

    // Time frame toggle
    const timeFrameEl = controlsEl.createDiv({
      cls: "workout-frame-toggle",
    });

    const toggleClass = (on: boolean) =>
      on ? "workout-toggle-btn active" : "workout-toggle-btn";

    const weekBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.week"),
      className: toggleClass(initial.timeFrame === "week"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("timeperiods.week"),
    });

    const monthBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.month"),
      className: toggleClass(initial.timeFrame === "month"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("timeperiods.month"),
    });

    const yearBtn = Button.create(timeFrameEl, {
      text: t("timeperiods.year"),
      className: toggleClass(initial.timeFrame === "year"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("timeperiods.year"),
    });

    // View toggle
    const viewToggleEl = controlsEl.createDiv({
      cls: "workout-frame-toggle",
    });

    const frontBtn = Button.create(viewToggleEl, {
      text: t("general.front"),
      className: toggleClass(initial.view === "front"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("general.front"),
    });

    const backBtn = Button.create(viewToggleEl, {
      text: t("general.back"),
      className: toggleClass(initial.view === "back"),
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("general.back"),
    });

    // Metric toggle (sets/reps make bodyweight and timed work visible)
    const metricToggleEl = controlsEl.createDiv({
      cls: "workout-frame-toggle",
    });

    const metrics: HeatMapMetric[] = ["volume", "sets", "reps"];
    const metricBtns = metrics.map((metric) =>
      Button.create(metricToggleEl, {
        text: t(`dashboard.muscleHeatMap.metrics.${metric}`),
        className: toggleClass(metric === initial.metric),
        variant: BUTTONVARIANT.SECONDARY,
        ariaLabel: t(`dashboard.muscleHeatMap.metrics.${metric}`),
      }),
    );

    // Current options state
    const currentOptions: MuscleHeatMapOptions = { ...initial };

    // Setup time frame event listeners
    [weekBtn, monthBtn, yearBtn].forEach((btn, index) => {
      Button.onClick(btn, () => {
        [weekBtn, monthBtn, yearBtn].forEach((b) =>
          b.removeClass("active"),
        );
        btn.addClass("active");
        currentOptions.timeFrame = ["week", "month", "year"][
          index
        ] as "week" | "month" | "year";
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
        currentOptions.view = ["front", "back"][index] as
          | "front"
          | "back";
        void renderCallback(
          canvasContainer,
          data,
          currentOptions,
          infoPanel,
          plugin,
        );
      });
    });

    // Setup metric toggle event listeners
    metricBtns.forEach((btn, index) => {
      Button.onClick(btn, () => {
        metricBtns.forEach((b) => b.removeClass("active"));
        btn.addClass("active");
        currentOptions.metric = metrics[index];
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
