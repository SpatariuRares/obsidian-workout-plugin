import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import {
  calculatePeriodStats,
  PeriodStats,
} from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import { StatCard, DashboardCard } from "@app/components/molecules";

export class QuickStatsCards {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
  ): void {
    const cardsEl = container.createEl("div", {
      cls: "workout-dashboard-widget workout-stats-cards",
    });

    cardsEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.TITLE,
      cls: "workout-widget-title",
    });

    const statsGrid = cardsEl.createEl("div", {
      cls: "workout-stats-grid",
    });

    // Calculate stats for different periods
    const weekStats = calculatePeriodStats(data, 7);
    const monthStats = calculatePeriodStats(data, 30);
    const yearStats = calculatePeriodStats(data, 365);

    // Render stats cards
    this.createStatsCard(
      statsGrid,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.PERIODS.WEEK,
      weekStats,
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.PERIODS.WEEK,
    );
    this.createStatsCard(
      statsGrid,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.PERIODS.MONTH,
      monthStats,
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.PERIODS.MONTH,
    );
    this.createStatsCard(
      statsGrid,
      CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.PERIODS.YEAR,
      yearStats,
      CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.PERIODS.YEAR,
    );
  }

  private static createStatsCard(
    container: HTMLElement,
    title: string,
    stats: PeriodStats,
    icon: string,
  ): void {
    const cardEl = DashboardCard.create(container, {
      icon,
      title,
      variant: "stats",
      className: "workout-stats-card",
    });

    // Stats grid using StatCard molecules
    const statsEl = cardEl.createEl("div", { cls: "workout-card-stats" });

    // Workouts stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS,
      value: stats.workouts.toString(),
      label: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.METRICS.WORKOUTS,
      className: "workout-stat-item",
    });

    // Total volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.METRICS.TOTAL_VOLUME,
      value: stats.volume.toLocaleString(),
      label:
        CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.METRICS.TOTAL_VOLUME,
      className: "workout-stat-item",
    });

    // Average volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: CONSTANTS.WORKOUT.ICONS.DASHBOARD.QUICK_STATS.METRICS.AVG_VOLUME,
      value: stats.avgVolume.toLocaleString(),
      label: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_STATS.METRICS.AVG_VOLUME,
      className: "workout-stat-item",
    });
  }
}
