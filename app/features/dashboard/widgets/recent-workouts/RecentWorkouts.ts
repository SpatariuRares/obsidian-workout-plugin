import { CONSTANTS } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import { getRecentWorkouts } from "@app/features/dashboard/widgets/recent-workouts/business";
import { ListItem } from "@app/components/molecules";

export class RecentWorkouts {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const recentEl = container.createEl("div", {
      cls: "workout-dashboard-widget span-4 workout-recent-workouts",
    });

    recentEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.RECENT_WORKOUTS.TITLE,
      cls: "workout-widget-title",
    });

    // Get recent workouts (last 5)
    const recentWorkouts = getRecentWorkouts(data, 5);

    const listEl = ListItem.createList(recentEl, {
      className: "workout-recent-workouts-list",
    });

    recentWorkouts.forEach((workout) => {
      ListItem.create(listEl, {
        secondary: workout.date,
        label:
          workout.workout ||
          CONSTANTS.WORKOUT.LABELS.DASHBOARD.RECENT_WORKOUTS.FALLBACK_NAME,
        value: `${workout.totalVolume.toLocaleString()} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.RECENT_WORKOUTS.VOLUME_SUFFIX}`,
        className: "workout-recent-workout-item",
        labelClassName: "workout-recent-name",
        valueClassName: "workout-recent-volume",
      });
    });
  }
}
