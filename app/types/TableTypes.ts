import { WorkoutLogData, FilterResult } from "@app/types";

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
 * Options for generating table code via CodeGenerator
 * Extends EmbeddedTableParams with additional metadata needed for code generation
 */
export enum TableColumnType {
  STANDARD = "standard",
  MINIMAL = "minimal",
}
export enum TABLE_TYPE {
  EXERCISE = "exercise",
  WORKOUT = "workout",
  COMBINED = "combined",
}

export interface TableCodeOptions {
  tableType: TABLE_TYPE;
  exercise: string;
  workout: string;
  limit: number;
  columnsType: TableColumnType;
  showAddButton: boolean;
  buttonText: string;
  searchByName: boolean;
  exactMatch: boolean;
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

export interface TableRenderContext {
  container: HTMLElement;
  logData: WorkoutLogData[];
  params: EmbeddedTableParams;
  tableData: TableData;
  callbacks: TableCallbacks;
}

