// Refactored InsertTimerModal extending BaseInsertModal

import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TimerConfigurationSection,
  TimerConfigurationElements,
  TimerConfigurationHandlers,
  TIMER_TYPE,
} from "@app/features/timer";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { Chip } from "@app/components/atoms/Chip";
import type WorkoutChartsPlugin from "main";
import { t } from "@app/i18n";

export class InsertTimerModal extends BaseInsertModal {
  private timerElements?: TimerConfigurationElements;
  private timerHandlers?: TimerConfigurationHandlers;
  private selectedPreset?: string;
  private presetChips: Map<string, HTMLButtonElement> = new Map();

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.insertTimer");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertTimer");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.timerInserted");
  }

  protected createConfigurationSections(container: HTMLElement): void {
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertTimerModal");
    }

    // Preset Section (if presets exist) - chips instead of dropdown
    const presetNames = Object.keys(this.plugin.settings.timerPresets);
    if (presetNames.length > 0) {
      const presetSection = this.createSection(
        container,
        t("modal.sections.preset"),
      );

      const chipsContainer = presetSection.createDiv({
        cls: "workout-timer-preset-chips",
      });

      for (const name of presetNames) {
        const isDefault = name === this.plugin.settings.defaultTimerPreset;
        const chip = Chip.create(chipsContainer, {
          text: name,
          selected: isDefault,
          className: "workout-log-recent-chip",
          onClick: () => this.onPresetChipClick(name),
        });
        this.presetChips.set(name, chip);
        if (isDefault) {
          this.selectedPreset = name;
        }
      }
    }

    // Timer Configuration Section using reusable component
    const { elements: timerElements, handlers: timerHandlers } =
      TimerConfigurationSection.create(this, container, this.plugin);
    this.timerElements = timerElements;
    this.timerHandlers = timerHandlers;

    // Apply preset values if a default preset is selected
    if (this.selectedPreset) {
      this.applyPresetValues(this.selectedPreset);
    }
  }

  private onPresetChipClick(name: string): void {
    if (this.selectedPreset === name) {
      // Deselect
      this.selectedPreset = undefined;
      for (const [, chip] of this.presetChips) {
        Chip.setSelected(chip, false);
      }
      return;
    }

    // Select new preset
    this.selectedPreset = name;
    for (const [presetName, chip] of this.presetChips) {
      Chip.setSelected(chip, presetName === name);
    }
    this.applyPresetValues(name);
  }

  private applyPresetValues(presetName: string): void {
    if (!this.timerElements || !this.timerHandlers || !this.plugin) return;

    const preset = this.plugin.settings.timerPresets[presetName];
    if (!preset) return;

    // Set timer type via handler (updates chips + visibility)
    this.timerHandlers.setTimerType(preset.type);

    this.timerElements.durationInput.value = preset.duration.toString();

    if (preset.rounds) {
      this.timerElements.roundsInput.value = preset.rounds.toString();
    }
    this.timerElements.exerciseInput.value = preset.name;
    this.timerElements.showControlsToggle.checked = preset.showControls;
    this.timerElements.soundToggle.checked = preset.sound;
  }

  protected generateCode(): string {
    if (!this.timerElements) {
      throw new Error(t("modal.notices.timerElementsNotInitialized"));
    }

    // If a preset is selected, include preset reference in generated code
    const presetName = this.selectedPreset;
    const timerValues = TimerConfigurationSection.getValues(this.timerElements);

    return CodeGenerator.generateTimerCode({
      type: timerValues.type as TIMER_TYPE,
      duration: timerValues.duration,
      rounds: timerValues.rounds,
      exercise: timerValues.exercise,
      showControls: timerValues.showControls,
      sound: timerValues.sound,
      preset: presetName || undefined,
    });
  }
}
