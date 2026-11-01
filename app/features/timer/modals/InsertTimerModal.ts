// Refactored InsertTimerModal extending BaseInsertModal

import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  TimerConfigurationSection,
  TimerConfigurationElements,
  TimerConfigurationHandlers,
} from "@app/features/timer/modals/components/TimerConfigurationSection";
import {
  TIMER_TYPE,
  type EmbeddedTimerParams,
} from "@app/features/timer/types";
import { timerBlock } from "@app/features/timer/timerBlock";
import { timerPresets } from "@app/features/timer/business/timerPresets";
import { Chip } from "@app/components/atoms/Chip";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

export class InsertTimerModal extends BaseInsertModal {
  protected timerElements?: TimerConfigurationElements;
  protected timerHandlers?: TimerConfigurationHandlers;
  protected selectedPreset?: string;
  protected presetChips: Map<string, HTMLButtonElement> = new Map();

  constructor(app: App, plugin: WorkoutPluginContext) {
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

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    if (!this.plugin) {
      throw new Error("Plugin is required for InsertTimerModal");
    }

    const { elements: timerElements, handlers: timerHandlers } =
      TimerConfigurationSection.create(this, container, this.plugin, (type) =>
        this.showPresetsFor(type),
      );
    this.timerElements = timerElements;
    this.timerHandlers = timerHandlers;

    // Preset chips under the timer type: the Saved presets list (Tabata and
    // EMOM are in it unless the user deleted them)
    for (const name of Object.keys(this.plugin.settings.timerPresets)) {
      const isDefault = name === this.plugin.settings.defaultTimerPreset;
      const chip = Chip.create(timerElements.presetChipsContainer, {
        text: name,
        selected: isDefault,
        onClick: () => this.onPresetChipClick(name),
      });
      this.presetChips.set(name, chip);
      if (isDefault) {
        this.selectedPreset = name;
      }
    }

    // Apply preset values if a default preset is selected
    if (this.selectedPreset) {
      this.applyPresetValues(this.selectedPreset);
    }
    this.showPresetsFor(timerElements.selectedTimerType);
  }

  /** Show only the presets of this type; a selected preset of another type is dropped */
  private showPresetsFor(type: TIMER_TYPE): void {
    if (!this.timerElements || !this.plugin) return;
    const presets = timerPresets(this.plugin.settings);
    let anyShown = false;
    for (const [name, chip] of this.presetChips) {
      const shown = presets[name]?.type === type;
      chip.classList.toggle("workout-display-none", !shown);
      anyShown ||= shown;
    }
    this.timerElements.presetGroup.classList.toggle(
      "workout-display-none",
      !anyShown,
    );
    if (this.selectedPreset && presets[this.selectedPreset]?.type !== type) {
      this.selectedPreset = undefined;
      for (const [, chip] of this.presetChips) {
        Chip.setSelected(chip, false);
      }
    }
  }

  protected onPresetChipClick(name: string): void {
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

  protected applyPresetValues(presetName: string): void {
    if (!this.timerElements || !this.timerHandlers || !this.plugin)
      return;

    const preset = timerPresets(this.plugin.settings)[presetName];
    if (!preset) return;

    // Set timer type via handler (updates chips + visibility)
    this.timerHandlers.setTimerType(preset.type);

    this.timerElements.durationInput.value =
      preset.duration.toString();

    if (preset.rounds) {
      this.timerElements.roundsInput.value = preset.rounds.toString();
    }
    this.timerElements.restInput.value = String(preset.rest ?? 0);
    this.timerElements.showControlsToggle.checked =
      preset.showControls;
    this.timerElements.soundToggle.checked = preset.sound;
  }

  protected generateCode(): string {
    return timerBlock.serialize(this.collectParams());
  }

  /**
   * The block parameters the form sets. Controls and sound are always
   * written, since a preset may set them the other way.
   */
  protected collectParams(): EmbeddedTimerParams {
    if (!this.timerElements) {
      throw new Error(t("modal.notices.timerElementsNotInitialized"));
    }

    const values = TimerConfigurationSection.getValues(this.timerElements);
    const type = values.type as TIMER_TYPE;

    return {
      id: this.getCodeBlockId(),
      preset: this.selectedPreset || undefined,
      type,
      duration: values.duration || undefined,
      work: values.work,
      rest: values.rest,
      rounds:
        type === TIMER_TYPE.INTERVAL && values.rounds
          ? values.rounds
          : undefined,
      exercise: values.exercise || undefined,
      showControls: values.showControls,
      sound: values.sound,
    };
  }

  /**
   * Generates a unique ID for the code block.
   * Subclasses can override to preserve an existing ID.
   */
  protected getCodeBlockId(): string {
    return generateCodeBlockId();
  }
}
