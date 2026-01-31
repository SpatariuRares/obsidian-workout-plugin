import { CONSTANTS } from "@app/constants";

/**
 * Get all unique normalized muscle groups
 */
export function getAllMuscleGroups(): Set<string> {
  return new Set(Object.values(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP));
}

/**
 * Check if a tag is a valid muscle tag
 */
export function isValidMuscleTag(tag: string): boolean {
  const normalizedTag = tag.toLowerCase().trim();
  return CONSTANTS.WORKOUT.MUSCLES.TAGS.includes(normalizedTag as typeof CONSTANTS.WORKOUT.MUSCLES.TAGS[number]);
}

/**
 * Check if a tag represents an actual muscle group (not exercise type)
 */
export function isMuscleKeyword(tag: string): boolean {
  const normalizedTag = tag.toLowerCase().trim();
  return CONSTANTS.WORKOUT.MUSCLES.KEYWORDS.some((keyword) => normalizedTag.includes(keyword));
}

/**
 * Map a tag to its normalized muscle group
 */
export function tagToMuscleGroup(tag: string): string | undefined {
  const normalizedTag = tag.toLowerCase().trim();
  return CONSTANTS.WORKOUT.MUSCLES.TAG_MAP[normalizedTag];
}
