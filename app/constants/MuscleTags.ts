/**
 * Centralized muscle tags and mappings
 * This file contains all muscle group tags and their mappings to normalized muscle groups
 */

/**
 * All available muscle tags in the system
 * Used for autocomplete, validation, and display
 */
export const MUSCLE_TAGS = [
  // Main muscle groups - Chest
  "chest",
  "petto",
  "pettorale",
  "pettoralesuperior",
  "pettoraleinferior",
  "pettoralemedio",

  // Main muscle groups - Back
  "back",
  "schiena",
  "dorsale",

  // Main muscle groups - Shoulders
  "shoulders",
  "spalle",
  "deltoidi",
  "deltoideanteriore",
  "deltoidilaterale",

  // Main muscle groups - Arms
  "biceps",
  "bicipiti",
  "triceps",
  "tricipiti",

  // Main muscle groups - Legs
  "legs",
  "gambe",
  "quads",
  "quadricipiti",
  "hamstrings",
  "ischiocrurali",
  "femorali",

  // Main muscle groups - Glutes
  "glutes",
  "glutei",
  "gluteo",
  "grandegluteo",
  "abduttori",
  "adduttori",

  // Main muscle groups - Calves
  "calves",
  "polpacci",

  // Main muscle groups - Core
  "abs",
  "addominali",
  "core",
  "cardio",

  // Secondary muscle groups
  "forearms",
  "avambracci",
  "traps",
  "trapezi",
  "rear_delts",
  "deltoidi_posteriori",
  "deltoidiposteriori",

  // Exercise types that help determine muscle groups
  "push",
  "pull",
  "squat",
  "deadlift",
  "press",
  "curl",
  "extension",
  "fly",
  "row",
  "spintaanca",
] as const;

/**
 * Mapping from exercise tags to normalized muscle group names
 * Used by MuscleTagMapper and heat map calculations
 */
export const TAG_MUSCLE_MAP: Record<string, string> = {
  // Main muscle groups - Chest
  chest: "chest",
  petto: "chest",
  pettorale: "chest",
  pettoralesuperior: "chest",
  pettoraleinferior: "chest",
  pettoralemedio: "chest",

  // Main muscle groups - Back
  back: "back",
  schiena: "back",
  dorsale: "back",

  // Main muscle groups - Shoulders
  shoulders: "shoulders",
  spalle: "shoulders",
  deltoidi: "shoulders",
  deltoideanteriore: "shoulders",
  deltoidilaterale: "shoulders",

  // Main muscle groups - Arms
  biceps: "biceps",
  bicipiti: "biceps",
  triceps: "triceps",
  tricipiti: "triceps",

  // Main muscle groups - Legs
  legs: "quads",
  gambe: "quads",
  quads: "quads",
  quadricipiti: "quads",
  hamstrings: "hamstrings",
  ischiocrurali: "hamstrings",
  femorali: "hamstrings",

  // Main muscle groups - Glutes
  glutes: "glutes",
  glutei: "glutes",
  gluteo: "glutes",
  grandegluteo: "glutes",
  abduttori: "glutes",
  adduttori: "glutes",

  // Main muscle groups - Calves
  calves: "calves",
  polpacci: "calves",

  // Main muscle groups - Core
  abs: "abs",
  addominali: "abs",
  core: "core",
  cardio: "core",

  // Secondary muscle groups
  forearms: "forearms",
  avambracci: "forearms",
  traps: "traps",
  trapezi: "traps",
  rear_delts: "rear_delts",
  deltoidi_posteriori: "rear_delts",
  deltoidiposteriori: "rear_delts",

  // Exercise types that help determine muscle groups
  push: "chest",
  pull: "back",
  squat: "quads",
  deadlift: "back",
  press: "shoulders",
  curl: "biceps",
  extension: "triceps",
  fly: "chest",
  row: "back",
  spintaanca: "glutes",
};

/**
 * Muscle keywords used for validation
 * Subset of tags that represent actual muscle groups (not exercise types)
 */
export const MUSCLE_KEYWORDS = [
  // Main muscle groups
  "chest",
  "petto",
  "pettorale",
  "back",
  "schiena",
  "dorsale",
  "shoulders",
  "spalle",
  "deltoidi",
  "biceps",
  "bicipiti",
  "triceps",
  "tricipiti",
  "legs",
  "gambe",
  "quads",
  "quadricipiti",
  "hamstrings",
  "ischiocrurali",
  "femorali",
  "glutes",
  "glutei",
  "gluteo",
  "abduttori",
  "adduttori",
  "calves",
  "polpacci",
  "abs",
  "addominali",
  "core",
  "forearms",
  "avambracci",
  "traps",
  "trapezi",
] as const;

/**
 * Get all unique normalized muscle groups
 */
export function getAllMuscleGroups(): Set<string> {
  return new Set(Object.values(TAG_MUSCLE_MAP));
}

/**
 * Check if a tag is a valid muscle tag
 */
export function isValidMuscleTag(tag: string): boolean {
  const normalizedTag = tag.toLowerCase().trim();
  return MUSCLE_TAGS.includes(normalizedTag as typeof MUSCLE_TAGS[number]);
}

/**
 * Check if a tag represents an actual muscle group (not exercise type)
 */
export function isMuscleKeyword(tag: string): boolean {
  const normalizedTag = tag.toLowerCase().trim();
  return MUSCLE_KEYWORDS.some((keyword) => normalizedTag.includes(keyword));
}

/**
 * Map a tag to its normalized muscle group
 */
export function tagToMuscleGroup(tag: string): string | undefined {
  const normalizedTag = tag.toLowerCase().trim();
  return TAG_MUSCLE_MAP[normalizedTag];
}
