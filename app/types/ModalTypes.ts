import { ExerciseAutocompleteElements } from "@app/features/modals/components/ExerciseAutocomplete";

export interface LogFormData {
  exercise: string;
  reps: number;
  weight: number;
  workout: string;
  notes: string;
  date?: string;
}

export interface LogFormElements {
  exerciseElements: ExerciseAutocompleteElements;
  repsInput: HTMLInputElement;
  weightInput: HTMLInputElement;
  notesInput: HTMLTextAreaElement;
  workoutInput: HTMLInputElement;
  currentWorkoutToggle: HTMLInputElement;
  dateInput?: HTMLInputElement;
}
