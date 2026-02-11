import { ExerciseAutocompleteElements } from "@app/features/modals/components/ExerciseAutocomplete";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";

export interface LogFormData {
  exercise: string;
  reps?: number; // Optional - only for strength type exercises
  weight?: number; // Optional - only for strength type exercises
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
