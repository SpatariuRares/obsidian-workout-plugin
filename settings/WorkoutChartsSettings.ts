// Settings tab for the Workout Charts plugin
import { App, PluginSettingTab, Setting } from "obsidian";
import type WorkoutChartsPlugin from "../main";

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
      .setName("Default Exercise")
      .setDesc("Default exercise to show in charts")
      .addText((text) =>
        text
          .setPlaceholder("Enter exercise name")
          .setValue(this.plugin.settings.defaultExercise)
          .onChange(async (value) => {
            this.plugin.settings.defaultExercise = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chart Type")
      .setDesc("Default chart type to display")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("volume", "Volume")
          .addOption("weight", "Weight")
          .addOption("reps", "Reps")
          .setValue(this.plugin.settings.chartType)
          .onChange(async (value) => {
            this.plugin.settings.chartType = value as
              | "volume"
              | "weight"
              | "reps";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Date Range (days)")
      .setDesc("Number of days to include in charts")
      .addSlider((slider) =>
        slider
          .setLimits(12, 96, 12)
          .setValue(this.plugin.settings.dateRange)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.dateRange = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Show Trend Line")
      .setDesc("Show trend line on charts")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTrendLine)
          .onChange(async (value) => {
            this.plugin.settings.showTrendLine = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Chart Height")
      .setDesc("Height of charts in pixels")
      .addSlider((slider) =>
        slider
          .setLimits(200, 800, 50)
          .setValue(this.plugin.settings.chartHeight)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.chartHeight = value;
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
