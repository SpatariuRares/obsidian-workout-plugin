/**
 * WorkoutFileSuggestModal - File suggester for selecting workout files
 *
 * Opens a fuzzy search modal to let users select a workout file
 * for canvas export.
 */
import { App, FuzzySuggestModal, TFile } from "obsidian";
import { t } from "@app/i18n";

/**
 * Modal for selecting workout files using fuzzy search
 */
export class WorkoutFileSuggestModal extends FuzzySuggestModal<TFile> {
  private onChoose: (file: TFile) => void;

  constructor(app: App, onChoose: (file: TFile) => void) {
    super(app);
    this.onChoose = onChoose;
    this.setPlaceholder(t("modal.placeholders.selectWorkoutFile"));
  }

  /**
   * Get all markdown files to show in the suggester
   */
  getItems(): TFile[] {
    return this.app.vault.getMarkdownFiles().sort((a, b) => {
      // Sort by modification time (most recent first)
      return b.stat.mtime - a.stat.mtime;
    });
  }

  /**
   * Get the display text for a file
   */
  getItemText(file: TFile): string {
    return file.path;
  }

  /**
   * Handle file selection
   */
  onChooseItem(file: TFile): void {
    this.onChoose(file);
  }
}
