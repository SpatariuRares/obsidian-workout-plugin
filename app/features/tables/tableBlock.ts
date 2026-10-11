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
  limit: {
    kind: "number",
    min: DEFAULT_TABLE_CONFIG.LIMIT_MIN,
    max: DEFAULT_TABLE_CONFIG.LIMIT_MAX,
    default: DEFAULT_TABLE_CONFIG.LIMIT,
  },
  sortBy: { kind: "enum", values: TABLE_SORT_FIELDS, default: "date" },
  sortOrder: { kind: "enum", values: ["asc", "desc"], default: "desc" },
  exactMatch: { kind: "boolean", default: DEFAULT_TABLE_CONFIG.EXACT_MATCH },
  showAddButton: { kind: "boolean", default: true },
  /** Unset: columns follow the exercise type */
  columns: { kind: "list" },
  targetWeight: { kind: "number", min: 0 },
  targetReps: { kind: "number", min: 0 },
  showProtocol: { kind: "boolean", default: true },
});
