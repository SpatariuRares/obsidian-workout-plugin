import { App, normalizePath, type Setting } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { FolderSuggest } from "@app/features/common/suggest/FolderSuggest";
import { runWithBusyButton } from "@app/features/settings/runWithBusyButton";
import type {
  WorkoutPluginContext,
  TemplateGeneratorPort,
} from "@app/types/PluginPorts";

export class TemplatesSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext & TemplateGeneratorPort,
  ) {}

  definitions(): DefinitionItem[] {
    return [
      {
        type: "group",
        heading: t("settings.sections.templates"),
        items: [
          {
            name: t("settings.labels.templateFolder"),
            desc: t("settings.descriptions.templateFolder"),
            render: (setting) => this.renderTemplateFolder(setting),
          },
          {
            name: t("settings.labels.generateDefaultTemplates"),
            desc: t("settings.descriptions.generateDefaultTemplates"),
            render: (setting) => this.renderGenerate(setting),
          },
        ],
      },
    ];
  }

  private renderTemplateFolder(setting: Setting): void {
    setting.addText((text) => {
      new FolderSuggest(this.app, text.inputEl);
      text
        .setPlaceholder(t("forms.enterFolderPath"))
        .setValue(this.plugin.settings.templateFolderPath)
        .onChange(async (value) => {
          const trimmed = value.trim();
          this.plugin.settings.templateFolderPath = trimmed
            ? normalizePath(trimmed).replace(/^\/+|\/+$/g, "")
            : "";
          await this.plugin.saveSettings();
        });
    });
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

}
