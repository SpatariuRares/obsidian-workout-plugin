// Settings tab for the Workout Charts plugin
import { App, PluginSettingTab, Setting } from "obsidian";
import type WorkoutChartsPlugin from "../../main";
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

    containerEl.createEl("h2", { text: "Workout Charts Settings" });

    // CSV Mode Info
    const csvInfo = containerEl.createEl("div", {
      cls: "setting-item-info",
    });
    csvInfo.innerHTML = `
      <div style="
        background: var(--background-secondary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 6px;
        padding: 12px;
        margin-bottom: 20px;
      ">
        <h4 style="margin: 0 0 8px 0; color: var(--interactive-accent);">📊 CSV Mode</h4>
        <p style="margin: 0; font-size: 14px; color: var(--text-muted);">
          All workout data is stored in a single CSV file for better performance and easier management.
        </p>
      </div>
    `;

    new Setting(containerEl)
      .setName("CSV Log File Path")
      .setDesc("Path to the CSV file containing all workout log data")
      .addText((text) =>
        text
          .setPlaceholder("Enter CSV file path")
          .setValue(this.plugin.settings.csvLogFilePath)
          .onChange(async (value) => {
            this.plugin.settings.csvLogFilePath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Exercise Folder Path")
      .setDesc("Path to the folder containing exercise pages")
      .addText((text) =>
        text
          .setPlaceholder("Enter folder path")
          .setValue(this.plugin.settings.exerciseFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.exerciseFolderPath = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Debug Mode")
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
    containerEl.createEl("h3", { text: "CSV File Management" });

    new Setting(containerEl)
      .setName("Create CSV Log File")
      .setDesc("Create a new CSV log file with sample data")
      .addButton((button) =>
        button.setButtonText("Create File").onClick(async () => {
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
