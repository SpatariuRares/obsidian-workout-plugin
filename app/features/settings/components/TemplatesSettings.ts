import type { Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { runWithBusyButton } from "@app/features/settings/runWithBusyButton";
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
    const generate = (overwrite: boolean) => () =>
      this.plugin.templateGeneratorService.generateDefaultTemplates(
        overwrite,
      );
    setting
      .addButton((button) => {
        button
          .setButtonText(t("settings.buttons.generateTemplates"))
          .setCta()
          .onClick(() =>
            runWithBusyButton(
              button,
              {
                idle: t("settings.buttons.generateTemplates"),
                busy: t("settings.buttons.generating"),
                done: t("settings.buttons.generated"),
                failed: t("settings.buttons.failed"),
              },
              generate(false),
            ),
          );
      })
      .addButton((button) => {
        // The "warning" style; setWarning() is deprecated, setDestructive() needs Obsidian 1.13
        button.buttonEl.addClass("mod-warning");
        button
          .setButtonText(t("settings.buttons.regenerateOverwrite"))
          .onClick(() =>
            runWithBusyButton(
              button,
              {
                idle: t("settings.buttons.regenerateOverwrite"),
                busy: t("settings.buttons.overwriting"),
                done: t("settings.buttons.done"),
                failed: t("settings.buttons.failed"),
              },
              generate(true),
            ),
          );
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
