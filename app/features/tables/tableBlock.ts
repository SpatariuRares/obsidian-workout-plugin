import { defineCodeBlock } from "@app/services/codeblocks/CodeBlockSchema";
import { DEFAULT_TABLE_CONFIG } from "@app/constants/defaults.constants";
import { TABLE_SORT_FIELDS } from "@app/features/tables/types";

/** The `workout-log` code block: its parameters, types and defaults */
export const tableBlock = defineCodeBlock("workout-log", {
  /** Written by the insert modal so the block can be edited in place */
  id: { kind: "string" },
  exercise: { kind: "string" },
  workout: { kind: "string" },
  /** Days to look back, including the boundary day; 0 = no limit */
  dateRange: { kind: "number", min: 0 },
  /** Rows shown; unset = `tableRowLimit` (two workouts when `sets` is set) */
  limit: {
    kind: "number",
    min: DEFAULT_TABLE_CONFIG.LIMIT_MIN,
    max: DEFAULT_TABLE_CONFIG.LIMIT_MAX,
  },
  sortBy: { kind: "enum", values: TABLE_SORT_FIELDS, default: "date" },
  sortOrder: { kind: "enum", values: ["asc", "desc"], default: "desc" },
  exactMatch: { kind: "boolean", default: DEFAULT_TABLE_CONFIG.EXACT_MATCH },
  showAddButton: { kind: "boolean", default: true },
  /** Unset: columns follow the exercise type */
  columns: { kind: "list" },
  /** Sets planned for this exercise; the workout-session block counts them */
  sets: { kind: "number", min: 1 },
  targetWeight: { kind: "number", min: 0 },
  targetReps: { kind: "number", min: 0 },
  showProtocol: { kind: "boolean", default: true },
});

/** Workouts a table with planned `sets` shows when it has no `limit` */
const WORKOUTS_SHOWN = 2;

/**
 * The rows a `workout-log` table shows: its `limit`, else the planned sets
 * of the last two workouts, else the default.
 */
export function tableRowLimit(params: { limit?: number; sets?: number }): number {
  if (params.limit !== undefined) return params.limit;
  if (params.sets !== undefined) {
    return Math.min(params.sets * WORKOUTS_SHOWN, DEFAULT_TABLE_CONFIG.LIMIT_MAX);
  }
  return DEFAULT_TABLE_CONFIG.LIMIT;
}
