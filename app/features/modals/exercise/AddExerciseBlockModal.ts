import { CONSTANTS } from "@app/constants";
import { t } from "@app/i18n";
import { App } from "obsidian";
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";
import {
  ExerciseAutocomplete,
  ExerciseAutocompleteElements,
} from "@app/features/modals/components/ExerciseAutocomplete";
import type WorkoutChartsPlugin from "main";

export class AddExerciseBlockModal extends BaseInsertModal {
  private exerciseElements?: ExerciseAutocompleteElements;
  private durationInput?: HTMLInputElement;
  private presetSelect?: HTMLSelectElement;
  private workoutInput?: HTMLInputElement;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app, plugin);
  }

  protected getModalTitle(): string {
    return t("modal.titles.addExerciseBlock")
    }

  protected getButtonText(): string {
    return CONSTANTS.WORKOUT.MODAL.BUTTONS.INSERT_EXERCISE_BLOCK;
  }

  protected getSuccessMessage(): string {
    return CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_BLOCK_INSERTED;
  }

  protected createConfigurationSections(container: HTMLElement): void {
    if (!this.plugin) {
      throw new Error("Plugin is required for AddExerciseBlockModal");
    }

    // Exercise selection section with autocomplete
    const exerciseSection = this.createSection(container, "Exercise");
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      this,
      exerciseSection,
      this.plugin
    );
    this.exerciseElements = exerciseElements;

    // Timer configuration section
    const timerSection = this.createSection(container, "Timer");

    // Timer preset dropdown (if presets exist)
    const presetNames = Object.keys(this.plugin.settings.timerPresets);
    if (presetNames.length > 0) {
      const presetOptions = [
        { text: t("settings.options.none"), value: "" },
        ...presetNames.map((name) => ({ text: name, value: name })),
      ];
      this.presetSelect = this.createSelectField(
        timerSection,
        CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_PRESET,
        presetOptions
      );

      // Set default preset if configured
      if (this.plugin.settings.defaultTimerPreset) {
        this.presetSelect.value = this.plugin.settings.defaultTimerPreset;
      }
    }

    // Timer duration input
    this.durationInput = this.createNumberField(timerSection, CONSTANTS.WORKOUT.MODAL.LABELS.TIMER_DURATION, 90, {
      min: 1,
      max: 3600,
      placeholder: "90",
    });

    // Workout file section
    const workoutSection = this.createSection(container, "Workout");

    // Workout file input with current file as default
    const currentFileName = this.getCurrentFileName();
    this.workoutInput = this.createTextField(
      workoutSection,
      CONSTANTS.WORKOUT.MODAL.LABELS.WORKOUT_FILE,
      currentFileName,
      currentFileName
    );
  }

  protected generateCode(): string {
    if (!this.exerciseElements || !this.durationInput || !this.workoutInput || !this.plugin) {
      throw new Error(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_FILL_ALL);
    }

    const exerciseName = this.exerciseElements.exerciseInput.value.trim();
    if (!exerciseName) {
      throw new Error(CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_NAME_REQUIRED);
    }

    const duration = this.durationInput.value || "90";
    const workout = this.workoutInput.value.trim() || this.getCurrentFileName();
    const preset = this.presetSelect?.value || "";

    // Get template from settings
    let template = this.plugin.settings.exerciseBlockTemplate;

    // Replace placeholders
    template = template.replace(/\{\{exercise\}\}/g, exerciseName);
    template = template.replace(/\{\{duration\}\}/g, duration);
    template = template.replace(/\{\{workout\}\}/g, workout);
    template = template.replace(/\{\{preset\}\}/g, preset);

    return template;
  }
}
