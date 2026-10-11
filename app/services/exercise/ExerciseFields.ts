import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import { t } from "@app/i18n";

export type FieldValue = number | string | boolean;

/**
 * A value a set records (reps, weight, duration, a custom parameter…) with
 * the rules for entering and showing it. See "Field" in CONTEXT.md.
 */
export interface Field extends ParameterDefinition {
  /** Only whole numbers make sense (reps, bpm, seconds) */
  integer: boolean;
  /** Input step */
  step: number;
  /** Amount the quick +/- buttons add (weight adapts to the history instead) */
  increment: number;
}

/** Names a field may be written as (table headers, `columns:`) → its key */
const ALIASES: Record<string, string> = {
  rep: "reps",
  reps: "reps",
  repetitions: "reps",
  wgt: "weight",
  weight: "weight",
  dur: "duration",
  duration: "duration",
  dist: "distance",
  distance: "distance",
  hr: "heartRate",
  heartrate: "heartRate",
  vol: "volume",
  volume: "volume",
  prot: "protocol",
  protocol: "protocol",
  date: "date",
  exercise: "exercise",
  notes: "notes",
  act: "actions",
  actions: "actions",
};

/**
 * The key of a field however it is written: "Rep", "Wgt (kg)", "HR",
 * "heart rate"… Unknown names are custom fields and keep their key.
 */
export function fieldKey(name: string): string {
  const base = name.replace(/\s*\(.*\)\s*$/, "").trim();
  return ALIASES[base.toLowerCase().replace(/[\s_-]+/g, "")] ?? base;
}

export function fieldFor(param: ParameterDefinition): Field {
  const key = fieldKey(param.key);
  const integer =
    key === "reps" ||
    key === "heartRate" ||
    param.unit === "bpm" ||
    (key === "duration" && param.unit === "sec");
  return {
    ...param,
    integer,
    step: integer || key === "duration" ? 1 : key === "weight" ? 0.5 : 0.1,
    increment: incrementFor(key, param.unit),
  };
}

function incrementFor(key: string, unit: string | undefined): number {
  if (key === "duration" && unit === "sec") return 5;
  if (key === "distance" || unit?.includes("km")) return 0.5;
  if (key === "heartRate") return 5;
  return 1;
}

/**
 * Reads what was typed (or ticked) into a field: its value, nothing when an
 * optional field is left empty, or why it can't be saved.
 */
export function readField(
  field: Field,
  raw: string | boolean,
): { value?: FieldValue; error?: string } {
  if (field.type === "boolean") return { value: raw === true };

  const text = String(raw).trim();
  if (!text) {
    if (!field.required) return {};
    return {
      error:
        field.type === "number"
          ? t("modal.notices.validMissingField", { field: field.label })
          : t("modal.notices.validFieldRequired", { field: field.label }),
    };
  }
  if (field.type === "string") return { value: text };

  const num = Number(text);
  if (!Number.isFinite(num)) {
    return { error: t("modal.notices.validMustBeNumber", { field: field.label }) };
  }
  if (field.integer && !Number.isInteger(num)) {
    return {
      error: t("modal.notices.validMustBeWholeNumber", { field: field.label }),
    };
  }
  if (field.min !== undefined && num < field.min) {
    return {
      error: t("modal.notices.validMinValue", { field: field.label, min: field.min }),
    };
  }
  if (field.max !== undefined && num > field.max) {
    return {
      error: t("modal.notices.validMaxValue", { field: field.label, max: field.max }),
    };
  }
  return { value: num };
}

/** A number as a field shows it: rounded for whole-number fields, else ≤2 decimals */
export function formatFieldNumber(field: Field, value: number): string {
  if (field.integer) return String(Math.round(value));
  return String(Math.round(value * 100) / 100);
}

/** A duration in seconds, from a value in the field's unit ("sec", "min", "h") */
export function durationSeconds(unit: string | undefined, value: number): number {
  const u = unit?.trim().toLowerCase();
  if (u === "min" || u === "m") return value * 60;
  if (u === "h" || u === "hr" || u === "hours") return value * 3600;
  return value;
}
