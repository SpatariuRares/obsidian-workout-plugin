/**
 * Constants Barrel Export
 *
 * This module provides a single import point for all constants.
 * Supports both barrel imports and direct module imports:
 *
 * @example
 * // Barrel import (convenient)
 * import { ICONS, DEFAULT_SETTINGS, MUSCLE_TAGS } from '@app/constants';
 *
 * // Direct import (better tree-shaking)
 * import { ICONS } from '@app/constants/ui.constants';
 * import { DEFAULT_SETTINGS } from '@app/constants/defaults.constants';
 */

// Re-export from individual constant modules
export * from "@app/constants/ui.constants";
export * from "@app/constants/defaults.constants";
export * from "@app/constants/muscles.constants";
export * from "@app/constants/validation.constants";
export * from "@app/constants/exerciseTypes.constants";

// Import from modular files for composing CONSTANTS
import {
  ICONS,
  MODAL_UI,
  SETTINGS_UI,
  TABLE_UI,
  CHARTS_UI,
  TIMER_UI,
  DASHBOARD_UI,
  GENERAL_UI,
  MESSAGES_UI,
  FORMS_UI,
  STATS_UI,
  TRENDS_UI,
  TIME_PERIODS_UI,
  COMMON_UI,
  COMMANDS_UI,
  DESCRIPTIONS_UI,
  getColumnLabels,
} from "@app/constants/ui.constants";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

import {
  MUSCLE_NAMES,
  MUSCLE_POSITIONS,
  MUSCLE_GROUPS,
  BODY_PARTS,
  MUSCLE_TAGS,
  MUSCLE_TAG_MAP,
  MUSCLE_KEYWORDS,
} from "@app/constants/muscles.constants";

import { DEFAULT_TABLE_CONFIG } from "@app/constants/defaults.constants";

import { ERROR_TYPES } from "@app/constants/validation.constants";

/**
 * Gets dynamic table labels with proper weight unit.
 * @returns Object with dynamic weight-related table labels
 */
function getDynamicTableLabels() {
  const weightUnit = ParameterUtils.getWeightUnit();
  return {
    WEIGHT_WITH_UNIT: `Weight (${weightUnit})`,
    VOLUME_WITH_UNIT: `Volume (${weightUnit})`,
  };
}

/**
 * Composed CONSTANTS object for backward compatibility.
 * This maintains the same structure as the original Constants.ts
 * but sources content from the new modular constant files.
 *
 * All files import CONSTANTS from '@app/constants' and this ensures
 * they continue to work without any changes.
 */
