import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import {
  calculatePeriodStats,
  PeriodStats,
} from "@app/features/dashboard/widgets/quick-stats/business/calculatePeriodStats";
import { Icon } from "@app/components/atoms";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";
import { ICONS } from "@app/constants/ui.constants";
import { FormatUtils } from "@app/utils/FormatUtils";

/**
 * Week, month and year side by side in one compact table (metrics as rows,
 * periods as columns): comparable at a glance and short on a phone, where
 * three stacked cards took about three screens.
 */
export class QuickStatsCards {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams,
  ): void {
    const cardsEl = WidgetContainer.create(container, {
      title: t("dashboard.quickStats.title"),
      className: "workout-stats-cards",
    });

    const periods = [
      { label: t("dashboard.quickStats.week"), stats: calculatePeriodStats(data, 7) },
      { label: t("dashboard.quickStats.month"), stats: calculatePeriodStats(data, 30) },
      { label: t("dashboard.quickStats.year"), stats: calculatePeriodStats(data, 365) },
    ];
    const metrics: {
      icon: string;
      label: string;
      value: (stats: PeriodStats) => number;
    }[] = [
      {
        icon: ICONS.METRICS.WORKOUTS,
        label: t("dashboard.quickStats.workouts"),
        value: (stats) => stats.workouts,
      },
      {
        icon: ICONS.METRICS.TOTAL_VOLUME,
        label: CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME,
        value: (stats) => stats.volume,
      },
      {
        icon: ICONS.METRICS.VOLUME,
        label: CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
        value: (stats) => stats.avgVolume,
      },
    ];

    const table = cardsEl.createEl("table", {
      cls: "workout-quick-stats-table",
    });
    const headRow = table.createEl("thead").createEl("tr");
    headRow.createEl("td");
    for (const period of periods) {
      headRow.createEl("th", { text: period.label, attr: { scope: "col" } });
    }

    const body = table.createEl("tbody");
    for (const metric of metrics) {
      const row = body.createEl("tr");
      const label = row.createEl("th", { attr: { scope: "row" } });
      Icon.create(label, { name: metric.icon });
      label.appendText(metric.label);
      for (const period of periods) {
        row.createEl("td", {
          text: FormatUtils.formatNumber(metric.value(period.stats)),
        });
      }
    }
  }
}
