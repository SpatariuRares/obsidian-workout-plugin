import { TFile } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { StringUtils } from "@app/utils/StringUtils";

// Constants
const PATH_MATCH_THRESHOLD = 70; // Minimum score for path matching

export interface ExerciseMatch {
  file: TFile;
  score: number;
  exerciseName: string;
  strategy: string;
}

export interface MatchResult {
  fileNameMatches: ExerciseMatch[];
  allExercisePathsAndScores: Map<string, number>;
  bestStrategy: string;
  bestPathKey: string;
}

/**
 * Utility class for exercise matching operations
 * Handles fuzzy matching, filtering strategies, and exercise data filtering
 */
export class ExerciseMatchUtils {
  static readonly PATH_MATCH_THRESHOLD = PATH_MATCH_THRESHOLD;

  /**
   * Calculate match score between two strings
   * Delegates to StringUtils.getMatchScore for centralized string matching logic
   */
  static getMatchScore(str1: string, str2: string): number {
    return StringUtils.getMatchScore(str1, str2);
  }

  /**
   * Find exercise matches in log data
   */
  static findExerciseMatches(
    logData: WorkoutLogData[],
    exerciseName: string
  ): MatchResult {
    const fileNameMatches: ExerciseMatch[] = [];
    const allExercisePathsAndScores = new Map<string, number>();

    for (const log of logData) {
      // Check filename strategy
      const fileName = log.file?.basename || "";
      const fileNameScore = this.getMatchScore(fileName, exerciseName);

      if (fileNameScore > 0 && log.file) {
        fileNameMatches.push({
          file: log.file,
          score: fileNameScore,
          exerciseName: fileName,
          strategy: "filename",
        });
      }

      // Check exercise field strategy
      const exerciseField = log.exercise || "";
      const exerciseScore = this.getMatchScore(exerciseField, exerciseName);

      if (exerciseScore > 0) {
        allExercisePathsAndScores.set(exerciseField, exerciseScore);
      }
    }

    return {
      fileNameMatches,
      allExercisePathsAndScores,
      bestStrategy: "",
      bestPathKey: "",
    };
  }

  /**
   * Determine the best filtering strategy
   */
  static determineExerciseFilterStrategy(
    fileNameMatches: ExerciseMatch[],
    allExercisePathsAndScores: Map<string, number>,
    exactMatch: boolean = false,
    exerciseName: string = ""
  ): {
    bestStrategy: string;
    bestPathKey: string;
    bestFileMatchesList: ExerciseMatch[];
  } {
    let bestStrategy = "none";
    let bestPathKey = "";
    let bestFileMatchesList: ExerciseMatch[] = [];

    // Robust exact match logic
    if (exactMatch && exerciseName) {
      // Prefer exact match on exercise field
      for (const [exerciseField] of allExercisePathsAndScores.entries()) {
        if (
          exerciseField.trim().toLowerCase() === exerciseName.trim().toLowerCase()
        ) {
          return {
            bestStrategy: "exercise_field_exact",
            bestPathKey: exerciseField,
            bestFileMatchesList: [],
          };
        }
      }
      // Fallback: exact match on filename
      const exactFileMatches = fileNameMatches.filter(
        (m) =>
          m.exerciseName.trim().toLowerCase() ===
          exerciseName.trim().toLowerCase()
      );
      if (exactFileMatches.length > 0) {
        return {
          bestStrategy: "filename_exact",
          bestPathKey: "",
          bestFileMatchesList: exactFileMatches,
        };
      }
      // No exact match found
      return {
        bestStrategy: "none",
        bestPathKey: "",
        bestFileMatchesList: [],
      };
    }

    // Check filename strategy
    if (fileNameMatches.length > 0) {
      const bestFileNameMatch = fileNameMatches.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      if (bestFileNameMatch.score >= (exactMatch ? 90 : PATH_MATCH_THRESHOLD)) {
        bestStrategy = "filename";
        bestFileMatchesList = fileNameMatches.filter(
          (match) => match.score >= (exactMatch ? 90 : PATH_MATCH_THRESHOLD)
        );
      }
    }

    // Check exercise field strategy
    if (allExercisePathsAndScores.size > 0) {
      const bestExercisePath = Array.from(
        allExercisePathsAndScores.entries()
      ).reduce((best, [path, score]) => (score > best[1] ? [path, score] : best));

      if (bestExercisePath[1] >= (exactMatch ? 90 : PATH_MATCH_THRESHOLD)) {
        if (
          bestExercisePath[1] >
          (bestFileMatchesList.length > 0 ? bestFileMatchesList[0].score : 0)
        ) {
          bestStrategy = "exercise_field";
          bestPathKey = bestExercisePath[0];
        }
      }
    }

    return { bestStrategy, bestPathKey, bestFileMatchesList };
  }

  /**
   * Filter log data by exercise using the determined strategy
   */
  static filterLogDataByExercise(
    logData: WorkoutLogData[],
    strategy: string,
    pathKey: string,
    fileMatches: ExerciseMatch[]
  ): WorkoutLogData[] {
    if (strategy === "exercise_field_exact") {
      return logData.filter(
        (log) =>
          (log.exercise || "").trim().toLowerCase() ===
          pathKey.trim().toLowerCase()
      );
    }
    if (strategy === "filename_exact") {
      const fileNames = fileMatches.map((m) =>
        m.exerciseName.trim().toLowerCase()
      );
      return logData.filter((log) =>
        fileNames.includes((log.file?.basename || "").trim().toLowerCase())
      );
    }
    if (strategy === "filename") {
      const filePaths = fileMatches.map((match) => match.file.path);
      return logData.filter(
        (log) => log.file && filePaths.includes(log.file.path)
      );
    }
    if (strategy === "exercise_field") {
      return logData.filter((log) => {
        const exerciseField = log.exercise || "";
        return this.getMatchScore(exerciseField, pathKey) >= PATH_MATCH_THRESHOLD;
      });
    }
    return [];
  }
}

 