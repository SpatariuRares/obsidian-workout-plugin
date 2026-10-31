import type { Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { getDynamicSettingsLabels } from "@app/constants";
import type { SettingsPort } from "@app/types/PluginPorts";

/** The numeric settings of this section: one text box, a check, a message */
type NumberField = {
  key:
    | "weightIncrement"
    | "repDuration"
    | "defaultRepsPerSet"
    | "setDuration";
  name: string;
  desc: string;
  parse: (raw: string) => number;
  isValid: (value: number) => boolean;
  error: string;
};

export class DurationEstimationSettings {
  constructor(private plugin: SettingsPort) {}

  definitions(): DefinitionItem[] {
    const positive = (v: number) => !isNaN(v) && v > 0;
    const fields: NumberField[] = [
      {
        // Was in ProgressiveOverloadSettings
        key: "weightIncrement",
        name: getDynamicSettingsLabels().WEIGHT_INCREMENT,
        desc: t("settings.descriptions.weightIncrement"),
        parse: parseFloat,
        isValid: positive,
        error: t("settings.validation.mustBePositive"),
      },
      {
        key: "repDuration",
        name: t("settings.labels.repDuration"),
        desc: t("settings.descriptions.repDuration"),
        parse: parseFloat,
        isValid: positive,
        error: t("settings.validation.mustBePositive"),
      },
      {
        key: "defaultRepsPerSet",
        name: t("settings.labels.defaultRepsPerSet"),
        desc: t("settings.descriptions.defaultRepsPerSet"),
        parse: (raw) => parseInt(raw, 10),
        isValid: (v) => !isNaN(v) && v >= 0,
        error: t("settings.validation.mustBeNonNegative"),
      },
      {
        key: "setDuration",
        name: t("settings.labels.setDuration"),
        desc: t("settings.descriptions.setDuration"),
        parse: (raw) => parseInt(raw, 10),
        isValid: positive,
        error: t("settings.validation.mustBePositive"),
      },
    ];

    return [
      {
        // "Training parameters" absorbs what used to be the separate "Progressive Overload" section
        type: "group",
        heading: t("settings.sections.trainingParameters"),
        items: fields.map((field) => ({
          name: field.name,
          desc: field.desc,
          render: (setting: Setting) =>
            this.renderField(setting, field),
        })),
      },
    ];
  }

  private renderField(setting: Setting, field: NumberField): void {
    setting.addText((text) => {
      text
        .setValue(String(this.plugin.settings[field.key]))
        .onChange(async (value) => {
          const numValue = field.parse(value);
          const isValid = field.isValid(numValue);
          error.toggleClass("is-visible", !isValid);
          if (isValid) {
            this.plugin.settings[field.key] = numValue;
            await this.plugin.saveSettings();
          }
        });
    });
    const error = setting.controlEl.createDiv({
      cls: "workout-setting-error",
      text: field.error,
    });
  }
}
