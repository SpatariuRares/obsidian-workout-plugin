/**
 * UI Constants - User Interface Labels, Icons, and Emoji
 *
 * This file contains all user-facing UI strings including:
 * - Modal titles, buttons, labels, placeholders, and checkboxes
 * - Settings section labels and descriptions
 * - Table column headers, labels, and messages
 * - Chart labels and display strings
 * - Timer labels and types
 * - Icon and emoji constants used throughout the UI
 *
 * These constants are organized by domain (modal, settings, table, etc.)
 * to enable easy discovery and consistent terminology across the plugin.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";

/**
 * Unit strings for each data type, used for displaying values with appropriate units
 */
export const UNITS_MAP: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: "kg",
  [CHART_DATA_TYPE.WEIGHT]: "kg",
  [CHART_DATA_TYPE.REPS]: "",
  [CHART_DATA_TYPE.DURATION]: "sec",
  [CHART_DATA_TYPE.DISTANCE]: "km",
  [CHART_DATA_TYPE.PACE]: "min/km",
  [CHART_DATA_TYPE.HEART_RATE]: "bpm",
} as const;

/**
 * Column labels for each data type, used for table headers and statistics titles
 */
export const COLUMN_LABELS: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: "Volume (kg)",
  [CHART_DATA_TYPE.WEIGHT]: "Weight (kg)",
  [CHART_DATA_TYPE.REPS]: "Reps",
  [CHART_DATA_TYPE.DURATION]: "Duration",
  [CHART_DATA_TYPE.DISTANCE]: "Distance (km)",
  [CHART_DATA_TYPE.PACE]: "Pace (min/km)",
  [CHART_DATA_TYPE.HEART_RATE]: "Heart Rate (bpm)",
} as const;

/**
 * Simple data type names without units, used for trend titles and labels
 */
export const DATA_TYPE_NAMES: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: "Volume",
  [CHART_DATA_TYPE.WEIGHT]: "Weight",
  [CHART_DATA_TYPE.REPS]: "Reps",
  [CHART_DATA_TYPE.DURATION]: "Duration",
  [CHART_DATA_TYPE.DISTANCE]: "Distance",
  [CHART_DATA_TYPE.PACE]: "Pace",
  [CHART_DATA_TYPE.HEART_RATE]: "Heart Rate",
} as const;

/**
 * Icon constants used throughout the UI
 */
export const ICONS = {
  COMMON: {
    PERCENTAGE: "%",
    PLUS: "+",
    MINUS: "-",
    ARROW_UP: "⬆️",
    ARROW_DOWN: "⬇️",
    ARROW_NEUTRAL: "↔️",
    EMPTY: "",
  },
  TABLE: {
    REPS: "🔁 ",
    WEIGHT: "🏋️ ",
    VOLUME: "📊 ",
    DURATION: "⏱️ ",
    DISTANCE: "📍 ",
    HEART_RATE: "❤️ ",
    EDIT: "✏️",
    DELETE: "🗑️",
  },
  ACTIONS: {
    ADD: "➕",
    EDIT: "✏️",
    DELETE: "🗑️",
    REFRESH: "🔄",
  },
  STATUS: {
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "ℹ️",
  },
  DASHBOARD: {
    QUICK_STATS: {
      PERIODS: {
        WEEK: "🗓️",
        MONTH: "📆",
        YEAR: "📈",
      },
      METRICS: {
        WORKOUTS: "🏋️",
        TOTAL_VOLUME: "📦",
        AVG_VOLUME: "📊",
      },
    },
    SUMMARY: {
      TOTAL_WORKOUTS: "🏋️",
      CURRENT_STREAK: "🔥",
      TOTAL_VOLUME: "📦",
      PERSONAL_RECORDS: "🏅",
    },
  },
  EXERCISE: {
    DEADLIFT: "💀",
    CURL: "💪",
    EXTENSION: "📏",
    BICEPS: "💪",
    TRICEPS: "💪",
    CORE: "🎯",
    FOREARM: "✊",
    BACK: "🦾",
    FLY: "🦅",
    HIP_TRUST: "🍑",
    SHOULDERS: "🦵",
    ARMS: "🦵",
    LEGS: "🦵",
    GLUTES: "🍑",
    CALVES: "🦵",
    TRAPS: "🔺",
    CARDIO: "⭐",
    PUSH: "🔼",
    PULL: "⬇️",
  },
} as const;

/**
 * Emoji constants (subset of icons that are purely emoji-based)
 */
export const EMOJI = {
  ACTIONS: {
    ADD: "➕",
    EDIT: "✏️",
    DELETE: "🗑️",
    REFRESH: "🔄",
    EXPORT: "📸",
  },
  STATUS: {
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "ℹ️",
  },
  EXERCISE: {
    DEADLIFT: "💀",
    CURL: "💪",
    BICEPS: "💪",
    TRICEPS: "💪",
    CORE: "🎯",
    BACK: "🦾",
    FLY: "🦅",
    GLUTES: "🍑",
    TRAPS: "🔺",
    CARDIO: "⭐",
  },
  TRENDS: {
    UP: "⬆️",
    DOWN: "⬇️",
    NEUTRAL: "↔️",
  },
  TIME_PERIODS: {
    WEEK: "🗓️",
    MONTH: "📆",
    YEAR: "📈",
  },
} as const;

/**
 * Modal UI labels - titles, buttons, labels, placeholders, and checkboxes
 */
