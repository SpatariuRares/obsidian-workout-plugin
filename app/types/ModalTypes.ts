import { ExerciseAutocompleteElements } from "@app/features/modals/components/ExerciseAutocomplete";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";

export interface LogFormData {
  exercise: string;
  reps: number;
  weight: number;
  workout: string;
  notes: string;
  date?: string;
  protocol?: WorkoutProtocol;
  customFields?: Record<string, string | number | boolean>;
}

export interface LogFormElements {
  exerciseElements: ExerciseAutocompleteElements;
  repsInput: HTMLInputElement;
  weightInput: HTMLInputElement;
  notesInput: HTMLTextAreaElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
  dateInput?: HTMLInputElement;
  protocolSelect?: HTMLSelectElement;
  dynamicFieldInputs: Map<string, HTMLInputElement>;
  dynamicFieldsContainer?: HTMLElement;
}
