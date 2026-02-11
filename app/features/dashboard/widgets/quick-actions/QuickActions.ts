import { CONSTANTS } from "@app/constants";
import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import type WorkoutChartsPlugin from "main";

import { Button } from "@app/components/atoms";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";

export class QuickActions {
  static render(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin,
  ): void {
    const actionsEl = WidgetContainer.create(container, {
      title: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.TITLE,
      className: "workout-quick-actions",
    });

    const buttonsEl = Button.createContainer(actionsEl);
    buttonsEl.addClass("workout-action-buttons");

    // Add workout log button
    const addLogBtn = Button.create(buttonsEl, {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
      variant: "primary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.ADD_WORKOUT_LOG,
    });

    Button.onClick(addLogBtn, () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = Button.create(buttonsEl, {
      text: CONSTANTS.WORKOUT.LABELS.DASHBOARD.QUICK_ACTIONS.VIEW_EXERCISES,
      variant: "secondary",
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
