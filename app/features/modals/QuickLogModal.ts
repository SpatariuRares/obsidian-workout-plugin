// Quick Log Modal for fast workout logging (mobile-friendly)
import { CONSTANTS } from "@app/constants";
import { ModalBase } from "@app/features/modals/base/ModalBase";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { Button } from "@app/components/atoms";
import { createButtonsSection } from "@app/features/modals/base/utils/createButtonsSection";
import { App, Notice, MarkdownView } from "obsidian";
import WorkoutChartsPlugin from "main";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

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
  private decrementBtn!: HTMLButtonElement;
  private incrementBtn!: HTMLButtonElement;
  private workoutLogData: WorkoutLogData[] = [];

  constructor(app: App, plugin: WorkoutChartsPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;

    // Pre-load workout log data for weight auto-fill
    try {
      this.workoutLogData = await this.plugin.getWorkoutLogData();
    } catch {
      this.workoutLogData = [];
    }

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

    // Weight input with +/- buttons
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
      const chip = Button.create(chipContainer, {
        text: exercise,
        className: "workout-quick-log-chip",
        ariaLabel: exercise,
      });
      chip.type = "button";

      Button.onClick(chip, () => {
        this.selectExercise(exercise);
      });
    });
  }

  /**
   * Handles selecting an exercise from the chips
   */
  private selectExercise(exercise: string): void {
    this.exerciseInput.value = exercise;
    // Auto-fill weight from last entry for this exercise
    this.autoFillWeight(exercise);
    // Move focus to reps input for quick entry
    this.repsInput.focus();
  }

  /**
   * Auto-fills the weight field with the last weight used for the given exercise
   */
  private autoFillWeight(exercise: string): void {
    if (!exercise || this.workoutLogData.length === 0) {
      return;
    }

    // Normalize exercise name for comparison
    const normalizedExercise = exercise.toLowerCase().trim();

    // Find the most recent entry for this exercise (data should be sorted by timestamp)
    // Sort by timestamp descending to get most recent first
    const sortedData = [...this.workoutLogData].sort((a, b) => {
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      return timestampB - timestampA;
    });

    const lastEntry = sortedData.find(
      (log) => log.exercise.toLowerCase().trim() === normalizedExercise
    );

    if (lastEntry && lastEntry.weight >= 0) {
      this.weightInput.value = String(lastEntry.weight);
    }
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

    // Auto-fill weight when exercise value changes (e.g., from autocomplete selection)
    // Use MutationObserver to detect value changes from autocomplete
    const observer = new MutationObserver(() => {
      const exercise = this.exerciseInput.value.trim();
      if (exercise) {
        this.autoFillWeight(exercise);
      }
    });

    // Observe attribute changes (value changes trigger attribute mutation in some cases)
    observer.observe(this.exerciseInput, { attributes: true, attributeFilter: ["value"] });

    // Also listen for change event (triggered on blur after value change)
    this.exerciseInput.addEventListener("change", () => {
      const exercise = this.exerciseInput.value.trim();
      if (exercise) {
        this.autoFillWeight(exercise);
      }
    });

    // Listen for blur to catch autocomplete selections
    this.exerciseInput.addEventListener("blur", () => {
      setTimeout(() => {
        const exercise = this.exerciseInput.value.trim();
        if (exercise && !this.weightInput.value) {
          this.autoFillWeight(exercise);
        }
      }, 250); // Delay to allow autocomplete click handler to complete
    });
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
   * Creates the weight input field with +/- adjustment buttons
   */
  private createWeightField(container: HTMLElement): void {
    const formGroup = this.createFormGroup(container);
    formGroup.addClass("workout-quick-log-field");

    // Create label
    formGroup.createEl("label", {
      text: CONSTANTS.WORKOUT.MODAL.LABELS.WEIGHT,
      cls: "workout-quick-log-label",
    });

    // Create wrapper for buttons and input
    const weightWrapper = formGroup.createEl("div", {
      cls: "workout-frame-toggle",
    });

    const increment = this.plugin.settings.quickWeightIncrement;

    // Decrement button
    this.decrementBtn = Button.create(weightWrapper, {
      text: `-${increment}`,
      className:
        "workout-quick-log-weight-btn workout-quick-log-weight-btn-decrement",
      ariaLabel: `Decrease by ${increment}`,
    });
    this.decrementBtn.type = "button";
    Button.onClick(this.decrementBtn, () => this.adjustWeight(-increment));

    // Weight input
    this.weightInput = weightWrapper.createEl("input", {
      type: "number",
      cls: "workout-quick-log-input workout-quick-log-weight-input",
      placeholder: CONSTANTS.WORKOUT.MODAL.PLACEHOLDERS.WEIGHT,
    });
    this.weightInput.min = "0";
    this.weightInput.step = "0.1";
    this.weightInput.inputMode = "decimal";

    // Increment button
    this.incrementBtn = Button.create(weightWrapper, {
      text: `+${increment}`,
      className:
        "workout-quick-log-weight-btn workout-quick-log-weight-btn-increment",
      ariaLabel: `Increase by ${increment}`,
    });
    this.incrementBtn.type = "button";
    Button.onClick(this.incrementBtn, () => this.adjustWeight(increment));
  }

  /**
   * Adjusts the weight value by the given amount
   * @param amount - The amount to adjust (positive or negative)
   */
  private adjustWeight(amount: number): void {
    const currentWeight = parseFloat(this.weightInput.value) || 0;
    const newWeight = Math.max(0, currentWeight + amount);
    // Round to avoid floating point issues (e.g., 10.5 + 2.5 = 13.0)
    this.weightInput.value = String(Math.round(newWeight * 10) / 10);

  }

  /**
   * Creates the confirm and cancel buttons
   */
  private createConfirmButton(container: HTMLElement): void {
    const buttonContainer = createButtonsSection(container);
    buttonContainer.addClass("workout-quick-log-button-container");
    
    const confirmBtn = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CONFIRM,
      className: "workout-quick-log-confirm-btn workout-btn workout-btn-primary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CONFIRM,
    });
    
    Button.onClick(confirmBtn, () => this.handleConfirm());

    const cancelBtn = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
      className: "workout-quick-log-cancel-btn workout-btn workout-btn-secondary",
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.CANCEL,
    });
    Button.onClick(cancelBtn, () => this.close());
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
