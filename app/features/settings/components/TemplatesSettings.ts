import { Setting } from "obsidian";
import { t } from "@app/i18n";
import WorkoutChartsPlugin from "main";

export class TemplatesSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(t("settings.sections.templates"))
      .setHeading();

    // Generate Templates button
    new Setting(containerEl)
      .setName(t("settings.labels.generateDefaultTemplates"))
      .setDesc(t("settings.descriptions.generateDefaultTemplates"))
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
              setTimeout(() => {
                button.setButtonText(t("settings.buttons.generateTemplates"));
                button.setDisabled(false);
              }, 2000);
            } catch (error) {
              button.setButtonText(t("settings.buttons.failed"));
              setTimeout(() => {
                button.setButtonText(t("settings.buttons.generateTemplates"));
                button.setDisabled(false);
              }, 2000);
            }
          });
      })
      .addButton((button) => {
        button
          .setButtonText(t("settings.buttons.regenerateOverwrite"))
          .setWarning()
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText(t("settings.buttons.overwriting"));
            try {
              await this.plugin.templateGeneratorService.generateDefaultTemplates(
                true,
              );
              button.setButtonText(t("settings.buttons.done"));
              setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.regenerateOverwrite"),
                );
                button.setDisabled(false);
              }, 2000);
            } catch (error) {
              console.error("Failed to regenerate templates:", error);
              button.setButtonText(t("settings.buttons.failed"));
              setTimeout(() => {
                button.setButtonText(
                  t("settings.buttons.regenerateOverwrite"),
                );
                button.setDisabled(false);
              }, 2000);
            }
          });
      });

    new Setting(containerEl)
      .setName(t("settings.labels.exerciseBlockTemplate"))
      .setDesc(t("settings.descriptions.exerciseBlockTemplate"))
      .addTextArea((text) => {
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
