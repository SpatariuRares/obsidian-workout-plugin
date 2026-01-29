import { CONSTANTS } from "@app/constants";
import { TFile } from "obsidian";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import {
  ChartDataset,
  CHART_DATA_TYPE,
  CHART_TYPE,
  EmbeddedViewParams,
} from "@app/types";

// Constants
const PATH_MATCH_THRESHOLD = 70; // Minimum score for path matching

// ===================== UTILITY FUNCTIONS =====================

/**
 * Helper to set multiple CSS properties on an element
 */
export function setCssProps(
  element: HTMLElement,
  props: Partial<CSSStyleDeclaration> | Record<string, string>,
) {
  Object.assign(element.style, props);
}

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
 * Calculate match score between two strings
 */
export function getMatchScore(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;
  if (s1.startsWith(s2) || s2.startsWith(s1)) return 90;
  if (s1.endsWith(s2) || s2.endsWith(s1)) return 80;

  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  // Check if all words from one string are contained in the other
  const allWords1In2 = words1.every((word) => s2.includes(word));
  const allWords2In1 = words2.every((word) => s1.includes(word));

  if (allWords1In2 || allWords2In1) return 70;

  // Check for partial word matches
  const commonWords = words1.filter((word) => words2.includes(word));
  if (commonWords.length > 0) return 60;

  // Check for substring match
  if (s1.includes(s2) || s2.includes(s1)) return 50;

  return 0;
}

/**
 * Find exercise matches in log data
 */
