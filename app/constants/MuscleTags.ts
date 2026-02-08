import { CANONICAL_MUSCLE_GROUPS, CONSTANTS } from "@app/constants";

/**
 * Get all unique normalized muscle groups
 */
export function getAllMuscleGroups(): Set<string> {
  return new Set<string>(CANONICAL_MUSCLE_GROUPS);
}

/**
 * Check if a tag is a valid muscle tag
 */
export function isValidMuscleTag(tag: string): boolean {
  const normalizedTag = tag.toLowerCase().trim();
  return CONSTANTS.WORKOUT.MUSCLES.TAGS.includes(normalizedTag as typeof CONSTANTS.WORKOUT.MUSCLES.TAGS[number]);
}
