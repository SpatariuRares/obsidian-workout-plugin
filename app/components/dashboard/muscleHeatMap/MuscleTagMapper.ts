import type WorkoutChartsPlugin from "../../../../main";

/**
 * Maps exercise tags to muscle groups using a predefined mapping
 * and caches exercise tags for performance
 */
export class MuscleTagMapper {
  private static exerciseTagsCache = new Map<string, string[]>();

  // Tag to muscle group mapping
  private static readonly TAG_MUSCLE_MAP: Record<string, string> = {
    // Main muscle groups
    chest: "chest",
    petto: "chest",
    pettorale: "chest",
    pettoralesuperior: "chest",
    pettoraleinferior: "chest",
    pettoralemedio: "chest",
    back: "back",
    schiena: "back",
    dorsale: "back",
    shoulders: "shoulders",
    spalle: "shoulders",
    deltoidi: "shoulders",
    deltoideanteriore: "shoulders",
    deltoidilaterale: "shoulders",
    biceps: "biceps",
    bicipiti: "biceps",
    triceps: "triceps",
    tricipiti: "triceps",
    legs: "quads",
    gambe: "quads",
    quads: "quads",
    quadricipiti: "quads",
    hamstrings: "hamstrings",
    ischiocrurali: "hamstrings",
    femorali: "hamstrings",
    glutes: "glutes",
    glutei: "glutes",
    gluteo: "glutes",
    grandegluteo: "glutes",
    abduttori: "glutes",
    adduttori: "glutes",
    calves: "calves",
    polpacci: "calves",
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
   * Get all unique muscle groups from the mapping
   */
  static getAllMuscleGroups(): Set<string> {
    return new Set(Object.values(this.TAG_MUSCLE_MAP));
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
      const exerciseFolderPath = plugin.settings.exerciseFolderPath;
      if (!exerciseFolderPath) {
        return [];
      }

      // Find the exercise file
      const allFiles = plugin.app.vault.getMarkdownFiles();
      const exerciseFile = allFiles.find((file) => {
        const normalizedFilePath = file.path.replace(/\\/g, "/");
        const fileName = file.basename.toLowerCase();
        const searchName = exerciseName.toLowerCase();

        // Check if this file is in the exercise folder and matches the exercise name
        const isInExerciseFolder = [
          exerciseFolderPath,
          exerciseFolderPath + "/",
          exerciseFolderPath + "/Data",
          exerciseFolderPath + "/Data/",
          "theGYM/" + exerciseFolderPath,
          "theGYM/" + exerciseFolderPath + "/",
          "theGYM/" + exerciseFolderPath + "/Data",
          "theGYM/" + exerciseFolderPath + "/Data/",
        ].some(
          (path) =>
            normalizedFilePath.startsWith(path) ||
            normalizedFilePath.includes(path + "/")
        );

        return (
          isInExerciseFolder &&
          (fileName === searchName ||
            fileName.includes(searchName) ||
            searchName.includes(fileName))
        );
      });

      if (!exerciseFile) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      // Read the file content
      const content = await plugin.app.vault.read(exerciseFile);

      // Parse frontmatter for tags
      const frontmatterMatch = content.match(/^---\s*\n(.*?)\n---/s);
      if (!frontmatterMatch) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      const frontmatter = frontmatterMatch[1];
      const tagsMatch = frontmatter.match(/tags:\s*\n((?:\s*-\s*.+\n?)*)/);

      if (!tagsMatch) {
        this.exerciseTagsCache.set(exerciseName, []);
        return [];
      }

      // Extract tags
      const tags = tagsMatch[1]
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("- "))
        .map((line) => line.substring(2).trim())
        .filter((tag) => tag.length > 0);

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
      const mappedMuscle = this.TAG_MUSCLE_MAP[normalizedTag];

      if (mappedMuscle) {
        muscleGroups.add(mappedMuscle);
      }
    });

    // If no muscle groups found from tags, try exercise name patterns
    if (muscleGroups.size === 0) {
      const exerciseNameLower = exerciseName.toLowerCase();

      // Check exercise name against tag mappings
      Object.entries(this.TAG_MUSCLE_MAP).forEach(([tag, muscle]) => {
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
