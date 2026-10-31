import type {
  LogFormData,
  LogFormElements,
} from "@app/types/ModalTypes";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import { DynamicFieldsRenderer } from "@app/features/modals/base/components/DynamicFieldsRenderer";
import {
  fieldFor,
  readField,
  type FieldValue,
} from "@app/services/exercise/ExerciseFields";

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
  const { fields, ...reading } = readLogFields(
    form.dynamicFieldInputs,
    parameters,
  );
  const workout =
    form.currentWorkoutToggle?.checked && currentFileName
      ? currentFileName
      : form.workoutInput.value.trim();

  return {
    fields,
    data: {
      exercise: form.exerciseElements.exerciseInput.value.trim(),
      ...reading,
      workout,
      notes: form.notesInput.value.trim(),
      date: form.dateInput?.value || undefined,
      protocol:
        form.protocolSelect?.value || WorkoutProtocol.STANDARD,
    },
  };
}

/** Read dynamic fields identically in modal and inline logging. */
export function readLogFields(
  inputs: Map<string, HTMLInputElement>,
  parameters: ParameterDefinition[],
) {
  const fields = new Map<string, string | boolean>();
  const values = new Map<string, FieldValue>();
  for (const [key, input] of inputs) {
    const param = parameters.find((p) => p.key === key) ?? {
      key,
      label: key,
      type: input.type === "checkbox" ? "boolean" : "string",
      required: false,
    };
    const raw =
      param.type === "boolean" ? input.checked : input.value;
    fields.set(key, raw);
    const { value } = readField(fieldFor(param), raw);
    if (value !== undefined) values.set(key, value);
  }

  const customFields: Record<string, FieldValue> = {};
  for (const [key, value] of values) {
    if (key !== "reps" && key !== "weight") customFields[key] = value;
  }

  const weightInput = inputs.get("weight");
  return {
    fields,
    reps: numberOr0(values.get("reps")),
    weight: numberOr0(values.get("weight")),
    weightUnit: weightInput
      ? DynamicFieldsRenderer.getWeightUnit(weightInput)
      : undefined,
    customFields:
      Object.keys(customFields).length > 0 ? customFields : undefined,
  };
}

function numberOr0(value: FieldValue | undefined): number {
  return typeof value === "number" ? value : 0;
}