export function findExerciseMatches(
  logData: WorkoutLogData[],
  exerciseName: string,
): MatchResult {
  const fileNameMatches: ExerciseMatch[] = [];
  const allExercisePathsAndScores = new Map<string, number>();

  for (const log of logData) {
    // Check filename strategy
    const fileName = log.file?.basename || "";
    const fileNameScore = getMatchScore(fileName, exerciseName);

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
    const exerciseScore = getMatchScore(exerciseField, exerciseName);

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
export function determineExerciseFilterStrategy(
  fileNameMatches: ExerciseMatch[],
  allExercisePathsAndScores: Map<string, number>,
  exactMatch: boolean = false,
  exerciseName: string = "",
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
        exerciseName.trim().toLowerCase(),
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
      current.score > best.score ? current : best,
    );

    if (bestFileNameMatch.score >= (exactMatch ? 90 : PATH_MATCH_THRESHOLD)) {
      bestStrategy = "filename";
      bestFileMatchesList = fileNameMatches.filter(
        (match) => match.score >= (exactMatch ? 90 : PATH_MATCH_THRESHOLD),
      );
    }
  }

  // Check exercise field strategy
  if (allExercisePathsAndScores.size > 0) {
    const bestExercisePath = Array.from(
      allExercisePathsAndScores.entries(),
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
export function filterLogDataByExercise(
  logData: WorkoutLogData[],
  strategy: string,
  pathKey: string,
  fileMatches: ExerciseMatch[],
): WorkoutLogData[] {
  if (strategy === "exercise_field_exact") {
    return logData.filter(
      (log) =>
        (log.exercise || "").trim().toLowerCase() ===
        pathKey.trim().toLowerCase(),
    );
  }
  if (strategy === "filename_exact") {
    const fileNames = fileMatches.map((m) =>
      m.exerciseName.trim().toLowerCase(),
    );
    return logData.filter((log) =>
      fileNames.includes((log.file?.basename || "").trim().toLowerCase()),
    );
  }
  if (strategy === "filename") {
    const filePaths = fileMatches.map((match) => match.file.path);
    return logData.filter(
      (log) => log.file && filePaths.includes(log.file.path),
    );
  }
  if (strategy === "exercise_field") {
    return logData.filter((log) => {
      const exerciseField = log.exercise || "";
      return getMatchScore(exerciseField, pathKey) >= PATH_MATCH_THRESHOLD;
    });
  }
  return [];
}

/**
 * CORREZIONE 1: Modifica della funzione processChartData in app/utils/utils.ts
 * Extended to support dynamic exercise types (timed, distance, cardio, custom)
 */
export function processChartData(
  logData: WorkoutLogData[],
  chartType: CHART_DATA_TYPE,
  dateRange: number = 30,
  dateFormat: string = "DD/MM/YYYY",
  // ✨ NUOVO PARAMETRO per distinguere tra workout totale e singolo esercizio
  displayType: CHART_TYPE = CHART_TYPE.EXERCISE,
): { labels: string[]; datasets: ChartDataset[] } {
  // Filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);

  const filteredData = logData.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= cutoffDate;
  });

  // Sort by date
  filteredData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Group by date and calculate values
  // Extended to include duration, distance, heartRate from customFields
  const dateGroups = new Map<
    string,
    {
      volume: number;
      weight: number;
      reps: number;
      duration: number;
      distance: number;
      heartRate: number;
      count: number;
    }
  >();

  filteredData.forEach((log) => {
    const dateKey = formatDate(log.date, dateFormat);
    const existing = dateGroups.get(dateKey) || {
      volume: 0,
      weight: 0,
      reps: 0,
      duration: 0,
      distance: 0,
      heartRate: 0,
      count: 0,
    };

    // Standard fields
    existing.volume += log.volume || 0;
    existing.weight += log.weight || 0;
    existing.reps += log.reps || 0;

    // Extract from customFields for dynamic exercise types
    if (log.customFields) {
      // Duration from customFields (case-insensitive)
      const durationValue = getCustomFieldNumber(log.customFields, "duration");
      existing.duration += durationValue;

      // Distance from customFields
      const distanceValue = getCustomFieldNumber(log.customFields, "distance");
      existing.distance += distanceValue;

      // Heart rate from customFields
      const heartRateValue =
        getCustomFieldNumber(log.customFields, "heartRate") ||
        getCustomFieldNumber(log.customFields, "heartrate");
      existing.heartRate += heartRateValue;
    }

    existing.count += 1;
    dateGroups.set(dateKey, existing);
  });

  // Calculate values based on display type
  const labels: string[] = [];
  const volumeData: number[] = [];
  const weightData: number[] = [];
  const repsData: number[] = [];
  const durationData: number[] = [];
  const distanceData: number[] = [];
  const paceData: number[] = [];
  const heartRateData: number[] = [];

  dateGroups.forEach((values, date) => {
    labels.push(date);

    // 🔧 CORREZIONE: Distinguere tra volume totale e media per esercizio
    if (displayType === CHART_TYPE.WORKOUT) {
      // Per l'allenamento totale: mostra il volume TOTALE (somma)
      volumeData.push(values.volume);
      weightData.push(values.weight); // Somma totale dei pesi
      repsData.push(values.reps); // Somma totale delle reps
      durationData.push(values.duration);
      distanceData.push(values.distance);
      // Pace = total time / total distance (min/km)
      paceData.push(
        values.distance > 0 ? values.duration / values.distance : 0,
      );
      heartRateData.push(
        values.count > 0 ? values.heartRate / values.count : 0,
      ); // Avg heart rate
    } else {
      // Per singolo esercizio: mantieni la media (comportamento attuale)
      volumeData.push(values.count > 0 ? values.volume / values.count : 0);
      weightData.push(values.count > 0 ? values.weight / values.count : 0);
      repsData.push(values.count > 0 ? values.reps / values.count : 0);
      durationData.push(values.count > 0 ? values.duration / values.count : 0);
      distanceData.push(values.count > 0 ? values.distance / values.count : 0);
      // Pace = avg time / avg distance (min/km)
      const avgDuration = values.count > 0 ? values.duration / values.count : 0;
      const avgDistance = values.count > 0 ? values.distance / values.count : 0;
      paceData.push(avgDistance > 0 ? avgDuration / avgDistance : 0);
      heartRateData.push(
        values.count > 0 ? values.heartRate / values.count : 0,
      );
    }
  });

  // Create datasets based on chart type
  const datasets: ChartDataset[] = [];

  // Build data array and label based on chart type
  const { data, label, color } = getChartDataForType(chartType, displayType, {
    volumeData,
    weightData,
    repsData,
    durationData,
    distanceData,
    paceData,
    heartRateData,
  });

  if (data.length > 0) {
    datasets.push({
      label,
      data,
      borderColor: color,
      backgroundColor: color + "20",
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6,
    });
  }

  return { labels, datasets };
}

/**
 * Helper to extract a number from customFields (case-insensitive key matching)
 */
function getCustomFieldNumber(
  customFields: Record<string, string | number | boolean>,
  key: string,
): number {
  // Try exact key first
  if (key in customFields) {
    const value = customFields[key];
    if (typeof value === "number") return value;
    if (typeof value === "string") {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    }
  }
  // Try case-insensitive match
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(customFields)) {
    if (k.toLowerCase() === lowerKey) {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const num = parseFloat(v);
        return isNaN(num) ? 0 : num;
      }
    }
  }
  return 0;
}

/**
 * Get chart data array, label, and color based on chart type
 */
