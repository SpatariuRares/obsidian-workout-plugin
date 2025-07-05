import { TFile } from "obsidian";

// ===================== UTILITY FUNCTIONS =====================

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

const PATH_MATCH_THRESHOLD = 70;
const NO_EXERCISE_SPECIFIED = "Esercizio Non Specificato";

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
  logData: any[],
  exerciseName: string,
  debug: boolean = false
): MatchResult {
  const fileNameMatches: ExerciseMatch[] = [];
  const allExercisePathsAndScores = new Map<string, number>();

  for (const log of logData) {
    // Check filename strategy
    const fileName = log.file?.basename || "";
    const fileNameScore = getMatchScore(fileName, exerciseName);

    if (fileNameScore > 0) {
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

  if (debug) {
    console.log("Exercise matches found:", {
      fileNameMatches: fileNameMatches.length,
      exercisePaths: allExercisePathsAndScores.size,
    });
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
  debug: boolean = false,
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

  if (debug) {
    console.log("Filter strategy determined:", {
      strategy: bestStrategy,
      pathKey: bestPathKey,
      matchesCount: bestFileMatchesList.length,
    });
  }

  return { bestStrategy, bestPathKey, bestFileMatchesList };
}

/**
 * Filter log data by exercise using the determined strategy
 */
export function filterLogDataByExercise(
  logData: any[],
  strategy: string,
  pathKey: string,
  fileMatches: ExerciseMatch[]
): any[] {
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
    return logData.filter((log) => filePaths.includes(log.file.path));
  }
  if (strategy === "exercise_field") {
    return logData.filter((log) => {
      const exerciseField = log.exercise || "";
      return getMatchScore(exerciseField, pathKey) >= PATH_MATCH_THRESHOLD;
    });
  }
  return logData;
}

/**
 * Process log data for chart display - Updated to match JS version functionality
 */
export function processChartData(
  logData: any[],
  chartType: "volume" | "weight" | "reps",
  dateRange: number = 30,
  dateFormat: string = "DD/MM/YYYY"
): { labels: string[]; datasets: any[] } {
  console.log("processChartData called with:", {
    logData: logData.length,
    chartType,
    dateRange,
  });

  // Filter by date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - dateRange);

  const filteredData = logData.filter((log) => {
    const logDate = new Date(log.date);
    return logDate >= cutoffDate;
  });

  console.log("After date filtering:", {
    filteredData: filteredData.length,
    cutoffDate,
  });

  // Sort by date
  const sortedData = filteredData.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Aggrega usando la data completa (YYYY-MM-DD)
  const dailyVolumes = new Map<string, number>();
  for (const log of sortedData) {
    let volumeValue: number;
    switch (chartType) {
      case "volume":
        volumeValue = log.volume || log.reps * log.weight;
        break;
      case "weight":
        volumeValue = log.weight;
        break;
      case "reps":
        volumeValue = log.reps;
        break;
      default:
        volumeValue = log.volume || log.reps * log.weight;
    }
    if (
      volumeValue === undefined ||
      volumeValue === null ||
      isNaN(volumeValue)
    ) {
      continue;
    }
    const dateKey = formatDate(log.date, "YYYY-MM-DD");
    dailyVolumes.set(dateKey, (dailyVolumes.get(dateKey) || 0) + volumeValue);
  }

  // Ordina le chiavi per data completa
  const sortedKeys = Array.from(dailyVolumes.keys()).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Labels solo DD/MM per l'asse X
  const labels = sortedKeys.map((dateStr) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
  });

  const volumeData = sortedKeys.map((date) => dailyVolumes.get(date) || 0);

  return {
    labels,
    datasets: [
      {
        label: `Volume ${
          chartType === "volume"
            ? "Totale"
            : chartType.charAt(0).toUpperCase() + chartType.slice(1)
        }`,
        data: volumeData,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.2,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
    ],
  };
}

/**
 * Validate user parameters and return errors if present
 */
export function validateUserParams(params: any): string[] {
  const errors: string[] = [];

  // Validate chartType
  if (params.chartType && !["exercise", "workout"].includes(params.chartType)) {
    errors.push(
      `chartType must be "exercise" or "workout", received: "${params.chartType}"`
    );
  }

  // Validate limit
  if (params.limit !== undefined) {
    const limit = parseInt(params.limit);
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      errors.push(
        `limit must be a number between 1 and 1000, received: "${params.limit}"`
      );
    }
  }

  // Validate height
  if (params.height && !/^\d+px$/.test(params.height)) {
    errors.push(
      `height must be in format "XXXpx", received: "${params.height}"`
    );
  }

  return errors;
}

/**
 * Generate random color for chart datasets
 */
function getRandomColor(alpha: number = 1): string {
  const colors = [
    `rgba(255, 99, 132, ${alpha})`,
    `rgba(54, 162, 235, ${alpha})`,
    `rgba(255, 206, 86, ${alpha})`,
    `rgba(75, 192, 192, ${alpha})`,
    `rgba(153, 102, 255, ${alpha})`,
    `rgba(255, 159, 64, ${alpha})`,
    `rgba(199, 199, 199, ${alpha})`,
    `rgba(83, 102, 255, ${alpha})`,
    `rgba(78, 252, 3, ${alpha})`,
    `rgba(252, 3, 244, ${alpha})`,
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Format date for display
 */
export function formatDate(
  date: string | Date,
  format: string = "DD/MM/YYYY"
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
