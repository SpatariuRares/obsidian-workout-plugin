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

export interface EmbeddedTableParams {
  id?: string; // Unique identifier for code block replacement
  exercise?: string;
  workout?: string;
  dateRange?: number; // Days to look back, including the boundary day (applied by DataFilter; 0 = no limit)
  limit?: number;
  sortBy?: TableSortField; // default "date"
  sortOrder?: TableSortOrder; // default "desc"
  exactMatch?: boolean;
  showAddButton?: boolean;
  columns?: string[] | string;
  targetWeight?: number;
  targetReps?: number;
  showProtocol?: boolean; // Show protocol column (default: true)
}

export interface TableRow {
  displayRow: string[];
  originalDate: string;
  dateKey: string;
  originalLog?: WorkoutLogData;
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

/**
 * Options for generating table code via CodeGenerator.
 * Extends required fields from EmbeddedTableParams to avoid duplication.
 */
export interface TableCodeOptions
  extends
    Required<
      Pick<
        EmbeddedTableParams,
        | "exercise"
        | "workout"
        | "limit"
        | "showAddButton"
        | "exactMatch"
      >
    >,
    Pick<
      EmbeddedTableParams,
      "dateRange" | "targetWeight" | "targetReps"
    > {
  id: string;
  tableType: TABLE_TYPE;
}
export interface TableCallbacks {
  onError?: (_error: Error, _context: string) => void;
  onSuccess?: (_message: string) => void;
}
