import { TEXT_CONSTANTS } from "@app/constants/TextConstants";
export const MODAL_TITLES = {
  CREATE_LOG: "Create workout log",
  EDIT_LOG: "Edit workout log",
  INSERT_CHART: "Insert workout chart",
  INSERT_TABLE: "Insert workout log table",
  INSERT_TIMER: "Insert workout timer",
  INSERT_DASHBOARD: "Insert workout dashboard",
  CREATE_EXERCISE_PAGE: "Create exercise page",
  CREATE_EXERCISE_SECTION: "Create exercise section",
  CONFIRM_ACTION: "Confirm action",
} as const;

export const MODAL_BUTTONS = {
  CREATE: "Create log",
  UPDATE: "Update log",
  INSERT_CHART: "Insert chart",
  INSERT_TABLE: "Insert table",
  INSERT_TIMER: "Insert timer",
  INSERT_DASHBOARD: "Insert dashboard",
  CANCEL: "Cancel",
  CONFIRM: "Confirm",
  CREATE_EXERCISE: "Create exercise page",
  CREATE_SECTION: "Create section",
} as const;

export const MODAL_NOTICES = {
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
} as const;

export const MODAL_LABELS = {
  EXERCISE: "Exercise:",
  REPS: "Reps:",
  WEIGHT: "Weight (kg):",
  NOTES: "Notes (optional):",
  WORKOUT: "Workout (optional):",
  WORKOUT_NAME: "Workout Name:",
  WORKOUT_NAME_OPTIONAL: "Workout name (optional):",
  CHART_TYPE: "Chart type:",
  DATA_TYPE: "Data type:",
  TABLE_TYPE: "Table Type:",
  DAYS_RANGE: "Days range:",
  DATA_LIMIT: "Data limit:",
  MAX_LOG_COUNT: "Maximum Log Count:",
  TABLE_COLUMNS: "Table Columns:",
  BUTTON_TEXT: "Button Text:",
  CUSTOM_TITLE: "Custom title:",
  TIMER_TYPE: "Timer Type:",
  DURATION: "Duration (seconds):",
  INTERVAL_TIME: "Interval Time (seconds):",
  ROUNDS: "Rounds:",
  TITLE: "Title:",
  EXERCISE_NAME: "Exercise Name:",
  EXERCISE_PATH: "Exercise Path:",
  SETS: "Sets:",
  REST_TIME: "Rest Time (seconds):",
  NOTE: "Note:",
  TAGS: "Tags (comma separated):",
  FOLDER_PATH: "Folder Path (optional):",
  CONFIRM_ACTION: "Confirm action",
} as const;

export const MODAL_PLACEHOLDERS = {
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
} as const;

export const MODAL_CHECKBOXES = {
  USE_CURRENT_WORKOUT: "Use current page as workout",
  USE_CURRENT_WORKOUT_FILE: "Use current workout (file name)",
  SHOW_TREND_LINE: "Show trend line",
  SHOW_TREND_HEADER: "Show trend header",
  SHOW_STATISTICS: "Show statistics",
  SHOW_ADD_BUTTON: "Show 'Add Log' Button",
  EXACT_MATCH: "Exact match",
  DEBUG_MODE: "Debug mode",
  SEARCH_BY_NAME: "Search by file name",
  SHOW_CONTROLS: "Show Controls",
  AUTO_START: "Auto Start",
  SOUND: "Sound",
  INCLUDE_TIMER: "Include Timer",
  INCLUDE_CHART: "Include Chart",
  INCLUDE_TABLE: "Include Table",
  INCLUDE_LOG: "Include Log",
  TIMER_AUTO_START: "Timer Auto Start",
  TIMER_SOUND: "Timer Sound",
} as const;

export const MODAL_EXERCISE_STATUS = {
  CREATE_PAGE: "📝 create exercise page",
  SELECTED: "✅ exercise selected",
  NOT_FOUND: "⚠️ no exercises found",
  FOUND: (count: number) => `📋 ${count} exercises found`,
} as const;

export const MODAL_SELECT_OPTIONS = {
  CHART_TYPE: [
    { text: "Complete workout", value: TEXT_CONSTANTS.COMMON.TYPES.WORKOUT },
    { text: "Specific exercise", value: TEXT_CONSTANTS.COMMON.TYPES.EXERCISE },
  ],
  DATA_TYPE: [
    { text: "Volume (kg)", value: TEXT_CONSTANTS.CHARTS.TYPES.VOLUME },
    { text: TEXT_CONSTANTS.COMMON.UNITS.WEIGHT_KG, value: TEXT_CONSTANTS.CHARTS.TYPES.WEIGHT },
    { text: TEXT_CONSTANTS.CHARTS.LABELS.REPS, value: TEXT_CONSTANTS.CHARTS.TYPES.REPS },
  ],
  TABLE_TYPE: [
    { text: "Exercise + workout", value: "combined" },
    { text: "Specific exercise", value: TEXT_CONSTANTS.COMMON.TYPES.EXERCISE },
    { text: "Complete workout", value: TEXT_CONSTANTS.COMMON.TYPES.WORKOUT },
  ],
  TABLE_COLUMNS: [
    {
      text: "Standard (Date, exercise, reps, weight, volume)",
      value: "standard",
    },
    { text: "Minimal (Date, exercise, reps, weight)", value: "minimal" },
  ],
  TIMER_TYPE: [
    { text: TEXT_CONSTANTS.TIMER.TYPES.COUNTDOWN, value: TEXT_CONSTANTS.TIMER.TYPES.COUNTDOWN_LOWER },
    { text: TEXT_CONSTANTS.TIMER.TYPES.INTERVAL, value: "interval" },
  ],
} as const;

export const MODAL_SECTIONS = {
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
} as const;

export const MODAL_CODE_BLOCKS = {
  CHART: "workout-chart",
  TABLE: "workout-log",
  TIMER: "workout-timer",
  DASHBOARD: "workout-dashboard",
} as const;

export const MODAL_DEFAULT_VALUES = {
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
} as const;
