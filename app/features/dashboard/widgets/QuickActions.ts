import { CONSTANTS } from "@app/constants";
import { EmbeddedDashboardParams } from "@app/types";
import type WorkoutChartsPlugin from "main";
import { createButtonsSection } from "@app/features/modals/base/utils/createButtonsSection";
import { Button } from "@app/components/atoms";

export class QuickActions {
  static render(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin
  ): void {
    const actionsEl = container.createEl("div", {
      cls: "workout-dashboard-widget span-4 workout-quick-actions",
    });

    actionsEl.createEl("h3", {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.TITLE,
      cls: "workout-widget-title",
    });

    const buttonsEl = createButtonsSection(actionsEl);
    buttonsEl.addClass("workout-action-buttons");

    // Add workout log button
    const addLogBtn = Button.create(buttonsEl, {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
      className: "workout-action-button workout-btn-primary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
    });

    Button.onClick(addLogBtn, () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = Button.create(buttonsEl, {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.VIEW_EXERCISES,
      className: "workout-action-button workout-btn-secondary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.VIEW_EXERCISES,
    });

    Button.onClick(viewExercisesBtn, () => {
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
