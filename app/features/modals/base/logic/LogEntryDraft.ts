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
    date: localDay(log.date),
    protocol: log.protocol,
    customFields: log.customFields,
  };
}

/**
 * Why the form can't be saved, or null. `fields` holds the raw text of each
 * parameter input the form shows.
 */
export function validate(
  exercise: string,
  fields: Map<string, string>,
  parameters: ParameterDefinition[],
): string | null {
  if (!exercise) return t("modal.notices.validationFillAll");

  for (const param of parameters) {
    if (!param.required) continue;

    const raw = fields.get(param.key);
    if (raw === undefined) {
      return t("modal.notices.validMissingField", { field: param.label });
    }
    const value = raw.trim();

    if (param.type === "number") {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return t("modal.notices.validMustBeNumber", { field: param.label });
      }
      if (param.min !== undefined && num < param.min) {
        return t("modal.notices.validMinValue", {
          field: param.label,
          min: param.min,
        });
      }
      if (param.max !== undefined && num > param.max) {
        return t("modal.notices.validMaxValue", {
          field: param.label,
          max: param.max,
        });
      }
    } else if (param.type === "string" && !value) {
      return t("modal.notices.validFieldRequired", { field: param.label });
    }
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
  if (!pickedDay || pickedDay === localDay(base)) return base;

  const [year, month, day] = pickedDay.split("-").map(Number);
  if (!year || !month || !day) return base;
  const moved = new Date(base);
  // One call, so a 31st doesn't overflow into the next month on the way
  moved.setFullYear(year, month - 1, day);
  return moved.toISOString();
}

/** YYYY-MM-DD of an ISO date in local time */
function localDay(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso.split("T")[0];
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
