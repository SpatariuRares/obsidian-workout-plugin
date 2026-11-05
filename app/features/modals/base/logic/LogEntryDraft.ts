// The log form as data: what an existing set looks like in the form, whether
// the form can be saved, and the set it saves. No DOM, no notices, so the
// create and edit modals only bind inputs to it.
import { t } from "@app/i18n";
import {
  WorkoutProtocol,
  type LogEntryInput,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import {
  fieldFor,
  readField,
  type FieldValue,
} from "@app/services/exercise/ExerciseFields";
import { trainingDay } from "@app/services/history/TrainingHistory";

const DEFAULT_ORIGIN = "[[Workout Charts Plugin]]";

/**
 * The form values for an existing set: the weight in the unit it was
 * entered in, and the day the user did it (local time, as the table shows).
 */
export function fromLog(log: WorkoutLogData): Partial<LogFormData> {
  return {
    exercise: log.exercise || "",
    reps: log.reps,
    weight: log.enteredWeight ?? log.weight,
    weightUnit: log.enteredUnit,
    workout: log.workout || "",
    notes: log.notes || "",
    date: trainingDay(log.date),
    protocol: log.protocol,
    customFields: log.customFields,
  };
}

/** What goes on top of the last set when the form starts from it */
export interface PrefillOptions {
  exercise?: string;
  /** The workout the new set belongs to, not the last set's */
  workout?: string;
  targetReps?: number;
  /** In the settings unit */
  targetWeight?: number;
}

/**
 * The form values for a new set that starts from the last one (on a new
 * day: its date is left out), with the given exercise, workout and targets
 * on top. Empty without a last set, but for those.
 */
export function prefillFromLast(
  last: WorkoutLogData | undefined,
  options: PrefillOptions = {},
): Partial<LogFormData> {
  const prefill: Partial<LogFormData> = last ? { ...fromLog(last), date: undefined } : {};
  if (options.exercise !== undefined) prefill.exercise = options.exercise;
  if (options.workout !== undefined) prefill.workout = options.workout;
  if (options.targetReps !== undefined) prefill.reps = options.targetReps;
  if (options.targetWeight !== undefined) {
    prefill.weight = options.targetWeight;
    // Targets are in the settings unit
    prefill.weightUnit = undefined;
  }
  return prefill;
}

/** What a set's fields hold, read: for `validate`, and the set's values */
export interface SetFields {
  /** What each field holds as typed (text, or a checkbox's state) */
  fields: Map<string, string | boolean>;
  reps: number;
  weight: number;
  /** Every field but reps and weight */
  customFields?: Record<string, FieldValue>;
}

/**
 * Reads a set's fields, each with its parameter and what it holds as typed.
 * The log form and the `workout-sets` rows both read their inputs this way.
 */
export function readSetFields(
  entries: Iterable<[ParameterDefinition, string | boolean]>,
): SetFields {
  const fields = new Map<string, string | boolean>();
  const customFields: Record<string, FieldValue> = {};
  let reps = 0;
  let weight = 0;
  for (const [param, raw] of entries) {
    fields.set(param.key, raw);
    const { value } = readField(fieldFor(param), raw);
    if (value === undefined) continue;
    if (param.key === "reps") reps = typeof value === "number" ? value : 0;
    else if (param.key === "weight") weight = typeof value === "number" ? value : 0;
    else customFields[param.key] = value;
  }
  return {
    fields,
    reps,
    weight,
    customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
  };
}

/** Why the form can't be saved, and the field to fix: "exercise" or a parameter key */
export interface FormError {
  field: string;
  message: string;
}

/**
 * Why the form can't be saved, or null. `fields` holds what each parameter
 * input of the form holds (text, or the checked state of a checkbox).
 */
export function validate(
  exercise: string,
  fields: Map<string, string | boolean>,
  parameters: ParameterDefinition[],
): FormError | null {
  if (!exercise) {
    return { field: "exercise", message: t("modal.notices.validChooseExercise") };
  }

  for (const param of parameters) {
    const raw = fields.get(param.key);
    if (raw === undefined) {
      if (!param.required) continue;
      return {
        field: param.key,
        message: t("modal.notices.validMissingField", { field: param.label }),
      };
    }
    const { error } = readField(fieldFor(param), raw);
    if (error) return { field: param.key, message: error };
  }
  return null;
}

export interface ToEntryContext {
  /** The set being edited; absent when logging a new one */
  original?: WorkoutLogData;
  now: Date;
  /** Link to the note the set is logged from */
  pageLink?: string;
}

/**
 * The set the form saves. A new set is dated now. An edited set keeps its
 * exact timestamp unless the user picked another day; then it moves to that
 * day at the same local time.
 */
export function toEntry(
  data: LogFormData,
  { original, now, pageLink }: ToEntryContext,
): LogEntryInput {
  return {
    date: entryDate(data.date, original?.date, now),
    exercise: data.exercise,
    reps: data.reps || 0,
    weight: data.weight || 0,
    weightUnit: data.weightUnit,
    origine: pageLink || DEFAULT_ORIGIN,
    workout: data.workout || undefined,
    notes: data.notes || undefined,
    protocol: data.protocol || WorkoutProtocol.STANDARD,
    customFields: data.customFields,
  };
}

function entryDate(
  pickedDay: string | undefined,
  originalDate: string | undefined,
  now: Date,
): string {
  const base = originalDate ?? now.toISOString();
  if (!pickedDay || pickedDay === trainingDay(base)) return base;

  const [year, month, day] = pickedDay.split("-").map(Number);
  if (!year || !month || !day) return base;
  const moved = new Date(base);
  // One call, so a 31st doesn't overflow into the next month on the way
  moved.setFullYear(year, month - 1, day);
  return moved.toISOString();
}
