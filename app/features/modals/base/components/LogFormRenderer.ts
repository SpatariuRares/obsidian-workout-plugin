import type WorkoutChartsPlugin from "main";

import { Platform } from "obsidian";
import { LogFormElements } from "@app/types/ModalTypes";
import { ExerciseAutocomplete } from "@app/features/modals/components/ExerciseAutocomplete";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import type { BaseLogModal } from "@app/features/modals/base/BaseLogModal";
import type { RecentExercisesService } from "@app/features/modals/base/services/RecentExercisesService";
import {
  fillDynamicInputsFromCustomFields,
  setupWorkoutToggle,
} from "@app/utils/form/FormUtils";
import { Chip } from "@app/components/atoms";
import { FileSuggest } from "@app/features/common/suggest/FileSuggest";
import { t } from "@app/i18n";
import { CONSTANTS } from "@app/constants";

export class LogFormRenderer {
  constructor(
    private plugin: WorkoutChartsPlugin,
    private dynamicFieldsRenderer: DynamicFieldsRenderer,
    private recentExercisesService: RecentExercisesService,
  ) {}

  /**
   * Creates all form elements with dynamic parameter fields based on exercise type
   */
  async createFormElements(
    modal: BaseLogModal,
    formContainer: HTMLElement,
    initialExerciseName: string | undefined,
    initialCurrentPageLink: string | undefined,
    shouldShowDateField: boolean,
    initialWorkoutToggleState: boolean,
    onExerciseChange: (newParams: ParameterDefinition[]) => void,
    shouldShowWorkoutToggle = true,
  ): Promise<LogFormElements> {
    // Exercise autocomplete using reusable component
    // We pass 'modal' as it requires the ModalBase instance context for suggestions
    const { elements: exerciseElements } = ExerciseAutocomplete.create(
      modal,
      formContainer,
      this.plugin,
      initialExerciseName,
    );

    const isMobile = Platform.isMobile;

    if (!isMobile) {
      this.createRecentExercisesChips(
        formContainer,
        exerciseElements.exerciseInput,
      );
    }

    // Create container for dynamic parameter fields
    const parametersContainer = formContainer.createDiv({
      cls: "workout-parameters-container",
    });

    // Load and render parameters for initial exercise
    const exerciseDefService = this.plugin.getExerciseDefinitionService();
    let parameters: ParameterDefinition[] = [];
    try {
      parameters = await exerciseDefService.getParametersForExercise(
        initialExerciseName || "",
      );
    } catch {
      parameters = await exerciseDefService.getParametersForExercise("");
    }

    // Notify parent about initial parameters
    onExerciseChange(parameters);

    const dynamicFieldInputs = this.dynamicFieldsRenderer.renderDynamicFields(
      parametersContainer,
      parameters,
    );

    // Protocol dropdown
    const builtInProtocols = [
      ...CONSTANTS.WORKOUT.MODAL.SELECT_OPTIONS.PROTOCOL,
    ];
    const customProtocols = this.plugin.settings.customProtocols.map((p) => ({
      text: p.name,
      value: p.id,
    }));
    const allProtocols = [...builtInProtocols, ...customProtocols];

    const protocolSelect = modal.createSelectField(
      formContainer,
      t("modal.protocol"),
      allProtocols,
    );
    protocolSelect.value = WorkoutProtocol.STANDARD;

    // Notes input
    const notesInput = modal.createTextField(
      formContainer,
      t("modal.notes"),
      t("modal.placeholders.notes"),
      "",
    );

    // Optional Date input
    let dateInput: HTMLInputElement | undefined;
    if (shouldShowDateField) {
      dateInput = modal.createTextField(formContainer, "Date", "", "");
      dateInput.type = "date";
    }

    // Mobile Accordion Section
    let workoutSectionParent = formContainer;
    if (isMobile) {
      workoutSectionParent = formContainer.createEl("details", {
        cls: "workout-log-mobile-accordion",
      });
      workoutSectionParent.createEl("summary", {
        text: t("modal.sections.mobileOptions"),
        cls: "workout-log-mobile-summary",
      });

      this.createRecentExercisesChips(
        workoutSectionParent,
        exerciseElements.exerciseInput,
      );
    }

    // Workout section
    const workoutSection = modal.createSection(
      workoutSectionParent,
      t("modal.sections.workout"),
    );

    // Current workout toggle
    let currentWorkoutToggle: HTMLInputElement | undefined;
    if (shouldShowWorkoutToggle) {
      currentWorkoutToggle = modal.createCheckboxField(
        workoutSection,
        t("modal.checkboxes.useCurrentWorkout"),
        initialWorkoutToggleState,
        "currentWorkout",
      );
    }

    // Workout input
    const workoutInput = modal.createTextField(
      workoutSection,
      t("modal.workout"),
      "",
      initialCurrentPageLink || "",
    );

    new FileSuggest(this.plugin.app, workoutInput);

    // Setup behaviors
    if (currentWorkoutToggle) {
      setupWorkoutToggle(
        currentWorkoutToggle,
        workoutInput,
        () => initialCurrentPageLink || "",
      );
    }

    const formElements: LogFormElements = {
      exerciseElements,
      notesInput,
      workoutInput,
      currentWorkoutToggle,
      dateInput,
      protocolSelect,
      dynamicFieldInputs,
      parametersContainer,
    };

    // Setup exercise change listener
    this.setupExerciseChangeListener(
      exerciseElements.exerciseInput,
      parametersContainer,
      formElements,
      onExerciseChange,
      modal.shouldAutoFillFromLastEntry(),
    );

    return formElements;
  }

