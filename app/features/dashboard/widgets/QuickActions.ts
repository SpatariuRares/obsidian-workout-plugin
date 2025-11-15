import { EmbeddedDashboardParams } from "@app/types";
import { UI_LABELS } from "@app/constants/LabelConstants";
import type WorkoutChartsPlugin from "main";

export class QuickActions {
  static render(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin
  ): void {
    const actionsEl = container.createEl("div", {
      cls: "dashboard-widget columns-2 quick-actions",
    });

    actionsEl.createEl("h3", {
      text: UI_LABELS.DASHBOARD.QUICK_ACTIONS.TITLE,
      cls: "widget-title",
    });

    const buttonsEl = actionsEl.createEl("div", {
      cls: "action-buttons",
    });

    // Add workout log button
    const addLogBtn = buttonsEl.createEl("button", {
      text: UI_LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
      cls: "action-button primary",
    });

    addLogBtn.addEventListener("click", () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = buttonsEl.createEl("button", {
      text: UI_LABELS.DASHBOARD.QUICK_ACTIONS.VIEW_EXERCISES,
      cls: "action-button secondary",
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

