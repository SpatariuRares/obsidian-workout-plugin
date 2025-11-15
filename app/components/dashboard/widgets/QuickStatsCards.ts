import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import {
  DashboardCalculations,
  PeriodStats,
} from "@app/components/dashboard/business/DashboardCalculations";
import { StatCard } from "@app/components/molecules";

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
    // Create period card container
    const cardEl = container.createEl("div", { cls: "stats-card-period" });

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

    // Stats grid using StatCard molecules
    const statsEl = cardEl.createEl("div", { cls: "card-stats" });

    // Workouts stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: "🏋️",
      value: stats.workouts.toString(),
      label: "Workouts",
      className: "stat-item",
    });

    // Total volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: "📊",
      value: stats.volume.toLocaleString(),
      label: "Total volume (kg)",
      className: "stat-item",
    });

    // Average volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: "📈",
      value: stats.avgVolume.toLocaleString(),
      label: "Avg volume (kg)",
      className: "stat-item",
    });
  }
}
