/**
 * Types for dynamic exercise type definitions.
 *
 * This module defines the schema for exercise types (Strength, Timed, Distance, etc.)
 * and exercise definitions (individual exercises with their type and parameters).
 */

/**
 * Supported parameter value types for exercise parameters.
 */
export type ParameterValueType = "number" | "string" | "boolean";

/**
 * Defines a single parameter for an exercise type.
 * Parameters describe what data to collect when logging an exercise.
 *
 * @example
 * // Weight parameter for strength exercises
 * {
 *   key: "weight",
 *   label: "Weight",
 *   type: "number",
 *   unit: "kg",
 *   required: true,
 *   default: 0,
 *   min: 0
 * }
 */
export interface ParameterDefinition {
  /** Unique key for the parameter (used in CSV columns and code) */
  key: string;
  /** Display label for the parameter (shown in forms) */
  label: string;
  /** Data type of the parameter value */
  type: ParameterValueType;
  /** Optional unit of measurement (e.g., "kg", "sec", "km") */
  unit?: string;
  /** Whether this parameter is required when logging */
  required: boolean;
  /** Default value when creating a new entry */
  default?: number | string | boolean;
  /** Minimum value (for number type) */
  min?: number;
  /** Maximum value (for number type) */
  max?: number;
}

/**
 * Defines a type of exercise (e.g., Strength, Timed, Distance).
 * Exercise types specify what parameters are tracked when logging.
 *
 * @example
 * // Strength exercise type
 * {
 *   id: "strength",
 *   name: "Strength",
 *   parameters: [
 *     { key: "reps", label: "Reps", type: "number", required: true, min: 1 },
 *     { key: "weight", label: "Weight", type: "number", unit: "kg", required: true, min: 0 }
 *   ]
 * }
 */
export interface ExerciseTypeDefinition {
  /** Unique identifier for the exercise type (lowercase, no spaces) */
  id: string;
  /** Display name for the exercise type */
  name: string;
  /** Parameters to track for this exercise type */
  parameters: ParameterDefinition[];
}

/**
 * Defines an individual exercise (e.g., "Bench Press", "Running").
 * Links an exercise name to its type and optional custom parameters.
 *
 * @example
 * // Standard strength exercise
 * {
 *   name: "Bench Press",
 *   typeId: "strength",
 *   muscleGroups: ["chest", "triceps", "shoulders"]
 * }
 *
 * @example
 * // Custom exercise with additional parameters
 * {
 *   name: "Plank",
 *   typeId: "timed",
 *   muscleGroups: ["core"],
 *   customParameters: [
 *     { key: "variation", label: "Variation", type: "string", required: false }
 *   ]
 * }
 */
export interface ExerciseDefinition {
  /** Name of the exercise (matches exercise page filename) */
  name: string;
  /** ID of the exercise type (references ExerciseTypeDefinition.id) */
  typeId: string;
  /** Optional muscle groups targeted by this exercise */
  muscleGroups?: string[];
  /** Optional additional parameters beyond those defined by the type */
  customParameters?: ParameterDefinition[];
}