export const MODAL_UI = {
  TITLES: {
    CREATE_LOG: "Create workout log",
    EDIT_LOG: "Edit workout log",
    INSERT_CHART: "Insert workout chart",
    INSERT_TABLE: "Insert workout log table",
    INSERT_TIMER: "Insert workout timer",
    INSERT_DASHBOARD: "Insert workout dashboard",
    INSERT_DURATION: "Insert workout duration",
    CREATE_EXERCISE_PAGE: "Create exercise page",
    CREATE_EXERCISE_SECTION: "Create exercise section",
    CONFIRM_ACTION: "Confirm action",
    AUDIT_EXERCISE_NAMES: "Audit exercise names",
    ADD_EXERCISE_BLOCK: "Add exercise block",
    QUICK_LOG: "Quick log",
    CANVAS_EXPORT: "Export workout to canvas",
    MUSCLE_TAG_MANAGER: "Manage muscle tags",
  },
  BUTTONS: {
    CREATE: "Create log",
    UPDATE: "Update log",
    INSERT_CHART: "Insert chart",
    RENAME_IN_CSV: "Rename in CSV",
    RENAME_FILE: "Rename file",
    INSERT_TABLE: "Insert table",
    INSERT_TIMER: "Insert timer",
    INSERT_DASHBOARD: "Insert dashboard",
    CANCEL: "Cancel",
    CONFIRM: "Confirm",
    CREATE_EXERCISE: "Create exercise page",
    CREATE_SECTION: "Create section",
    INSERT_EXERCISE_BLOCK: "Insert",
    UPDATE_TARGET_WEIGHT: "Update target",
    ADJUST_PLUS: "+",
    ADJUST_MINUS: "-",
    EXPORT: "Export",
    ADD_PARAMETER: "Add parameter",
    REMOVE_PARAMETER: "Remove",
  },
  NOTICES: {
    LOG_CREATED: "Workout log created successfully!",
    LOG_UPDATED: "Workout log updated successfully!",
    LOG_CREATE_ERROR: "Error creating log: ",
    LOG_UPDATE_ERROR: "Error updating log: ",
    CHART_INSERTED: "✅ Chart inserted successfully!",
    TABLE_INSERTED: "✅ Table inserted successfully!",
    TIMER_INSERTED: "✅ Timer inserted successfully!",
    DASHBOARD_INSERTED: "✅ Dashboard inserted successfully!",
    VALIDATION_FILL_ALL: "Please fill in all fields with valid values",
    VALIDATION_POSITIVE_VALUES:
      "Please enter valid positive values for reps and weight",
    VALIDATION_COMBINED_MODE:
      "⚠️ for 'exercise + workout' type you must fill both fields!",
    NO_ACTIVE_EDITOR: "No active markdown editor",
    INSERT_CODE_NO_FILE: "Open a markdown file to insert the code",
    EXERCISE_PAGE_CREATED: "Exercise page created successfully!",
    EXERCISE_PAGE_ERROR: "Error creating exercise page: ",
    EXERCISE_PAGE_NAME_REQUIRED: "Please enter an exercise name",
    EXERCISE_NAME_REQUIRED: "❌ please enter an exercise name",
    EXERCISE_SECTION_CREATED: "✅ exercise section created successfully!",
    DASHBOARD_CREATED: "Dashboard section created successfully",
    GENERIC_ERROR: "Error: ",
    TIMER_ELEMENTS_NOT_INITIALIZED: "Timer elements not initialized",
    AUDIT_NO_MISMATCHES:
      "✅ No mismatches found. All exercise files match CSV entries.",
    AUDIT_SCANNING: "Scanning exercise files...",
    AUDIT_RENAME_SUCCESS: "Successfully renamed exercise in CSV",
    AUDIT_RENAME_ERROR: "Error renaming exercise: ",
    AUDIT_CONFIRM_RENAME:
      "Are you sure you want to rename this exercise in the CSV?",
    AUDIT_RENAME_FILE_SUCCESS: "Successfully renamed exercise file",
    AUDIT_RENAME_FILE_ERROR: "Error renaming file: ",
    AUDIT_CONFIRM_RENAME_FILE: "Are you sure you want to rename this file?",
    EXERCISE_BLOCK_INSERTED: "✅ Exercise block inserted successfully!",
    CANVAS_EXPORTED: "Canvas exported successfully!",
    CANVAS_EXPORT_ERROR: "Error exporting to canvas: ",
    CANVAS_NO_EXERCISES: "No exercises found in workout file",
    MUSCLE_TAG_LOADING: "Loading muscle tags...",
    MUSCLE_TAG_COUNT: (count: number) =>
      `${count} tag${count !== 1 ? "s" : ""} found`,
    MUSCLE_TAG_NO_RESULTS: "No tags match your search",
    MUSCLE_TAG_SAVED: "Muscle tag saved successfully!",
    MUSCLE_TAG_DELETED: "Muscle tag deleted successfully!",
    MUSCLE_TAG_DELETE_CONFIRM: (tag: string) =>
      `Are you sure you want to delete the tag "${tag}"?`,
    MUSCLE_TAG_SAVE_ERROR: (error: string) =>
      `Error saving muscle tag: ${error}`,
    MUSCLE_TAG_EXISTS: (tag: string) => `Tag "${tag}" already exists`,
    MUSCLE_TAG_SIMILAR_WARNING: "Similar tag exists - possible duplicate",
    MUSCLE_TAG_SIMILAR_FOUND: (count: number) =>
      `${count} similar tag${count !== 1 ? "s" : ""} found`,
    MUSCLE_TAG_EXPORTED: "Muscle tags exported successfully!",
    MUSCLE_TAG_EXPORT_ERROR: (error: string) =>
      `Error exporting muscle tags: ${error}`,
    MUSCLE_TAG_IMPORTED: (count: number) =>
      `${count} muscle tag${count !== 1 ? "s" : ""} imported successfully!`,
    MUSCLE_TAG_IMPORT_ERROR: (error: string) =>
      `Error importing muscle tags: ${error}`,
    MUSCLE_TAG_IMPORT_INVALID_FORMAT:
      "Invalid CSV format. File must have 'tag' and 'muscleGroup' columns.",
    MUSCLE_TAG_IMPORT_INVALID_GROUP: (tag: string, group: string) =>
      `Invalid muscle group "${group}" for tag "${tag}". Must be a canonical muscle group.`,
    MUSCLE_TAG_IMPORT_PREVIEW: (count: number) =>
      `${count} tag${count !== 1 ? "s" : ""} to import`,
    MUSCLE_TAG_IMPORT_NO_VALID: "No valid tags found in CSV file.",
    TARGET_ACHIEVED: "Target Reached! Consider increasing weight",
    TARGET_DISMISSED: "Achievement badge dismissed",
    SUGGESTED_NEXT_WEIGHT: "Suggested next:",
    CONFIRM_UPDATE_TARGET: "Update target weight to",
    MIGRATION_COMPLETE: (count: number) =>
      `✅ Migration complete. Updated ${count} exercise files.`,
    MIGRATION_NO_UPDATES: "No exercise files needed updates.",
    MIGRATION_ERROR: "Error migrating exercises: ",
  },
  LABELS: {
    EXERCISE: "Exercise:",
    REPS: "Reps:",
    WEIGHT: "Weight (kg):",
    NOTES: "Notes (optional):",
    WORKOUT: "Workout (optional):",
    WORKOUT_NAME: "Workout name:",
    WORKOUT_NAME_OPTIONAL: "Workout name (optional):",
    CHART_TYPE: "Chart type:",
    DATA_TYPE: "Data type:",
    TABLE_TYPE: "Table type:",
    DAYS_RANGE: "Days range:",
    DATA_LIMIT: "Data limit:",
    MAX_LOG_COUNT: "Maximum log count:",
    CUSTOM_TITLE: "Custom title:",
    TIMER_TYPE: "Timer type:",
    DURATION: "Duration (seconds):",
    INTERVAL_TIME: "Interval time (seconds):",
    ROUNDS: "Rounds:",
    TITLE: "Title:",
    EXERCISE_NAME: "Exercise name:",
    EXERCISE_PATH: "Exercise path:",
    SETS: "Sets:",
    REST_TIME: "Rest time (seconds):",
    NOTE: "Note:",
    TAGS: "Tags (comma separated):",
    FOLDER_PATH: "Folder path (optional):",
    EXERCISE_TYPE: "Exercise type:",
    CUSTOM_PARAMETERS: "Custom parameters:",
    PARAMETER_KEY: "Key:",
    PARAMETER_LABEL: "Label:",
    PARAMETER_TYPE: "Type:",
    PARAMETER_UNIT: "Unit (optional):",
    PARAMETER_REQUIRED: "Required",
    CONFIRM_ACTION: "Confirm action",
    FILE_NAME: "File name",
    CSV_EXERCISE: "CSV exercise",
    SIMILARITY: "Similarity",
    STATUS: "Status",
    TAG: "Tag",
    MUSCLE_GROUP: "Muscle group",
    ACTIONS: "Actions",
    ADD_TAG: "Add tag",
    EDIT_TAG: "Edit tag",
    NEW_TAG: "New tag",
    SAVE: "Save",
    DELETE: "Delete",
    SIMILAR_TAGS: "Similar tags:",
    EXPORT_TAGS: "Export tags",
    IMPORT_TAGS: "Import tags",
    IMPORT_MERGE: "Merge",
    IMPORT_REPLACE: "Replace all",
    TIMER_DURATION: "Timer duration (seconds):",
    TIMER_PRESET: "Timer preset:",
    WORKOUT_FILE: "Workout file:",
    DATE_RANGE: "Date range (days):",
    TARGET_WEIGHT: "Target weight (kg):",
    TARGET_REPS: "Target reps:",
    PROTOCOL: "Protocol:",
    RECENT_EXERCISES: "Recent:",
    CANVAS_LAYOUT: "Layout",
    CANVAS_OPTIONS: "Options",
    LAYOUT_TYPE: "Layout type:",
    LAYOUT_HORIZONTAL: "Horizontal flow",
    LAYOUT_VERTICAL: "Vertical flow",
    LAYOUT_GROUPED: "Grouped by muscle",
  },
  PLACEHOLDERS: {
    SEARCH_TAGS: "Search by tag or muscle group...",
    ENTER_TAG_NAME: "Enter tag name (e.g., petto, chest)",
    EXERCISE_AUTOCOMPLETE: "Start typing to see available exercises...",
    REPS: "e.g., 10",
    REPS_RANGE: "8-10",
    WEIGHT: "e.g., 10.5",
    NOTES: "e.g., Good form, felt strong",
    WORKOUT: "e.g. Workout A, Training B, or use checkbox below",
    CUSTOM_TITLE: "Leave empty for automatic title",
    TIMER_TITLE: "Workout Timer",
    EXERCISE_NAME: "e.g. Bench Press",
    EXERCISE_PATH: "e.g. Exercises/Upper Body",
    SETS: "4",
    REST_TIME: "90",
    NOTE: "Push hard here. This is your fundamental exercise.",
    TAGS: "e.g., spalle, deltoidi, laterali, isolamento, macchina",
    FOLDER_PATH: "e.g., Exercises or leave empty for root",
    PARAMETER_KEY: "e.g., speed",
    PARAMETER_LABEL: "e.g., Speed",
    PARAMETER_UNIT: "e.g., km/h",
  },
  CHECKBOXES: {
    USE_CURRENT_WORKOUT: "Use current page as workout",
    USE_CURRENT_WORKOUT_FILE: "Use current workout (file name)",
    SHOW_TREND_LINE: "Show trend line",
    SHOW_TREND_HEADER: "Show trend header",
    SHOW_STATISTICS: "Show statistics",
    SHOW_ADD_BUTTON: "Show 'Add log' button",
    EXACT_MATCH: "Exact match",
    DEBUG_MODE: "Debug mode",
    SEARCH_BY_NAME: "Search by file name",
    SHOW_CONTROLS: "Show controls",
    AUTO_START: "Auto start",
    SOUND: "Sound",
    INCLUDE_TIMER: "Include timer",
    INCLUDE_CHART: "Include chart",
    INCLUDE_TABLE: "Include table",
    INCLUDE_LOG: "Include log",
    TIMER_AUTO_START: "Timer auto start",
    TIMER_SOUND: "Timer sound",
    USE_PRESET_ONLY: "Use preset only (minimal code)",
    INCLUDE_DURATIONS: "Include timer durations",
    INCLUDE_STATS: "Include last performance stats",
    CONNECT_SUPERSETS: "Connect superset exercises with edges",
  },
  EXERCISE_STATUS: {
    CREATE_PAGE: "📝 create exercise page",
    SELECTED: "✅ exercise selected",
    NOT_FOUND: "⚠️ no exercises found",
    FOUND: (count: number) => `📋 ${count} exercises found`,
  },
  SELECT_OPTIONS: {
    CHART_TYPE: [
      { text: "Complete workout", value: "workout" },
      { text: "Specific exercise", value: "exercise" },
    ],
    DATA_TYPE: [
      { text: "Volume (kg)", value: "volume" },
      { text: "Weight (kg)", value: "weight" },
      { text: "Reps", value: "reps" },
    ],
    TABLE_TYPE: [
      { text: "Exercise + workout", value: "combined" },
      { text: "Specific exercise", value: "exercise" },
      { text: "Complete workout", value: "workout" },
      { text: "All logs", value: "all" },
    ],
    TIMER_TYPE: [
      { text: "Countdown", value: "countdown" },
      { text: "Interval", value: "interval" },
    ],
    PROTOCOL: [
      { text: "Standard", value: "standard" },
      { text: "Drop set", value: "drop_set" },
      { text: "Myo-reps", value: "myo_reps" },
      { text: "Rest-pause", value: "rest_pause" },
      { text: "Superset", value: "superset" },
      { text: "21s", value: "twentyone" },
    ],
    EXERCISE_TYPE: [
      { text: "Strength", value: "strength" },
      { text: "Timed", value: "timed" },
      { text: "Distance", value: "distance" },
      { text: "Cardio", value: "cardio" },
      { text: "Custom", value: "custom" },
    ],
    PARAMETER_TYPE: [
      { text: "Number", value: "number" },
      { text: "Text", value: "string" },
      { text: "Yes/No", value: "boolean" },
    ],
  },
  SECTIONS: {
    CHART_TYPE: "Chart type",
    TABLE_TYPE: "Table type",
    TARGET: "Target",
    CONFIGURATION: "Configuration",
    DISPLAY_OPTIONS: "Display options",
    ADVANCED_OPTIONS: "Advanced options",
    TIMER_CONFIGURATION: "Timer configuration",
    WORKOUT: "Workout",
    EXERCISE_CONFIGURATION: "Exercise configuration",
    OPTIONS: "Options",
    PRESET: "Preset",
    PROGRESSIVE_OVERLOAD: "Progressive overload",
  },
  CODE_BLOCKS: {
    CHART: "workout-chart",
    TABLE: "workout-log",
    TIMER: "workout-timer",
    DASHBOARD: "workout-dashboard",
    DURATION: "workout-duration",
  },
  DEFAULTS: {
    CHART_DATE_RANGE: 180,
    CHART_DATE_RANGE_MIN: 1,
    CHART_DATE_RANGE_MAX: 365,
    CHART_LIMIT: 100,
    CHART_LIMIT_MIN: 1,
    CHART_LIMIT_MAX: 1000,
    TABLE_LIMIT: 12,
    TABLE_LIMIT_MIN: 1,
    TABLE_LIMIT_MAX: 1000,
    TIMER_DURATION: 90,
    TIMER_DURATION_MIN: 1,
    TIMER_DURATION_MAX: 3600,
    TIMER_INTERVAL: 30,
    TIMER_INTERVAL_MIN: 1,
    TIMER_INTERVAL_MAX: 3600,
    TIMER_ROUNDS: 5,
    TIMER_ROUNDS_MIN: 1,
    TIMER_ROUNDS_MAX: 100,
  },
} as const;

