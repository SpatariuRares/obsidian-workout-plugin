/**
 * Built-in Exercise Type Definitions
 *
 * This module defines the predefined exercise types available in the plugin.
 * Each type specifies what parameters are tracked when logging exercises.
 */

import type { ExerciseTypeDefinition } from "@app/types/ExerciseTypes";

/**
 * Exercise type IDs for type-safe references.
 */
export const EXERCISE_TYPE_IDS = {
  STRENGTH: "strength",
  TIMED: "timed",
  DISTANCE: "distance",
  CARDIO: "cardio",
  CUSTOM: "custom",
} as const;

/**
 * Strength exercise type: tracks reps and weight.
 * Used for traditional weightlifting exercises like squats, bench press, etc.
 */
const STRENGTH_TYPE: ExerciseTypeDefinition = {
  id: EXERCISE_TYPE_IDS.STRENGTH,
  name: "Strength",
  parameters: [
    {
      key: "reps",
      label: "Reps",
      type: "number",
      required: true,
      default: 0,
      min: 0,
    },
    {
      key: "weight",
      label: "Weight",
      type: "number",
      // Unit is dynamically determined by ParameterUtils based on user settings
      required: true,
      default: 0,
      min: 0,
    },
  ],
};

/**
 * Timed exercise type: tracks duration only.
 * Used for exercises measured by time like planks, wall sits, etc.
 */
const TIMED_TYPE: ExerciseTypeDefinition = {
  id: EXERCISE_TYPE_IDS.TIMED,
  name: "Timed",
  parameters: [
    {
      key: "duration",
      label: "Duration",
      type: "number",
      unit: "sec",
      required: true,
      default: 0,
      min: 0,
    },
  ],
};

/**
 * Distance exercise type: tracks distance with optional duration.
 * Used for exercises like running, cycling, swimming where distance is primary.
 */
const DISTANCE_TYPE: ExerciseTypeDefinition = {
  id: EXERCISE_TYPE_IDS.DISTANCE,
  name: "Distance",
  parameters: [
    {
      key: "distance",
      label: "Distance",
      type: "number",
      unit: "km",
      required: true,
      default: 0,
      min: 0,
    },
    {
      key: "duration",
      label: "Duration",
      type: "number",
      unit: "min",
      required: false,
      min: 0,
    },
  ],
};

/**
 * Cardio exercise type: tracks duration with optional distance and heart rate.
 * Used for cardio sessions like HIIT, rowing, elliptical where time is primary.
 */
const CARDIO_TYPE: ExerciseTypeDefinition = {
  id: EXERCISE_TYPE_IDS.CARDIO,
  name: "Cardio",
  parameters: [
    {
      key: "duration",
      label: "Duration",
      type: "number",
      unit: "min",
      required: true,
      default: 0,
      min: 0,
    },
    {
      key: "distance",
      label: "Distance",
      type: "number",
      unit: "km",
      required: false,
      min: 0,
    },
    {
      key: "heartRate",
      label: "Heart rate",
      type: "number",
      unit: "bpm",
      required: false,
      min: 0,
      max: 250,
    },
  ],
};

/**
 * Custom exercise type: no predefined parameters.
 * Used for exercises where users define their own parameters.
 */
const CUSTOM_TYPE: ExerciseTypeDefinition = {
  id: EXERCISE_TYPE_IDS.CUSTOM,
  name: "Custom",
  parameters: [],
};

/**
 * Array of all built-in exercise type definitions.
 * These are the predefined types available when creating exercises.
 */
export const BUILT_IN_EXERCISE_TYPES: ExerciseTypeDefinition[] = [
  STRENGTH_TYPE,
  TIMED_TYPE,
  DISTANCE_TYPE,
  CARDIO_TYPE,
  CUSTOM_TYPE,
];

/**
 * Retrieves an exercise type definition by its ID.
 *
 * @param id - The exercise type ID to look up
 * @returns The matching ExerciseTypeDefinition or undefined if not found
 *
 * @example
 * const strengthType = getExerciseTypeById("strength");
 * // Returns the strength type definition with reps and weight parameters
 *
 * const unknownType = getExerciseTypeById("unknown");
 * // Returns undefined
 */
export function getExerciseTypeById(
  id: string
): ExerciseTypeDefinition | undefined {
  return BUILT_IN_EXERCISE_TYPES.find((type) => type.id === id);
}

/**
 * The default exercise type ID for backward compatibility.
 * Exercises without an explicit type are treated as strength exercises.
 */
export const DEFAULT_EXERCISE_TYPE_ID = EXERCISE_TYPE_IDS.STRENGTH;
