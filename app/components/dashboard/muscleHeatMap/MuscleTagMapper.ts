import type WorkoutChartsPlugin from "../../../../main";
import { TAG_MUSCLE_MAP, getAllMuscleGroups } from "../../../constants/MuscleTags";
import { ExercisePathResolver } from "../../../utils/ExercisePathResolver";
import { FrontmatterParser } from "../../../utils/FrontmatterParser";

/**
 * Maps exercise tags to muscle groups using a predefined mapping
 * and caches exercise tags for performance
 */
export class MuscleTagMapper {
  private static exerciseTagsCache = new Map<string, string[]>();

  /**
   * Get all unique muscle groups from the mapping
   */
  static getAllMuscleGroups(): Set<string> {
    return getAllMuscleGroups();
  }

  /**
   * Loads exercise tags from the exercise file
   */
  static async loadExerciseTags(
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): Promise<string[]> {
    // Check cache first
    if (this.exerciseTagsCache.has(exerciseName)) {
      return this.exerciseTagsCache.get(exerciseName)!;
    }

    try {
      // Find the exercise file using the path resolver
      const exerciseFile = ExercisePathResolver.findExerciseFile(
        exerciseName,
        plugin
      );

      if (!exerciseFile) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      // Read the file content
      const content = await plugin.app.vault.read(exerciseFile);

      // Parse tags using the frontmatter parser
      const tags = FrontmatterParser.parseTags(content);

      this.exerciseTagsCache.set(exerciseName, tags);
      return tags;
    } catch (error) {
      if (plugin.settings.debugMode) {
        console.error(
          `Error loading exercise tags for "${exerciseName}":`,
          error
        );
      }
      this.exerciseTagsCache.set(exerciseName, []);
      return [];
    }
  }

  /**
   * Maps exercise tags to muscle groups
   */
  static async findMuscleGroupsFromTags(
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): Promise<string[]> {
    const tags = await this.loadExerciseTags(exerciseName, plugin);
    const muscleGroups = new Set<string>();

    // Map tags to muscle groups
    tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      const mappedMuscle = TAG_MUSCLE_MAP[normalizedTag];

      if (mappedMuscle) {
        muscleGroups.add(mappedMuscle);
      }
    });

    // If no muscle groups found from tags, try exercise name patterns
    if (muscleGroups.size === 0) {
      const exerciseNameLower = exerciseName.toLowerCase();

      // Check exercise name against tag mappings
      Object.entries(TAG_MUSCLE_MAP).forEach(([tag, muscle]) => {
        if (
          exerciseNameLower.includes(tag) ||
          tag.includes(exerciseNameLower)
        ) {
          muscleGroups.add(muscle);
        }
      });
    }

    return Array.from(muscleGroups);
  }

  /**
   * Clear the exercise tags cache
   */
  static clearCache(): void {
    this.exerciseTagsCache.clear();
  }
}