/**
 * Settings UI labels - section headers, field labels, descriptions, and messages
 */
export const SETTINGS_UI = {
  LABELS: {
    CSV_PATH: "CSV log file path",
    EXERCISE_FOLDER: "Exercise folder path",
    DEFAULT_EXACT_MATCH: "Default exact match",
    TIMER_PRESETS: "Timer presets",
    DEFAULT_TIMER_PRESET: "Default timer preset",
    PRESET_NAME: "Preset name",
    PRESET_TYPE: "Timer type",
    PRESET_DURATION: "Duration (seconds)",
    PRESET_INTERVAL: "Interval time (seconds)",
    PRESET_ROUNDS: "Rounds",
    PRESET_SHOW_CONTROLS: "Show controls",
    PRESET_AUTO_START: "Auto start",
    PRESET_SOUND: "Sound",
    EXERCISE_BLOCK_TEMPLATE: "Exercise block template",
    WEIGHT_INCREMENT: "Weight increment (kg)",
    CUSTOM_PROTOCOLS: "Custom protocols",
    PROTOCOL_NAME: "Protocol name",
    PROTOCOL_ABBREVIATION: "Abbreviation",
    PROTOCOL_COLOR: "Badge color",
    SET_DURATION: "Default set duration (seconds)",
    SHOW_QUICK_LOG_RIBBON: "Show create log ribbon icon",
    QUICK_WEIGHT_INCREMENT: "Weight buttons increment (kg)",
    CREATE_MUSCLE_TAGS_CSV: "Muscle tags CSV file",
  },
  DESCRIPTIONS: {
    CSV_PATH: "Path to the CSV file containing all workout log data",
    EXERCISE_FOLDER: "Path to the folder containing exercise pages",
    CREATE_CSV: "Create a new CSV log file with sample data",
    DEFAULT_EXACT_MATCH:
      "When enabled, exercise filtering uses exact name matching by default. Disable for fuzzy matching.",
    TIMER_PRESETS: "Create and manage reusable timer presets",
    DEFAULT_TIMER_PRESET: "Select a default preset for new timers",
    NO_PRESETS:
      "No timer presets configured. Click 'Add preset' to create one.",
    EXERCISE_BLOCK_TEMPLATE:
      "Template for exercise blocks. Available placeholders: {{exercise}}, {{duration}}, {{workout}}, {{preset}}",
    WEIGHT_INCREMENT:
      "Default weight increment for progressive overload (e.g., 2.5 for 2.5kg increments)",
    CUSTOM_PROTOCOLS:
      "Create custom workout protocols to track specialized training techniques",
    NO_CUSTOM_PROTOCOLS:
      "No custom protocols configured. Click 'Add protocol' to create one.",
    PROTOCOL_ABBREVIATION:
      "Short abbreviation shown in badge (max 3 characters)",
    PROTOCOL_COLOR: "Badge background color (hex format, e.g., #FF5733)",
    SET_DURATION:
      "Default time per set used in workout duration estimation (typical range: 30-60 seconds)",
    SHOW_QUICK_LOG_RIBBON:
      "Show a dumbbell icon in the left ribbon to open the create workout log modal",
    QUICK_WEIGHT_INCREMENT:
      "Weight increment used by +/- buttons in create/edit workout log modals (e.g., 2.5 for +2.5 / -2.5)",
    CREATE_MUSCLE_TAGS_CSV:
      "Create a CSV file with default muscle tag mappings. Edit this file to add custom tags in any language.",
    CONFIRM_OVERWRITE_MUSCLE_TAGS:
      "A muscle tags CSV file already exists. Do you want to overwrite it with default values? This will remove any custom tags.",
  },
  SECTIONS: {
    CSV_MANAGEMENT: "CSV file management",
    FILTERING: "Filtering",
    TIMER_PRESETS: "Timer presets",
    TEMPLATES: "Templates",
    PROGRESSIVE_OVERLOAD: "Progressive overload",
    CUSTOM_PROTOCOLS: "Custom protocols",
    DURATION_ESTIMATION: "Duration estimation",
    QUICK_LOG: "Mobile logging",
  },
  BUTTONS: {
    ADD_PRESET: "Add preset",
    DELETE_PRESET: "Delete",
    SAVE_PRESET: "Save",
    CANCEL: "Cancel",
    ADD_PROTOCOL: "Add protocol",
    SAVE_PROTOCOL: "Save",
    CREATE_MUSCLE_TAGS: "Create muscle tags",
  },
  OPTIONS: {
    NONE: "None",
  },
  MESSAGES: {
    PRESET_NAME_REQUIRED: "Preset name is required",
    PRESET_NAME_EXISTS: "A preset with this name already exists",
    PRESET_DELETED: "Preset deleted",
    PRESET_SAVED: "Preset saved",
    CONFIRM_DELETE_PRESET: "Are you sure you want to delete this preset?",
    PROTOCOL_NAME_REQUIRED: "Protocol name is required",
    PROTOCOL_ABBREVIATION_REQUIRED:
      "Abbreviation is required (max 3 characters)",
    PROTOCOL_COLOR_REQUIRED: "Badge color is required",
    PROTOCOL_NAME_EXISTS: "A protocol with this name already exists",
    PROTOCOL_DELETED: "Protocol deleted",
    PROTOCOL_SAVED: "Protocol saved",
    CONFIRM_DELETE_PROTOCOL: "Are you sure you want to delete this protocol?",
  },
} as const;

