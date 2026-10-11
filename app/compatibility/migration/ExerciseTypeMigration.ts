import { Notice } from "obsidian";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { t } from "@app/i18n";

/**
 * Marks exercise pages that say no type at all (neither `exercise_type` nor
 * `type`) as strength, the type they already behave as.
 */
export class ExerciseTypeMigration {
  private plugin: WorkoutPluginContext;

  constructor(plugin: WorkoutPluginContext) {
    this.plugin = plugin;
  }

  public async migrateExerciseTypes(): Promise<void> {
    try {
      if (!this.plugin.settings.exerciseFolderPath) {
        new Notice(t("messages.exerciseFolderNotSet"));
        return;
      }

      const untyped = this.plugin
        .getExerciseLibrary()
        .pages()
        .filter((page) => page.type === undefined);

      for (const page of untyped) {
        await this.plugin.app.fileManager.processFrontMatter(
          page.file,
          (frontmatter) => {
            frontmatter["exercise_type"] = "strength";
          },
        );
      }

      if (untyped.length > 0) {
        new Notice(
          t("modal.notices.migrationComplete", {
            count: untyped.length,
          }),
        );
      } else {
        new Notice(t("modal.notices.migrationNoUpdates"));
      }
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(t("modal.notices.migrationError", { error: errorMessage }));
    }
  }
}
