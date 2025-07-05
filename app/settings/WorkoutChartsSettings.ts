// Settings tab for the Workout Charts plugin
import { App, PluginSettingTab, Setting } from "obsidian";
import type WorkoutChartsPlugin from "../../main";

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

    new Setting(containerEl)
      .setName("Log Folder Path")
      .setDesc("Path to the folder containing workout log files")
      .addText((text) =>
        text
          .setPlaceholder("Enter folder path")
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
  }
}
