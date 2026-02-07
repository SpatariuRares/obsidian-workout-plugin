/**
 * @fileoverview Validation Constants
 *
 * This file contains all validation-related constants including:
 * - Error messages for data validation
 * - Validation patterns (regex, numeric limits)
 * - Error type classifications
 * - Form validation messages
 *
 * Part of the Phase 5 refactoring to split Constants.ts into focused modules.
 */

// ============================================================================
// Error Messages
// ============================================================================

/**
 * Error messages for data operations and file handling
 */
export const ERROR_MESSAGES = {
  /** CSV log file not found error */
  CSV_NOT_FOUND: "CSV log file not found",
  /** File is empty error */
  FILE_EMPTY: "File is empty",
  /** No frontmatter found in file */
  NO_FRONTMATTER: "No frontmatter found",
  /** No tags found in file */
  NO_TAGS: "No tags found",
} as const;

/**
 * Error type classifications for error handling
 */
export const ERROR_TYPES = {
  /** Validation error type */
  VALIDATION: "Validation error",
  /** Table-related error type */
  TABLE: "Table error",
  /** Generic error type */
  GENERIC: "Error",
} as const;

// ============================================================================
// Form Validation Messages
// ============================================================================

/**
 * Validation messages for form inputs
 */
export const FORM_VALIDATION = {
  /** Required: Fill in all fields */
  FILL_ALL_FIELDS: "Please fill in all fields with valid values",
  /** Required: Positive values for reps and weight */
  POSITIVE_VALUES: "Please enter valid positive values for reps and weight",
  /** Combined mode requires both fields */
  COMBINED_MODE: "⚠️ for 'exercise + workout' type you must fill both fields!",
  /** Exercise name is required */
  EXERCISE_NAME_REQUIRED: "❌ please enter an exercise name",
  /** Exercise page name is required */
  EXERCISE_PAGE_NAME_REQUIRED: "Please enter an exercise name",
} as const;

// ============================================================================
// Settings Validation Messages
// ============================================================================

/**
 * Validation messages for settings (presets and protocols)
 */
export const SETTINGS_VALIDATION = {
  /** Preset validation messages */
  PRESET: {
    NAME_REQUIRED: "Preset name is required",
    NAME_EXISTS: "A preset with this name already exists",
  },
  /** Protocol validation messages */
  PROTOCOL: {
    NAME_REQUIRED: "Protocol name is required",
    ABBREVIATION_REQUIRED: "Abbreviation is required (max 3 characters)",
    COLOR_REQUIRED: "Badge color is required",
    NAME_EXISTS: "A protocol with this name already exists",
  },
} as const;

// ============================================================================
// Table Validation
// ============================================================================

/**
 * Validation messages for table configuration
 */
export const TABLE_VALIDATION = {
  /** Limit must be within range */
  LIMIT_RANGE: (min: number, max: number, received: string): string =>
    `limit must be a number between ${min} and ${max}, received: "${received}"`,
  /** Columns must be array of strings or JSON */
  COLUMNS_INVALID_TYPE: "columns must be an array of strings or a JSON string",
  /** Column values must be strings */
  COLUMNS_NOT_STRINGS: "columns must be an array of strings",
} as const;

// ============================================================================
// Numeric Validation Limits
// ============================================================================

/**
 * Numeric limits for chart configuration
 */
export const CHART_LIMITS = {
  /** Date range limits */
  DATE_RANGE: {
    DEFAULT: 180,
    MIN: 1,
    MAX: 365,
  },
  /** Data limit limits */
  LIMIT: {
    DEFAULT: 100,
    MIN: 1,
    MAX: 1000,
  },
} as const;

/**
 * Numeric limits for table configuration
 */
export const TABLE_LIMITS = {
  /** Row limit limits */
  LIMIT: {
    DEFAULT: 12,
    MIN: 1,
    MAX: 1000,
  },
  /** General table limits */
  GENERAL: {
    DEFAULT: 50,
    MIN: 1,
    MAX: 1000,
  },
} as const;

/**
 * Numeric limits for timer configuration
 */
export const TIMER_LIMITS = {
  /** Duration limits */
  DURATION: {
    DEFAULT: 90,
    MIN: 1,
    MAX: 3600,
  },
  /** Interval limits */
  INTERVAL: {
    DEFAULT: 30,
    MIN: 1,
    MAX: 3600,
  },
  /** Rounds limits */
  ROUNDS: {
    DEFAULT: 5,
    MIN: 1,
    MAX: 100,
  },
} as const;

// ============================================================================
// Aggregated Export
// ============================================================================

/**
 * Aggregated validation constants for convenient access
 */
export const VALIDATION = {
  ERRORS: ERROR_MESSAGES,
  ERROR_TYPES,
  FORM: FORM_VALIDATION,
  SETTINGS: SETTINGS_VALIDATION,
  TABLE: TABLE_VALIDATION,
  LIMITS: {
    CHART: CHART_LIMITS,
    TABLE: TABLE_LIMITS,
    TIMER: TIMER_LIMITS,
  },
} as const;
