import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { CHART_DATA_TYPE, EmbeddedDashboardParams } from "@app/types";
import { ChartRenderer } from "@app/features/charts";
import { DashboardCalculations } from "@app/features/dashboard/business/DashboardCalculations";

export class VolumeAnalytics {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const analyticsEl = container.createEl("div", {
      cls: "workout-dashboard-widget  span-4  workout-volume-analytics",
    });

    analyticsEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.TITLE,
      cls: "workout-widget-title",
    });

    // Create chart container
    const chartContainer = analyticsEl.createEl("div", {
      cls: "workout-dashboard-chart-container",
    });

    // Prepare volume trend data
    const volumeTrendData = DashboardCalculations.prepareVolumeTrendData(
      data,
      30
    ); // Last 30 days

    // Create volume trend chart
    ChartRenderer.renderChart(
      chartContainer,
      volumeTrendData.labels,
      [
        {
          label: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.DATASET_LABEL,
          data: volumeTrendData.data,
        },
      ],
      {
        type: CHART_DATA_TYPE.VOLUME,
        title: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.CHART_TITLE,
      }
    );

    // Volume by muscle group breakdown
    const muscleGroupEl = analyticsEl.createEl("div", {
      cls: "workout-muscle-group-breakdown",
    });

    const muscleGroupData =
      DashboardCalculations.calculateMuscleGroupVolume(data);
    this.renderMuscleGroupBreakdown(muscleGroupEl, muscleGroupData);
  }

  private static renderMuscleGroupBreakdown(
    container: HTMLElement,
    data: [string, number][]
  ): void {
    container.createEl("h4", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.MUSCLE_BREAKDOWN_TITLE,
    });

    const listEl = container.createEl("ul", { cls: "workout-muscle-group-list" });

    data.forEach(([exercise, volume]) => {
      const itemEl = listEl.createEl("li", { cls: "workout-muscle-group-item" });

      itemEl.createEl("span", {
        text: exercise,
        cls: "workout-exercise-name",
      });

      itemEl.createEl("span", {
        text: `${volume.toLocaleString()} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.VOLUME_ANALYTICS.VOLUME_SUFFIX}`,
        cls: "workout-exercise-volume",
      });
    });
  }
}

