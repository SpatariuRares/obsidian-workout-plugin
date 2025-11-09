// Settings tab for the Workout Charts plugin
import WorkoutChartsPlugin from "main";
import { App, PluginSettingTab, Setting, normalizePath } from "obsidian";
import { Notice } from "obsidian";

export class WorkoutChartsSettingTab extends PluginSettingTab {
  plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    const csvInfo = containerEl.createEl("div", {
      cls: "setting-item-info",
    });

    const infoDiv = csvInfo.createEl("div", {
      cls: "csv-mode-info",
    });
    infoDiv.setAttribute(
      "style",
      `
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 20px;
    `
    );

    const title = infoDiv.createEl("h4", {
      text: "Workout planner",
    });
    title.setAttribute(
      "style",
      "margin: 0 0 8px 0; color: var(--interactive-accent);"
    );

    const description = infoDiv.createEl("p", {
      text: "All workout data is stored in a single CSV file for better performance and easier management.",
    });
    description.setAttribute(
      "style",
      "margin: 0; font-size: 14px; color: var(--text-muted);"
    );

    new Setting(containerEl)
      .setName("CSV log file path")
      .setDesc("Path to the CSV file containing all workout log data")
      .addText((text) =>
        text
          .setPlaceholder("Enter CSV file path")
          .setValue(this.plugin.settings.csvLogFilePath)
          .onChange(async (value) => {
            this.plugin.settings.csvLogFilePath = normalizePath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exercise folder path")
      .setDesc("Path to the folder containing exercise pages")
      .addText((text) =>
        text
          .setPlaceholder("Enter folder path")
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.exerciseFolderPath = normalizePath(value);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Debug mode")
      .setDesc("Enable debug logging for troubleshooting")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    // CSV Management Section
    containerEl.createEl("h3", { text: "CSV file management" });

    new Setting(containerEl)
      .setName("Create CSV log file")
      .setDesc("Create a new CSV log file with sample data")
      .addButton((button) =>
        button.setButtonText("Create file").onClick(async () => {
          try {
            await this.plugin.createCSVLogFile();
            new Notice("CSV log file created successfully!");
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            new Notice(`Error creating CSV file: ${errorMessage}`);
          }
        })
      );
  }
}
