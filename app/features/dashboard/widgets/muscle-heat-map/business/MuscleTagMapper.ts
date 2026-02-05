import type WorkoutChartsPlugin from "main";
import { ExercisePathResolver } from "@app/utils/exercise/ExercisePathResolver";
import { FrontmatterParser } from "@app/utils/frontmatter/FrontmatterParser";
import { getAllMuscleGroups, CONSTANTS } from "@app/constants";
import { DataFilter } from "@app/services/data/DataFilter";

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
   * Gets the current muscle tag map.
   * Uses custom tags from MuscleTagService via DataFilter if available,
   * otherwise falls back to default MUSCLE_TAG_MAP.
   * @returns Map of tag to muscle group
   */
  private static getTagMap(): Map<string, string> {
    const customTagMap = DataFilter.getTagMap();
    if (customTagMap) {
      return customTagMap;
    }
    // Fallback to default constants
    return new Map(Object.entries(CONSTANTS.WORKOUT.MUSCLES.TAG_MAP));
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
    } catch {
      // Silent fail - error loading exercise tags
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
    const tagMap = this.getTagMap();

    // Map tags to muscle groups
    tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase().trim();
      const mappedMuscle = tagMap.get(normalizedTag);

      if (mappedMuscle) {
        muscleGroups.add(mappedMuscle);
      }
    });

    // If no muscle groups found from tags, try exercise name patterns
    if (muscleGroups.size === 0) {
      const exerciseNameLower = exerciseName.toLowerCase();

      // Check exercise name against tag mappings
      tagMap.forEach((muscle, tag) => {
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

