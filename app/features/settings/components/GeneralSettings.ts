import { App, Setting, normalizePath, Notice, TFolder } from "obsidian";
import { t } from "@app/i18n";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import type {
  EventBusPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { isWeightUnit } from "@app/utils/WeightUnitUtils";
import { changeWeightUnit } from "@app/features/settings/business/changeWeightUnit";
import { announceDataPathChange } from "@app/features/settings/business/announceDataPathChange";

/** Wait for typing to stop before views reload from a new path */
const PATH_CHANGE_DELAY_MS = 600;

export class GeneralSettings {
  private csvPathValidationTimer: number | null = null;
  /** Pending path changes: the value before the first keystroke, and the timer */
  private pathChanges = new Map<
    "csvLogFilePath" | "exerciseFolderPath",
    { previousValue: string; timer: number }
  >();

  constructor(
    private app: App,
    private plugin: WorkoutPluginContext & EventBusPort,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    // Top-level "Setup & data" heading for the path/unit fields
    new Setting(containerEl)
      .setName(t("settings.sections.setupAndData"))
      .setHeading();

    const csvPathSetting = new Setting(containerEl)
      .setName(t("settings.labels.csvPath"))
      .setDesc(t("settings.descriptions.csvFolder"))
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        const currentPath = this.plugin.settings.csvLogFilePath;
        const lastSlash = currentPath.lastIndexOf("/");
        const folderPath =
          lastSlash > 0 ? currentPath.substring(0, lastSlash) : "";

        text
          .setPlaceholder(t("forms.enterCsvPath"))
          .setValue(folderPath)
          .onChange(async (value) => {
            const folder = normalizePath(value);
            this.announcePathChangeLater("csvLogFilePath");
            this.plugin.settings.csvLogFilePath = `${folder}/workout_logs.csv`;
            await this.plugin.saveSettings();
            this.scheduleCsvPathValidation(
              value.trim(),
              csvPathWarning,
            );
          });
      });
    const csvPathWarning = csvPathSetting.controlEl.createEl("div", {
      cls: "workout-setting-error",
    });
    csvPathWarning.setCssProps({
      display: "none",
    });

    new Setting(containerEl)
      .setName(t("settings.labels.exerciseFolder"))
      .setDesc(t("settings.descriptions.exerciseFolder"))
      .addText((text) => {
        new FolderSuggest(this.app, text.inputEl);
        text
          .setPlaceholder(t("forms.enterFolderPath"))
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.announcePathChangeLater("exerciseFolderPath");
            this.plugin.settings.exerciseFolderPath =
              normalizePath(value);
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName(t("settings.labels.weightUnit"))
      .setDesc(t("settings.descriptions.weightUnit"))
      .addDropdown((dropdown) =>
        dropdown
          .addOption("kg", t("settings.options.weightUnit.kg"))
          .addOption("lb", t("settings.options.weightUnit.lb"))
          .setValue(this.plugin.settings.weightUnit)
          .onChange(async (value) => {
            const previousValue = this.plugin.settings.weightUnit;
            if (!isWeightUnit(value) || value === previousValue) return;
            try {
              await changeWeightUnit(this.plugin, previousValue, value);
            } catch (error) {
              dropdown.setValue(previousValue);
              new Notice(
                t("settings.messages.weightUnitChangeFailed", {
                  error: ErrorUtils.getErrorMessage(error),
                }),
              );
            }
          }),
      );

    // CSV Management Section
    new Setting(containerEl)
      .setName(t("settings.sections.csvManagement"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.setupCSV"))
      .setDesc(t("settings.descriptions.setupCSV"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.createFiles"))
          .onClick(async () => {
            try {
              // Create workout log CSV
              await this.plugin.createCSVLogFile();

              // Create muscle tags CSV
              await this.handleCreateMuscleTagsCsv();

              new Notice(t("settings.messages.csvFilesCreated"));
            } catch (error) {
              const errorMessage = ErrorUtils.getErrorMessage(error);
              new Notice(t("messages.errors.csvFilesError", { error: errorMessage }));
            }
          }),
      );

    // Initial Setup Section
    new Setting(containerEl)
      .setName(t("settings.sections.exampleData"))
      .setHeading();

    new Setting(containerEl)
      .setName(t("settings.labels.generateExamples"))
      .setDesc(t("settings.descriptions.generateExamples"))
      .addButton((button) =>
        button
          .setButtonText(t("settings.buttons.createExamples"))
          .onClick(async () => {
            const { ExampleGeneratorService } =
              await import("@app/services/examples/ExampleGeneratorService");
            const generator = new ExampleGeneratorService(this.app);

            if (generator.exampleFolderExists()) {
              new ConfirmModal(
                this.app,
                t("settings.messages.confirmOverwriteExamples"),
                async () => {
                  await generator.generateExampleFolder(true);
                },
              ).open();
            } else {
              await generator.generateExampleFolder(false);
            }
          }),
      );
  }

  /**
   * Call before writing a new path. Once typing stops, views reload from
   * the new place (see announceDataPathChange). The path is saved on every
   * keystroke as before.
   */
  private announcePathChangeLater(
    key: "csvLogFilePath" | "exerciseFolderPath",
  ): void {
    const pending = this.pathChanges.get(key);
    if (pending) window.clearTimeout(pending.timer);
    const previousValue = pending?.previousValue ?? this.plugin.settings[key];
    const timer = window.setTimeout(() => {
      this.pathChanges.delete(key);
      announceDataPathChange(this.plugin, key, previousValue);
    }, PATH_CHANGE_DELAY_MS);
    this.pathChanges.set(key, { previousValue, timer });
  }

  private scheduleCsvPathValidation(
    folderValue: string,
    warningEl: HTMLElement,
  ): void {
    if (this.csvPathValidationTimer !== null) {
      window.clearTimeout(this.csvPathValidationTimer);
    }
    this.csvPathValidationTimer = window.setTimeout(() => {
      this.csvPathValidationTimer = null;
      if (!folderValue) {
        warningEl.textContent = t("settings.validation.csvPathEmpty");
        warningEl.addClass("is-visible");
        return;
      }
      const folder = normalizePath(folderValue);
      const exists =
        this.app.vault.getAbstractFileByPath(folder) instanceof TFolder;
      if (!exists) {
        warningEl.textContent = t(
          "settings.validation.csvFolderNotFound",
        );
        warningEl.addClass("is-visible");
      } else {
        warningEl.removeClass("is-visible");
      }
    }, 300);
  }

  /**
   * Handles the creation of the muscle tags CSV file.
   * If the file already exists, prompts for confirmation before overwriting.
   */
  private async handleCreateMuscleTagsCsv(): Promise<void> {
    const muscleTagService = this.plugin.getMuscleTagService();

    try {
      const exists = await muscleTagService.csvExists();

      if (exists) {
        // File exists, show confirmation modal
        new ConfirmModal(
          this.app,
          t("settings.descriptions.confirmOverwriteMuscleTags"),
          async () => {
            // User confirmed, overwrite by saving default tags
            await this.createMuscleTagsCsvWithDefaults();
          },
        ).open();
      } else {
        // File doesn't exist, create it directly
        await muscleTagService.createDefaultCsv();
        this.plugin.triggerMuscleTagRefresh();
        new Notice(t("settings.messages.csvFilesCreated"));
      }
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(t("messages.errors.muscleTagsCsvError", { error: errorMessage }));
    }
  }

  /**
   * Creates the muscle tags CSV file with default values, overwriting any existing file.
   */
  private async createMuscleTagsCsvWithDefaults(): Promise<void> {
    const muscleTagService = this.plugin.getMuscleTagService();
    const { MUSCLE_TAG_ENTRIES } =
      await import("@app/constants/muscles.constants");
    const defaultTags = new Map(
      MUSCLE_TAG_ENTRIES.map((entry) => [entry.tag, entry.muscleGroup]),
    );

    try {
      await muscleTagService.saveTags(defaultTags);
      this.plugin.triggerMuscleTagRefresh();
      new Notice(t("settings.messages.csvFilesCreated"));
    } catch (error) {
      const errorMessage = ErrorUtils.getErrorMessage(error);
      new Notice(t("messages.errors.muscleTagsCsvError", { error: errorMessage }));
    }
  }
}
