import { WorkoutLogData } from "../../types/WorkoutLogData";
import { EmbeddedDashboardParams } from "../types/types";
import { ChartRenderer } from "../chart/ChartRenderer";
import { DashboardCalculations } from "./DashboardCalculations";

export class VolumeAnalytics {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): void {
    const analyticsEl = container.createEl("div", {
      cls: "dashboard-widget  columns-2  volume-analytics",
    });

    analyticsEl.createEl("h3", {
      text: "Volume Analytics",
      cls: "widget-title",
    });

    // Create chart container
    const chartContainer = analyticsEl.createEl("div", {
      cls: "dashboard-chart-container",
    });

    // Prepare volume trend data
    const volumeTrendData = DashboardCalculations.prepareVolumeTrendData(data, 30); // Last 30 days

    // Create volume trend chart
    ChartRenderer.renderChart(
      chartContainer,
      volumeTrendData.labels,
      [
        {
          label: "Daily Volume (kg)",
          data: volumeTrendData.data,
        },
      ],
      {
        type: "volume",
        title: "Volume Trend (Last 30 Days)",
      }
    );

    // Volume by muscle group breakdown
    const muscleGroupEl = analyticsEl.createEl("div", {
      cls: "muscle-group-breakdown",
    });

    const muscleGroupData = DashboardCalculations.calculateMuscleGroupVolume(data);
    this.renderMuscleGroupBreakdown(muscleGroupEl, muscleGroupData);
  }


  private static renderMuscleGroupBreakdown(
    container: HTMLElement,
    data: [string, number][]
  ): void {
    container.createEl("h4", { text: "Top Exercises by Volume" });

    const listEl = container.createEl("ul", { cls: "muscle-group-list" });

    data.forEach(([exercise, volume]) => {
      const itemEl = listEl.createEl("li", { cls: "muscle-group-item" });

      itemEl.createEl("span", {
        text: exercise,
        cls: "exercise-name",
      });

      itemEl.createEl("span", {
        text: `${volume.toLocaleString()} kg`,
        cls: "exercise-volume",
      });
    });
  }
}