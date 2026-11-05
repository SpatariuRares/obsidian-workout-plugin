import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { getRecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/business/getRecentWorkouts";
import { ListItem } from "@app/components/molecules";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";
import { FormatUtils } from "@app/utils/FormatUtils";

export class RecentWorkouts {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
  ): void {
    const recentEl = WidgetContainer.create(container, {
      title: t("dashboard.recentWorkouts.title"),
      className: "workout-recent-workouts",
    });

    const recentWorkouts = getRecentWorkouts(
      data,
      params.recentWorkoutsLimit ?? dashboardBlock.defaults.recentWorkoutsLimit,
    );

    const listEl = ListItem.createList(recentEl, {
      className: "workout-recent-workouts-list",
    });

    recentWorkouts.forEach((workout) => {
      ListItem.create(listEl, {
        secondary: workout.date,
        label:
          workout.workout ||
          t("dashboard.recentWorkouts.fallbackName"),
        value: FormatUtils.formatVolume(workout.totalVolume),
        className: "workout-recent-workout-item",
        labelClassName: "workout-recent-name",
        valueClassName: "workout-recent-volume",
      });
    });
  }
}
