import { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import { ParameterDefinition } from "@app/types/ExerciseTypes";
import { LogFormValidator } from "@app/features/modals/base/logic/LogFormValidator";
import { WorkoutProtocol, CSVWorkoutLogEntry } from "@app/types/WorkoutLogData";

export class LogSubmissionHandler {
  /**
   * Extracts data from the form, validates it, and returns the structured LogFormData.
   * Returns null if validation fails.
   */
  static extractAndValidateData(
    formElements: LogFormElements,
    currentParameters: ParameterDefinition[],
    currentFileName: string | undefined
  ): LogFormData | null {
    // Extract exercise name
    const exercise = formElements.exerciseElements.exerciseInput.value.trim();

    // Validate
    if (
      !LogFormValidator.validateDynamicLogData(
        exercise,
        formElements.dynamicFieldInputs,
        currentParameters
      )
    ) {
      return null;
    }

    // Extract reps/weight (legacy support for CSV columns)
    const repsInput = formElements.dynamicFieldInputs.get("reps");
    const weightInput = formElements.dynamicFieldInputs.get("weight");
    const reps = repsInput ? parseInt(repsInput.value) || 0 : 0;
    const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;

    const notes = formElements.notesInput.value.trim();
    let workout = formElements.workoutInput.value.trim();
    const protocol = (formElements.protocolSelect?.value ||
      WorkoutProtocol.STANDARD) as WorkoutProtocol;

    // Handle current workout toggle
    if (formElements.currentWorkoutToggle.checked && currentFileName) {
      workout = currentFileName;
    }

     // Build customFields
    const customFields: Record<string, string | number | boolean> = {};
    for (const [key, input] of formElements.dynamicFieldInputs) {
      if (key === "reps" || key === "weight") {
        continue; // Skip standard fields
      }

      const value = input.value.trim();
      if (!value) continue; // Skip empty values

      if (input.type === "checkbox") {
        customFields[key] = (input as HTMLInputElement).checked;
      } else if (input.type === "number") {
        const parsed = parseFloat(value);
        if (!isNaN(parsed)) {
          customFields[key] = parsed;
        }
      } else {
        customFields[key] = value;
      }
    }

    return {
      exercise,
      reps,
      weight,
      workout,
      notes,
      date: formElements.dateInput?.value || undefined,
      protocol,
      customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
    };
  }

  /**
   * Helper method to create integration-ready log entry object.
   * Mirrors the deprecated createLogEntryObject from BaseLogModal.
   */
  static createLogEntry(
    data: LogFormData,
    currentPageLink: string | undefined
  ): Omit<CSVWorkoutLogEntry, "timestamp"> {
      return {
          date: data.date || new Date().toISOString(),
          exercise: data.exercise,
          reps: data.reps || 0,
          weight: data.weight || 0,
          volume: (data.reps || 0) * (data.weight || 0),
          origine: currentPageLink || "[[Workout Charts Plugin]]",
          workout: data.workout || undefined,
          notes: data.notes || undefined,
          protocol: data.protocol || WorkoutProtocol.STANDARD,
          customFields: data.customFields,
      };
  }
}
