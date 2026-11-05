import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type {
  HeatMapMetric,
  MuscleHeatMapOptions,
} from "@app/features/dashboard/widgets/muscle-heat-map/types";
import { ChipGroup } from "@app/components/molecules";
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

    const currentOptions: MuscleHeatMapOptions = { ...initial };
    const redraw = () =>
      void renderCallback(
        canvasContainer,
        data,
        currentOptions,
        infoPanel,
        plugin,
      );

    const timeFrames: MuscleHeatMapOptions["timeFrame"][] = ["week", "month", "year"];
    ChipGroup.create(controlsEl, {
      label: t("dashboard.muscleHeatMap.controls.period"),
      options: timeFrames.map((id) => ({ id, label: t(`timeperiods.${id}`) })),
      selected: initial.timeFrame,
      labelHidden: true,
      onPick: (id) => {
        currentOptions.timeFrame = id as MuscleHeatMapOptions["timeFrame"];
        redraw();
      },
    });

    const views: MuscleHeatMapOptions["view"][] = ["front", "back"];
    ChipGroup.create(controlsEl, {
      label: t("dashboard.muscleHeatMap.controls.side"),
      options: views.map((id) => ({ id, label: t(`general.${id}`) })),
      selected: initial.view,
      labelHidden: true,
      onPick: (id) => {
        currentOptions.view = id as MuscleHeatMapOptions["view"];
        redraw();
      },
    });

    // Sets/reps make bodyweight and timed work visible
    const metrics: HeatMapMetric[] = ["volume", "sets", "reps"];
    ChipGroup.create(controlsEl, {
      label: t("dashboard.muscleHeatMap.controls.metric"),
      options: metrics.map((id) => ({
        id,
        label: t(`dashboard.muscleHeatMap.metrics.${id}`),
      })),
      selected: initial.metric,
      labelHidden: true,
      onPick: (id) => {
        currentOptions.metric = id as HeatMapMetric;
        redraw();
      },
    });

    return currentOptions;
  }
}
