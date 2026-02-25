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
 *
 * INTERNATIONALIZATION (i18n):
 * All user-facing strings are now internationalized using LocalizationService.
 * Translations are loaded from app/i18n/locales/*.json files.
 * The plugin automatically detects the user's language from Obsidian settings.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { ParameterUtils } from "@app/utils/parameter/ParameterUtils";
import { t } from "@app/i18n";

/**
 * Gets the current weight unit from settings (kg or lb)
 * @returns The current weight unit string
 */
function getWeightUnit(): string {
  // ParameterUtils stores the current weight unit set from plugin settings
  return ParameterUtils.getWeightUnit();
}

/**
 * Gets dynamic unit map based on current settings.
 * Returns units for each data type, with weight/volume units respecting user settings.
 * @returns Record mapping data types to their display units
 */
export function getUnitsMap(): Record<CHART_DATA_TYPE, string> {
  const weightUnit = getWeightUnit();
  return {
    [CHART_DATA_TYPE.VOLUME]: weightUnit,
    [CHART_DATA_TYPE.WEIGHT]: weightUnit,
    [CHART_DATA_TYPE.REPS]: "",
    [CHART_DATA_TYPE.DURATION]: t("common.sec"),
    [CHART_DATA_TYPE.DISTANCE]: t("common.km"),
    [CHART_DATA_TYPE.PACE]: t("common.minPerKm"),
    [CHART_DATA_TYPE.HEART_RATE]: t("common.bpm"),
  };
}

/**
 * Gets dynamic column labels based on current settings.
 * Returns labels with proper units for table headers and statistics titles.
 * @returns Record mapping data types to their display labels with units
 */
export function getColumnLabels(): Record<CHART_DATA_TYPE, string> {
  const weightUnit = getWeightUnit();
  return {
    [CHART_DATA_TYPE.VOLUME]: t("table.columns.volumeUnit", { weightUnit }),
    [CHART_DATA_TYPE.WEIGHT]: t("table.columns.weightUnit", { weightUnit }),
    [CHART_DATA_TYPE.REPS]: t("table.columns.reps"),
    [CHART_DATA_TYPE.DURATION]: t("table.columns.duration"),
    [CHART_DATA_TYPE.DISTANCE]: t("table.columns.distanceUnit", {
      distanceUnit: "km",
    }),
    [CHART_DATA_TYPE.PACE]: t("table.columns.pace"),
    [CHART_DATA_TYPE.HEART_RATE]: t("table.columns.heartRate"),
  };
}

/**
 * Simple data type names without units, used for trend titles and labels
 */
export const DATA_TYPE_NAMES: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: t("charts.types.volume"),
  [CHART_DATA_TYPE.WEIGHT]: t("charts.types.weight"),
  [CHART_DATA_TYPE.REPS]: t("charts.types.reps"),
  [CHART_DATA_TYPE.DURATION]: t("charts.types.duration"),
  [CHART_DATA_TYPE.DISTANCE]: t("charts.types.distance"),
  [CHART_DATA_TYPE.PACE]: t("charts.types.pace"),
  [CHART_DATA_TYPE.HEART_RATE]: t("charts.types.heartRate"),
} as const;

/**
 * Gets dynamic modal labels with proper weight unit.
 * Returns label strings that include weight units, adjusted based on settings.
 * @returns Object with dynamic weight-related labels
 */
export function getDynamicModalLabels() {
  const weightUnit = getWeightUnit();
  return {
    WEIGHT: t("modal.labels.weight", { unit: weightUnit }),
    TARGET_WEIGHT: t("modal.labels.targetWeight", { unit: weightUnit }),
  };
}

/**
 * Gets dynamic select options with proper weight unit.
 * Returns select dropdown options with correct units in display text.
 * @returns Array of select options for data type dropdown
 */
export function getDynamicDataTypeOptions() {
  const weightUnit = getWeightUnit();
  return [
    { text: t("modal.labels.volume", { unit: weightUnit }), value: "volume" },
    { text: t("modal.labels.weight", { unit: weightUnit }), value: "weight" },
    { text: t("modal.labels.reps"), value: "reps" },
  ];
}

/**
 * Modal UI labels - titles, buttons, labels, placeholders, and checkboxes
 */
