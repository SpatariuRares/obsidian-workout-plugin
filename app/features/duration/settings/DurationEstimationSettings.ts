import { Setting } from "obsidian";
import { t } from "@app/i18n";
import { getDynamicSettingsLabels } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class DurationEstimationSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    // "Training parameters" absorbs what used to be the separate "Progressive Overload" section
    new Setting(containerEl)
      .setName(t("settings.sections.trainingParameters"))
      .setHeading();

    // Weight increment (was in ProgressiveOverloadSettings)
    const weightIncrementSetting = new Setting(containerEl)
      .setName(getDynamicSettingsLabels().WEIGHT_INCREMENT)
      .setDesc(t("settings.descriptions.weightIncrement"))
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.weightIncrement))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && numValue > 0;
            weightIncrementError.toggleClass("is-visible", !isValid);
            if (isValid) {
              this.plugin.settings.weightIncrement = numValue;
              await this.plugin.saveSettings();
            }
          });
      });
    const weightIncrementError =
      weightIncrementSetting.controlEl.createEl("div", {
        cls: "workout-setting-error",
        text: t("settings.validation.mustBePositive"),
      });

    // Duration per Rep
    const repDurationSetting = new Setting(containerEl)
      .setName(t("settings.labels.repDuration"))
      .setDesc(t("settings.descriptions.repDuration"))
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.repDuration))
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            const isValid = !isNaN(numValue) && numValue > 0;
            repDurationError.toggleClass("is-visible", !isValid);
            if (isValid) {
              this.plugin.settings.repDuration = numValue;
              await this.plugin.saveSettings();
            }
          });
      });
    const repDurationError = repDurationSetting.controlEl.createEl(
      "div",
      {
        cls: "workout-setting-error",
        text: t("settings.validation.mustBePositive"),
      },
    );

    // Default Reps per Set
    const defaultRepsSetting = new Setting(containerEl)
      .setName(t("settings.labels.defaultRepsPerSet"))
      .setDesc(t("settings.descriptions.defaultRepsPerSet"))
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.defaultRepsPerSet))
          .onChange(async (value) => {
            const numValue = parseInt(value, 10);
            const isValid = !isNaN(numValue) && numValue >= 0;
            defaultRepsError.toggleClass("is-visible", !isValid);
            if (isValid) {
              this.plugin.settings.defaultRepsPerSet = numValue;
              await this.plugin.saveSettings();
            }
          });
      });
    const defaultRepsError = defaultRepsSetting.controlEl.createEl(
      "div",
      {
        cls: "workout-setting-error",
        text: t("settings.validation.mustBeNonNegative"),
      },
    );

    const setDurationSetting = new Setting(containerEl)
      .setName(t("settings.labels.setDuration"))
      .setDesc(t("settings.descriptions.setDuration"))
      .addText((text) => {
        text
          .setValue(String(this.plugin.settings.setDuration))
          .onChange(async (value) => {
            const numValue = parseInt(value, 10);
            const isValid = !isNaN(numValue) && numValue > 0;
            setDurationError.toggleClass("is-visible", !isValid);
            if (isValid) {
              this.plugin.settings.setDuration = numValue;
              await this.plugin.saveSettings();
            }
          });
      });
    const setDurationError = setDurationSetting.controlEl.createEl(
      "div",
      {
        cls: "workout-setting-error",
        text: t("settings.validation.mustBePositive"),
      },
    );
  }
}
