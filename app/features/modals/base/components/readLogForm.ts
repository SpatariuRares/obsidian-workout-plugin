import type { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";

export interface LogFormReading {
  data: LogFormData;
  /** Raw text of every parameter input, for LogEntryDraft.validate */
  fields: Map<string, string>;
}

/**
 * Reads the log form's inputs. Parsing only: whether the values make a
 * valid set, and what gets saved, is LogEntryDraft's job.
 */
export function readLogForm(
  form: LogFormElements,
  currentFileName: string | undefined,
): LogFormReading {
  const fields = new Map<string, string>();
  for (const [key, input] of form.dynamicFieldInputs) {
    fields.set(key, input.value);
  }

  const repsInput = form.dynamicFieldInputs.get("reps");
  const weightInput = form.dynamicFieldInputs.get("weight");

  const customFields: Record<string, string | number | boolean> = {};
  for (const [key, input] of form.dynamicFieldInputs) {
    if (key === "reps" || key === "weight") continue;
    const value = input.value.trim();
    if (!value) continue;
    if (input.type === "checkbox") {
      customFields[key] = input.checked;
    } else if (input.type === "number") {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) customFields[key] = parsed;
    } else {
      customFields[key] = value;
    }
  }

  const workout =
    form.currentWorkoutToggle?.checked && currentFileName
      ? currentFileName
      : form.workoutInput.value.trim();

  return {
    fields,
    data: {
      exercise: form.exerciseElements.exerciseInput.value.trim(),
      reps: repsInput ? parseInt(repsInput.value) || 0 : 0,
      weight: weightInput ? parseFloat(weightInput.value) || 0 : 0,
      weightUnit: weightInput
        ? DynamicFieldsRenderer.getWeightUnit(weightInput)
        : undefined,
      workout,
      notes: form.notesInput.value.trim(),
      date: form.dateInput?.value || undefined,
      protocol: (form.protocolSelect?.value ||
        WorkoutProtocol.STANDARD) as WorkoutProtocol,
      customFields:
        Object.keys(customFields).length > 0 ? customFields : undefined,
    },
  };
}
