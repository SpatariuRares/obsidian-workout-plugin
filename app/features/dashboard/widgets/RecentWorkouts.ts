import { CONSTANTS } from "@app/constants/Constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DashboardCalculations } from "@app/features/dashboard/business/DashboardCalculations";

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
    const recentWorkouts = DashboardCalculations.getRecentWorkouts(data, 5);

    const listEl = recentEl.createEl("ul", {
      cls: "workout-recent-workouts-list",
    });

    recentWorkouts.forEach((workout) => {
      const itemEl = listEl.createEl("li", {
        cls: "workout-recent-workout-item",
      });

      itemEl.createEl("div", {
        text: workout.date,
        cls: "workout-date-group-header",
      });

      itemEl.createEl("div", {
        text:
          workout.workout ||
          CONSTANTS.WORKOUT.LABELS.DASHBOARD.RECENT_WORKOUTS.FALLBACK_NAME,
        cls: "workout-recent-workout-name",
      });

      itemEl.createEl("div", {
        text: `${workout.totalVolume.toLocaleString()} ${CONSTANTS.WORKOUT.LABELS.DASHBOARD.RECENT_WORKOUTS.VOLUME_SUFFIX}`,
        cls: "workout-recent-workout-volume",
      });
    });
  }
}

