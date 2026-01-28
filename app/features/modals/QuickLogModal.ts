// Quick Log Modal for fast workout logging (mobile-friendly)
import { CONSTANTS } from "@app/constants/Constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Button } from "@app/components/atoms";
import { App, Notice, MarkdownView } from "obsidian";
import WorkoutChartsPlugin from "main";

/** Maximum number of recent exercises to store in settings */
const MAX_RECENT_EXERCISES = 10;
/** Number of recent exercises to display as chips */
const DISPLAY_RECENT_COUNT = 5;

/**
 * QuickLogModal - Fast, mobile-friendly workout logging
 *
 * This modal is designed for quick set logging with minimal taps:
 * - Recent exercise chips for quick selection
 * - Exercise autocomplete input
 * - Reps input
 * - Weight input
 * - Large touch targets (44x44px minimum)
 * - Quick confirm button that logs to CSV
 */
export class QuickLogModal extends ModalBase {
  private plugin: WorkoutChartsPlugin;
  private exerciseInput!: HTMLInputElement;
  private repsInput!: HTMLInputElement;
  private weightInput!: HTMLInputElement;

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
    const { contentEl } = this;

    // Add quick-log specific class for styling
    contentEl.addClass("workout-quick-log-modal");

    contentEl.createEl("h2", { text: CONSTANTS.WORKOUT.MODAL.TITLES.QUICK_LOG });

    const mainContainer = this.createStyledMainContainer(contentEl);

    // Recent exercises chips (above exercise input)
    this.createRecentExercisesChips(mainContainer);

    // Exercise input with autocomplete
    this.createExerciseField(mainContainer);

    // Reps input
    this.createRepsField(mainContainer);

    // Weight input
    this.createWeightField(mainContainer);

    // Confirm button (large touch target)
    this.createConfirmButton(mainContainer);
  }

  /**
   * Creates the recent exercises chip buttons
   */
  private createRecentExercisesChips(container: HTMLElement): void {
    const recentExercises = this.plugin.settings.recentExercises || [];

    // Only show if there are recent exercises
    if (recentExercises.length === 0) {
      return;
    }

    const chipSection = container.createEl("div", {
      cls: "workout-quick-log-recent-section",
    });

    chipSection.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.RECENT_EXERCISES,
      cls: "workout-quick-log-recent-label",
    });

    const chipContainer = chipSection.createEl("div", {
      cls: "workout-quick-log-chips-container",
    });

    // Display top 5 recent exercises
    const displayExercises = recentExercises.slice(0, DISPLAY_RECENT_COUNT);

    displayExercises.forEach((exercise) => {
      const chip = chipContainer.createEl("button", {
        text: exercise,
        cls: "workout-quick-log-chip",
      });
      chip.type = "button";

      chip.addEventListener("click", () => {
        this.selectExercise(exercise);
      });
    });
  }

  /**
   * Handles selecting an exercise from the chips
   */
  private selectExercise(exercise: string): void {
    this.exerciseInput.value = exercise;
    // Move focus to reps input for quick entry
    this.repsInput.focus();
  }

  /**
   * Creates the exercise input field with autocomplete
   */
  private createExerciseField(container: HTMLElement): void {
    const { elements } = ExerciseAutocomplete.create(
      this,
      container,
      this.plugin
    );
    this.exerciseInput = elements.exerciseInput;
    this.exerciseInput.addClass("workout-quick-log-input");
  }

  /**
   * Creates the reps input field
   */
  private createRepsField(container: HTMLElement): void {
    const formGroup = this.createFormGroup(container);
    formGroup.addClass("workout-quick-log-field");

    this.repsInput = this.createNumberInput(
      formGroup,
      CONSTANTS.WORKOUT.MODAL.LABELS.REPS,
      "",
      1,
      undefined,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.REPS
    );
    this.repsInput.addClass("workout-quick-log-input");
    this.repsInput.inputMode = "numeric";
  }

  /**
   * Creates the weight input field
   */
  private createWeightField(container: HTMLElement): void {
    const formGroup = this.createFormGroup(container);
    formGroup.addClass("workout-quick-log-field");

    this.weightInput = this.createNumberInput(
      formGroup,
      CONSTANTS.WORKOUT.MODAL.LABELS.WEIGHT,
      "",
      0,
      undefined,
      CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.WEIGHT
    );
    this.weightInput.addClass("workout-quick-log-input");
    this.weightInput.inputMode = "decimal";
  }

  /**
   * Creates the confirm button with large touch target
   */
  private createConfirmButton(container: HTMLElement): void {
    const buttonContainer = container.createEl("div", {
      cls: "workout-quick-log-button-container",
    });

    const confirmBtn = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CONFIRM,
      className: "workout-quick-log-confirm-btn workout-charts-btn workout-charts-btn-primary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CONFIRM,
    });

    Button.onClick(confirmBtn, () => this.handleConfirm());
  }

  /**
   * Handles the confirm button click - validates and logs entry
   */
  private async handleConfirm(): Promise<void> {
    const exercise = this.exerciseInput.value.trim();
    const reps = parseInt(this.repsInput.value);
    const weight = parseFloat(this.weightInput.value);

    // Validation
    if (!exercise) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.EXERCISE_NAME_REQUIRED);
      this.exerciseInput.focus();
      return;
    }

    if (isNaN(reps) || reps <= 0) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_POSITIVE_VALUES);
      this.repsInput.focus();
      return;
    }

    if (isNaN(weight) || weight < 0) {
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.VALIDATION_POSITIVE_VALUES);
      this.weightInput.focus();
      return;
    }

    // Calculate volume
    const volume = reps * weight;

    // Get current workout name from active file (if any)
    const workout = this.getCurrentWorkoutName();

    try {
      // Log entry to CSV
      await this.plugin.addWorkoutLogEntry({
        date: new Date().toISOString(),
        exercise: exercise,
        reps: reps,
        weight: weight,
        volume: volume,
        origine: workout,
        workout: workout,
        notes: "",
      });

      // Update recent exercises list
      await this.updateRecentExercises(exercise);

      // Show success notice
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.LOG_CREATED);

      // Trigger refresh of workout log views
      this.plugin.triggerWorkoutLogRefresh();

      // Close modal
      this.close();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      new Notice(CONSTANTS.WORKOUT.MODAL.NOTICES.LOG_CREATE_ERROR + errorMessage);
    }
  }

  /**
   * Updates the recent exercises list in settings
   * - Adds exercise to front of list (most recent first)
   * - Removes duplicates
   * - Limits to MAX_RECENT_EXERCISES items
   */
  private async updateRecentExercises(exercise: string): Promise<void> {
    const currentRecent = this.plugin.settings.recentExercises || [];

    // Remove exercise if it already exists (to move it to front)
    const filteredRecent = currentRecent.filter(
      (ex) => ex.toLowerCase() !== exercise.toLowerCase()
    );

    // Add to front
    const updatedRecent = [exercise, ...filteredRecent];

    // Limit to max items
    this.plugin.settings.recentExercises = updatedRecent.slice(0, MAX_RECENT_EXERCISES);

    // Save settings
    await this.plugin.saveSettings();
  }

  /**
   * Gets the current workout name from the active file
   */
  private getCurrentWorkoutName(): string {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (activeView?.file) {
      return activeView.file.basename;
    }
    return "";
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
}
