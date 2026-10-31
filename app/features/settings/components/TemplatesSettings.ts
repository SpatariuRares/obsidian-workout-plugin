import type { Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import type {
  WorkoutPluginContext,
  TemplateGeneratorPort,
} from "@app/types/PluginPorts";

export class TemplatesSettings {
  constructor(
    private plugin: WorkoutPluginContext & TemplateGeneratorPort,
  ) {}

  definitions(): DefinitionItem[] {
    return [
      {
        type: "group",
        heading: t("settings.sections.templates"),
        items: [
          {
            name: t("settings.labels.generateDefaultTemplates"),
            desc: t("settings.descriptions.generateDefaultTemplates"),
            render: (setting) => this.renderGenerate(setting),
          },
          {
            name: t("settings.labels.exerciseBlockTemplate"),
            desc: t("settings.descriptions.exerciseBlockTemplate"),
            render: (setting) => this.renderBlockTemplate(setting),
          },
        ],
      },
    ];
  }

  private renderGenerate(setting: Setting): void {
    setting
      .addButton((button) => {
        button
          .setButtonText(t("settings.buttons.generateTemplates"))
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText(t("settings.buttons.generating"));
            try {
              await this.plugin.templateGeneratorService.generateDefaultTemplates(
                false,
              );
              button.setButtonText(t("settings.buttons.generated"));
              window.setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.generateTemplates"),
                );
                button.setDisabled(false);
              }, 2000);
            } catch {
              button.setButtonText(t("settings.buttons.failed"));
              window.setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.generateTemplates"),
                );
                button.setDisabled(false);
              }, 2000);
            }
          });
      })
      .addButton((button) => {
        // The "warning" style; setWarning() is deprecated, setDestructive() needs Obsidian 1.13
        button.buttonEl.addClass("mod-warning");
        button
          .setButtonText(t("settings.buttons.regenerateOverwrite"))
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText(t("settings.buttons.overwriting"));
            try {
              await this.plugin.templateGeneratorService.generateDefaultTemplates(
                true,
              );
              button.setButtonText(t("settings.buttons.done"));
              window.setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.regenerateOverwrite"),
                );
                button.setDisabled(false);
              }, 2000);
            } catch {
              button.setButtonText(t("settings.buttons.failed"));
              window.setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.regenerateOverwrite"),
                );
                button.setDisabled(false);
              }, 2000);
            }
          });
      });
  }

  private renderBlockTemplate(setting: Setting): void {
    setting.addTextArea((text) => {
      text
        .setValue(this.plugin.settings.exerciseBlockTemplate)
        .setPlaceholder(this.plugin.settings.exerciseBlockTemplate)
        .onChange(async (value) => {
          this.plugin.settings.exerciseBlockTemplate = value;
          await this.plugin.saveSettings();
        });
      text.inputEl.rows = 10;
      text.inputEl.cols = 50;
    });
  }
}