/**
 * Table UI labels - column headers, labels, messages, and icons
 */
export const TABLE_UI = {
  COLUMNS: {
    DATE: "Date",
    EXERCISE: "Exercise",
    REPS: "Rep",
    WEIGHT: "Wgt",
    VOLUME: "Vol",
    DURATION: "Dur",
    DISTANCE: "Dist",
    HEART_RATE: "HR",
    NOTES: "Notes",
    PROTOCOL: "Prot",
    ACTIONS: "Act",
  },
  LABELS: {
    DATA: "Date",
    VOLUME: "Volume",
    WEIGHT: "Weight",
    REPETITIONS: "Repetitions",
    DURATION: "Duration",
    DISTANCE: "Distance",
    HEART_RATE: "Heart rate",
    NO_DATA: "No data available",
    INVALID_DATE: "Invalid date",
    NOT_AVAILABLE: "N/A",
    TREND_LINE: "Trend Line",
  },
  /** Abbreviated labels for mobile/compact display */
  LABELS_SHORT: {
    VOLUME: "Vol",
    WEIGHT: "Wgt",
    REPETITIONS: "Rep",
    DURATION: "Dur",
    DISTANCE: "Dist",
    HEART_RATE: "HR",
    SETS: "Sets",
  },
  ICONS: {
    REPS: "🔁 ",
    WEIGHT: "🏋️ ",
    VOLUME: "📊 ",
    DURATION: "⏱️ ",
    DISTANCE: "📍 ",
    HEART_RATE: "❤️ ",
    EDIT: "✏️",
    DELETE: "🗑️",
    GOTO: "🔗",
  },
  DEFAULT_VISIBLE_COLUMNS: ["Date", "Reps", "Weight", "Volume", "Notes"],
  MESSAGES: {
    DELETE_CONFIRM: "Are you sure you want to delete this log entry?",
    DELETE_SUCCESS: "Log entry deleted successfully!",
    DELETE_ERROR: "Error deleting log entry: ",
    REFRESH_SUCCESS: "Table refreshed successfully",
    GOTO_EXERCISE: "Go to exercise",
    EDIT_TITLE: "Edit log entry",
    DELETE_TITLE: "Delete log entry",
  },
} as const;

