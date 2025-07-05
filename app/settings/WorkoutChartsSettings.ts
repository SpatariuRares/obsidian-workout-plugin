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

    // CSV Logging Section
    containerEl.createEl("h3", { text: "CSV Data Storage" });

    new Setting(containerEl)
      .setName("CSV Log File Path")
      .setDesc("Path to the CSV file for storing all workout logs")
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
      .setName("Legacy Log Folder Path")
      .setDesc(
        "Path to the legacy log folder (used for migration from old file-based system)"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter legacy folder path")
          .setValue(this.plugin.settings.logFolderPath)
          .onChange(async (value) => {
            this.plugin.settings.logFolderPath = value;
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

    // General Settings
    containerEl.createEl("h3", { text: "General Settings" });

    new Setting(containerEl)
      .setName("Debug Mode")
      .setDesc("Enable debug logging")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    // Migration Section
    containerEl.createEl("h3", { text: "Data Migration" });

    const migrationContainer = containerEl.createEl("div", {
      cls: "migration-section",
    });

    migrationContainer.innerHTML = `
      <p><strong>Note:</strong> If you have existing individual log files from the old system,
      you can use the migration command below to convert your existing data to CSV format.</p>
    `;

    const migrateButton = migrationContainer.createEl("button", {
      text: "Migrate Existing Logs to CSV",
      cls: "mod-warning",
    });

    migrateButton.addEventListener("click", async () => {
      try {
        await this.plugin.migrateToCSV();
        new Notice("Migration completed successfully!");
      } catch (error) {
        new Notice(`Migration failed: ${error.message}`);
      }
    });
  }
}
