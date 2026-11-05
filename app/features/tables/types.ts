import type { BlockParams } from "@app/services/codeblocks/CodeBlockSchema";
import type { tableBlock } from "@app/features/tables/tableBlock";
import { FilterResult } from "@app/types/CommonTypes";
import { CHART_TYPE } from "@app/types/WorkoutConfigTypes";
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
 * Table type for filtering: the chart types a table can have (all but none)
 */
export const TABLE_TYPE = {
  EXERCISE: CHART_TYPE.EXERCISE,
  WORKOUT: CHART_TYPE.WORKOUT,
  COMBINED: CHART_TYPE.COMBINED,
  ALL: CHART_TYPE.ALL,
} as const;
export type TABLE_TYPE = Exclude<CHART_TYPE, CHART_TYPE.NONE>;

