import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DashboardCalculations } from "@app/features/dashboard/business/DashboardCalculations";
import { UI_LABELS } from "@app/constants/LabelConstants";
import { UI_ICONS } from "@app/constants/IconConstants";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const widgetEl = container.createEl("div", {
      cls: "dashboard-widget summary-widget",
    });

    widgetEl.createEl("h3", {
      text: UI_LABELS.DASHBOARD.SUMMARY.TITLE,
      cls: "widget-title",
    });

    const summaryEl = widgetEl.createEl("div", {
      cls: "summary-grid",
    });

    const metrics = DashboardCalculations.calculateSummaryMetrics(data);

    this.createSummaryCard(
      summaryEl,
      UI_LABELS.DASHBOARD.SUMMARY.TOTAL_WORKOUTS,
      metrics.totalWorkouts.toString(),
      UI_ICONS.DASHBOARD.SUMMARY.TOTAL_WORKOUTS
    );

    this.createSummaryCard(
      summaryEl,
      UI_LABELS.DASHBOARD.SUMMARY.CURRENT_STREAK,
      `${metrics.currentStreak} ${UI_LABELS.DASHBOARD.SUMMARY.CURRENT_STREAK_SUFFIX}`,
      UI_ICONS.DASHBOARD.SUMMARY.CURRENT_STREAK
    );

    this.createSummaryCard(
      summaryEl,
      UI_LABELS.DASHBOARD.SUMMARY.TOTAL_VOLUME,
      `${metrics.totalVolume.toLocaleString()} ${UI_LABELS.DASHBOARD.SUMMARY.TOTAL_VOLUME_SUFFIX}`,
      UI_ICONS.DASHBOARD.SUMMARY.TOTAL_VOLUME
    );

    this.createSummaryCard(
      summaryEl,
      UI_LABELS.DASHBOARD.SUMMARY.PERSONAL_RECORDS,
      metrics.personalRecords.toString(),
      UI_ICONS.DASHBOARD.SUMMARY.PERSONAL_RECORDS
    );
  }

  private static createSummaryCard(
    container: HTMLElement,
    title: string,
    value: string,
    icon: string
  ): void {
    const cardEl = container.createEl("div", { cls: "summary-card" });

    cardEl.createEl("div", {
      text: icon,
      cls: "card-icon",
    });

    cardEl.createEl("div", {
      text: value,
      cls: "card-value",
    });

    cardEl.createEl("div", {
      text: title,
      cls: "card-title",
    });
  }
}