export const CONSTANTS = {
  WORKOUT: {
    UI: {
      ACTIONS: {
        EDIT_WORKOUT: GENERAL_UI.ACTIONS.EDIT_WORKOUT,
        DELETE_WORKOUT: GENERAL_UI.ACTIONS.DELETE_WORKOUT,
        EXPORT: GENERAL_UI.ACTIONS.EXPORT,
      },
      LABELS: {
        EXERCISES_COUNT: "3 exercises",
        WORKOUT_PROGRESS: "Workout progress",
        TRAINING_ANALYSIS: "Training analysis",
        FRONT: GENERAL_UI.LABELS.FRONT,
        BACK: GENERAL_UI.LABELS.BACK,
        MUSCLE_HEAT_MAP: GENERAL_UI.LABELS.MUSCLE_HEAT_MAP,
        TOTAL_WORKOUT: "Total workout",
        WORKOUT_DATA: GENERAL_UI.LABELS.WORKOUT_DATA,
        WORKOUT_LOG: GENERAL_UI.LABELS.WORKOUT_LOG,
        CURRENT_FILE: GENERAL_UI.LABELS.CURRENT_FILE,
        DASHBOARD: GENERAL_UI.LABELS.DASHBOARD,
      },
      DISPLAY: {
        PERCENTAGE_45: "45%",
      },
      BUTTONS: {
        CREATE_FILE: GENERAL_UI.ACTIONS.CREATE_FILE,
      },
    },
    MESSAGES: {
      NO_DATA: MESSAGES_UI.NO_DATA,
      LOADING: MESSAGES_UI.LOADING,
      NO_DATA_PERIOD: MESSAGES_UI.NO_DATA_PERIOD,
      TIMER_COMPLETED: MESSAGES_UI.TIMER_COMPLETED,
      WARNINGS: MESSAGES_UI.WARNINGS,
      SUCCESS: MESSAGES_UI.SUCCESS,
      ERRORS: MESSAGES_UI.ERRORS,
      STATUS: MESSAGES_UI.STATUS,
    },
    FORMS: {
      LABELS: FORMS_UI.LABELS,
      PLACEHOLDERS: FORMS_UI.PLACEHOLDERS,
    },
    CHARTS: {
      LABELS: {
        REPS: CHARTS_UI.LABELS.REPS,
        DATE: CHARTS_UI.LABELS.DATE,
        TREND_LINE: CHARTS_UI.LABELS.TREND_LINE,
      },
      TYPES: CHARTS_UI.TYPES,
    },
    MUSCLES: {
      NAMES: MUSCLE_NAMES,
      POSITIONS: MUSCLE_POSITIONS,
      GROUPS: MUSCLE_GROUPS,
      BODY_PARTS: BODY_PARTS,
      TAGS: MUSCLE_TAGS,
      TAG_MAP: MUSCLE_TAG_MAP,
      KEYWORDS: MUSCLE_KEYWORDS,
    },
    STATS: {
      LABELS: STATS_UI.LABELS,
    },
    TRENDS: {
      STATUS: TRENDS_UI.STATUS,
      DIRECTIONS: TRENDS_UI.DIRECTIONS,
    },
    TIME_PERIODS: TIME_PERIODS_UI,
    COMMON: COMMON_UI,
    TIMER: {
      TYPES: TIMER_UI.TYPES,
    },
    COMMANDS: COMMANDS_UI,
    DESCRIPTIONS: DESCRIPTIONS_UI,
    SETTINGS: {
      LABELS: SETTINGS_UI.LABELS,
      DESCRIPTIONS: SETTINGS_UI.DESCRIPTIONS,
      SECTIONS: SETTINGS_UI.SECTIONS,
      BUTTONS: SETTINGS_UI.BUTTONS,
      OPTIONS: SETTINGS_UI.OPTIONS,
      MESSAGES: SETTINGS_UI.MESSAGES,
    },
    ERRORS: {
      TYPES: ERROR_TYPES,
    },
    ICONS: ICONS,
    LABELS: {
      GENERAL: GENERAL_UI.LABELS,
      TABLE: {
        DATE: TABLE_UI.COLUMNS.DATE,
        EXERCISE: TABLE_UI.COLUMNS.EXERCISE,
        REPS: TABLE_UI.COLUMNS.REPS,
        REPETITIONS: TABLE_UI.LABELS.REPETITIONS,
        get WEIGHT_WITH_UNIT() {
          return getDynamicTableLabels().WEIGHT_WITH_UNIT;
        },
        VOLUME: TABLE_UI.COLUMNS.VOLUME,
        WEIGHT: TABLE_UI.COLUMNS.WEIGHT,
        get VOLUME_WITH_UNIT() {
          return getDynamicTableLabels().VOLUME_WITH_UNIT;
        },
        NOTES: TABLE_UI.COLUMNS.NOTES,
        ACTIONS: TABLE_UI.COLUMNS.ACTIONS,
        NO_DATA: TABLE_UI.LABELS.NO_DATA,
        INVALID_DATE: TABLE_UI.LABELS.INVALID_DATE,
        NOT_AVAILABLE: TABLE_UI.LABELS.NOT_AVAILABLE,
        TREND_LINE: TABLE_UI.LABELS.TREND_LINE,
        ADD_LOG_BUTTON: "Add log",
        UP: "up",
        DOWN: "down",
        NEUTRAL: "neutral",
        TARGET_PREFIX: "Target:",
      },
      ACTIONS: GENERAL_UI.ACTIONS,
      LOGS: GENERAL_UI.LOGS,
      DASHBOARD: DASHBOARD_UI,
      CHARTS: CHARTS_UI.LABELS,
    },
    MODAL: MODAL_UI,
    TABLE: {
      COLUMNS: TABLE_UI.COLUMNS,
      LABELS: TABLE_UI.LABELS,
      LIMITS: {
        DEFAULT: DEFAULT_TABLE_CONFIG.LIMIT,
        MIN: DEFAULT_TABLE_CONFIG.LIMIT_MIN,
        MAX: DEFAULT_TABLE_CONFIG.LIMIT_MAX,
      },
      ICONS: TABLE_UI.ICONS,
      DEFAULT_VISIBLE_COLUMNS: TABLE_UI.DEFAULT_VISIBLE_COLUMNS,
      MESSAGES: TABLE_UI.MESSAGES,
      DATE_KEYS: {
        INVALID: "invalid-date",
      },
      DEFAULTS: {
        BUTTON_TEXT: DEFAULT_TABLE_CONFIG.BUTTON_TEXT,
        EXACT_MATCH: DEFAULT_TABLE_CONFIG.EXACT_MATCH,
      },
      VALIDATION_ERRORS: {
        LIMIT_RANGE: (min: number, max: number, received: string) =>
          `limit must be a number between ${min} and ${max}, received: "${received}"`,
        COLUMNS_INVALID_TYPE:
          "columns must be an array of strings or a JSON string",
        COLUMNS_NOT_STRINGS: "columns must be an array of strings",
      },
    },
  },
} as const;
