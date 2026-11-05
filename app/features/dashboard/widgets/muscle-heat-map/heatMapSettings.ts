import {
  HEAT_MAP_METRICS,
  HEAT_MAP_TIME_FRAMES,
  HEAT_MAP_VIEWS,
} from "@app/features/dashboard/types";
import type { ChoiceSetting } from "@app/features/dashboard/widgets/widgetSettings";
import { t } from "@app/i18n";

/**
 * The heat map's choices, in the order its toggles show them: the widget
 * menu edits what they start on, the widget draws them as its toggles
 */
export const HEAT_MAP_TIME_FRAME_SETTING: ChoiceSetting = {
  kind: "choice",
  key: "heatMapTimeFrame",
  label: () => t("dashboard.widgetModal.heatMapTimeFrame"),
  options: HEAT_MAP_TIME_FRAMES.map((value) => ({
    value,
    label: () => t(`timeperiods.${value}`),
  })),
};

export const HEAT_MAP_VIEW_SETTING: ChoiceSetting = {
  kind: "choice",
  key: "heatMapView",
  label: () => t("dashboard.widgetModal.heatMapView"),
  options: HEAT_MAP_VIEWS.map((value) => ({
    value,
    label: () => t(`general.${value}`),
  })),
};

/** Sets/reps make bodyweight and timed work visible */
export const HEAT_MAP_METRIC_SETTING: ChoiceSetting = {
  kind: "choice",
  key: "heatMapMetric",
  label: () => t("dashboard.widgetModal.heatMapMetric"),
  options: HEAT_MAP_METRICS.map((value) => ({
    value,
    label: () => t(`dashboard.muscleHeatMap.metrics.${value}`),
  })),
};
