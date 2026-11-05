import type { ProtocolId } from "@app/types/WorkoutLogData";
import type { WeightUnit } from "@app/utils/WeightUnitUtils";

export interface ExerciseAutocompleteElements {
  exerciseInput: HTMLInputElement;
  autocompleteContainer: HTMLElement;
}

export interface LogFormData {
  exercise: string;
  reps?: number; // Optional - only for strength type exercises
  weight?: number; // Optional - only for strength type exercises
  /** Unit picked next to the weight field; undefined means the settings unit */
  weightUnit?: WeightUnit;
  workout: string;
  notes: string;
  date?: string;
  protocol?: ProtocolId;
  customFields?: Record<string, string | number | boolean>;
}

/** The protocol picked in the log form's chips */
export interface ProtocolChoice {
  readonly value: string;
  /** Picks it, adding a chip for a protocol no longer in the settings */
  set(id: string): void;
}

export interface LogFormElements {
  exerciseElements: ExerciseAutocompleteElements;
  notesInput: HTMLInputElement | HTMLTextAreaElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle?: HTMLInputElement;
  dateInput?: HTMLInputElement;
  protocol?: ProtocolChoice;
  dynamicFieldInputs: Map<string, HTMLInputElement>;
  parametersContainer: HTMLElement; // Container for dynamic parameter fields
}
