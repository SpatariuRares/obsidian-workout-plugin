import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DashboardCalculations } from "@app/components/dashboard/DashboardCalculations";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): void {
    const widgetEl = container.createEl("div", {
      cls: "dashboard-widget summary-widget",
    });

    widgetEl.createEl("h3", {
      text: "Summary",
      cls: "widget-title",
    });

    const summaryEl = widgetEl.createEl("div", {
      cls: "summary-grid",
    });

    const metrics = DashboardCalculations.calculateSummaryMetrics(data);

    this.createSummaryCard(
      summaryEl,
      "Total Workouts",
      metrics.totalWorkouts.toString(),
      "🏋️"
    );

    this.createSummaryCard(
      summaryEl,
      "Current Streak",
      `${metrics.currentStreak} weeks`,
      "🔥"
    );

    this.createSummaryCard(
      summaryEl,
      "Total Volume",
      `${metrics.totalVolume.toLocaleString()} kg`,
      "📊"
    );

    this.createSummaryCard(
      summaryEl,
      "Personal Records",
      metrics.personalRecords.toString(),
      "🏆"
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