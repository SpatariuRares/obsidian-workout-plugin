import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedDashboardParams } from "@app/types";
import { DashboardCalculations } from "@app/components/dashboard/business/DashboardCalculations";

export class RecentWorkouts {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    _params: EmbeddedDashboardParams
  ): void {
    const recentEl = container.createEl("div", {
      cls: "dashboard-widget  columns-2  recent-workouts",
    });

    recentEl.createEl("h3", {
      text: "Recent workouts",
      cls: "widget-title",
    });

    // Get recent workouts (last 5)
    const recentWorkouts = DashboardCalculations.getRecentWorkouts(data, 5);

    const listEl = recentEl.createEl("ul", {
      cls: "recent-workouts-list",
    });

    recentWorkouts.forEach((workout) => {
      const itemEl = listEl.createEl("li", {
        cls: "recent-workout-item",
      });

      itemEl.createEl("div", {
        text: workout.date,
        cls: "workout-date",
      });

      itemEl.createEl("div", {
        text: workout.workout || "Workout",
        cls: "workout-name",
      });

      itemEl.createEl("div", {
        text: `${workout.totalVolume.toLocaleString()} kg`,
        cls: "workout-volume",
      });
    });
  }
}
