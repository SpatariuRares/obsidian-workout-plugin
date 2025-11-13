export const TABLE_COLUMNS = {
  DATE: "Date",
  EXERCISE: "Exercise",
  REPS: "Reps",
  WEIGHT: "Weight (kg)",
  VOLUME: "Volume",
  NOTES: "Notes",
  ACTIONS: "Actions",
} as const;

export const TABLE_LABELS = {
  DATA: "Date",
  VOLUME: "Volume (kg)",
  WEIGHT: "Weight (kg)",
  REPETITIONS: "Repetitions",
  NO_DATA: "No data available",
  INVALID_DATE: "Invalid date",
  NOT_AVAILABLE: "N/A",
  TREND_LINE: "Trend Line",
} as const;

export const TABLE_LIMITS = {
  DEFAULT: 50,
  MIN: 1,
  MAX: 1000,
} as const;

export const TABLE_ICONS = {
  REPS: "🔢",
  WEIGHT: "⚖️",
  VOLUME: "📊",
  EDIT: "✏️",
  DELETE: "🗑️",
} as const;

export const DEFAULT_VISIBLE_COLUMNS = [
  TABLE_COLUMNS.DATE,
  TABLE_COLUMNS.REPS,
  TABLE_COLUMNS.WEIGHT,
  TABLE_COLUMNS.VOLUME,
  TABLE_COLUMNS.NOTES,
] as const;

export const TABLE_MESSAGES = {
  DELETE_CONFIRM: "Are you sure you want to delete this log entry?",
  DELETE_SUCCESS: "Log entry deleted successfully!",
  DELETE_ERROR: "Error deleting log entry: ",
  REFRESH_SUCCESS: "Table refreshed successfully",
  EDIT_TITLE: "Edit log entry",
  DELETE_TITLE: "Delete log entry",
} as const;

export const TABLE_DATE_KEYS = {
  INVALID: "invalid-date",
} as const;

export const TABLE_DEFAULTS = {
  BUTTON_TEXT: "➕ Add Log",
} as const;

export const TABLE_VALIDATION_ERRORS = {
  LIMIT_RANGE: (min: number, max: number, received: string) =>
    `limit must be a number between ${min} and ${max}, received: "${received}"`,
  COLUMNS_INVALID_TYPE:
    "columns must be an array of strings or a JSON string",
  COLUMNS_NOT_STRINGS: "columns must be an array of strings",
  BUTTON_TEXT_NOT_STRING: "buttonText must be a string",
} as const;
