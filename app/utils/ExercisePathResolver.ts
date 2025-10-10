import type WorkoutChartsPlugin from "../../main";
import { TFile } from "obsidian";

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
    exerciseFolderPath: string
  ): boolean {
    const normalizedFilePath = this.normalizeFilePath(file.path);
    const pathsToCheck = this.getExerciseFolderPaths(exerciseFolderPath);

    return pathsToCheck.some(
      (path) =>
        normalizedFilePath.startsWith(path) ||
        normalizedFilePath.includes(path + "/")
    );
  }

  /**
   * Find all exercise files in the configured exercise folder
   */
  static findExerciseFiles(plugin: WorkoutChartsPlugin): TFile[] {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      return [];
    }

    const allFiles = plugin.app.vault.getMarkdownFiles();
    return allFiles.filter((file) =>
      this.isInExerciseFolder(file, exerciseFolderPath)
    );
  }

  /**
   * Find a specific exercise file by name
   * Uses fuzzy matching to handle variations in naming
   */
  static findExerciseFile(
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): TFile | undefined {
    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    if (!exerciseFolderPath) {
      return undefined;
    }

    const allFiles = plugin.app.vault.getMarkdownFiles();
    const searchName = exerciseName.toLowerCase();

    return allFiles.find((file) => {
      const normalizedFilePath = this.normalizeFilePath(file.path);
      const fileName = file.basename.toLowerCase();

      // Check if this file is in the exercise folder
      if (!this.isInExerciseFolder(file, exerciseFolderPath)) {
        return false;
      }

      // Match by exact name or fuzzy matching
      return (
        fileName === searchName ||
        fileName.includes(searchName) ||
        searchName.includes(fileName)
      );
    });
  }

  /**
   * Get exercise names from all exercise files
   */
  static getExerciseNames(plugin: WorkoutChartsPlugin): string[] {
    const files = this.findExerciseFiles(plugin);
    return files.map((file) => file.basename).sort();
  }

  /**
   * Debug helper to log path resolution details
   */
  static debugPathResolution(
    plugin: WorkoutChartsPlugin,
    context: string
  ): void {
    if (!plugin.settings.debugMode) {
      return;
    }

    const exerciseFolderPath = plugin.settings.exerciseFolderPath;
    const allFiles = plugin.app.vault.getMarkdownFiles();
    const exerciseFiles = this.findExerciseFiles(plugin);

    console.log(`${context}: Exercise folder path:`, exerciseFolderPath);
    console.log(`${context}: Total markdown files:`, allFiles.length);
    console.log(
      `${context}: Paths to check:`,
      this.getExerciseFolderPaths(exerciseFolderPath || "")
    );
    console.log(`${context}: Filtered exercise files:`, exerciseFiles.length);
    console.log(
      `${context}: Exercise files:`,
      exerciseFiles.map((f) => f.path)
    );
  }
}
