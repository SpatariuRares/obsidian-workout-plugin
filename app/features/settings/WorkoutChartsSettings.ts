// Settings tab for the Workout Charts plugin
import { App, PluginSettingTab } from "obsidian";
import { t } from "@app/i18n";
import WorkoutChartsPlugin from "main";
import { GeneralSettings } from "@app/features/settings/components/GeneralSettings";
import { TimerPresetsSettings } from "@app/features/timer";
import { CustomProtocolsSettings } from "@app/features/settings/components/CustomProtocolsSettings";
import { TemplatesSettings } from "@app/features/settings/components/TemplatesSettings";
import { DurationEstimationSettings } from "@app/features/duration";
import { QuickLogSettings } from "@app/features/settings/components/QuickLogSettings";
import { MaintenanceSettings } from "@app/features/settings/components/MaintenanceSettings";

export class WorkoutChartsSettingTab extends PluginSettingTab {
  plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Setup & Data (paths, weight unit, CSV management, example data)
    new GeneralSettings(this.app, this.plugin, containerEl).render();

    // Quick Log Section (exact match + weight increment)
    new QuickLogSettings(this.plugin, containerEl).render();

    // Timer Presets Section
    new TimerPresetsSettings(
      this.app,
      this.plugin,
      containerEl,
    ).render();

    // Custom Protocols Section
    new CustomProtocolsSettings(
      this.app,
      this.plugin,
      containerEl,
    ).render();

    // Training Parameters Section
    new DurationEstimationSettings(this.plugin, containerEl).render();

    // Advanced collapsible section (Templates + Maintenance)
    const advancedDetails = containerEl.createEl("details", {
      cls: "workout-advanced-section",
    });
    advancedDetails.createEl("summary", {
      cls: "workout-advanced-section__toggle",
      text: t("settings.sections.advanced"),
    });

    new TemplatesSettings(this.plugin, advancedDetails).render();
    new MaintenanceSettings(
      this.app,
      this.plugin,
      advancedDetails,
    ).render();
  }
}
