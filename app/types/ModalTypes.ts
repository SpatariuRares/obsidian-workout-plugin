import { WorkoutProtocol } from "@app/types/WorkoutLogData";
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
  protocol?: WorkoutProtocol;
  customFields?: Record<string, string | number | boolean>;
}

export interface LogFormElements {
  exerciseElements: ExerciseAutocompleteElements;
  notesInput: HTMLInputElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle?: HTMLInputElement;
  dateInput?: HTMLInputElement;
  protocolSelect?: HTMLSelectElement;
  dynamicFieldInputs: Map<string, HTMLInputElement>;
  parametersContainer: HTMLElement; // Container for dynamic parameter fields
}
