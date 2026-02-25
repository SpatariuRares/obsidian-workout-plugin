import { EmbeddedDashboardParams } from "@app/features/dashboard/types";
import type WorkoutChartsPlugin from "main";

import { Button } from "@app/components/atoms";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { t } from "@app/i18n";

export class QuickActions {
  static render(
    container: HTMLElement,
    params: EmbeddedDashboardParams,
    plugin: WorkoutChartsPlugin,
  ): void {
    const actionsEl = WidgetContainer.create(container, {
      title: t("dashboard.quickActions.title"),
      className: "workout-quick-actions",
    });

    const buttonsEl = Button.createContainer(actionsEl);
    buttonsEl.addClass("workout-action-buttons");

    // Add workout log button
    const addLogBtn = Button.create(buttonsEl, {
      text: t("dashboard.quickActions.addWorkoutLog"),
      variant: "primary",
      ariaLabel: t("dashboard.quickActions.addWorkoutLog"),
    });

    Button.onClick(addLogBtn, () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = Button.create(buttonsEl, {
      text: t("dashboard.quickActions.viewExercises"),
      variant: "secondary",
      ariaLabel: t("dashboard.quickActions.viewExercises"),
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
