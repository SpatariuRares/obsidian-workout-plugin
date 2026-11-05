import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { StringUtils } from "@app/utils/StringUtils";

// Constants
const PATH_MATCH_THRESHOLD = 70; // Minimum score for path matching

export type ExerciseFilterStrategy = "exercise_field" | "none";

export interface MatchResult {
  /** Score of every distinct exercise name in the logs against the query */
  allExercisePathsAndScores: Map<string, number>;
}

/**
 * Utility class for exercise matching operations.
 * Matching uses the exercise field of each log only: every log comes from
 * the same CSV file, so its file name says nothing about the exercise.
 */
export class ExerciseMatchUtils {
  static readonly PATH_MATCH_THRESHOLD = PATH_MATCH_THRESHOLD;

  /**
   * Whether a log's exercise passes the fuzzy threshold for the query.
   */
  static isFuzzyMatch(exercise: string, query: string): boolean {
    return StringUtils.getMatchScore(exercise, query) >= PATH_MATCH_THRESHOLD;
  }

  /**
   * Find exercise matches in log data
   */
  static findExerciseMatches(
    logData: WorkoutLogData[],
    exerciseName: string,
  ): MatchResult {
    const allExercisePathsAndScores = new Map<string, number>();

    for (const log of logData) {
      const exerciseField = log.exercise || "";
      const exerciseScore = StringUtils.getMatchScore(
        exerciseField,
        exerciseName,
      );

      if (exerciseScore > 0) {
        allExercisePathsAndScores.set(exerciseField, exerciseScore);
      }
    }

    return { allExercisePathsAndScores };
  }

  /**
   * Pick the best-scoring exercise name (fuzzy matching; `exactMatch` is
   * handled by DataFilter before it gets here).
   */
  static determineExerciseFilterStrategy(
    allExercisePathsAndScores: Map<string, number>,
  ): {
    bestStrategy: ExerciseFilterStrategy;
    bestPathKey: string;
  } {
    if (allExercisePathsAndScores.size > 0) {
      const [bestPath, bestScore] = Array.from(
        allExercisePathsAndScores.entries(),
      ).reduce((best, entry) => (entry[1] > best[1] ? entry : best));

      if (bestScore >= PATH_MATCH_THRESHOLD) {
        return { bestStrategy: "exercise_field", bestPathKey: bestPath };
      }
    }

    return { bestStrategy: "none", bestPathKey: "" };
  }

  /**
   * Filter log data by exercise using the determined strategy
   */
  static filterLogDataByExercise(
    logData: WorkoutLogData[],
    strategy: ExerciseFilterStrategy,
    pathKey: string,
  ): WorkoutLogData[] {
    if (strategy === "exercise_field") {
      return logData.filter((log) =>
        this.isFuzzyMatch(log.exercise || "", pathKey),
      );
    }
    return [];
  }
}