export const MODAL_UI = {
  LABELS: {
    TARGET_REPS: t("modal.labels.targetReps"),
  },
  SELECT_OPTIONS: {
    CHART_TYPE: [
      {
        get label() {
          return t("modal.selectOptions.completeWorkout");
        },
        value: "workout",
      },
      {
        get label() {
          return t("modal.selectOptions.specificExercise");
        },
        value: "exercise",
      },
    ],
    get DATA_TYPE() {
      return getDynamicDataTypeOptions();
    },
    TABLE_TYPE: [
      {
        get label() {
          return t("modal.selectOptions.exerciseWorkout");
        },
        value: "combined",
      },
      {
        get label() {
          return t("modal.selectOptions.specificExercise");
        },
        value: "exercise",
      },
      {
        get label() {
          return t("modal.selectOptions.completeWorkout");
        },
        value: "workout",
      },
      {
        get label() {
          return t("modal.selectOptions.allLogs");
        },
        value: "all",
      },
    ],
    PROTOCOL: [
      {
        get text() {
          return t("modal.selectOptions.standard");
        },
        value: "standard",
      },
      {
        get text() {
          return t("modal.selectOptions.dropSet");
        },
        value: "drop_set",
      },
      {
        get text() {
          return t("modal.selectOptions.myoReps");
        },
        value: "myo_reps",
      },
      {
        get text() {
          return t("modal.selectOptions.restPause");
        },
        value: "rest_pause",
      },
      {
        get text() {
          return t("modal.selectOptions.superset");
        },
        value: "superset",
      },
      {
        get text() {
          return t("modal.selectOptions.twentyones");
        },
        value: "twentyone",
      },
    ],
    EXERCISE_TYPE: [
      {
        get text() {
          return t("modal.selectOptions.strength");
        },
        value: "strength",
      },
      {
        get text() {
          return t("modal.selectOptions.timed");
        },
        value: "timed",
      },
      {
        get text() {
          return t("modal.selectOptions.distance");
        },
        value: "distance",
      },
      {
        get text() {
          return t("modal.selectOptions.cardio");
        },
        value: "cardio",
      },
      {
        get text() {
          return t("modal.selectOptions.custom");
        },
        value: "custom",
      },
    ],
    PARAMETER_TYPE: [
      {
        get text() {
          return t("modal.selectOptions.number");
        },
        value: "number",
      },
      {
        get text() {
          return t("modal.selectOptions.text");
        },
        value: "string",
      },
      {
        get text() {
          return t("modal.selectOptions.yesNo");
        },
        value: "boolean",
      },
    ],
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
 * Gets dynamic settings labels with proper weight unit.
 * Returns label strings that include weight units, adjusted based on settings.
 * @returns Object with dynamic weight-related settings labels
 */
export function getDynamicSettingsLabels() {
  const weightUnit = getWeightUnit();
  return {
    WEIGHT_INCREMENT: t("charts.labels.weightIncrementUnit", { weightUnit }),
    QUICK_WEIGHT_INCREMENT: t("charts.labels.quickWeightIncrementUnit", {
      weightUnit,
    }),
  };
}

/**
 * Table UI labels - column headers, labels, messages, and icons
 */
export const TABLE_UI = {
  /** Column definitions with translated labels and technical identifiers */
  COLUMN_DEFS: {
    DATE: {
      get label() {
        return t("table.columnLabels.date");
      },
      value: "Date",
    },
    EXERCISE: {
      get label() {
        return t("table.columnLabels.exercise");
      },
      value: "Exercise",
    },
    REPS: {
      get label() {
        return t("table.columnLabels.reps");
      },
      value: "Rep",
    },
    WEIGHT: {
      get label() {
        return t("table.columnLabels.weight");
      },
      value: "Wgt",
    },
    VOLUME: {
      get label() {
        return t("table.columnLabels.volume");
      },
      value: "Vol",
    },
    DURATION: {
      get label() {
        return t("table.columnLabels.duration");
      },
      value: "Dur",
    },
    DISTANCE: {
      get label() {
        return t("table.columnLabels.distance");
      },
      value: "Dist",
    },
    HEART_RATE: {
      get label() {
        return t("table.columnLabels.heartRate");
      },
      value: "HR",
    },
    NOTES: {
      get label() {
        return t("table.columnLabels.notes");
      },
      value: "Notes",
    },
    PROTOCOL: {
      get label() {
        return t("table.columnLabels.protocol");
      },
      value: "Prot",
    },
    ACTIONS: {
      get label() {
        return t("table.columnLabels.actions");
      },
      value: "Act",
    },
  },

  DEFAULT_VISIBLE_COLUMNS: ["Date", "Reps", "Weight", "Volume", "Notes"],
} as const;

/**
 * Maps technical column identifiers to their translated labels
 * Handles identifiers with units (e.g., "Wgt (kg)" → "Weight (kg)" or "Peso (kg)")
 * @param identifiers - Array of technical column identifiers (e.g., ["Rep", "Wgt (kg)"])
 * @returns Array of translated column labels
 */
export function mapColumnIdentifiersToLabels(identifiers: string[]): string[] {
  const columnDefsMap = new Map<string, string>();

  // Build reverse map from value to label
  Object.values(TABLE_UI.COLUMN_DEFS).forEach((def) => {
    columnDefsMap.set(def.value, def.label);
  });

  // Map identifiers to labels, preserving units in parentheses
  return identifiers.map((id) => {
    // Check if identifier has a unit in parentheses (e.g., "Wgt (kg)")
    const unitMatch = id.match(/^(.+?)\s+(\(.+\))$/);

    if (unitMatch) {
      // Extract base identifier and unit
      const baseId = unitMatch[1];
      const unit = unitMatch[2];

      // Map base identifier to label and append unit
      const label = columnDefsMap.get(baseId);
      return label ? `${label} ${unit}` : id;
    }

    // No unit, direct mapping
    return columnDefsMap.get(id) || id;
  });
}

/**
 * Chart UI labels - axis labels, legend entries, and display text
 */
export const CHARTS_UI = {
  LABELS: {
    /** Dynamic trend title based on data type */
    TREND_TITLE: (dataType?: CHART_DATA_TYPE) => {
      const typeName = dataType
        ? DATA_TYPE_NAMES[dataType]
        : t("charts.types.volume");
      return t("charts.trendType", { typeName });
    },

    /** Dynamic variation display with proper units */
    VARIATION_FROM_TO_FORMATTED: (startValue: string, endValue: string) =>
      t("charts.variationFromTo", { startValue, endValue }),
    /** Dynamic single value display */
    VARIATION_SINGLE_VALUE_FORMATTED: (
      value: string,
      dataType?: CHART_DATA_TYPE,
    ) => {
      const typeName = dataType
        ? DATA_TYPE_NAMES[dataType]
        : t("charts.types.volume");
      return ` (${typeName}: ${value})`;
    },
    /** Dynamic value label */
    VARIATION_VALUE_LABEL_FORMATTED: (
      value: string,
      dataType?: CHART_DATA_TYPE,
    ) => {
      const typeName = dataType
        ? DATA_TYPE_NAMES[dataType]
        : t("charts.types.volume");
      return `${typeName}: ${value}`;
    },
  },
};

/**
 * Gets dynamic dashboard labels with proper weight unit.
 * Returns label strings that include weight units, adjusted based on settings.
 * @returns Object with dynamic dashboard labels organized by section
 */
export function getDynamicDashboardLabels() {
  const weightUnit = getWeightUnit();
  return {
    QUICK_STATS: {
      METRICS: {
        TOTAL_VOLUME: t("general.labels.totalVolume", { weightUnit }),
        AVG_VOLUME: t("general.labels.avgVolume", { weightUnit }),
      },
    },
    RECENT_WORKOUTS: {
      VOLUME_SUFFIX: weightUnit,
    },
    SUMMARY: {
      TOTAL_VOLUME_SUFFIX: weightUnit,
    },
    VOLUME_ANALYTICS: {
      DATASET_LABEL: t("general.labels.dailyVolume", { weightUnit }),
      VOLUME_SUFFIX: weightUnit,
    },
  };
}

/**
 * Dashboard UI labels - section titles, metrics, and display text
 */
export const DASHBOARD_UI = {
  QUICK_STATS: {
    METRICS: {
      get TOTAL_VOLUME() {
        return getDynamicDashboardLabels().QUICK_STATS.METRICS.TOTAL_VOLUME;
      },
      get AVG_VOLUME() {
        return getDynamicDashboardLabels().QUICK_STATS.METRICS.AVG_VOLUME;
      },
    },
  },
  RECENT_WORKOUTS: {
    get VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().RECENT_WORKOUTS.VOLUME_SUFFIX;
    },
  },
  SUMMARY: {
    get TOTAL_VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().SUMMARY.TOTAL_VOLUME_SUFFIX;
    },
  },
  VOLUME_ANALYTICS: {
    get DATASET_LABEL() {
      return getDynamicDashboardLabels().VOLUME_ANALYTICS.DATASET_LABEL;
    },
    get VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().VOLUME_ANALYTICS.VOLUME_SUFFIX;
    },
  },
} as const;

/**
 * Gets dynamic general UI labels with proper weight unit.
 * @returns Object with dynamic weight-related general labels
 */
export function getDynamicGeneralLabels() {
  const weightUnit = getWeightUnit();
  return {
    LABELS: {
      TOTAL_VOLUME: t("general.labels.totalVolume", { weightUnit }),
      AVG_VOLUME: t("general.labels.avgVolume", { weightUnit }),
      TOTAL_WEIGHT: t("general.labels.totalWeight", { weightUnit }),
      AVG_WEIGHT: t("general.labels.avgWeight", { weightUnit }),
    },
  };
}

/**
 * General UI labels - common labels used across multiple features
 */
export const GENERAL_UI = {
  LABELS: {
    get TOTAL_VOLUME() {
      return getDynamicGeneralLabels().LABELS.TOTAL_VOLUME;
    },
    get AVG_VOLUME() {
      return getDynamicGeneralLabels().LABELS.AVG_VOLUME;
    },
    get TOTAL_WEIGHT() {
      return getDynamicGeneralLabels().LABELS.TOTAL_WEIGHT;
    },
    get AVG_WEIGHT() {
      return getDynamicGeneralLabels().LABELS.AVG_WEIGHT;
    },
  },
} as const;
