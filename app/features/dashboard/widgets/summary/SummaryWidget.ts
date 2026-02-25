import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { calculateSummaryMetrics } from "@app/features/dashboard/widgets/summary/business/calculateSummaryMetrics";
import { DashboardCard } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

export class SummaryWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.title"),
      className: "workout-summary-widget",
    });

    const summaryEl = widgetEl.createEl("div", {
      cls: "workout-summary-grid",
    });

    const metrics = calculateSummaryMetrics(data);

    this.createSummaryCard(
      summaryEl,
      t("dashboard.totalWorkouts"),
      metrics.totalWorkouts.toString(),
      t("icons.dashboard.summary.totalWorkouts"),
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.currentStreak"),
      t("dashboard.currentStreakSuffix", { count: metrics.currentStreak }),
      t("icons.dashboard.summary.currentStreak"),
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.totalVolume"),
      `${metrics.totalVolume.toLocaleString()} ${t("dashboard.summary.totalVolumeSuffix")}`,
      t("icons.dashboard.summary.totalVolume"),
    );

    this.createSummaryCard(
      summaryEl,
      t("dashboard.personalRecords"),
      metrics.personalRecords.toString(),
      t("icons.dashboard.summary.personalRecords"),
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
