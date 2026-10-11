import { TFile } from "obsidian";
import type { AppPort } from "@app/types/PluginPorts";

type ExercisePathContext = AppPort & { settings: { exerciseFolderPath: string } };

/**
 * Utility for resolving exercise file paths
 * Centralizes the logic for finding exercise files in various folder structures
 */
export class ExercisePathResolver {
  /**
   * Generate all possible paths for the exercise folder
   * Handles various configurations and path patterns
   */
  static getExerciseFolderPaths(basePath: string): string[] {
    return [
      basePath,
      basePath + "/",
      basePath + "/Data",
      basePath + "/Data/",
      "theGYM/" + basePath,
      "theGYM/" + basePath + "/",
      "theGYM/" + basePath + "/Data",
      "theGYM/" + basePath + "/Data/",
    ];
  }

  /**
   * Normalize file path for consistent comparison
   */
  static normalizeFilePath(filePath: string): string {
    return filePath.replace(/\\/g, "/");
  }

  /**
   * Check if a file is in the exercise folder
   */
  static isInExerciseFolder(
    file: TFile,
    exerciseFolderPath: string,
  ): boolean {
    const normalizedFilePath = this.normalizeFilePath(file.path);
    const pathsToCheck = this.getExerciseFolderPaths(
      exerciseFolderPath,
    );

    return pathsToCheck.some(
      (path) =>
        normalizedFilePath.startsWith(path) ||
        normalizedFilePath.includes(path + "/"),
    );
  }

  /**
   * Find all exercise files in the configured exercise folder
   */
  static findExerciseFiles(plugin: ExercisePathContext): TFile[] {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      return [];
    }

    const allFiles = plugin.app.vault.getMarkdownFiles();
    return allFiles.filter((file) =>
      this.isInExerciseFolder(file, exerciseFolderPath),
    );
  }

  /**
   * Find a specific exercise file by name: the exact name first, then a
   * note whose name contains it or is contained in it
   */
  static findExerciseFile(
    exerciseName: string,
    plugin: ExercisePathContext,
  ): TFile | undefined {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      return undefined;
    }

    const searchName = exerciseName.toLowerCase();
    const candidates = plugin.app.vault
      .getMarkdownFiles()
      .filter((file) => this.isInExerciseFolder(file, exerciseFolderPath));

    // An exact name wins over a note whose name only contains it
    // ("Squat" must not pick "Front squat")
    return (
      candidates.find((file) => file.basename.toLowerCase() === searchName) ??
      candidates.find((file) => {
        const fileName = file.basename.toLowerCase();
        return (
          fileName.includes(searchName) || searchName.includes(fileName)
        );
      })
    );
  }

  /**
   * Get exercise names from all exercise files
   */
  static getExerciseNames(plugin: ExercisePathContext): string[] {
    const files = this.findExerciseFiles(plugin);
    return files.map((file) => file.basename).sort();
  }
}
