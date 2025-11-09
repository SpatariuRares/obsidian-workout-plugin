import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData } from "@app/types";

export interface TableState {
  currentContainer?: HTMLElement;
  currentLogData?: WorkoutLogData[];
  currentParams?: EmbeddedTableParams;
}

export interface TableCallbacks {
  onRefresh?: () => Promise<void>;
  onError?: (error: Error, context: string) => void;
  onSuccess?: (message: string) => void;
  onDebug?: (component: string, message: string, data?: unknown) => void;
}

export interface TableRenderContext {
  container: HTMLElement;
  logData: WorkoutLogData[];
  params: EmbeddedTableParams;
  tableData: TableData;
  callbacks: TableCallbacks;
}