import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DashboardCalculations } from "@app/features/dashboard/business/DashboardCalculations";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const widgetEl = container.createEl("div", {
      cls: "workout-dashboard-widget workout-summary-widget",
    });

    widgetEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.TITLE,
      cls: "workout-widget-title",
    });

    const summaryEl = widgetEl.createEl("div", {
      cls: "workout-summary-grid",
    });

    const metrics = DashboardCalculations.calculateSummaryMetrics(data);

    this.createSummaryCard(
      summaryEl,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.TOTAL_WORKOUTS,
      metrics.totalWorkouts.toString(),
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.SUMMARY.TOTAL_WORKOUTS
    );

    this.createSummaryCard(
      summaryEl,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.CURRENT_STREAK,
      `${metrics.currentStreak} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.CURRENT_STREAK_SUFFIX}`,
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.SUMMARY.CURRENT_STREAK
    );

    this.createSummaryCard(
      summaryEl,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.TOTAL_VOLUME,
      `${metrics.totalVolume.toLocaleString()} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.TOTAL_VOLUME_SUFFIX}`,
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.SUMMARY.TOTAL_VOLUME
    );

    this.createSummaryCard(
      summaryEl,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.SUMMARY.PERSONAL_RECORDS,
      metrics.personalRecords.toString(),
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.SUMMARY.PERSONAL_RECORDS
    );
  }

  private static createSummaryCard(
    container: HTMLElement,
    title: string,
    value: string,
    icon: string
  ): void {
    const cardEl = container.createEl("div", { cls: "workout-summary-card" });

    cardEl.createEl("div", {
      text: icon,
      cls: "workout-card-icon",
    });

    cardEl.createEl("div", {
      text: value,
      cls: "workout-card-value",
    });

    cardEl.createEl("div", {
      text: title,
      cls: "workout-card-title",
    });
  }
}
