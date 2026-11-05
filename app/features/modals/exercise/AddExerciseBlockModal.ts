import { t } from "@app/i18n";
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import type { ExerciseAutocompleteElements } from "@app/types/ModalTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { ChipGroup } from "@app/components/molecules";
import { StringUtils } from "@app/utils/StringUtils";

export class AddExerciseBlockModal extends BaseInsertModal {
  private exerciseElements?: ExerciseAutocompleteElements;
  private durationInput?: HTMLInputElement;
  /** The picked timer preset; empty = none */
  private selectedPreset = "";
  private workoutInput?: HTMLInputElement;

  constructor(app: App, plugin: WorkoutPluginContext) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.addExerciseBlock");
  }

  protected getButtonText(): string {
    return t("modal.buttons.insertExerciseBlock");
  }

  protected getSuccessMessage(): string {
    return t("modal.notices.exerciseBlockInserted");
  }

  protected createConfigurationSections(
    container: HTMLElement,
  ): void {
    if (!this.plugin) {
      throw new Error("Plugin is required for AddExerciseBlockModal");
    }

    // Exercise selection section with autocomplete
    const exerciseSection = this.createSection(
      container,
      t("modal.sections.exercise"),
    );
    const { elements: exerciseElements } =
      ExerciseAutocomplete.create(this, exerciseSection, this.plugin, undefined, { showCreateButton: false });
    this.exerciseElements = exerciseElements;

    // Timer configuration section
    const timerSection = this.createSection(
      container,
      t("modal.sections.timer"),
    );

    // Saved presets as chips, like the timer insert modal (the default one picked)
    const presetNames = Object.keys(this.plugin.settings.timerPresets);
    if (presetNames.length > 0) {
      const defaultPreset = this.plugin.settings.defaultTimerPreset;
      this.selectedPreset =
        defaultPreset && presetNames.includes(defaultPreset)
          ? defaultPreset
          : "";
      ChipGroup.create(timerSection, {
        label: t("modal.timerPreset"),
        options: [
          { id: "", label: t("settings.options.none") },
          ...presetNames.map((name) => ({ id: name, label: name })),
        ],
        selected: this.selectedPreset,
        onPick: (id) => {
          this.selectedPreset = id;
        },
      });
    }

    // Timer duration input
    this.durationInput = this.createNumberField(
      timerSection,
      t("modal.timerDuration"),
      90,
      {
        min: 1,
        max: 3600,
        placeholder: "90",
      },
    );

    // Workout file section
    const workoutSection = this.createSection(
      container,
      t("modal.sections.workout"),
    );

    // Workout file input with current file as default
    const currentFileName = this.getCurrentFileName();
    this.workoutInput = this.createTextField(
      workoutSection,
      t("modal.workoutFile"),
      currentFileName,
      currentFileName,
    );
  }

  protected generateCode(): string {
    if (
      !this.exerciseElements ||
      !this.durationInput ||
      !this.workoutInput ||
      !this.plugin
    ) {
      throw new Error(t("modal.notices.validationFillAll"));
    }

    const exerciseName =
      this.exerciseElements.exerciseInput.value.trim();
    if (!exerciseName) {
      throw new Error(t("modal.notices.exerciseNameRequired"));
    }

    const duration = this.durationInput.value || "90";
    const workout =
      this.workoutInput.value.trim() || this.getCurrentFileName();
    return StringUtils.fillTemplate(
      this.plugin.settings.exerciseBlockTemplate,
      {
        exercise: exerciseName,
        duration,
        workout,
        preset: this.selectedPreset,
      },
    );
  }
}
