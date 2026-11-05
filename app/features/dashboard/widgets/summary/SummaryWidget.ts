import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  EmbeddedDashboardParams,
  SUMMARY_METRIC_IDS,
} from "@app/features/dashboard/types";
import { calculateSummaryMetrics } from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import { StatCard } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { ICONS } from "@app/constants/ui.constants";
import { FormatUtils } from "@app/utils/FormatUtils";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
    /** Every logged set, so records are judged against all of them */
    history: WorkoutLogData[] = data,
    /** Training days a week that keep the streak */
    weeklyGoal = 1,
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.summary.title"),
      className: "workout-summary-widget",
    });

    const summaryEl = StatCard.row(widgetEl, "workout-summary-grid");

    const metrics = calculateSummaryMetrics(
      data,
      history,
      weeklyGoal,
    );

    const shown = params.summaryMetrics ?? SUMMARY_METRIC_IDS;

    if (shown.includes("workouts")) {
      this.createSummaryCard(
        summaryEl,
        t("dashboard.summary.totalWorkouts"),
        metrics.totalWorkouts.toString(),
        ICONS.METRICS.WORKOUTS,
      );
    }

    if (shown.includes("streak")) {
      this.createSummaryCard(
        summaryEl,
        t("dashboard.summary.currentStreak"),
        t("dashboard.summary.currentStreakSuffix", {
          count: metrics.currentStreak,
        }),
        ICONS.METRICS.STREAK,
      );
    }

    if (shown.includes("volume")) {
      this.createSummaryCard(
        summaryEl,
        t("dashboard.summary.totalVolume"),
        FormatUtils.formatVolume(metrics.totalVolume),
        ICONS.METRICS.TOTAL_VOLUME,
      );
    }

    if (shown.includes("records")) {
      this.createSummaryCard(
        summaryEl,
        t("dashboard.summary.personalRecords"),
        metrics.personalRecords.toString(),
        ICONS.METRICS.RECORDS,
      );
    }
  }

  private static createSummaryCard(
    container: HTMLElement,
    title: string,
    value: string,
    icon: string,
  ): void {
    StatCard.create(container, {
      icon,
      label: title,
      value,
      className: "workout-summary-card",
    });
  }
}
