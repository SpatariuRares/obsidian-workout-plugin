import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { CHART_DATA_TYPE } from "@app/features/charts";

import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { ChartRenderer } from "@app/features/charts";
import {
  prepareVolumeTrendData,
  calculateMuscleGroupVolume,
} from "@app/features/dashboard/widgets/volume-analytics/business/volumeAnalyticsData";
import { ListItem } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";

export class VolumeAnalytics {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
  ): void {
    const analyticsEl = WidgetContainer.create(container, {
      title: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.TITLE,
      className: "workout-volume-analytics",
      isWide: true,
    });

    // Create chart container
    const chartContainer = analyticsEl.createEl("div", {
      cls: "workout-dashboard-chart-container",
    });

    // Prepare volume trend data
    const volumeTrendData = prepareVolumeTrendData(data, 30); // Last 30 days

    // Create volume trend chart
    ChartRenderer.renderChart(
      chartContainer,
      volumeTrendData.labels,
      [
        {
          label:
            CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.DATASET_LABEL,
          data: volumeTrendData.data,
        },
      ],
      {
        type: CHART_DATA_TYPE.VOLUME,
        title: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.CHART_TITLE,
      },
    );

    // Volume by muscle group breakdown
    const muscleGroupEl = analyticsEl.createEl("div", {
      cls: "workout-muscle-group-breakdown",
    });

    const muscleGroupData = calculateMuscleGroupVolume(data);
    this.renderMuscleGroupBreakdown(muscleGroupEl, muscleGroupData);
  }

  private static renderMuscleGroupBreakdown(
    container: HTMLElement,
    data: [string, number][],
  ): void {
    container.createEl("h4", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS
        .MUSCLE_BREAKDOWN_TITLE,
    });

    const listEl = ListItem.createList(container, {
      className: "workout-muscle-group-list",
    });

    data.forEach(([exercise, volume]) => {
      ListItem.create(listEl, {
        label: exercise,
        value: `${volume.toLocaleString()} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.VOLUME_SUFFIX}`,
        className: "workout-muscle-group-item",
        labelClassName: "workout-exercise-name",
        valueClassName: "workout-exercise-volume",
      });
    });
  }
}
