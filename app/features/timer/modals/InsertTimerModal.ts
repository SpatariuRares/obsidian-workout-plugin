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
import {
  savedDefaultTimerPreset,
  timerPresets,
} from "@app/features/timer/business/timerPresets";
import {
  ChipGroup,
  type ChipOptionalGroupResult,
} from "@app/components/molecules/ChipGroup";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import { t } from "@app/i18n";

export class InsertTimerModal extends BaseInsertModal {
  protected timerElements?: TimerConfigurationElements;
  protected timerHandlers?: TimerConfigurationHandlers;
  /** The presets of the picked type; none picked = no preset */
  protected presetChoice?: ChipOptionalGroupResult;

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
    // EMOM are in it unless the user deleted them), only those of the type
    this.presetChoice = ChipGroup.createOptional(timerElements.presetGroup, {
      label: t("modal.sections.preset"),
      none: t("settings.options.none"),
      options: [],
      onPick: (name) => {
        if (name) this.applyPresetValues(name);
      },
    });
    // The default preset is picked and applied (its type first)
    const picked = savedDefaultTimerPreset(this.plugin.settings);
    if (picked) this.applyPresetValues(picked);
    this.showPresetsFor(timerElements.timerType.value(), picked);
  }

  /** The presets the chips can offer, of any type: the Saved presets list */
  protected offeredPresets(): string[] {
    return this.plugin ? Object.keys(this.plugin.settings.timerPresets) : [];
  }

  /**
   * Offers only the presets of this type (the group hides when there are
   * none); a picked preset of another type is dropped
   */
  protected showPresetsFor(type: TIMER_TYPE, picked?: string): void {
    if (!this.timerElements || !this.plugin || !this.presetChoice) return;
    const presets = timerPresets(this.plugin.settings);
    const names = this.offeredPresets().filter(
      // A preset with no config left has no type to filter by
      (name) => !presets[name] || presets[name].type === type,
    );
    this.presetChoice.setOptions(
      names.map((name) => ({ id: name, label: name })),
      picked,
    );
    this.timerElements.presetGroup.classList.toggle(
      "workout-display-none",
      names.length === 0,
    );
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
    return timerBlock.serialize({ id: generateCodeBlockId(), ...this.collectParams() });
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
      preset: this.presetChoice?.value(),
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
}
