import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogFormData } from "@app/types/ModalTypes";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";
import {
  fieldFor,
  fieldKey,
  formatFieldNumber,
  readField,
  type FieldValue,
} from "@app/services/exercise/ExerciseFields";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";
import {
  setValues,
  validate,
  type FormError,
} from "@app/features/modals/base/logic/LogEntryDraft";

/** What the user typed or picked in a row not logged yet */
export interface SetDraft {
  /** Text typed per field key ("true"/"" for a checkbox); missing = untouched */
  values: Record<string, string>;
  /** Picked protocol id; undefined = the row's suggestion */
  protocol?: string;
  notes: string;
}

export function emptyDraft(): SetDraft {
  return { values: {}, notes: "" };
}

/** One row of the sheet */
export interface SetRow {
  /** 1-based */
  number: number;
  /** The set logged today for this row; undefined for a row to fill in */
  logged?: WorkoutLogData;
  /** Grey hint per field key: the same set last time, else the target */
  placeholders: Record<string, string>;
  /** Protocol of the same set last time, when not standard */
  suggestedProtocol?: string;
}

export interface SheetInput {
  /** The fields a set of the exercise records */
  parameters: ParameterDefinition[];
  /** Today's sets of the exercise in this workout, in set order */
  today: WorkoutLogData[];
  /** The sets of the last earlier day the exercise was done, in set order */
  previous: WorkoutLogData[];
  /** Planned sets (the block's `sets`) */
  sets?: number;
  targetReps?: number;
  targetWeight?: number;
  /** Rows to fill in, beyond the plan, the user added */
  extraRows: number;
}

/**
 * The rows the sheet shows: today's sets first (logged), then rows to fill
 * in up to the planned sets (as many as last time without a plan, at least
 * one), plus the ones the user added.
 */
export function setRows(input: SheetInput): SetRow[] {
  const planned = input.sets ?? Math.max(input.previous.length, 1);
  const pending = Math.max(planned - input.today.length, 0) + input.extraRows;
  const total = input.today.length + pending;

  const rows: SetRow[] = [];
  for (let index = 0; index < total; index++) {
    const sameSet = input.previous[index];
    const hint = sameSet ?? input.previous[input.previous.length - 1];
    const suggested = sameSet ? protocolId(sameSet.protocol) : undefined;
    rows.push({
      number: index + 1,
      logged: input.today[index],
      placeholders: placeholdersFor(input, hint),
      suggestedProtocol:
        suggested === protocolId(WorkoutProtocol.STANDARD) ? undefined : suggested,
    });
  }
  return rows;
}

function placeholdersFor(
  input: SheetInput,
  hint: WorkoutLogData | undefined,
): Record<string, string> {
  const placeholders: Record<string, string> = {};
  for (const param of input.parameters) {
    const field = fieldFor(param);
    const key = fieldKey(param.key);
    const value = hint ? loggedValue(hint, key) : targetValue(input, key);
    if (typeof value === "number") {
      placeholders[param.key] = formatFieldNumber(field, value);
    } else if (typeof value === "string" && value !== "") {
      placeholders[param.key] = value;
    }
  }
  return placeholders;
}

/** A field's value in a logged set (weight in the settings unit) */
export function loggedValue(
  set: WorkoutLogData,
  key: string,
): FieldValue | undefined {
  if (key === "reps") return set.reps;
  if (key === "weight") return set.weight;
  const custom = Object.entries(set.customFields ?? {}).find(
    ([name]) => fieldKey(name) === key,
  );
  return custom?.[1];
}

function targetValue(input: SheetInput, key: string): number | undefined {
  if (key === "reps") return input.targetReps;
  if (key === "weight") return input.targetWeight;
  return undefined;
}

/** The protocol a row logs with: the one picked, else its suggestion */
export function rowProtocol(row: SetRow, draft: SetDraft): string {
  return draft.protocol ?? row.suggestedProtocol ?? WorkoutProtocol.STANDARD;
}

export interface RowContext {
  exercise: string;
  workout: string;
  parameters: ParameterDefinition[];
}

/**
 * The set a row logs: each field as typed, or its placeholder when left
 * empty (so ticking an untouched row repeats last time), in the settings
 * unit. An error names the field to fix.
 */
export function rowToFormData(
  row: SetRow,
  draft: SetDraft,
  { exercise, workout, parameters }: RowContext,
): { data: LogFormData } | { error: FormError } {
  const fields = new Map<string, string | boolean>();
  for (const param of parameters) {
    const typed = draft.values[param.key];
    if (param.type === "boolean") {
      fields.set(param.key, typed === "true");
      continue;
    }
    const text = typed?.trim() ? typed.trim() : (row.placeholders[param.key] ?? "");
    fields.set(param.key, text);
  }

  const error = validate(exercise, fields, parameters);
  if (error) return { error };

  const values = new Map<string, FieldValue>();
  for (const param of parameters) {
    const raw = fields.get(param.key);
    if (raw === undefined) continue;
    const { value } = readField(fieldFor(param), raw);
    if (value !== undefined) values.set(param.key, value);
  }

  return {
    data: {
      exercise,
      workout,
      ...setValues(values),
      notes: draft.notes.trim(),
      protocol: rowProtocol(row, draft),
    },
  };
}
