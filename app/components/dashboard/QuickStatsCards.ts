import { WorkoutLogData } from "../../types/WorkoutLogData";
import { EmbeddedDashboardParams } from "../types/types";
import { DashboardCalculations, PeriodStats } from "./DashboardCalculations";

export class QuickStatsCards {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams
  ): void {
    const cardsEl = container.createEl("div", {
      cls: "dashboard-widget stats-cards",
    });

    cardsEl.createEl("h3", {
      text: "Quick Stats",
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

    cardEl.createEl("div", {
      text: icon,
      cls: "card-icon",
    });

    cardEl.createEl("h4", {
      text: title,
      cls: "card-title",
    });

    const statsEl = cardEl.createEl("div", { cls: "card-stats" });

    statsEl.createEl("div", {
      text: `${stats.workouts} workouts`,
      cls: "stat-item",
    });

    statsEl.createEl("div", {
      text: `${stats.volume.toLocaleString()} kg`,
      cls: "stat-item",
    });

    statsEl.createEl("div", {
      text: `${stats.avgVolume.toLocaleString()} avg`,
      cls: "stat-item",
    });
  }
}