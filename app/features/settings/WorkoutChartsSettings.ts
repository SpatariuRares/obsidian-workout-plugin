// Settings tab for the Workout Charts plugin
import { App, Plugin, PluginSettingTab } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import { renderSettingDefinitions } from "@app/features/settings/renderSettingDefinitions";
import { t } from "@app/i18n";
import type {
  EventBusPort,
  QuickLogRibbonPort,
  TemplateGeneratorPort,
  TourPort,
  WorkoutPluginContext,
} from "@app/types/PluginPorts";
import { GeneralSettings } from "@app/features/settings/components/GeneralSettings";
import { TimerPresetsSettings } from "@app/features/timer/settings/TimerPresetsSettings";
import { CustomProtocolsSettings } from "@app/features/settings/components/CustomProtocolsSettings";
import { TemplatesSettings } from "@app/features/settings/components/TemplatesSettings";
import { DurationEstimationSettings } from "@app/features/duration/settings/DurationEstimationSettings";
import { QuickLogSettings } from "@app/features/settings/components/QuickLogSettings";
import { MaintenanceSettings } from "@app/features/settings/components/MaintenanceSettings";
import { BetaFeaturesSettings } from "@app/features/settings/components/BetaFeaturesSettings";
import { ExerciseTypesSettings } from "@app/features/settings/components/ExerciseTypesSettings";

/** What the settings sections need from the plugin */
type SettingsTabContext = Plugin &
  WorkoutPluginContext &
  EventBusPort &
  QuickLogRibbonPort &
  TemplateGeneratorPort &
  TourPort;

export class WorkoutChartsSettingTab extends PluginSettingTab {
  plugin: SettingsTabContext;

  private general: GeneralSettings;
  private quickLog: QuickLogSettings;
  private timerPresets: TimerPresetsSettings;
  private customProtocols: CustomProtocolsSettings;
  private exerciseTypes: ExerciseTypesSettings;
  private durationEstimation: DurationEstimationSettings;
  private templates: TemplatesSettings;
  private maintenance: MaintenanceSettings;
  private beta: BetaFeaturesSettings;

  constructor(app: App, plugin: SettingsTabContext) {
    super(app, plugin);
    this.plugin = plugin;

    const refresh = () => this.refresh();
    this.general = new GeneralSettings(app, plugin);
    this.quickLog = new QuickLogSettings(plugin);
    this.timerPresets = new TimerPresetsSettings(
      app,
      plugin,
      refresh,
    );
    this.customProtocols = new CustomProtocolsSettings(
      app,
      plugin,
      refresh,
    );
    this.exerciseTypes = new ExerciseTypesSettings(app, plugin, refresh);
    this.durationEstimation = new DurationEstimationSettings(plugin);
    this.templates = new TemplatesSettings(plugin);
    this.maintenance = new MaintenanceSettings(app, plugin);
    this.beta = new BetaFeaturesSettings(plugin);
    // A type made outside the tab (the create-exercise form): Obsidian 1.13
    // keeps the definitions it read until update(), so the list would miss it
    plugin.eventBus.on("settings:changed", ({ key }) => {
      if (key === "exerciseTypes") refresh();
    });
  }

  /**
   * Every row of every section, in one place. Obsidian 1.13+ draws these
   * itself and indexes them for settings search; it then never calls
   * display(), so no row may exist outside this list.
   */
  getSettingDefinitions(): SettingDefinitionItem[] {
    return this.definitions().map(withoutRenderResult);
  }

  private definitions(): DefinitionItem[] {
    return [
      // Setup & Data (paths, weight unit, CSV management, example data)
      ...this.general.definitions(),
      // Quick log (exact match, ribbon icon, weight increment)
      ...this.quickLog.definitions(),
      ...this.timerPresets.definitions(),
      ...this.customProtocols.definitions(),
      ...this.exerciseTypes.definitions(),
      // Training parameters
      ...this.durationEstimation.definitions(),
      // New features the user opts into
      ...this.beta.definitions(),
      {
        type: "page",
        name: t("settings.sections.advanced"),
        items: [
          ...this.templates.definitions(),
          ...this.maintenance.definitions(),
        ],
      },
    ];
  }

  /** Obsidian before 1.13 only calls display(): draw the same definitions */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    renderSettingDefinitions(containerEl, this.definitions());
  }

  /** Redraw after the list of presets or protocols changed */
  refresh(): void {
    // update() only exists on Obsidian 1.13+
    const { update } = this as { update?: () => void };
    if (typeof update === "function") {
      update.call(this);
    } else {
      this.display();
    }
  }
}

/**
 * Obsidian 1.13 keeps whatever a row's `render` returns as its cleanup and
 * calls it when the row is redrawn or the tab closes; a row written as
 * `(setting) => setting.addToggle(...)` returns the Setting, which then throws
 * "t is not a function". The rows draw only, so nothing is returned.
 */
function withoutRenderResult(item: DefinitionItem): DefinitionItem {
  if ("items" in item) {
    return {
      ...item,
      items: item.items.map(withoutRenderResult),
    } as DefinitionItem;
  }
  if ("render" in item) {
    const render = item.render;
    return {
      ...item,
      render: (setting) => {
        render(setting);
      },
    };
  }
  return item;
}
