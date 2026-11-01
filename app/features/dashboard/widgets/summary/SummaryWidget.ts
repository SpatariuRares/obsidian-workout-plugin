import { getUnitsMap } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { calculateSummaryMetrics } from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import { DashboardCard } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { ICONS } from "@app/constants/ui.constants";
import { FormatUtils } from "@app/utils/FormatUtils";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
    /** Every logged set, so records are judged against all of them */
    history: WorkoutLogData[] = data,
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.summary.title"),
      className: "workout-summary-widget",
    });

    const summaryEl = widgetEl.createDiv({
      cls: "workout-summary-grid",
    });

    const metrics = calculateSummaryMetrics(data, history);

    this.createSummaryCard(
      summaryEl,
      t("dashboard.summary.totalWorkouts"),
      metrics.totalWorkouts.toString(),
      ICONS.METRICS.WORKOUTS,
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.summary.currentStreak"),
      t("dashboard.summary.currentStreakSuffix", {
        count: metrics.currentStreak,
      }),
      ICONS.METRICS.STREAK,
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.summary.totalVolume"),
      `${FormatUtils.formatNumber(metrics.totalVolume)} ${getUnitsMap()["volume"]}`,
      ICONS.METRICS.TOTAL_VOLUME,
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.summary.personalRecords"),
      metrics.personalRecords.toString(),
      ICONS.METRICS.RECORDS,
    );
  }

  private static createSummaryCard(
    container: HTMLElement,
    title: string,
    value: string,
    icon: string,
  ): void {
    DashboardCard.create(container, {
      icon,
      title,
      value,
      variant: "summary",
      className: "workout-summary-card",
    });
  }
}
