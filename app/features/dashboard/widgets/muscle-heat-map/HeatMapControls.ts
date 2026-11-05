import { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { MuscleHeatMapOptions } from "@app/features/dashboard/widgets/muscle-heat-map/types";
import {
  HEAT_MAP_METRIC_SETTING,
  HEAT_MAP_TIME_FRAME_SETTING,
  HEAT_MAP_VIEW_SETTING,
} from "@app/features/dashboard/widgets/muscle-heat-map/heatMapSettings";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { ChipGroup } from "@app/components/molecules";
import { t } from "@app/i18n";

type RenderCallback = (
  _canvasContainer: HTMLElement,
  _data: WorkoutLogData[],
  _options: MuscleHeatMapOptions,
  _infoPanel: HTMLElement,
  _plugin: WorkoutPluginContext,
) => Promise<void>;

/** The toggles, in order: the widget menu's choices, each with its own label */
const CONTROLS = [
  {
    option: "timeFrame",
    setting: HEAT_MAP_TIME_FRAME_SETTING,
    label: () => t("dashboard.muscleHeatMap.controls.period"),
  },
  {
    option: "view",
    setting: HEAT_MAP_VIEW_SETTING,
    label: () => t("dashboard.muscleHeatMap.controls.side"),
  },
  {
    option: "metric",
    setting: HEAT_MAP_METRIC_SETTING,
    label: () => t("dashboard.muscleHeatMap.controls.metric"),
  },
] as const;

/** What the toggles start on when the block doesn't say */
export const HEAT_MAP_DEFAULT_OPTIONS: MuscleHeatMapOptions = {
  timeFrame: dashboardBlock.defaults.heatMapTimeFrame,
  view: dashboardBlock.defaults.heatMapView,
  metric: dashboardBlock.defaults.heatMapMetric,
};

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
    initial: MuscleHeatMapOptions = HEAT_MAP_DEFAULT_OPTIONS,
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

    for (const { option, setting, label } of CONTROLS) {
      ChipGroup.create(controlsEl, {
        label: label(),
        options: setting.options.map((o) => ({ id: o.value, label: o.label() })),
        selected: initial[option],
        labelHidden: true,
        onPick: (id) => {
          // The ids are the setting's values, the schema's enum
          (currentOptions as unknown as Record<string, string>)[option] = id;
          redraw();
        },
      });
    }

    return currentOptions;
  }
}
