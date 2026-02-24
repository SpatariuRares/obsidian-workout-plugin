/**
 * @fileoverview Muscle-related constants for the Workout Planner plugin.
 *
 * This file contains all muscle group definitions, tag mappings, and
 * body part constants used throughout the plugin for:
 * - Muscle heatmaps and visualization
 * - Exercise categorization and filtering
 * - Tag normalization and mapping
 *
 * @module muscles.constants
 */

/**
 * Canonical muscle groups for tag mapping.
 * These are the normalized muscle group names that tags can map to.
 */
export const CANONICAL_MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "abs",
  "core",
  "forearms",
  "traps",
  "rear_delts",
] as const;

export type CanonicalMuscleGroup = (typeof CANONICAL_MUSCLE_GROUPS)[number];

/**
 * Body part regions for exercise categorization.
 */
export const BODY_PARTS = {
  UPPER_BODY: "Upper body",
} as const;

/**
 * All recognized muscle tags that can be used in exercise frontmatter.
 * Includes both English and Italian variants for bilingual support.
 * Tags are organized by muscle group for clarity.
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
 * Extended muscle tag entry with language information
 */
export interface MuscleTagEntry {
  tag: string;
  muscleGroup: string;
  language: string;
}

/**
 * Default muscle tag entries with language information.
 * Used as fallback when CSV doesn't exist.
 * Includes both English (en) and Italian (it) tags.
 */
export const MUSCLE_TAG_ENTRIES: MuscleTagEntry[] = [
  // Main muscle groups - Chest (English)
  { tag: "chest", muscleGroup: "chest", language: "en" },
  // Main muscle groups - Chest (Italian)
  { tag: "petto", muscleGroup: "chest", language: "it" },
  { tag: "pettorale", muscleGroup: "chest", language: "it" },
  { tag: "pettoralesuperior", muscleGroup: "chest", language: "it" },
  { tag: "pettoraleinferior", muscleGroup: "chest", language: "it" },
  { tag: "pettoralemedio", muscleGroup: "chest", language: "it" },

  // Main muscle groups - Back (English)
  { tag: "back", muscleGroup: "back", language: "en" },
  // Main muscle groups - Back (Italian)
  { tag: "schiena", muscleGroup: "back", language: "it" },
  { tag: "dorsale", muscleGroup: "back", language: "it" },

  // Main muscle groups - Shoulders (English)
  { tag: "shoulders", muscleGroup: "shoulders", language: "en" },
  // Main muscle groups - Shoulders (Italian)
  { tag: "spalle", muscleGroup: "shoulders", language: "it" },
  { tag: "deltoidi", muscleGroup: "shoulders", language: "it" },
  { tag: "deltoideanteriore", muscleGroup: "shoulders", language: "it" },
  { tag: "deltoidilaterale", muscleGroup: "shoulders", language: "it" },

  // Main muscle groups - Arms (English)
  { tag: "biceps", muscleGroup: "biceps", language: "en" },
  { tag: "triceps", muscleGroup: "triceps", language: "en" },
  // Main muscle groups - Arms (Italian)
  { tag: "bicipiti", muscleGroup: "biceps", language: "it" },
  { tag: "tricipiti", muscleGroup: "triceps", language: "it" },

  // Main muscle groups - Legs (English)
  { tag: "legs", muscleGroup: "quads", language: "en" },
  { tag: "quads", muscleGroup: "quads", language: "en" },
  { tag: "hamstrings", muscleGroup: "hamstrings", language: "en" },
  // Main muscle groups - Legs (Italian)
  { tag: "gambe", muscleGroup: "quads", language: "it" },
  { tag: "quadricipiti", muscleGroup: "quads", language: "it" },
  { tag: "ischiocrurali", muscleGroup: "hamstrings", language: "it" },
  { tag: "femorali", muscleGroup: "hamstrings", language: "it" },

  // Main muscle groups - Glutes (English)
  { tag: "glutes", muscleGroup: "glutes", language: "en" },
  // Main muscle groups - Glutes (Italian)
  { tag: "glutei", muscleGroup: "glutes", language: "it" },
  { tag: "gluteo", muscleGroup: "glutes", language: "it" },
  { tag: "grandegluteo", muscleGroup: "glutes", language: "it" },
  { tag: "abduttori", muscleGroup: "glutes", language: "it" },
  { tag: "adduttori", muscleGroup: "glutes", language: "it" },

  // Main muscle groups - Calves (English)
  { tag: "calves", muscleGroup: "calves", language: "en" },
  // Main muscle groups - Calves (Italian)
  { tag: "polpacci", muscleGroup: "calves", language: "it" },

  // Main muscle groups - Core (English)
  { tag: "abs", muscleGroup: "abs", language: "en" },
  { tag: "core", muscleGroup: "core", language: "en" },
  { tag: "cardio", muscleGroup: "core", language: "en" },
  // Main muscle groups - Core (Italian)
  { tag: "addominali", muscleGroup: "abs", language: "it" },

  // Secondary muscle groups (English)
  { tag: "forearms", muscleGroup: "forearms", language: "en" },
  { tag: "traps", muscleGroup: "traps", language: "en" },
  { tag: "rear_delts", muscleGroup: "rear_delts", language: "en" },
  // Secondary muscle groups (Italian)
  { tag: "avambracci", muscleGroup: "forearms", language: "it" },
  { tag: "trapezi", muscleGroup: "traps", language: "it" },
  { tag: "deltoidi_posteriori", muscleGroup: "rear_delts", language: "it" },
  { tag: "deltoidiposteriori", muscleGroup: "rear_delts", language: "it" },

  // Exercise types that help determine muscle groups (English)
  { tag: "push", muscleGroup: "chest", language: "en" },
  { tag: "pull", muscleGroup: "back", language: "en" },
  { tag: "squat", muscleGroup: "quads", language: "en" },
  { tag: "deadlift", muscleGroup: "back", language: "en" },
  { tag: "press", muscleGroup: "shoulders", language: "en" },
  { tag: "curl", muscleGroup: "biceps", language: "en" },
  { tag: "extension", muscleGroup: "triceps", language: "en" },
  { tag: "fly", muscleGroup: "chest", language: "en" },
  { tag: "row", muscleGroup: "back", language: "en" },
  // Exercise types (Italian)
  { tag: "spintaanca", muscleGroup: "glutes", language: "it" },
];

/**
 * Maps individual muscle tags to their normalized muscle group.
 * Used to categorize exercises consistently regardless of the
 * specific tag variant used. Supports both English and Italian tags.
 *
 * @deprecated Use MUSCLE_TAG_ENTRIES for language-aware tag handling
 */
export const MUSCLE_TAG_MAP: Record<string, string> = {
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

