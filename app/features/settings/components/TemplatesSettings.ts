import { Setting } from "obsidian";
import { CONSTANTS } from "@app/constants";
import WorkoutChartsPlugin from "main";

export class TemplatesSettings {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private containerEl: HTMLElement,
  ) {}

  render(): void {
    const { containerEl } = this;

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.SECTIONS.TEMPLATES)
      .setHeading();

    // Generate Templates button
    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.GENERATE_DEFAULT_TEMPLATES)
      .setDesc(
        CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.GENERATE_DEFAULT_TEMPLATES,
      )
      .addButton((button) => {
        button
          .setButtonText(
            CONSTANTS.WORKOUT.SETTINGS.LABELS.GENERATE_DEFAULT_TEMPLATES,
          )
          .setCta()
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText("Generating...");
            try {
              await this.plugin.templateGeneratorService.generateDefaultTemplates(
                false,
              );
              button.setButtonText("Generated!");
              setTimeout(() => {
                button.setButtonText("Generate templates");
                button.setDisabled(false);
              }, 2000);
            } catch (error) {
              button.setButtonText("Failed");
              setTimeout(() => {
                button.setButtonText("Generate templates");
                button.setDisabled(false);
              }, 2000);
            }
          });
      })
      .addButton((button) => {
        button
          .setButtonText("Regenerate (overwrite)")
          .setWarning()
          .onClick(async () => {
            button.setDisabled(true);
            button.setButtonText("Overwriting...");
            try {
              await this.plugin.templateGeneratorService.generateDefaultTemplates(
                true,
              );
              button.setButtonText("Done!");
              setTimeout(() => {
                button.setButtonText("Regenerate (overwrite)");
                button.setDisabled(false);
              }, 2000);
            } catch (error) {
              console.error("Failed to regenerate templates:", error);
              button.setButtonText("Failed");
              setTimeout(() => {
                button.setButtonText("Regenerate (overwrite)");
                button.setDisabled(false);
              }, 2000);
            }
          });
      });

    new Setting(containerEl)
      .setName(CONSTANTS.WORKOUT.SETTINGS.LABELS.EXERCISE_BLOCK_TEMPLATE)
      .setDesc(CONSTANTS.WORKOUT.SETTINGS.DESCRIPTIONS.EXERCISE_BLOCK_TEMPLATE)
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
