import { FilterResult } from "@app/types/CommonTypes";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

export interface EmbeddedTableParams {
  exercise?: string;
  exercisePath?: string;
  workout?: string;
  workoutPath?: string;
  dateRange?: number; // Days to look back for filtering
  limit?: number;
  exactMatch?: boolean;
  searchByName?: boolean;
  showAddButton?: boolean;
  buttonText?: string;
  columns?: string[] | string;
  targetWeight?: number;
  targetReps?: number;
  showProtocol?: boolean; // Show protocol column (default: true)
  protocol?: string | string[]; // Filter by protocol (single value or array)
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
 * Options for generating table code via CodeGenerator
 */
export interface TableCodeOptions {
  tableType: TABLE_TYPE;
  exercise: string;
  workout: string;
  limit: number;
  showAddButton: boolean;
  buttonText: string;
  searchByName: boolean;
  exactMatch: boolean;
  dateRange?: number;
  targetWeight?: number;
  targetReps?: number;
}
export interface TableState {
  currentContainer?: HTMLElement;
  currentLogData?: WorkoutLogData[];
  currentParams?: EmbeddedTableParams;
}

export interface TableCallbacks {
  onRefresh?: () => Promise<void>;
  onError?: (_error: Error, _context: string) => void;
  onSuccess?: (_message: string) => void;
}
