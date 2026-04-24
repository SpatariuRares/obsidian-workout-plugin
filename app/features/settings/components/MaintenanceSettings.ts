import { App, Notice, Setting } from "obsidian";
import { t } from "@app/i18n";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { runAddMissingBlockIds } from "@app/utils/BlockIdMigration";
import { ExerciseTypeMigration } from "@app/compatibility/migration";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

/**
 * MaintenanceSettings - Settings section for vault-wide maintenance migrations.
 *
 * Contains idempotent operations that keep the vault consistent
 * with the plugin's current feature requirements.
 */
export class MaintenanceSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.maintenance"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.runAllMaintenance"))
      .setDesc(t("settings.descriptions.runAllMaintenance"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.runAllMaintenance"))
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            try {
              const { totalAdded, modifiedFiles } =
                await runAddMissingBlockIds(this.app);

              if (totalAdded === 0) {
                new Notice(t("messages.success.noBlockIdsNeeded"));
              } else {
                new Notice(
                  t("messages.success.blockIdsAdded", {
                    count: totalAdded,
                    files: modifiedFiles,
                  }),
                );
              }

              await new ExerciseTypeMigration(
                this.plugin,
              ).migrateExerciseTypes();
            } catch (error) {
              const errorMessage = ErrorUtils.getErrorMessage(error);
              new Notice(t("modal.notices.genericError", { error: errorMessage }));
            } finally {
              button.setDisabled(false);
            }
          }),
      );
  }
}
