// Quick Log Modal for fast workout logging (mobile-friendly)
import { CONSTANTS } from "@app/constants/Constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { App, Notice } from "obsidian";
import WorkoutChartsPlugin from "main";

/**
 * QuickLogModal - Placeholder for quick workout logging
 *
 * This modal is designed for fast, mobile-friendly workout logging.
 * It will be expanded in US-002 to include:
 * - Exercise autocomplete input
 * - Reps input
 * - Weight input
 * - Quick confirm button
 *
 * Currently displays a placeholder notice.
 */
export class QuickLogModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: CONSTANTS.WORKOUT.MODAL.TITLES.QUICK_LOG });

    const mainContainer = this.createStyledMainContainer(contentEl);

    // Placeholder message
    mainContainer.createEl("p", {
      text: "Quick log feature coming soon! This will allow you to log sets with minimal taps.",
      cls: "workout-quick-log-placeholder",
    });

    // Show notice that this is a placeholder
    new Notice("Quick log modal opened - full implementation coming in US-002");
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
