import { Notice, App } from "obsidian";
import { t } from "@app/i18n";
import type { DefinitionItem } from "@app/features/settings/settingDefinitionTypes";
import {
  TIMER_TYPE,
  TimerPresetConfig,
} from "@app/features/timer/types";
import { TimerPresetEditorModal } from "@app/features/timer/modals/TimerPresetEditorModal";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
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
      {
        type: "group",
        heading: t("settings.sections.timerPresets"),
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
      {
        type: "list",
        heading: t("settings.sections.savedPresets"),
        emptyState: t("settings.descriptions.noPresets"),
        addItem: {
          name: t("settings.buttons.addPreset"),
          action: () => this.showPresetEditor(null),
        },
        onDelete: (index) => this.confirmDelete(presetNames[index]),
        deleteTooltip: t("settings.tooltips.deletePreset"),
        items: presetNames.map((name) => ({
          name: presets[name].name,
          desc: this.formatPresetDetails(presets[name]),
          tooltip: t("settings.tooltips.editPreset"),
          action: () => this.showPresetEditor(presets[name]),
        })),
      },
    ];
  }

  private confirmDelete(name: string | undefined): void {
    if (name === undefined) return;
    new ConfirmModal(
      this.app,
      t("settings.messages.confirmDeletePreset"),
      async () => {
        await this.deletePreset(name);
      },
    ).open();
  }

  private formatPresetDetails(preset: TimerPresetConfig): string {
    const parts: string[] = [];
    parts.push(`Type: ${preset.type}`);
    parts.push(`Duration: ${preset.duration}s`);

    if (preset.type === TIMER_TYPE.INTERVAL && preset.rounds) {
      parts.push(`Rounds: ${preset.rounds}`);
    }
    if (preset.type === TIMER_TYPE.INTERVAL && preset.rest) {
      parts.push(`${t("settings.labels.presetRest")}: ${preset.rest}s`);
    }

    const options: string[] = [];
    if (preset.showControls)
      options.push(t("timer.presets.detailsControls"));
    if (preset.sound) options.push(t("timer.presets.detailsSound"));

    if (options.length > 0) {
      parts.push(`Options: ${options.join(", ")}`);
    }

    return parts.join(" | ");
  }

  private showPresetEditor(
    existingPreset: TimerPresetConfig | null,
  ): void {
    const formState: TimerPresetConfig = existingPreset
      ? { ...existingPreset }
      : {
          name: "",
          type: TIMER_TYPE.COUNTDOWN,
          duration: 30,
          showControls: true,
          sound: true,
          rounds: 5,
        };
    const originalName = existingPreset?.name || null;

    new TimerPresetEditorModal(this.app, formState, !existingPreset, async () => {
      return this.savePreset(formState, originalName);
    }).open();
  }

  private async savePreset(
    preset: TimerPresetConfig,
    originalName: string | null,
  ): Promise<boolean> {
    // Validate name
    if (!preset.name.trim()) {
      new Notice(t("settings.messages.presetNameRequired"));
      return false;
    }

    const trimmedName = preset.name.trim();
    preset.name = trimmedName;

    // Check for duplicate names (unless editing the same preset)
    if (
      originalName !== trimmedName &&
      this.plugin.settings.timerPresets[trimmedName]
    ) {
      new Notice(t("settings.messages.presetNameExists"));
      return false;
    }

    // If renaming, delete the old preset
    if (originalName && originalName !== trimmedName) {
      delete this.plugin.settings.timerPresets[originalName];

      // Update default preset reference if needed
      if (this.plugin.settings.defaultTimerPreset === originalName) {
        this.plugin.settings.defaultTimerPreset = trimmedName;
      }
    }

    // Save the preset
    this.plugin.settings.timerPresets[trimmedName] = preset;
    await this.plugin.saveSettings();

    new Notice(t("settings.messages.presetSaved"));
    this.refresh();
    return true;
  }

  private async deletePreset(name: string): Promise<void> {
    delete this.plugin.settings.timerPresets[name];

    // Clear default if it was this preset
    if (this.plugin.settings.defaultTimerPreset === name) {
      this.plugin.settings.defaultTimerPreset = null;
    }

    await this.plugin.saveSettings();
    new Notice(t("settings.messages.presetDeleted"));

    this.refresh();
  }
}
