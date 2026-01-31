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
 * Muscle names for display and identification.
 * Primarily used in heatmap and body visualization components.
 */
export const MUSCLE_NAMES = {
  TRAP: "Trap",
  TRAP_MID: "TrapMid",
  LATS: "Lats",
  LOWER: "Lower",
  BICIPITI: "Bicipiti",
  TRICIPITI: "Tricipiti",
  AVAMBRACCI: "Avambracci",
  SCHIENA: "Schiena",
  PETTO: "Petto",
  ADDOMINALI: "Addominali",
  OBLIQUI: "Obliqui",
  QUADRICIPITI: "Quadricipiti",
  FEMORALI: "Femorali",
  GLUTEI: "Glutei",
  POLPACCI: "Polpacci",
  SPALLE_ANTERIORI: "Spalle Anteriori",
  SPALLE_LATERALI: "Spalle Laterali",
  SPALLE_POSTERIORI: "Spalle Posteriori",
} as const;

/**
 * Muscle position labels for vertical body positioning.
 * Used in heatmap positioning and body visualization.
 */
export const MUSCLE_POSITIONS = {
  ALTO: "Alto",
  MEDIO: "Medio",
  BASSO: "Basso",
} as const;

/**
 * High-level muscle group categories.
 */
export const MUSCLE_GROUPS = {
  CORE: "Core",
} as const;

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
 * Maps individual muscle tags to their normalized muscle group.
 * Used to categorize exercises consistently regardless of the
 * specific tag variant used. Supports both English and Italian tags.
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

/**
 * Keywords used to identify muscle groups in text.
 * These are used for fuzzy matching and exercise identification.
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
 * Aggregated export for convenient access to all muscle constants.
 * Use this when you need multiple muscle-related constants.
 *
 * @example
 * import { MUSCLES } from '@app/constants/muscles.constants';
 * const { NAMES, TAGS, TAG_MAP } = MUSCLES;
 */
export const MUSCLES = {
  NAMES: MUSCLE_NAMES,
  POSITIONS: MUSCLE_POSITIONS,
  GROUPS: MUSCLE_GROUPS,
  BODY_PARTS: BODY_PARTS,
  TAGS: MUSCLE_TAGS,
  TAG_MAP: MUSCLE_TAG_MAP,
  KEYWORDS: MUSCLE_KEYWORDS,
} as const;
