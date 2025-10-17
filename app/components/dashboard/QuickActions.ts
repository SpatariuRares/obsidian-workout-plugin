import { EmbeddedDashboardParams } from "@app/types";
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
      text: "Quick Actions",
      cls: "widget-title",
    });

    const buttonsEl = actionsEl.createEl("div", {
      cls: "action-buttons",
    });

    // Add workout log button
    const addLogBtn = buttonsEl.createEl("button", {
      text: "Add Workout Log",
      cls: "action-button primary",
    });

    addLogBtn.addEventListener("click", () => {
      plugin.createLogModalHandler.openModal();
    });

    // View all exercises button
    const viewExercisesBtn = buttonsEl.createEl("button", {
      text: "View Exercises",
      cls: "action-button secondary",
    });

    viewExercisesBtn.addEventListener("click", () => {
      // Navigate to exercises folder
      if (plugin.app.workspace.getActiveFile()) {
        plugin.app.workspace.openLinkText(
          plugin.settings.exerciseFolderPath,
          "",
          false
        );
      }
    });
  }
}