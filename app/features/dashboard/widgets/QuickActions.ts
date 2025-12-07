import { CONSTANTS } from "@app/constants/Constants";
import { EmbeddedDashboardParams } from "@app/types";
import type WorkoutChartsPlugin from "main";

export class QuickActions {
  static render(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin
  ): void {
    const actionsEl = container.createEl("div", {
      cls: "workout-dashboard-widget workout-quick-actions",
    });

    actionsEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.TITLE,
      cls: "workout-widget-title",
    });

    const buttonsEl = actionsEl.createEl("div", {
      cls: "workout-action-buttons",
    });

    // Add workout log button
    const addLogBtn = buttonsEl.createEl("button", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
      cls: "workout-action-button primary",
    });

    addLogBtn.addEventListener("click", () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = buttonsEl.createEl("button", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.VIEW_EXERCISES,
      cls: "workout-action-button secondary",
    });

    viewExercisesBtn.addEventListener("click", () => {
      // Navigate to exercises folder
      if (plugin.app.workspace.getActiveFile()) {
        plugin.app.workspace
          .openLinkText(plugin.settings.exerciseFolderPath, "", false)
          .catch(() => {
            // Silent fail - failed to open exercises folder
          });
      }
    });
  }
}

