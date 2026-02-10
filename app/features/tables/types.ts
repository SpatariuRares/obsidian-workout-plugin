import { FilterResult } from "@app/types/CommonTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

export interface EmbeddedTableParams {
  exercise?: string;
  workout?: string;
  dateRange?: number; // Days to look back (handled by CodeBlockProcessorService before table render)
  limit?: number;
  exactMatch?: boolean;
  searchByName?: boolean;
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
  extends Required<
    Pick<
      EmbeddedTableParams,
      "exercise" | "workout" | "limit" | "showAddButton" | "searchByName" | "exactMatch"
    >
  >,
  Pick<EmbeddedTableParams, "dateRange" | "targetWeight" | "targetReps"> {
  tableType: TABLE_TYPE;
}
export interface TableCallbacks {
  onError?: (_error: Error, _context: string) => void;
  onSuccess?: (_message: string) => void;
}
