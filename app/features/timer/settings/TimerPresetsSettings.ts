import type { App } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import {
  TIMER_TYPE,
  TimerPresetConfig,
} from "@app/features/timer/types";
import { TimerPresetEditorModal } from "@app/features/timer/modals/TimerPresetEditorModal";
import {
  isUnchangedDefaultTimerPreset,
  timerPresetHelp,
  timerPresetSummary,
} from "@app/features/timer/business/timerPresets";
import { settingsListEditor } from "@app/features/settings/settingsListEditor";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

export class TimerPresetsSettings {
  constructor(
    private app: App,
    private plugin: WorkoutPluginContext,
    /** Redraws the settings tab after the preset list changed */
    private refresh: () => void,
  ) {}

  definitions(): DefinitionItem[] {
    const presets = this.plugin.settings.timerPresets;
    const presetNames = Object.keys(presets);

    return [
      {
        type: "group",
        heading: t("settings.sections.timerDeviceCues"),
        items: [
          {
            name: t("settings.labels.keepScreenAwake"),
            desc: t("settings.descriptions.keepScreenAwake"),
            render: (setting) => {
              setting.addToggle((toggle) =>
                toggle
                  .setValue(this.plugin.settings.keepScreenAwake)
                  .onChange(async (value) => {
                    this.plugin.settings.keepScreenAwake = value;
                    await this.plugin.saveSettings();
                  }),
              );
            },
          },
          {
            name: t("settings.labels.vibrateOnCompletion"),
            desc: t("settings.descriptions.vibrateOnCompletion"),
            render: (setting) => {
              setting.addToggle((toggle) =>
                toggle
                  .setValue(this.plugin.settings.vibrateOnCompletion)
                  .onChange(async (value) => {
                    this.plugin.settings.vibrateOnCompletion = value;
                    await this.plugin.saveSettings();
                  }),
              );
            },
          },
        ],
      },
      settingsListEditor<TimerPresetConfig>({
        app: this.app,
        heading: t("settings.sections.timerPresets"),
        emptyState: t("settings.descriptions.noPresets"),
        addLabel: t("settings.buttons.addPreset"),
        editTooltip: t("settings.tooltips.editPreset"),
        deleteTooltip: t("settings.tooltips.deletePreset"),
        items: presetNames.map((name) => presets[name]),
        keyOf: (preset) => preset.name,
        describe: (preset) => ({
          name: preset.name,
          desc: this.formatPresetDetails(preset),
        }),
        blank: () => ({
          name: "",
          type: TIMER_TYPE.COUNTDOWN,
          duration: 30,
          showControls: true,
          sound: true,
          rounds: 5,
        }),
        open: (draft, original, save) =>
          new TimerPresetEditorModal(
            this.app,
            draft,
            !original,
            save,
          ).open(),
        normalize: (preset) => {
          preset.name = preset.name.trim();
        },
        validate: (preset, originalName) => {
          if (!preset.name)
            return t("settings.messages.presetNameRequired");
          return originalName !== preset.name &&
            this.plugin.settings.timerPresets[preset.name]
            ? t("settings.messages.presetNameExists")
            : null;
        },
        upsert: (preset, originalName) =>
          this.upsert(preset, originalName),
        remove: (name) => this.remove(name),
        persist: () => this.plugin.saveSettings(),
        refresh: this.refresh,
        messages: {
          confirmDelete: t("settings.messages.confirmDeletePreset"),
          saved: t("settings.messages.presetSaved"),
          deleted: t("settings.messages.presetDeleted"),
        },
      }),
      // The presets first, under one heading, then which one new timers use
      {
        type: "group",
        items: [
          {
            name: t("settings.labels.defaultTimerPreset"),
            desc: t("settings.descriptions.defaultTimerPreset"),
            render: (setting) => {
              setting.addDropdown((dropdown) => {
                dropdown.addOption("", t("settings.options.none"));
                presetNames.forEach((name) => {
                  dropdown.addOption(name, name);
                });
                dropdown.setValue(
                  this.plugin.settings.defaultTimerPreset || "",
                );
                dropdown.onChange(async (value) => {
                  this.plugin.settings.defaultTimerPreset =
                    value || null;
                  await this.plugin.saveSettings();
                });
              });
            },
          },
        ],
      },
    ];
  }

  private formatPresetDetails(
    preset: TimerPresetConfig,
  ): string | DocumentFragment {
    const details = timerPresetSummary(preset);
    const help = timerPresetHelp(preset.name);
    if (!help || !isUnchangedDefaultTimerPreset(preset))
      return details;

    // What a built-in preset is for, so the default entries explain themselves
    const fragment = createFragment();
    fragment.createDiv({ text: details });
    fragment.createDiv({ text: help });
    return fragment;
  }

  /** Writes `preset`; a rename moves the default preset along with it */
  private upsert(
    preset: TimerPresetConfig,
    originalName: string | null,
  ): void {
    const settings = this.plugin.settings;
    if (originalName && originalName !== preset.name) {
      delete settings.timerPresets[originalName];
      if (settings.defaultTimerPreset === originalName) {
        settings.defaultTimerPreset = preset.name;
      }
    }
    settings.timerPresets[preset.name] = preset;
  }

  /** Deletes the preset, and the default when it was this one */
  private remove(name: string): void {
    const settings = this.plugin.settings;
    delete settings.timerPresets[name];
    if (settings.defaultTimerPreset === name) {
      settings.defaultTimerPreset = null;
    }
  }
}
