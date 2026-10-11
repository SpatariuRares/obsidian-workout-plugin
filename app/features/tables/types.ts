import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { tableBlock } from "@app/features/tables/tableBlock";
import { FilterResult } from "@app/types/CommonTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

export const TABLE_SORT_FIELDS = [
  "date",
  "exercise",
  "weight",
  "reps",
  "volume",
] as const;
export type TableSortField = (typeof TABLE_SORT_FIELDS)[number];
export type TableSortOrder = "asc" | "desc";

/** Parameters of a `workout-log` block; the schema is in tableBlock.ts */
export type EmbeddedTableParams = BlockParams<typeof tableBlock>;

export interface TableRow {
  displayRow: string[];
  originalDate: string;
  dateKey: string;
  originalLog?: WorkoutLogData;
  /** The set's duration in seconds, read in its exercise's unit */
  durationSeconds?: number;
}

export interface TableData {
  headers: string[];
  rows: TableRow[];
  totalRows: number;
  filterResult: FilterResult;
  params: EmbeddedTableParams;
}

/**
 * Table type for filtering
 */
export enum TABLE_TYPE {
  EXERCISE = "exercise",
  WORKOUT = "workout",
  COMBINED = "combined",
  ALL = "all",
}

export interface TableCallbacks {
  onError?: (_error: Error, _context: string) => void;
  onSuccess?: (_message: string) => void;
}