function getChartDataForType(
  chartType: CHART_DATA_TYPE,
  displayType: CHART_TYPE,
  dataArrays: {
    volumeData: number[];
    weightData: number[];
    repsData: number[];
    durationData: number[];
    distanceData: number[];
    paceData: number[];
    heartRateData: number[];
  },
): { data: number[]; label: string; color: string } {
  const isWorkout = displayType === CHART_TYPE.WORKOUT;

  switch (chartType) {
    case CHART_DATA_TYPE.VOLUME:
      return {
        data: dataArrays.volumeData,
        label: isWorkout
          ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
          : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
        color: "#4CAF50",
      };

    case CHART_DATA_TYPE.WEIGHT:
      return {
        data: dataArrays.weightData,
        label: isWorkout
          ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_WEIGHT
          : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_WEIGHT,
        color: "#FF9800",
      };

    case CHART_DATA_TYPE.REPS:
      return {
        data: dataArrays.repsData,
        label: isWorkout
          ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_REPS
          : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_REPS,
        color: "#FF9800",
      };

    case CHART_DATA_TYPE.DURATION:
      return {
        data: dataArrays.durationData,
        label: isWorkout ? "Total duration" : "Avg duration",
        color: "#2196F3",
      };

    case CHART_DATA_TYPE.DISTANCE:
      return {
        data: dataArrays.distanceData,
        label: isWorkout ? "Total distance" : "Avg distance",
        color: "#9C27B0",
      };

    case CHART_DATA_TYPE.PACE:
      return {
        data: dataArrays.paceData,
        label: "Pace (min/km)",
        color: "#E91E63",
      };

    case CHART_DATA_TYPE.HEART_RATE:
      return {
        data: dataArrays.heartRateData,
        label: "Avg heart rate (bpm)",
        color: "#F44336",
      };

    default:
      // Fallback to volume for unknown types
      return {
        data: dataArrays.volumeData,
        label: isWorkout
          ? CONSTANTS.WORKOUT.LABELS.GENERAL.TOTAL_VOLUME
          : CONSTANTS.WORKOUT.LABELS.GENERAL.AVG_VOLUME,
        color: "#4CAF50",
      };
  }
}

/**
 * Validate user parameters and return errors if present
 */
export function validateUserParams(params: EmbeddedViewParams): string[] {
  const errors: string[] = [];

  // Validate dateRange (exists in chart and table params)
  if ("dateRange" in params && params.dateRange !== undefined) {
    const dateRange = Number(params.dateRange);
    if (isNaN(dateRange) || dateRange < 1 || dateRange > 365) {
      errors.push("dateRange must be a number between 1 and 365");
    }
  }

  // Validate limit (exists in chart and table params)
  if ("limit" in params && params.limit !== undefined) {
    const limit = Number(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push("limit must be a number between 1 and 1000");
    }
  }

  // Validate chartType (exists only in chart params)
  if ("chartType" in params && params.chartType !== undefined) {
    const chartType = params.chartType;
    if (![CHART_TYPE.EXERCISE, CHART_TYPE.WORKOUT].includes(chartType)) {
      errors.push(
        "chartType must be either CHART_TYPE.EXERCISE or CHART_TYPE.WORKOUT",
      );
    }
  }

  // Validate type for charts (exists only in chart params)
  // Accepts all valid CHART_DATA_TYPE values including dynamic types
  if ("type" in params && params.type !== undefined) {
    const type = String(params.type);
    const validTypes: string[] = [
      CHART_DATA_TYPE.VOLUME,
      CHART_DATA_TYPE.WEIGHT,
      CHART_DATA_TYPE.REPS,
      CHART_DATA_TYPE.DURATION,
      CHART_DATA_TYPE.DISTANCE,
      CHART_DATA_TYPE.PACE,
      CHART_DATA_TYPE.HEART_RATE,
    ];
    if (!validTypes.includes(type)) {
      errors.push(`type must be one of: ${validTypes.join(", ")}`);
    }
  }

  // Validate duration for timers (exists only in timer params)
  if ("duration" in params && params.duration !== undefined) {
    const duration = Number(params.duration);
    if (isNaN(duration) || duration < 1 || duration > 3600) {
      errors.push("duration must be a number between 1 and 3600 seconds");
    }
  }

  return errors;
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  format: string = "DD/MM/YYYY",
): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  switch (format) {
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

/**
 * Calculate trend line data
 */
export function calculateTrendLine(data: number[]): {
  slope: number;
  intercept: number;
} {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += data[i];
    sumXY += i * data[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}
