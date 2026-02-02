// Refactored InsertTimerModal extending BaseInsertModal
import { CONSTANTS } from "@app/constants";
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TimerConfigurationSection,
  TimerConfigurationElements,
} from "@app/features/modals/components/TimerConfigurationSection";
import { CodeGenerator } from "@app/features/modals/components/CodeGenerator";
import { TIMER_TYPE } from "@app/types";
import type WorkoutChartsPlugin from "main";

export class InsertTimerModal extends BaseInsertModal {
  private timerElements?: TimerConfigurationElements;
  private presetSelect?: HTMLSelectElement;
  private usePresetOnlyCheckbox?: HTMLInputElement;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return CONSTANTS.WORKOUT.MODAL.TITLES.INSERT_TIMER;
  }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_TIMER;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.TIMER_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertTimerModal");
    }

    // Preset Section (if presets exist)
    const presetNames = Object.keys(this.plugin.settings.timerPresets);
    if (presetNames.length > 0) {
      const presetSection = this.createSection(container, CONSTANTS.WORKOUT.MODAL.SECTIONS.PRESET);

      // Preset dropdown
      const presetOptions = [
        { text: CONSTANTS.WORKOUT.SETTINGS.OPTIONS.NONE, value: "" },
        ...presetNames.map((name) => ({ text: name, value: name })),
      ];
      this.presetSelect = this.createSelectField(
        presetSection,
        CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_PRESET,
        presetOptions
      );

      // Set default preset if configured
      if (this.plugin.settings.defaultTimerPreset) {
        this.presetSelect.value = this.plugin.settings.defaultTimerPreset;
      }

      // Use preset only checkbox
      const usePresetOnlyContainer = this.createCheckboxGroup(presetSection);
      this.usePresetOnlyCheckbox = this.createCheckbox(
        usePresetOnlyContainer,
        CONSTANTS.WORKOUT.MODAL.CHECKBOXES.USE_PRESET_ONLY,
        false,
        "usePresetOnly"
      );

      // When preset is selected, populate form fields with preset values
      this.presetSelect.addEventListener("change", () => this.onPresetChange());
    }

    // Timer Configuration Section using reusable component
    const { elements: timerElements } = TimerConfigurationSection.create(
      this,
      container
    );
    this.timerElements = timerElements;

    // Apply preset values if a default preset is selected
    if (this.presetSelect?.value) {
      this.onPresetChange();
    }
  }

  private onPresetChange(): void {
    if (!this.presetSelect || !this.timerElements || !this.plugin) return;

    const presetName = this.presetSelect.value;
    if (!presetName) return;

    const preset = this.plugin.settings.timerPresets[presetName];
    if (!preset) return;

    // Populate form fields with preset values
    this.timerElements.timerTypeSelect.value = preset.type;
    this.timerElements.timerTypeSelect.dispatchEvent(new Event("change")); // Trigger visibility update

    if (this.timerElements.durationInput) {
      this.timerElements.durationInput.value = preset.duration.toString();
    }
    if (this.timerElements.roundsInput && preset.rounds) {
      this.timerElements.roundsInput.value = preset.rounds.toString();
    }
    this.timerElements.titleInput.value = preset.name;
    this.timerElements.showControlsToggle.checked = preset.showControls;
    this.timerElements.autoStartToggle.checked = preset.autoStart;
    this.timerElements.soundToggle.checked = preset.sound;
  }

  protected generateCode(): string {
    if (!this.timerElements) {
      throw new Error(CONSTANTS.WORKOUT.MODAL.NOTICES.TIMER_ELEMENTS_NOT_INITIALIZED);
    }

    // If using preset only, generate minimal code with just preset reference
    const presetName = this.presetSelect?.value;
    if (presetName && this.usePresetOnlyCheckbox?.checked) {
      return CodeGenerator.generateTimerCode({
        preset: presetName,
      });
    }

    const timerValues = TimerConfigurationSection.getValues(this.timerElements);

    return CodeGenerator.generateTimerCode({
      type: timerValues.type as TIMER_TYPE,
      duration: timerValues.duration,
      rounds: timerValues.rounds,
      title: timerValues.title,
      showControls: timerValues.showControls,
      autoStart: timerValues.autoStart,
      sound: timerValues.sound,
      preset: presetName || undefined,
    });
  }
}
