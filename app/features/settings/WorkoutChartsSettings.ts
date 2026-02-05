// Settings tab for the Workout Charts plugin
import { App, PluginSettingTab } from "obsidian";
import WorkoutChartsPlugin from "main";
import { GeneralSettings } from "@app/features/settings/components/GeneralSettings";
import { TimerPresetsSettings } from "@app/features/timer";
import { CustomProtocolsSettings } from "@app/features/settings/components/CustomProtocolsSettings";
import { TemplatesSettings } from "@app/features/settings/components/TemplatesSettings";
import { ProgressiveOverloadSettings } from "@app/features/settings/components/ProgressiveOverloadSettings";
import { DurationEstimationSettings } from "@app/features/duration";
import { QuickLogSettings } from "@app/features/settings/components/QuickLogSettings";

export class WorkoutChartsSettingTab extends PluginSettingTab {
  plugin: WorkoutChartsPlugin;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // General Settings
    new GeneralSettings(this.app, this.plugin, containerEl).render();

    // Timer Presets Section
    new TimerPresetsSettings(this.plugin, containerEl).render();

    // Custom Protocols Section
    new CustomProtocolsSettings(this.plugin, containerEl).render();

    // Templates Section
    new TemplatesSettings(this.plugin, containerEl).render();

    // Progressive Overload Section
    new ProgressiveOverloadSettings(this.plugin, containerEl).render();

    // Duration Estimation Section
    new DurationEstimationSettings(this.plugin, containerEl).render();

    // Quick Log Section
    new QuickLogSettings(this.plugin, containerEl).render();
  }
}
