import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import {
  DashboardCalculations,
  PeriodStats,
} from "@app/features/dashboard/business/DashboardCalculations";
import { StatCard } from "@app/components/molecules";
import { UI_LABELS } from "@app/constants/LabelConstants";
import { UI_ICONS } from "@app/constants/IconConstants";

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
      text: UI_LABELS.DASHBOARD.QUICK_STATS.TITLE,
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
    this.createStatsCard(
      statsGrid,
      UI_LABELS.DASHBOARD.QUICK_STATS.PERIODS.WEEK,
      weekStats,
      UI_ICONS.DASHBOARD.QUICK_STATS.PERIODS.WEEK
    );
    this.createStatsCard(
      statsGrid,
      UI_LABELS.DASHBOARD.QUICK_STATS.PERIODS.MONTH,
      monthStats,
      UI_ICONS.DASHBOARD.QUICK_STATS.PERIODS.MONTH
    );
    this.createStatsCard(
      statsGrid,
      UI_LABELS.DASHBOARD.QUICK_STATS.PERIODS.YEAR,
      yearStats,
      UI_ICONS.DASHBOARD.QUICK_STATS.PERIODS.YEAR
    );
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
      icon: UI_ICONS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS,
      value: stats.workouts.toString(),
      label: UI_LABELS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS,
      className: "stat-item",
    });

    // Total volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: UI_ICONS.DASHBOARD.QUICK_STATS.METRICS.TOTAL_VOLUME,
      value: stats.volume.toLocaleString(),
      label: UI_LABELS.DASHBOARD.QUICK_STATS.METRICS.TOTAL_VOLUME,
      className: "stat-item",
    });

    // Average volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: UI_ICONS.DASHBOARD.QUICK_STATS.METRICS.AVG_VOLUME,
      value: stats.avgVolume.toLocaleString(),
      label: UI_LABELS.DASHBOARD.QUICK_STATS.METRICS.AVG_VOLUME,
      className: "stat-item",
    });
  }
}