  /**
   * Creates recent exercise chips for quick selection.
   */
  private createRecentExercisesChips(
    container: HTMLElement,
    exerciseInput: HTMLInputElement,
  ): void {
    const recentExercises =
      this.recentExercisesService.getDisplayRecentExercises();
    if (recentExercises.length === 0) {
      return;
    }

    const chipSection = container.createEl("div", {
      cls: "workout-log-recent-section",
    });
    const exerciseFieldGroup = exerciseInput.closest(
      ".workout-charts-form-group",
    );
    if (exerciseFieldGroup && exerciseFieldGroup.parentElement === container) {
      container.insertBefore(chipSection, exerciseFieldGroup);
    }

    chipSection.createEl("label", {
      text: t("modal.recentExercises"),
      cls: "workout-log-recent-label",
    });

    const chipContainer = chipSection.createEl("div", {
      cls: "workout-log-recent-chips",
    });

    recentExercises.forEach((exercise) => {
      Chip.create(chipContainer, {
        text: exercise,
        className: "workout-log-recent-chip",
        ariaLabel: exercise,
        onClick: () => {
          exerciseInput.value = exercise;
          exerciseInput.dispatchEvent(new Event("change"));
          exerciseInput.focus();
        },
      });
    });
  }

  /**
   * Sets up listener to update fields when exercise changes.
   */
  private setupExerciseChangeListener(
    exerciseInput: HTMLInputElement,
    parametersContainer: HTMLElement,
    formElements: LogFormElements,
    onExerciseChange: (newParams: ParameterDefinition[]) => void,
    shouldAutoFill: boolean,
  ): void {
    const handler = async () => {
      const exerciseName = exerciseInput.value.trim();
      await this.handleExerciseChange(
        exerciseName,
        parametersContainer,
        formElements,
        onExerciseChange,
        shouldAutoFill,
      );
    };

    // Listen for change event (triggered by autocomplete selection)
    exerciseInput.addEventListener("change", () => void handler());

    // Also listen for blur to catch manual typing
    let blurTimeout: ReturnType<typeof setTimeout> | null = null;
    exerciseInput.addEventListener("blur", () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      blurTimeout = setTimeout(() => void handler(), 250);
    });
  }

  /**
   * Handles exercise change: updates fields and auto-fills from last entry.
   */
  private async handleExerciseChange(
    exerciseName: string,
    parametersContainer: HTMLElement,
    formElements: LogFormElements,
    onExerciseChange: (newParams: ParameterDefinition[]) => void,
    shouldAutoFill: boolean,
  ): Promise<void> {
    const exerciseDefService = this.plugin.getExerciseDefinitionService();
    let newParameters: ParameterDefinition[];
    try {
      newParameters =
        await exerciseDefService.getParametersForExercise(exerciseName);
    } catch {
      newParameters = await exerciseDefService.getParametersForExercise("");
    }

    // Preserve existing values
    const preservedValues = new Map<string, string>();
    for (const [key, input] of formElements.dynamicFieldInputs) {
      if (input.value) {
        preservedValues.set(key, input.value);
      }
    }

    // Render new fields
    const newFieldInputs = this.dynamicFieldsRenderer.renderDynamicFields(
      parametersContainer,
      newParameters,
    );
    formElements.dynamicFieldInputs = newFieldInputs;

    // Notify parent
    onExerciseChange(newParameters);

    // Restore preserved values
    for (const [key, value] of preservedValues) {
      const input = newFieldInputs.get(key);
      if (input) {
        input.value = value;
      }
    }

    // Auto-fill from last entry if enabled
    if (shouldAutoFill) {
      await this.autoFillFromLastEntry(exerciseName, formElements);
    }
  }

  private async autoFillFromLastEntry(
    exerciseName: string,
    formElements: LogFormElements,
  ): Promise<void> {
    const lastEntry = await this.plugin.findLastEntryForExercise(exerciseName);
    if (!lastEntry) return;

    // Auto-fill reps and weight
    const repsInput = formElements.dynamicFieldInputs.get("reps");
    if (repsInput && lastEntry.reps > 0) {
      repsInput.value = String(lastEntry.reps);
    }

    const weightInput = formElements.dynamicFieldInputs.get("weight");
    if (weightInput && lastEntry.weight >= 0) {
      weightInput.value = String(lastEntry.weight);
    }

    // Auto-fill custom fields
    fillDynamicInputsFromCustomFields(
      lastEntry.customFields,
      formElements.dynamicFieldInputs,
    );

    // Auto-fill protocol
    if (lastEntry.protocol && formElements.protocolSelect) {
      formElements.protocolSelect.value = lastEntry.protocol;
    }
  }
}
