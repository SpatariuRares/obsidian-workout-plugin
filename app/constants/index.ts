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
  MODAL_UI,
  TABLE_UI,
  CHARTS_UI,
  DASHBOARD_UI,
  GENERAL_UI,
} from "@app/constants/ui.constants";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";

import { MUSCLE_TAG_MAP } from "@app/constants/muscles.constants";

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
      LABELS: {
        TRAINING_ANALYSIS: "Training analysis",
        TOTAL_WORKOUT: "Total workout",
      },
    },
    MUSCLES: {
      TAG_MAP: MUSCLE_TAG_MAP,
    },
    ERRORS: {
      TYPES: ERROR_TYPES,
    },
    LABELS: {
      GENERAL: GENERAL_UI.LABELS,
      TABLE: {
        DATE: TABLE_UI.COLUMN_DEFS.DATE.value,
        EXERCISE: TABLE_UI.COLUMN_DEFS.EXERCISE.value,
        REPS: TABLE_UI.COLUMN_DEFS.REPS.value,
        REPETITIONS: TABLE_UI.COLUMN_DEFS.REPS.label,
        get WEIGHT_WITH_UNIT() {
          return getDynamicTableLabels().WEIGHT_WITH_UNIT;
        },
        VOLUME: TABLE_UI.COLUMN_DEFS.VOLUME.value,
        WEIGHT: TABLE_UI.COLUMN_DEFS.WEIGHT.value,
        get VOLUME_WITH_UNIT() {
          return getDynamicTableLabels().VOLUME_WITH_UNIT;
        },
        TARGET_PREFIX: "Target:",
      },
      DASHBOARD: DASHBOARD_UI,
      CHARTS: CHARTS_UI.LABELS,
    },
    MODAL: MODAL_UI,
    TABLE: {
      COLUMNS: TABLE_UI.COLUMN_DEFS,
      LIMITS: {
        DEFAULT: DEFAULT_TABLE_CONFIG.LIMIT,
        MIN: DEFAULT_TABLE_CONFIG.LIMIT_MIN,
        MAX: DEFAULT_TABLE_CONFIG.LIMIT_MAX,
      },
      DEFAULT_VISIBLE_COLUMNS: TABLE_UI.DEFAULT_VISIBLE_COLUMNS,
      DATE_KEYS: {
        INVALID: "invalid-date",
      },
      DEFAULTS: {
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
