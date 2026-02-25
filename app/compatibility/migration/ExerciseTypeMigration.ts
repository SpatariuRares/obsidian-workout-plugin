import { Notice, TFolder, TFile } from "obsidian";
import WorkoutChartsPlugin from "main";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { t } from "@app/i18n";

export class ExerciseTypeMigration {
  private plugin: WorkoutChartsPlugin;

  constructor(plugin: WorkoutChartsPlugin) {
    this.plugin = plugin;
  }

  public async migrateExerciseTypes(): Promise<void> {
    try {
      const exerciseFolderPath = this.plugin.settings.exerciseFolderPath;
      if (!exerciseFolderPath) {
        new Notice(t("messages.fileEmpty")); // Using generic error or specific if available
        return;
      }

      const folder =
        this.plugin.app.vault.getAbstractFileByPath(exerciseFolderPath);
      if (!folder || !(folder instanceof TFolder)) {
        new Notice(`Exercise folder not found: ${exerciseFolderPath}`);
        return;
      }

      let updatedCount = 0;
      const files = this.getAllMarkdownFiles(folder);

      for (const file of files) {
        await this.plugin.app.fileManager.processFrontMatter(
          file,
          (frontmatter) => {
            if (!frontmatter["exercise_type"]) {
              frontmatter["exercise_type"] = "strength";
              updatedCount++;
            }
          },
        );
      }

      if (updatedCount > 0) {
        new Notice(
          t("modal.notices.migrationComplete", { count: updatedCount }),
        );
      } else {
        new Notice(t("modal.notices.migrationNoUpdates"));
      }
    } catch (error) {
      const errorMessage =
        ErrorUtils.getErrorMessage(error);
      new Notice(
        t("modal.notices.migrationError") + errorMessage,
      );
    }
  }

  private getAllMarkdownFiles(folder: TFolder): TFile[] {
    let files: TFile[] = [];
    for (const child of folder.children) {
      if (child instanceof TFile && child.extension === "md") {
        files.push(child);
      } else if (child instanceof TFolder) {
        files = files.concat(this.getAllMarkdownFiles(child));
      }
    }
    return files;
  }
}
