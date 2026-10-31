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

/** Side of the body a muscle is on, for front/back balance ("both": counted on neither) */
export type BodySide = "front" | "back" | "both";

/**
 * Every muscle group tags can map to: one entry per muscle. A specific
 * muscle names the broad group it belongs to (`parent`): the heat map draws
 * it in its own zone, while a broad tag (e.g. "chest") is spread over all of
 * that group's zones. Adding a muscle = an entry here, a zone in
 * HEAT_MAP_ZONES and a `data-muscle` group in BodyViewSvg.
 */
export const MUSCLE_GROUPS = [
  { id: "chest", side: "front" },
  { id: "back", side: "back" },
  { id: "shoulders", side: "both" },
  { id: "biceps", side: "front" },
  { id: "triceps", side: "back" },
  { id: "quads", side: "front" },
  { id: "hamstrings", side: "back" },
  { id: "glutes", side: "back" },
  { id: "calves", side: "back" },
  { id: "abs", side: "front" },
  { id: "core", side: "front" },
  { id: "forearms", side: "both" },
  { id: "traps", side: "back" },
  { id: "rear_delts", parent: "shoulders", side: "back" },
  { id: "upper_chest", parent: "chest", side: "front" },
  { id: "mid_chest", parent: "chest", side: "front" },
  { id: "lower_chest", parent: "chest", side: "front" },
  { id: "front_delts", parent: "shoulders", side: "front" },
  { id: "side_delts", parent: "shoulders", side: "both" },
  { id: "lats", parent: "back", side: "back" },
  { id: "rhomboids", parent: "back", side: "back" },
  { id: "lower_back", parent: "back", side: "back" },
  { id: "obliques", parent: "core", side: "front" },
  { id: "serratus", parent: "core", side: "front" },
] as const satisfies readonly {
  id: string;
  parent?: string;
  side: BodySide;
}[];

export type CanonicalMuscleGroup = (typeof MUSCLE_GROUPS)[number]["id"];

/** Ids of every muscle group, in MUSCLE_GROUPS order */
export const CANONICAL_MUSCLE_GROUPS: readonly CanonicalMuscleGroup[] =
  MUSCLE_GROUPS.map((group) => group.id);

/** Specific muscles and the broad group they belong to (from MUSCLE_GROUPS) */
export const MUSCLE_PARENT_GROUPS: Partial<
  Record<CanonicalMuscleGroup, CanonicalMuscleGroup>
> = Object.fromEntries(
  MUSCLE_GROUPS.flatMap((group) =>
    "parent" in group ? [[group.id, group.parent]] : [],
  ),
);

/**
 * Body part regions for exercise categorization.
 */
export const BODY_PARTS = {
  UPPER_BODY: "Upper body",
} as const;

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
  { tag: "pettoralesuperior", muscleGroup: "upper_chest", language: "it" },
  { tag: "pettoraleinferior", muscleGroup: "lower_chest", language: "it" },
  { tag: "pettoralemedio", muscleGroup: "mid_chest", language: "it" },

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
  {
    tag: "deltoideanteriore",
    muscleGroup: "front_delts",
    language: "it",
  },
  {
    tag: "deltoidilaterale",
    muscleGroup: "side_delts",
    language: "it",
  },

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
  {
    tag: "deltoidi_posteriori",
    muscleGroup: "rear_delts",
    language: "it",
  },
  {
    tag: "deltoidiposteriori",
    muscleGroup: "rear_delts",
    language: "it",
  },

  // Specific muscles (English)
  { tag: "upper_chest", muscleGroup: "upper_chest", language: "en" },
  { tag: "mid_chest", muscleGroup: "mid_chest", language: "en" },
  { tag: "lower_chest", muscleGroup: "lower_chest", language: "en" },
  { tag: "front_delts", muscleGroup: "front_delts", language: "en" },
  { tag: "side_delts", muscleGroup: "side_delts", language: "en" },
  { tag: "lats", muscleGroup: "lats", language: "en" },
  { tag: "rhomboids", muscleGroup: "rhomboids", language: "en" },
  { tag: "lower_back", muscleGroup: "lower_back", language: "en" },
  { tag: "ql", muscleGroup: "lower_back", language: "en" },
  { tag: "obliques", muscleGroup: "obliques", language: "en" },
  { tag: "serratus", muscleGroup: "serratus", language: "en" },

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
 * Every default tag name, derived from MUSCLE_TAG_ENTRIES.
 */
export const MUSCLE_TAGS: readonly string[] = [
  ...new Set(MUSCLE_TAG_ENTRIES.map((entry) => entry.tag)),
];

/**
 * Default tag -> muscle group map (all languages), derived from
 * MUSCLE_TAG_ENTRIES. Used when the user has no muscle-tags.csv.
 * Returns a new object on every call.
 */
export function defaultTagMap(): Record<string, string> {
  return Object.fromEntries(
    MUSCLE_TAG_ENTRIES.map((entry) => [entry.tag, entry.muscleGroup]),
  );
}

/**
 * @deprecated Use defaultTagMap(), or MUSCLE_TAG_ENTRIES for language-aware tag handling
 */
export const MUSCLE_TAG_MAP: Record<string, string> = defaultTagMap();
