import type { LogFormData, LogFormElements } from "@app/types/ModalTypes";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { readSetFields } from "@app/features/modals/base/logic/LogEntryDraft";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";

export interface LogFormReading {
  data: LogFormData;
  /** What each parameter input holds (text, or a checkbox's state), for LogEntryDraft.validate */
  fields: Map<string, string | boolean>;
}

/**
 * Reads the log form's inputs, typed by the exercise's parameters. Parsing
 * only: whether the values make a valid set, and what gets saved, is
 * LogEntryDraft's job.
 */
export function readLogForm(
  form: LogFormElements,
  currentFileName: string | undefined,
  parameters: ParameterDefinition[],
): LogFormReading {
  const { fields, reps, weight, customFields } = readSetFields(
    Array.from(form.dynamicFieldInputs, ([key, input]): [ParameterDefinition, string | boolean] => {
      const param = parameters.find((p) => p.key === key) ?? {
        key,
        label: key,
        type: input.type === "checkbox" ? "boolean" : "string",
        required: false,
      };
      return [param, param.type === "boolean" ? input.checked : input.value];
    }),
  );
  const weightInput = form.dynamicFieldInputs.get("weight");
  const workout =
    form.currentWorkoutToggle?.checked && currentFileName
      ? currentFileName
      : form.workoutInput.value.trim();

  return {
    fields,
    data: {
      exercise: form.exerciseElements.exerciseInput.value.trim(),
      reps,
      weight,
      weightUnit: weightInput
        ? DynamicFieldsRenderer.getWeightUnit(weightInput)
        : undefined,
      workout,
      notes: form.notesInput.value.trim(),
      date: form.dateInput?.value || undefined,
      protocol:
        form.protocolSelect?.value || WorkoutProtocol.STANDARD,
      customFields,
    },
  };
}