/**
 * Chart UI labels - axis labels, legend entries, and display text
 */
export const CHARTS_UI = {
  LABELS: {
    REPS: "Reps",
    DATE: "Date",
    TREND_LINE: "Trend line",
    UP: "up",
    DOWN: "down",
    NEUTRAL: "neutral",
    /** @deprecated Use TREND_TITLE instead for dynamic type support */
    TREND_TITLE_PREFIX: "Trend Volume: ",
    /** Dynamic trend title based on data type */
    TREND_TITLE: (dataType?: CHART_DATA_TYPE) => {
      const typeName = dataType ? DATA_TYPE_NAMES[dataType] : "Volume";
      return `Trend ${typeName}: `;
    },
    OVERALL_VARIATION_PREFIX: "Overall variation: ",
    /** @deprecated Use VARIATION_FROM_TO_FORMATTED for dynamic unit support */
    VARIATION_FROM_TO: (startValue: string, endValue: string) =>
      ` (da ${startValue} a ${endValue})`,
    /** Dynamic variation display with proper units */
    VARIATION_FROM_TO_FORMATTED: (startValue: string, endValue: string) =>
      ` (da ${startValue} a ${endValue})`,
    /** @deprecated Use VARIATION_SINGLE_VALUE_FORMATTED for dynamic type support */
    VARIATION_SINGLE_VALUE: (value: string) => ` (Volume: ${value})`,
    /** Dynamic single value display */
    VARIATION_SINGLE_VALUE_FORMATTED: (
      value: string,
      dataType?: CHART_DATA_TYPE,
    ) => {
      const typeName = dataType ? DATA_TYPE_NAMES[dataType] : "Volume";
      return ` (${typeName}: ${value})`;
    },
    /** @deprecated Use VARIATION_VALUE_LABEL_FORMATTED for dynamic type support */
    VARIATION_VALUE_LABEL: (value: string) => `Volume: ${value}`,
    /** Dynamic value label */
    VARIATION_VALUE_LABEL_FORMATTED: (
      value: string,
      dataType?: CHART_DATA_TYPE,
    ) => {
      const typeName = dataType ? DATA_TYPE_NAMES[dataType] : "Volume";
      return `${typeName}: ${value}`;
    },
    SIGNIFICANT_INCREASE: "Aumento signif.",
    FALLBACK_TABLE_MESSAGE:
      "fallback table (charts plugin not available or error)",
  },
  TYPES: {
    VOLUME: "volume",
    WEIGHT: "weight",
    REPS: "reps",
  },
};

