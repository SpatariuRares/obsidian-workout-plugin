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
} as const;
