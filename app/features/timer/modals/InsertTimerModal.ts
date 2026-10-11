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

    // Preset Section (if presets exist) - chips instead of dropdown
    const presetNames = Object.keys(
      this.plugin.settings.timerPresets,
    );
    if (presetNames.length > 0) {
      const presetSection = this.createSection(
        container,
        t("modal.sections.preset"),
      );

      const chipsContainer = presetSection.createDiv({
        cls: "workout-timer-preset-chips",
      });

      for (const name of presetNames) {
        const isDefault =
          name === this.plugin.settings.defaultTimerPreset;
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

    const preset = this.plugin.settings.timerPresets[presetName];
    if (!preset) return;

    // Set timer type via handler (updates chips + visibility)
    this.timerHandlers.setTimerType(preset.type);

    this.timerElements.durationInput.value =
      preset.duration.toString();

    if (preset.rounds) {
      this.timerElements.roundsInput.value = preset.rounds.toString();
    }
    this.timerElements.exerciseInput.value = preset.name;
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
