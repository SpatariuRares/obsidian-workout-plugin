import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import {
  calculatePeriodStats,
  PeriodStats,
} from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import { StatCard, DashboardCard } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

export class QuickStatsCards {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
  ): void {
    const cardsEl = WidgetContainer.create(container, {
      title: t("dashboard.summary.title"),
      className: "workout-stats-cards",
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
      t("dashboard.quickStats.week"),
      weekStats,
      t("icons.dashboard.quickStats.periods.week"),
    );
    this.createStatsCard(
      statsGrid,
      t("dashboard.quickStats.month"),
      monthStats,
      t("icons.dashboard.quickStats.periods.month"),
    );
    this.createStatsCard(
      statsGrid,
      t("dashboard.quickStats.year"),
      yearStats,
      t("icons.dashboard.quickStats.periods.year"),
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
      icon: t("icons.dashboard.quickStats.metrics.workouts"),
      value: stats.workouts.toString(),
      label: t("dashboard.quickStats.workouts"),
      className: "workout-stat-item",
    });

    // Total volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: t("icons.dashboard.quickStats.metrics.totalVolume"),
      value: stats.volume.toLocaleString(),
      label: CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME,
      className: "workout-stat-item",
    });

    // Average volume stat using StatCard molecule
    StatCard.create(statsEl, {
      icon: t("icons.dashboard.quickStats.metrics.avgVolume"),
      value: stats.avgVolume.toLocaleString(),
      label: CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
      className: "workout-stat-item",
    });
  }
}