/**
 * Timer UI labels - timer types and related display text
 */
export const TIMER_UI = {
  TYPES: {
    COUNTDOWN: "Countdown",
    INTERVAL: "Interval",
  },
} as const;

/**
 * Dashboard UI labels - section titles, metrics, and display text
 */
export const DASHBOARD_UI = {
  QUICK_ACTIONS: {
    TITLE: "Quick actions",
    ADD_WORKOUT_LOG: "Add workout log",
    VIEW_EXERCISES: "View exercises",
  },
  QUICK_STATS: {
    TITLE: "Quick stats",
    PERIODS: {
      WEEK: "This week",
      MONTH: "This month",
      YEAR: "This year",
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
    TOTAL_WORKOUTS: "Total workouts",
    CURRENT_STREAK: "Current streak",
    CURRENT_STREAK_SUFFIX: "weeks",
    TOTAL_VOLUME: "Total volume",
    TOTAL_VOLUME_SUFFIX: "kg",
    PERSONAL_RECORDS: "Personal records",
  },
  VOLUME_ANALYTICS: {
    TITLE: "Volume analytics",
    DATASET_LABEL: "Daily volume (kg)",
    CHART_TITLE: "Volume trend (last 30 days)",
    MUSCLE_BREAKDOWN_TITLE: "Top exercises by volume",
    VOLUME_SUFFIX: "kg",
  },
  PROTOCOL_DISTRIBUTION: {
    TITLE: "Protocol distribution",
    SUBTITLE: "Last 30 days",
    NO_DATA: "No protocol data available",
    SETS_LABEL: "sets",
    PERCENT_LABEL: "%",
    FILTER_ACTIVE: "Filtering by:",
    CLEAR_FILTER: "Clear filter",
    CLICK_TO_FILTER: "Click to filter",
  },
  PROTOCOL_EFFECTIVENESS: {
    TITLE: "Protocol effectiveness",
    NO_DATA: "Not enough data (minimum 5 entries per protocol)",
    DISCLAIMER: "Note: Correlation does not imply causation",
    COLUMN_PROTOCOL: "Protocol",
    COLUMN_ENTRIES: "Entries",
    COLUMN_VOLUME_CHANGE: "Avg volume change",
    COLUMN_PROGRESSION: "Progression rate",
  },
  DURATION_COMPARISON: {
    TITLE: "Actual vs estimated duration",
    SUBTITLE: "Last 5 workouts",
    NO_DATA: "Not enough workout data to compare durations",
    COLUMN_WORKOUT: "Workout",
    COLUMN_DATE: "Date",
    COLUMN_ESTIMATED: "Estimated",
    COLUMN_ACTUAL: "Actual",
    COLUMN_VARIANCE: "Variance",
    VARIANCE_TREND_TITLE: "Accuracy trend",
    VARIANCE_TREND_IMPROVING: "Estimates are getting more accurate",
    VARIANCE_TREND_DECLINING: "Estimates are getting less accurate",
    VARIANCE_TREND_STABLE: "Estimate accuracy is stable",
    MINUTES_SUFFIX: "m",
    OVER_ESTIMATED: "Over",
    UNDER_ESTIMATED: "Under",
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
} as const;

/**
 * Messages displayed to users - notifications, warnings, errors, and status messages
 */
export const MESSAGES_UI = {
  NO_DATA: "No workout data available",
  LOADING: "Loading workout data...",
  NO_DATA_PERIOD: "No workout data found for the selected time period.",
  TIMER_COMPLETED: "Timer completed!",
  WARNINGS: {
    IMBALANCE_ALERTS: "Imbalance alerts",
  },
  SUCCESS: {
    NO_IMBALANCES: "No major muscle imbalances detected",
    CSV_CREATED: "CSV log file created successfully!",
    CODE_INSERTED: "Code inserted successfully!",
    MUSCLE_TAGS_CSV_CREATED: "Muscle tags CSV file created successfully!",
    TAG_REFERENCE_GENERATED:
      "Muscle tags reference note generated successfully!",
  },
  ERRORS: {
    CSV_NOT_FOUND: "CSV log file not found",
    FILE_EMPTY: "File is empty",
    NO_FRONTMATTER: "No frontmatter found",
    NO_TAGS: "No tags found",
    MUSCLE_TAGS_CSV_FAILED: (error: string) =>
      `Error creating muscle tags CSV: ${error}`,
    TAG_REFERENCE_FAILED: (error: string) =>
      `Error generating tag reference note: ${error}`,
  },
  STATUS: {
    INSUFFICIENT_DATA: "Insufficient data",
  },
} as const;

/**
 * Form-related labels and placeholders
 */
export const FORMS_UI = {
  LABELS: {
    EXERCISE_NAME: "Exercise name",
    WORKOUT_NAME: "Workout name:",
  },
  PLACEHOLDERS: {
    ENTER_EXERCISE_NAME: "Enter exercise name",
    ENTER_CSV_PATH: "Enter CSV file path",
    ENTER_FOLDER_PATH: "Enter folder path",
  },
} as const;

/**
 * Statistics display labels
 */
export const STATS_UI = {
  LABELS: {
    SESSIONS: "Sessions: ",
    RECENT_TREND: "Recent trend: ",
    AVG_VOLUME: "Average volume: ",
  },
} as const;

/**
 * Trend-related labels and status indicators
 */
export const TRENDS_UI = {
  STATUS: {
    STABLE: "Stable",
    INVARIANT: "Invariant",
    INCREASING: "Increasing",
    DECREASING: "Decreasing",
    IMPROVING: "Improving",
    DECLINING: "Declining",
    STABLE_LOWER: "Stable (lower)",
    STABLE_HIGHER: "Stable (higher)",
  },
  DIRECTIONS: {
    UP: "up",
    DOWN: "down",
    NEUTRAL: "neutral",
  },
} as const;

/**
 * Time period labels
 */
export const TIME_PERIODS_UI = {
  WEEK: "Week",
  MONTH: "Month",
  YEAR: "Year",
} as const;

/**
 * Common/shared UI labels and values
 */
export const COMMON_UI = {
  UNITS: {
    WEIGHT_KG: "Weight (kg)",
  },
  TYPES: {
    EXERCISE: "exercise",
    WORKOUT: "workout",
  },
  DEFAULTS: {
    UNKNOWN: "Unknown",
    EXERCISE_NAME: "exercise",
    WORKOUT_NAME: "Workout",
  },
  NOT_AVAILABLE: "N/A",
} as const;

/**
 * Command names/labels
 */
export const COMMANDS_UI = {
  CREATE_CSV: "Create CSV log file",
  INSERT_TABLE: "Insert workout table",
  AUDIT_EXERCISE_NAMES: "Audit exercise names",
  ADD_EXERCISE_BLOCK: "Add exercise block",
  QUICK_LOG: "Quick log",
  EXPORT_WORKOUT_TO_CANVAS: "Export workout to canvas",
  MIGRATE_EXERCISE_TYPES: "Migrate exercise types",
  CONVERT_EXERCISE: "Convert exercise data",
  MANAGE_MUSCLE_TAGS: "Manage muscle tags",
  GENERATE_TAG_REFERENCE: "Generate tag reference note",
} as const;

/**
 * Command descriptions
 */
export const DESCRIPTIONS_UI = {
  INSERT_TABLE:
    "This will insert a comprehensive workout dashboard with statistics, charts, and quick actions.",
} as const;

/**
 * General UI labels - common labels used across multiple features
 */
export const GENERAL_UI = {
  LABELS: {
    TOTAL_VOLUME: "Total volume (kg)",
    AVG_VOLUME: "Average volume (kg)",
    TOTAL_WEIGHT: "Total weight (kg)",
    AVG_WEIGHT: "Average weight (kg)",
    TOTAL_REPS: "Total reps",
    AVG_REPS: "Average reps",
    WORKOUTS: "Workouts",
    SEARCH: "Search",
    FRONT: "Front",
    BACK: "Back",
    MUSCLE_HEAT_MAP: "Muscle heat map",
    WORKOUT_DATA: "Workout data",
    WORKOUT_LOG: "Workout log",
    CURRENT_FILE: "Current file",
    DASHBOARD: "Dashboard",
  },
  ACTIONS: {
    EDIT_WORKOUT: "Edit workout",
    DELETE_WORKOUT: "Delete workout",
    EXPORT: "📸 Export",
    ADD: "Add",
    ADD_LOG: "Add log",
    EDIT: "Edit",
    EDIT_LOG_ENTRY: "Edit log entry",
    DELETE: "Delete",
    DELETE_LOG_ENTRY: "Delete log entry",
    DELETE_CONFIRM: "Are you sure you want to delete this log entry?",
    DELETE_SUCCESS: "Log entry deleted successfully!",
    DELETE_ERROR: "Error deleting log entry: ",
    REFRESH_SUCCESS: "Table refreshed successfully",
    CREATE_FILE: "Create file",
  },
  LOGS: {
    NO_DATA_TITLE: (exerciseName?: string) =>
      `No logs found for ${exerciseName && exerciseName.trim().length > 0 ? exerciseName : "exercise"}`,
    CREATE_FIRST_LOG_BUTTON_TEXT: (exerciseName?: string) =>
      `Create first log for ${exerciseName && exerciseName.trim().length > 0 ? exerciseName : "exercise"}`,
    CREATE_FIRST_LOG_BUTTON_ARIA: (exerciseName?: string) =>
      `Create first log for ${exerciseName && exerciseName.trim().length > 0 ? exerciseName : "exercise"}`,
    ADD_LOG_BUTTON_TEXT: (exerciseName?: string) =>
      `Add log for ${exerciseName && exerciseName.trim().length > 0 ? exerciseName : "Workout"}`,
    ADD_LOG_BUTTON_ARIA: (exerciseName?: string) =>
      `Add log for ${exerciseName && exerciseName.trim().length > 0 ? exerciseName : "Workout"}`,
    CREATE_LOG_BUTTON_TEXT: (exerciseName: string) =>
      `Create log for: ${exerciseName}`,
    CREATE_LOG_BUTTON_ARIA: (exerciseName: string) =>
      `Create log for ${exerciseName}`,
    NO_MATCH_MESSAGE: "No matching exercise data found",
  },
} as const;

/**
 * Aggregated UI_LABELS export for backward compatibility
 * Groups all UI labels by domain
 */
export const UI_LABELS = {
  MODAL: MODAL_UI,
  SETTINGS: SETTINGS_UI,
  TABLE: TABLE_UI,
  CHARTS: CHARTS_UI,
  TIMER: TIMER_UI,
  DASHBOARD: DASHBOARD_UI,
  GENERAL: GENERAL_UI,
  MESSAGES: MESSAGES_UI,
  FORMS: FORMS_UI,
  STATS: STATS_UI,
  TRENDS: TRENDS_UI,
  TIME_PERIODS: TIME_PERIODS_UI,
  COMMON: COMMON_UI,
  COMMANDS: COMMANDS_UI,
  DESCRIPTIONS: DESCRIPTIONS_UI,
  ICONS,
  EMOJI,
} as const;
