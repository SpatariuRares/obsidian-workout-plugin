import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { EmbeddedTableParams, TableData } from "@app/types";

export interface TableState {
  currentContainer?: HTMLElement;
  currentLogData?: WorkoutLogData[];
  currentParams?: EmbeddedTableParams;
}

export interface TableCallbacks {
  onRefresh?: () => Promise<void>;
  onError?: (_error: Error, _context: string) => void;
  onSuccess?: (_message: string) => void;
  onDebug?: (_component: string, _message: string, _data?: unknown) => void;
}

export interface TableRenderContext {
  container: HTMLElement;
  logData: WorkoutLogData[];
  params: EmbeddedTableParams;
  tableData: TableData;
  callbacks: TableCallbacks;
}
