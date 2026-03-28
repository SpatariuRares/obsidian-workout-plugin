import type { WorkoutLogData, WorkoutChartsSettings } from "@app/types/WorkoutLogData";

// ---- Normalizzazione ----

/**
 * Normalizza un nome esercizio per confronti case-insensitive e whitespace-agnostic.
 * "Squat " → "squat"
 * "bench  press" → "bench press"
 */
export function normalizeExercise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ---- Context e Payload ----

export interface LogEventContext {
  exercise: string;
  workout?: string;
}

export interface LogAddedPayload {
  entry: WorkoutLogData;
  context: LogEventContext;
}

export interface LogUpdatedPayload {
  previous: WorkoutLogData;
  updated: WorkoutLogData;
}

export interface LogDeletedPayload {
  entry: WorkoutLogData;
  context: LogEventContext;
}

export interface LogBulkChangedPayload {
  count: number;
  operation: 'import' | 'rename' | 'bulk-delete' | 'other';
}

export interface MuscleTagsChangedPayload {
  // Intenzionalmente vuoto: il cambio è sempre globale
}

export interface SettingsChangedPayload {
  key: keyof WorkoutChartsSettings;
  previousValue: unknown;
  newValue: unknown;
}

export interface PluginErrorPayload {
  source: string;
  error: Error;
  recoverable: boolean;
}

// ---- Discriminated Union ----

export type WorkoutEvent =
  | { type: 'log:added';           payload: LogAddedPayload }
  | { type: 'log:updated';         payload: LogUpdatedPayload }
  | { type: 'log:deleted';         payload: LogDeletedPayload }
  | { type: 'log:bulk-changed';    payload: LogBulkChangedPayload }
  | { type: 'muscle-tags:changed'; payload: MuscleTagsChangedPayload }
  | { type: 'settings:changed';    payload: SettingsChangedPayload }
  | { type: 'plugin:error';        payload: PluginErrorPayload }

export type WorkoutEventType = WorkoutEvent['type'];

/** Estrae il payload di un tipo specifico (utile nei test) */
export type WorkoutEventPayload<T extends WorkoutEventType> =
  Extract<WorkoutEvent, { type: T }>['payload'];
