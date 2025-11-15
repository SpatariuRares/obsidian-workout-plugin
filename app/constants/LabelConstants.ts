const DEFAULT_EXERCISE_NAME = "exercise";
const DEFAULT_WORKOUT_NAME = "Workout";

const getExerciseName = (exerciseName?: string): string =>
  exerciseName && exerciseName.trim().length > 0
    ? exerciseName
    : DEFAULT_EXERCISE_NAME;

const getWorkoutName = (exerciseName?: string): string =>
  exerciseName && exerciseName.trim().length > 0
    ? exerciseName
    : DEFAULT_WORKOUT_NAME;

export const UI_LABELS = {
  TABLE: {
    DATE: "Date",
    EXERCISE: "Exercise",
    REPS: "Reps",
    REPETITIONS: "Repetitions",
    WEIGHT: "Weight (kg)",
    VOLUME: "Volume",
    VOLUME_WITH_UNIT: "Volume (kg)",
    NOTES: "Notes",
    ACTIONS: "Actions",
    NO_DATA: "No data available",
    INVALID_DATE: "Invalid date",
    NOT_AVAILABLE: "N/A",
    TREND_LINE: "Trend Line",
    ADD_LOG_BUTTON: "Add Log",
  },
  ACTIONS: {
    ADD: "Add",
    ADD_LOG: "Add Log",
    EDIT: "Edit",
    EDIT_LOG_ENTRY: "Edit log entry",
    DELETE: "Delete",
    DELETE_LOG_ENTRY: "Delete log entry",
    DELETE_CONFIRM: "Are you sure you want to delete this log entry?",
    DELETE_SUCCESS: "Log entry deleted successfully!",
    DELETE_ERROR: "Error deleting log entry: ",
    REFRESH_SUCCESS: "Table refreshed successfully",
  },
  LOGS: {
    NO_DATA_TITLE: (exerciseName?: string) =>
      `No workout logs found for ${getExerciseName(exerciseName)}`,
    CREATE_FIRST_LOG_BUTTON_TEXT: (exerciseName?: string) =>
      `Create first workout log for ${getExerciseName(exerciseName)}`,
    CREATE_FIRST_LOG_BUTTON_ARIA: (exerciseName?: string) =>
      `Create first workout log for ${getExerciseName(exerciseName)}`,
    ADD_LOG_BUTTON_TEXT: (exerciseName?: string) =>
      `Add Log for ${getWorkoutName(exerciseName)}`,
    ADD_LOG_BUTTON_ARIA: (exerciseName?: string) =>
      `Add workout log for ${getWorkoutName(exerciseName)}`,
    CREATE_LOG_BUTTON_TEXT: (exerciseName: string) =>
      `Create log for: ${exerciseName}`,
    CREATE_LOG_BUTTON_ARIA: (exerciseName: string) =>
      `Create workout log for ${exerciseName}`,
    NO_MATCH_MESSAGE: "No matching exercise data found",
  },
  DASHBOARD: {
    QUICK_ACTIONS: {
      TITLE: "Quick actions",
      ADD_WORKOUT_LOG: "Add workout log",
      VIEW_EXERCISES: "View exercises",
    },
    QUICK_STATS: {
      TITLE: "Quick stats",
      PERIODS: {
        WEEK: "This Week",
        MONTH: "This Month",
        YEAR: "This Year",
      },
      METRICS: {
        WORKOUTS: "Workouts",
        TOTAL_VOLUME: "Total volume (kg)",
        AVG_VOLUME: "Avg volume (kg)",
      },
    },
    RECENT_WORKOUTS: {
      TITLE: "Recent workouts",
      FALLBACK_NAME: "Workout",
      VOLUME_SUFFIX: "kg",
    },
    SUMMARY: {
      TITLE: "Summary",
      TOTAL_WORKOUTS: "Total Workouts",
      CURRENT_STREAK: "Current Streak",
      CURRENT_STREAK_SUFFIX: "weeks",
      TOTAL_VOLUME: "Total Volume",
      TOTAL_VOLUME_SUFFIX: "kg",
      PERSONAL_RECORDS: "Personal Records",
    },
    VOLUME_ANALYTICS: {
      TITLE: "Volume analytics",
      DATASET_LABEL: "Daily volume (kg)",
      CHART_TITLE: "Volume Trend (Last 30 Days)",
      MUSCLE_BREAKDOWN_TITLE: "Top exercises by volume",
      VOLUME_SUFFIX: "kg",
    },
    MUSCLE_TAGS: {
      TITLE: "Available muscle tags",
      DESCRIPTION:
        "Click on any tag to copy it. Use these tags in exercise files for proper categorization and tracking.",
      TOTAL_COUNT: (count: number) => `Total: ${count} tags available`,
      TOOLTIP: (tag: string) => `Click to copy: ${tag}`,
    },
    FILE_ERRORS: {
      TITLE: "Exercise file errors",
      ALL_VALID: "All exercise files are valid",
      NO_TAGS: "No muscle tags found",
      TOO_MANY_TAGS: (count: number) => `Too many muscle tags (${count})`,
      READ_ERROR: (message: string) => `Error reading file: ${message}`,
    },
  },
  CHARTS: {
    TREND_TITLE_PREFIX: "Trend Volume: ",
    OVERALL_VARIATION_PREFIX: "Overall variation: ",
    VARIATION_FROM_TO: (startKg: string, endKg: string) =>
      ` (da ${startKg} kg a ${endKg} kg)`,
    VARIATION_SINGLE_VALUE: (value: string) => ` (Volume: ${value} kg)`,
    VARIATION_VALUE_LABEL: (value: string) => `Volume: ${value} kg`,
    SIGNIFICANT_INCREASE: "Aumento signif.",
    FALLBACK_TABLE_MESSAGE:
      "fallback table (charts plugin not available or error)",
  },
} as const;
