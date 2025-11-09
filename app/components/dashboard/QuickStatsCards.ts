import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import {
  DashboardCalculations,
  PeriodStats,
} from "@app/components/dashboard/DashboardCalculations";

export class QuickStatsCards {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const cardsEl = container.createEl("div", {
      cls: "dashboard-widget stats-cards",
    });

    cardsEl.createEl("h3", {
      text: "Quick stats",
      cls: "widget-title",
    });

    const statsGrid = cardsEl.createEl("div", {
      cls: "stats-grid",
    });

    // Calculate stats for different periods
    const weekStats = DashboardCalculations.calculatePeriodStats(data, 7);
    const monthStats = DashboardCalculations.calculatePeriodStats(data, 30);
    const yearStats = DashboardCalculations.calculatePeriodStats(data, 365);

    // Render stats cards
    this.createStatsCard(statsGrid, "This Week", weekStats, "📅");
    this.createStatsCard(statsGrid, "This Month", monthStats, "📆");
    this.createStatsCard(statsGrid, "This Year", yearStats, "🗓️");
  }

  private static createStatsCard(
    container: HTMLElement,
    title: string,
    stats: PeriodStats,
    icon: string
  ): void {
    const cardEl = container.createEl("div", { cls: "stats-card" });

    // Header with icon and title
    const headerEl = cardEl.createEl("div", { cls: "card-header" });

    headerEl.createEl("div", {
      text: icon,
      cls: "card-icon",
    });

    headerEl.createEl("h4", {
      text: title,
      cls: "card-title",
    });

    // Stats grid
    const statsEl = cardEl.createEl("div", { cls: "card-stats" });

    // Workouts stat
    const workoutsStat = statsEl.createEl("div", { cls: "stat-item" });
    workoutsStat.createEl("div", {
      text: stats.workouts.toString(),
      cls: "stat-value",
    });
    workoutsStat.createEl("div", {
      text: "Workouts",
      cls: "stat-label",
    });

    // Total volume stat
    const volumeStat = statsEl.createEl("div", { cls: "stat-item" });
    volumeStat.createEl("div", {
      text: `${stats.volume.toLocaleString()}`,
      cls: "stat-value",
    });
    volumeStat.createEl("div", {
      text: "Total volume (kg)",
      cls: "stat-label",
    });

    // Average volume stat
    const avgStat = statsEl.createEl("div", { cls: "stat-item" });
    avgStat.createEl("div", {
      text: `${stats.avgVolume.toLocaleString()}`,
      cls: "stat-value",
    });
    avgStat.createEl("div", {
      text: "Avg volume (kg)",
      cls: "stat-label",
    });
  }
}
