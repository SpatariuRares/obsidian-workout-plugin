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
    [CHART_DATA_TYPE.DURATION]: "sec",
    [CHART_DATA_TYPE.DISTANCE]: "km",
    [CHART_DATA_TYPE.PACE]: "min/km",
    [CHART_DATA_TYPE.HEART_RATE]: "bpm",
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
    [CHART_DATA_TYPE.VOLUME]: `Volume (${weightUnit})`,
    [CHART_DATA_TYPE.WEIGHT]: `Weight (${weightUnit})`,
    [CHART_DATA_TYPE.REPS]: "Reps",
    [CHART_DATA_TYPE.DURATION]: "Duration",
    [CHART_DATA_TYPE.DISTANCE]: "Distance (km)",
    [CHART_DATA_TYPE.PACE]: "Pace (min/km)",
    [CHART_DATA_TYPE.HEART_RATE]: "Heart Rate (bpm)",
  };
}

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
 * Gets dynamic modal labels with proper weight unit.
 * Returns label strings that include weight units, adjusted based on settings.
 * @returns Object with dynamic weight-related labels
 */
export function getDynamicModalLabels() {
  const weightUnit = getWeightUnit();
  return {
    WEIGHT: `Weight (${weightUnit}):`,
    TARGET_WEIGHT: `Target weight (${weightUnit}):`,
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
    { text: `Volume (${weightUnit})`, value: "volume" },
    { text: `Weight (${weightUnit})`, value: "weight" },
    { text: "Reps", value: "reps" },
  ];
}

/**
 * Modal UI labels - titles, buttons, labels, placeholders, and checkboxes
 */
export const MODAL_UI = {
  TITLES: {
    get CREATE_LOG() {
      return t("modal.titles.createLog");
    },
    get EDIT_LOG() {
      return t("modal.titles.editLog");
    },
    get INSERT_CHART() {
      return t("modal.titles.insertChart");
    },
    get INSERT_TABLE() {
      return t("modal.titles.insertTable");
    },
    get INSERT_TIMER() {
      return t("modal.titles.insertTimer");
    },
    get INSERT_DASHBOARD() {
      return t("modal.titles.insertDashboard");
    },
    get INSERT_DURATION() {
      return t("modal.titles.insertDuration");
    },
    get CREATE_EXERCISE_PAGE() {
      return t("modal.titles.createExercisePage");
    },
    get CREATE_EXERCISE_SECTION() {
      return t("modal.titles.createExerciseSection");
    },
    get CONFIRM_ACTION() {
      return t("modal.titles.confirmAction");
    },
    get AUDIT_EXERCISE_NAMES() {
      return t("modal.titles.auditExerciseNames");
    },
    get ADD_EXERCISE_BLOCK() {
      return t("modal.titles.addExerciseBlock");
    },
    get QUICK_LOG() {
      return t("modal.titles.quickLog");
    },
    get CANVAS_EXPORT() {
      return t("modal.titles.canvasExport");
    },
    get MUSCLE_TAG_MANAGER() {
      return t("modal.titles.muscleTagManager");
    },
  },
  BUTTONS: {
    get CREATE() {
      return t("modal.buttons.create");
    },
    get UPDATE() {
      return t("modal.buttons.update");
    },
    get INSERT_CHART() {
      return t("modal.buttons.insertChart");
    },
    get RENAME_IN_CSV() {
      return t("modal.buttons.renameInCsv");
    },
    get RENAME_FILE() {
      return t("modal.buttons.renameFile");
    },
    get INSERT_TABLE() {
      return t("modal.buttons.insertTable");
    },
    get INSERT_TIMER() {
      return t("modal.buttons.insertTimer");
    },
    get INSERT_DASHBOARD() {
      return t("modal.buttons.insertDashboard");
    },
    get CANCEL() {
      return t("modal.buttons.cancel");
    },
    get CONFIRM() {
      return t("modal.buttons.confirm");
    },
    get CREATE_EXERCISE() {
      return t("modal.buttons.createExercise");
    },
    get CREATE_SECTION() {
      return t("modal.buttons.createSection");
    },
    get INSERT_EXERCISE_BLOCK() {
      return t("modal.buttons.insertExerciseBlock");
    },
    get UPDATE_TARGET_WEIGHT() {
      return t("modal.buttons.updateTargetWeight");
    },
    get ADJUST_PLUS() {
      return t("modal.buttons.adjustPlus");
    },
    get ADJUST_MINUS() {
      return t("modal.buttons.adjustMinus");
    },
    get EXPORT() {
      return t("modal.buttons.export");
    },
    get ADD_PARAMETER() {
      return t("modal.buttons.addParameter");
    },
    get REMOVE_PARAMETER() {
      return t("modal.buttons.removeParameter");
    },
  },
  NOTICES: {
    get LOG_CREATED() {
      return t("modal.notices.logCreated");
    },
    get LOG_UPDATED() {
      return t("modal.notices.logUpdated");
    },
    get LOG_CREATE_ERROR() {
      return t("modal.notices.logCreateError");
    },
    get LOG_UPDATE_ERROR() {
      return t("modal.notices.logUpdateError");
    },
    get CHART_INSERTED() {
      return t("modal.notices.chartInserted");
    },
    get TABLE_INSERTED() {
      return t("modal.notices.tableInserted");
    },
    get TIMER_INSERTED() {
      return t("modal.notices.timerInserted");
    },
    get DASHBOARD_INSERTED() {
      return t("modal.notices.dashboardInserted");
    },
    get VALIDATION_FILL_ALL() {
      return t("modal.notices.validationFillAll");
    },
    get VALIDATION_POSITIVE_VALUES() {
      return t("modal.notices.validationPositiveValues");
    },
    get VALIDATION_COMBINED_MODE() {
      return t("modal.notices.validationCombinedMode");
    },
    get NO_ACTIVE_EDITOR() {
      return t("modal.notices.noActiveEditor");
    },
    get INSERT_CODE_NO_FILE() {
      return t("modal.notices.insertCodeNoFile");
    },
    get EXERCISE_PAGE_CREATED() {
      return t("modal.notices.exercisePageCreated");
    },
    get EXERCISE_PAGE_ERROR() {
      return t("modal.notices.exercisePageError");
    },
    get EXERCISE_PAGE_NAME_REQUIRED() {
      return t("modal.notices.exercisePageNameRequired");
    },
    get EXERCISE_NAME_REQUIRED() {
      return t("modal.notices.exerciseNameRequired");
    },
    get EXERCISE_SECTION_CREATED() {
      return t("modal.notices.exerciseSectionCreated");
    },
    get DASHBOARD_CREATED() {
      return t("modal.notices.dashboardCreated");
    },
    get GENERIC_ERROR() {
      return t("modal.notices.genericError");
    },
    get TIMER_ELEMENTS_NOT_INITIALIZED() {
      return t("modal.notices.timerElementsNotInitialized");
    },
    get AUDIT_NO_MISMATCHES() {
      return t("modal.notices.auditNoMismatches");
    },
    get AUDIT_SCANNING() {
      return t("modal.notices.auditScanning");
    },
    get AUDIT_RENAME_SUCCESS() {
      return t("modal.notices.auditRenameSuccess");
    },
    get AUDIT_RENAME_ERROR() {
      return t("modal.notices.auditRenameError");
    },
    get AUDIT_CONFIRM_RENAME() {
      return t("modal.notices.auditConfirmRename");
    },
    get AUDIT_RENAME_FILE_SUCCESS() {
      return t("modal.notices.auditRenameFileSuccess");
    },
    get AUDIT_RENAME_FILE_ERROR() {
      return t("modal.notices.auditRenameFileError");
    },
    get AUDIT_CONFIRM_RENAME_FILE() {
      return t("modal.notices.auditConfirmRenameFile");
    },
    get EXERCISE_BLOCK_INSERTED() {
      return t("modal.notices.exerciseBlockInserted");
    },
    get CANVAS_EXPORTED() {
      return t("modal.notices.canvasExported");
    },
    get CANVAS_EXPORT_ERROR() {
      return t("modal.notices.canvasExportError");
    },
    get CANVAS_NO_EXERCISES() {
      return t("modal.notices.canvasNoExercises");
    },
    get MUSCLE_TAG_LOADING() {
      return t("modal.notices.muscleTagLoading");
    },
    MUSCLE_TAG_COUNT: (count: number) =>
      `${count} tag${count !== 1 ? "s" : ""} found`,
    get MUSCLE_TAG_NO_RESULTS() {
      return t("modal.notices.muscleTagNoResults");
    },
    get MUSCLE_TAG_SAVED() {
      return t("modal.notices.muscleTagSaved");
    },
    get MUSCLE_TAG_DELETED() {
      return t("modal.notices.muscleTagDeleted");
    },
    MUSCLE_TAG_DELETE_CONFIRM: (tag: string) =>
      `Are you sure you want to delete the tag "${tag}"?`,
    MUSCLE_TAG_SAVE_ERROR: (error: string) =>
      `Error saving muscle tag: ${error}`,
    MUSCLE_TAG_EXISTS: (tag: string) => `Tag "${tag}" already exists`,
    get MUSCLE_TAG_SIMILAR_WARNING() {
      return t("modal.notices.muscleTagSimilarWarning");
    },
    MUSCLE_TAG_SIMILAR_FOUND: (count: number) =>
      `${count} similar tag${count !== 1 ? "s" : ""} found`,
    get MUSCLE_TAG_EXPORTED() {
      return t("modal.notices.muscleTagExported");
    },
    MUSCLE_TAG_EXPORT_ERROR: (error: string) =>
      `Error exporting muscle tags: ${error}`,
    MUSCLE_TAG_IMPORTED: (count: number) =>
      `${count} muscle tag${count !== 1 ? "s" : ""} imported successfully!`,
    MUSCLE_TAG_IMPORT_ERROR: (error: string) =>
      `Error importing muscle tags: ${error}`,
    get MUSCLE_TAG_IMPORT_INVALID_FORMAT() {
      return t("modal.notices.muscleTagImportInvalidFormat");
    },
    MUSCLE_TAG_IMPORT_INVALID_GROUP: (tag: string, group: string) =>
      `Invalid muscle group "${group}" for tag "${tag}". Must be a canonical muscle group.`,
    MUSCLE_TAG_IMPORT_PREVIEW: (count: number) =>
      `${count} tag${count !== 1 ? "s" : ""} to import`,
    get MUSCLE_TAG_IMPORT_NO_VALID() {
      return t("modal.notices.muscleTagImportNoValid");
    },
    get TARGET_ACHIEVED() {
      return t("modal.notices.targetAchieved");
    },
    get TARGET_DISMISSED() {
      return t("modal.notices.targetDismissed");
    },
    get SUGGESTED_NEXT_WEIGHT() {
      return t("modal.notices.suggestedNextWeight");
    },
    get CONFIRM_UPDATE_TARGET() {
      return t("modal.notices.confirmUpdateTarget");
    },
    MIGRATION_COMPLETE: (count: number) =>
      `✅ Migration complete. Updated ${count} exercise files.`,
    get MIGRATION_NO_UPDATES() {
      return t("modal.notices.migrationNoUpdates");
    },
    get MIGRATION_ERROR() {
      return t("modal.notices.migrationError");
    },
  },
  LABELS: {
    get EXERCISE() {
      return t("modal.labels.exercise");
    },
    get REPS() {
      return t("modal.labels.reps");
    },
    get WEIGHT() {
      return getDynamicModalLabels().WEIGHT;
    },
    get NOTES() {
      return t("modal.notes");
    },
    get WORKOUT() {
      return t("modal.workout");
    },
    get WORKOUT_NAME() {
      return t("modal.workoutName");
    },
    get WORKOUT_NAME_OPTIONAL() {
      return t("modal.workoutNameOptional");
    },
    get CHART_TYPE() {
      return t("modal.chartType");
    },
    get DATA_TYPE() {
      return t("modal.dataType");
    },
    get TABLE_TYPE() {
      return t("modal.tableType");
    },
    get DAYS_RANGE() {
      return t("modal.daysRange");
    },
    get DATA_LIMIT() {
      return t("modal.dataLimit");
    },
    get MAX_LOG_COUNT() {
      return t("modal.maxLogCount");
    },
    get CUSTOM_TITLE() {
      return t("modal.customTitle");
    },
    get TIMER_TYPE() {
      return t("modal.timerType");
    },
    get DURATION() {
      return t("modal.duration");
    },
    get INTERVAL_TIME() {
      return t("modal.intervalTime");
    },
    get ROUNDS() {
      return t("modal.rounds");
    },
    get TITLE() {
      return t("modal.title");
    },
    get EXERCISE_NAME() {
      return t("modal.exerciseName");
    },
    get EXERCISE_PATH() {
      return t("modal.exercisePath");
    },
    get SETS() {
      return t("modal.sets");
    },
    get REST_TIME() {
      return t("modal.restTime");
    },
    get NOTE() {
      return t("modal.note");
    },
    get TAGS() {
      return t("modal.tags");
    },
    get FOLDER_PATH() {
      return t("modal.folderPath");
    },
    get EXERCISE_TYPE() {
      return t("modal.exerciseType");
    },
    get CUSTOM_PARAMETERS() {
      return t("modal.customParameters");
    },
    get PARAMETER_KEY() {
      return t("modal.parameterKey");
    },
    get PARAMETER_LABEL() {
      return t("modal.parameterLabel");
    },
    get PARAMETER_TYPE() {
      return t("modal.parameterType");
    },
    get PARAMETER_UNIT() {
      return t("modal.parameterUnit");
    },
    get PARAMETER_REQUIRED() {
      return t("modal.parameterRequired");
    },
    get CONFIRM_ACTION() {
      return t("modal.confirmAction");
    },
    get FILE_NAME() {
      return t("modal.fileName");
    },
    get CSV_EXERCISE() {
      return t("modal.csvExercise");
    },
    get SIMILARITY() {
      return t("modal.similarity");
    },
    get STATUS() {
      return t("modal.status");
    },
    get TAG() {
      return t("modal.tag");
    },
    get MUSCLE_GROUP() {
      return t("modal.muscleGroup");
    },
    get ACTIONS() {
      return t("modal.actions");
    },
    get ADD_TAG() {
      return t("modal.addTag");
    },
    get EDIT_TAG() {
      return t("modal.editTag");
    },
    get NEW_TAG() {
      return t("modal.newTag");
    },
    get SAVE() {
      return t("modal.save");
    },
    get DELETE() {
      return t("modal.delete");
    },
    get SIMILAR_TAGS() {
      return t("modal.similarTags");
    },
    get EXPORT_TAGS() {
      return t("modal.exportTags");
    },
    get IMPORT_TAGS() {
      return t("modal.importTags");
    },
    get IMPORT_MERGE() {
      return t("modal.importMerge");
    },
    get IMPORT_REPLACE() {
      return t("modal.importReplace");
    },
    get TIMER_DURATION() {
      return t("modal.timerDuration");
    },
    get TIMER_PRESET() {
      return t("modal.timerPreset");
    },
    get WORKOUT_FILE() {
      return t("modal.workoutFile");
    },
    get DATE_RANGE() {
      return t("modal.dateRange");
    },
    get TARGET_WEIGHT() {
      return getDynamicModalLabels().TARGET_WEIGHT;
    },
    TARGET_REPS: "Target reps:",
    get PROTOCOL() {
      return t("modal.protocol");
    },
    get RECENT_EXERCISES() {
      return t("modal.recentExercises");
    },
    get CANVAS_LAYOUT() {
      return t("modal.canvasLayout");
    },
    get CANVAS_OPTIONS() {
      return t("modal.canvasOptions");
    },
    get LAYOUT_TYPE() {
      return t("modal.layoutType");
    },
    get LAYOUT_HORIZONTAL() {
      return t("modal.layoutHorizontal");
    },
    get LAYOUT_VERTICAL() {
      return t("modal.layoutVertical");
    },
    get LAYOUT_GROUPED() {
      return t("modal.layoutGrouped");
    },
    get TAGS_SELECTOR() {
      return t("modal.tagsSelector");
    },
    get NO_TAGS_FOUND() {
      return t("modal.noTagsFound");
    },
    get NO_TAGS_SELECTED() {
      return t("modal.noTagsSelected");
    },
  },
  PLACEHOLDERS: {
    get SEARCH_TAGS() {
      return t("modal.placeholders.searchTags");
    },
    get SEARCH_MUSCLE_TAGS() {
      return t("modal.placeholders.searchMuscleTags");
    },
    get ENTER_TAG_NAME() {
      return t("modal.placeholders.enterTagName");
    },
    get EXERCISE_AUTOCOMPLETE() {
      return t("modal.placeholders.exerciseAutocomplete");
    },
    get REPS() {
      return t("modal.placeholders.reps");
    },
    get REPS_RANGE() {
      return t("modal.placeholders.repsRange");
    },
    get WEIGHT() {
      return t("modal.placeholders.weight");
    },
    get NOTES() {
      return t("modal.placeholders.notes");
    },
    get WORKOUT() {
      return t("modal.placeholders.workout");
    },
    get CUSTOM_TITLE() {
      return t("modal.placeholders.customTitle");
    },
    get TIMER_TITLE() {
      return t("modal.placeholders.timerTitle");
    },
    get EXERCISE_NAME() {
      return t("modal.placeholders.exerciseName");
    },
    get EXERCISE_PATH() {
      return t("modal.placeholders.exercisePath");
    },
    get SETS() {
      return t("modal.placeholders.sets");
    },
    get REST_TIME() {
      return t("modal.placeholders.restTime");
    },
    get NOTE() {
      return t("modal.placeholders.note");
    },
    get TAGS() {
      return t("modal.placeholders.tags");
    },
    get FOLDER_PATH() {
      return t("modal.placeholders.folderPath");
    },
    get PARAMETER_KEY() {
      return t("modal.placeholders.parameterKey");
    },
    get PARAMETER_LABEL() {
      return t("modal.placeholders.parameterLabel");
    },
    get PARAMETER_UNIT() {
      return t("modal.placeholders.parameterUnit");
    },
  },
  CHECKBOXES: {
    get USE_CURRENT_WORKOUT() {
      return t("modal.checkboxes.useCurrentWorkout");
    },
    get USE_CURRENT_WORKOUT_FILE() {
      return t("modal.checkboxes.useCurrentWorkoutFile");
    },
    get SHOW_TREND_LINE() {
      return t("modal.checkboxes.showTrendLine");
    },
    get SHOW_TREND_HEADER() {
      return t("modal.checkboxes.showTrendHeader");
    },
    get SHOW_STATISTICS() {
      return t("modal.checkboxes.showStatistics");
    },
    get SHOW_ADD_BUTTON() {
      return t("modal.checkboxes.showAddButton");
    },
    get EXACT_MATCH() {
      return t("modal.checkboxes.exactMatch");
    },
    get DEBUG_MODE() {
      return t("modal.checkboxes.debugMode");
    },
    get SEARCH_BY_NAME() {
      return t("modal.checkboxes.searchByName");
    },
    get SHOW_CONTROLS() {
      return t("modal.checkboxes.showControls");
    },
    get AUTO_START() {
      return t("modal.checkboxes.autoStart");
    },
    get SOUND() {
      return t("modal.checkboxes.sound");
    },
    get INCLUDE_TIMER() {
      return t("modal.checkboxes.includeTimer");
    },
    get INCLUDE_CHART() {
      return t("modal.checkboxes.includeChart");
    },
    get INCLUDE_TABLE() {
      return t("modal.checkboxes.includeTable");
    },
    get INCLUDE_LOG() {
      return t("modal.checkboxes.includeLog");
    },
    get TIMER_AUTO_START() {
      return t("modal.checkboxes.timerAutoStart");
    },
    get TIMER_SOUND() {
      return t("modal.checkboxes.timerSound");
    },
    get USE_PRESET_ONLY() {
      return t("modal.checkboxes.usePresetOnly");
    },
    get INCLUDE_DURATIONS() {
      return t("modal.checkboxes.includeDurations");
    },
    get INCLUDE_STATS() {
      return t("modal.checkboxes.includeStats");
    },
    get CONNECT_SUPERSETS() {
      return t("modal.checkboxes.connectSupersets");
    },
  },
  EXERCISE_STATUS: {
    get CREATE_PAGE() {
      return t("modal.exerciseStatus.createPage");
    },
    get SELECTED() {
      return t("modal.exerciseStatus.selected");
    },
    get NOT_FOUND() {
      return t("modal.exerciseStatus.notFound");
    },
    FOUND: (count: number) => `📋 ${count} exercises found`,
  },
  AUTOCOMPLETE: {
    get FUZZY_BADGE() {
      return t("modal.autocomplete.fuzzyBadge");
    },
    FUZZY_TOOLTIP: (score: number) =>
      t("modal.autocomplete.fuzzyTooltip").replace("{score}", String(score)),
    get EXACT_BADGE() {
      return t("modal.autocomplete.exactBadge");
    },
    EXACT_TOOLTIP: (score: number) =>
      t("modal.autocomplete.exactTooltip").replace("{score}", String(score)),
    get WORD_BADGE() {
      return t("modal.autocomplete.wordBadge");
    },
    WORD_TOOLTIP: (score: number) =>
      t("modal.autocomplete.wordTooltip").replace("{score}", String(score)),
    get PARTIAL_BADGE() {
      return t("modal.autocomplete.partialBadge");
    },
    PARTIAL_TOOLTIP: (score: number) =>
      t("modal.autocomplete.partialTooltip").replace("{score}", String(score)),
  },
  SELECT_OPTIONS: {
    CHART_TYPE: [
      {
        get text() {
          return t("modal.selectOptions.completeWorkout");
        },
        value: "workout",
      },
      {
        get text() {
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
        get text() {
          return t("modal.selectOptions.exerciseWorkout");
        },
        value: "combined",
      },
      {
        get text() {
          return t("modal.selectOptions.specificExercise");
        },
        value: "exercise",
      },
      {
        get text() {
          return t("modal.selectOptions.completeWorkout");
        },
        value: "workout",
      },
      {
        get text() {
          return t("modal.selectOptions.allLogs");
        },
        value: "all",
      },
    ],
    TIMER_TYPE: [
      {
        get text() {
          return t("modal.selectOptions.countdown");
        },
        value: "countdown",
      },
      {
        get text() {
          return t("modal.selectOptions.interval");
        },
        value: "interval",
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
  SECTIONS: {
    get CHART_TYPE() {
      return t("modal.sections.chartType");
    },
    get TABLE_TYPE() {
      return t("modal.sections.tableType");
    },
    get TARGET() {
      return t("modal.sections.target");
    },
    get CONFIGURATION() {
      return t("modal.sections.configuration");
    },
    get DISPLAY_OPTIONS() {
      return t("modal.sections.displayOptions");
    },
    get ADVANCED_OPTIONS() {
      return t("modal.sections.advancedOptions");
    },
    get TIMER_CONFIGURATION() {
      return t("modal.sections.timerConfiguration");
    },
    get WORKOUT() {
      return t("modal.sections.workout");
    },
    get EXERCISE_CONFIGURATION() {
      return t("modal.sections.exerciseConfiguration");
    },
    get OPTIONS() {
      return t("modal.sections.options");
    },
    get PRESET() {
      return t("modal.sections.preset");
    },
    get PROGRESSIVE_OVERLOAD() {
      return t("modal.sections.progressiveOverload");
    },
    get MOBILE_OPTIONS() {
      return t("modal.sections.mobileOptions");
    },
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
    WEIGHT_INCREMENT: `Weight increment (${weightUnit})`,
    QUICK_WEIGHT_INCREMENT: `Weight buttons increment (${weightUnit})`,
  };
}

/**
 * Settings UI labels - section headers, field labels, descriptions, and messages
 */
export const SETTINGS_UI = {
  LABELS: {
    get GENERATE_DEFAULT_TEMPLATES() {
      return t("settings.generateDefaultTemplates");
    },
    get CSV_PATH() {
      return t("settings.csvPath");
    },
    get EXERCISE_FOLDER() {
      return t("settings.exerciseFolder");
    },
    get DEFAULT_EXACT_MATCH() {
      return t("settings.defaultExactMatch");
    },
    get TIMER_PRESETS() {
      return t("settings.timerPresets");
    },
    get DEFAULT_TIMER_PRESET() {
      return t("settings.defaultTimerPreset");
    },
    get PRESET_NAME() {
      return t("settings.presetName");
    },
    get PRESET_TYPE() {
      return t("settings.presetType");
    },
    get PRESET_DURATION() {
      return t("settings.presetDuration");
    },
    get PRESET_INTERVAL() {
      return t("settings.presetInterval");
    },
    get PRESET_ROUNDS() {
      return t("settings.presetRounds");
    },
    get PRESET_SHOW_CONTROLS() {
      return t("settings.presetShowControls");
    },
    get PRESET_AUTO_START() {
      return t("settings.presetAutoStart");
    },
    get PRESET_SOUND() {
      return t("settings.presetSound");
    },
    get EXERCISE_BLOCK_TEMPLATE() {
      return t("settings.exerciseBlockTemplate");
    },
    get WEIGHT_INCREMENT() {
      return getDynamicSettingsLabels().WEIGHT_INCREMENT;
    },
    get CUSTOM_PROTOCOLS() {
      return t("settings.customProtocols");
    },
    get PROTOCOL_NAME() {
      return t("settings.protocolName");
    },
    get PROTOCOL_ABBREVIATION() {
      return t("settings.protocolAbbreviation");
    },
    get PROTOCOL_COLOR() {
      return t("settings.protocolColor");
    },
    get SET_DURATION() {
      return t("settings.setDuration");
    },
    get REP_DURATION() {
      return t("settings.repDuration");
    },
    get DEFAULT_REPS_PER_SET() {
      return t("settings.defaultRepsPerSet");
    },
    get SHOW_QUICK_LOG_RIBBON() {
      return t("settings.showQuickLogRibbon");
    },
    get QUICK_WEIGHT_INCREMENT() {
      return getDynamicSettingsLabels().QUICK_WEIGHT_INCREMENT;
    },
    get CREATE_MUSCLE_TAGS_CSV() {
      return t("settings.createMuscleTagsCsv");
    },
    get SETUP_CSV() {
      return t("settings.setupCsv");
    },
    get GENERATE_EXAMPLES() {
      return t("settings.generateExamples");
    },
    get WEIGHT_UNIT() {
      return t("settings.weightUnit");
    },
  },
  DESCRIPTIONS: {
    get GENERATE_DEFAULT_TEMPLATES() {
      return t("settings.generateDefaultTemplates");
    },
    get CSV_PATH() {
      return t("settings.csvPath");
    },
    get CSV_FOLDER() {
      return t("settings.csvFolder");
    },
    get EXERCISE_FOLDER() {
      return t("settings.exerciseFolder");
    },
    get CREATE_CSV() {
      return t("settings.createCsv");
    },
    get DEFAULT_EXACT_MATCH() {
      return t("settings.defaultExactMatch");
    },
    get TIMER_PRESETS() {
      return t("settings.timerPresets");
    },
    get DEFAULT_TIMER_PRESET() {
      return t("settings.defaultTimerPreset");
    },
    get NO_PRESETS() {
      return t("settings.noPresets");
    },
    get EXERCISE_BLOCK_TEMPLATE() {
      return t("settings.exerciseBlockTemplate");
    },
    WEIGHT_INCREMENT:
      "Default weight increment for progressive overload (e.g., 2.5 for 2.5 unit increments)",
    get CUSTOM_PROTOCOLS() {
      return t("settings.customProtocols");
    },
    get NO_CUSTOM_PROTOCOLS() {
      return t("settings.noCustomProtocols");
    },
    get PROTOCOL_ABBREVIATION() {
      return t("settings.protocolAbbreviation");
    },
    get PROTOCOL_COLOR() {
      return t("settings.protocolColor");
    },
    get SET_DURATION() {
      return t("settings.setDuration");
    },
    get REP_DURATION() {
      return t("settings.repDuration");
    },
    get DEFAULT_REPS_PER_SET() {
      return t("settings.defaultRepsPerSet");
    },
    get SHOW_QUICK_LOG_RIBBON() {
      return t("settings.showQuickLogRibbon");
    },
    QUICK_WEIGHT_INCREMENT:
      "Weight increment used by +/- buttons in create/edit workout log modals (e.g., 2.5 for +2.5 / -2.5 units)",
    get CREATE_MUSCLE_TAGS_CSV() {
      return t("settings.createMuscleTagsCsv");
    },
    get CONFIRM_OVERWRITE_MUSCLE_TAGS() {
      return t("settings.confirmOverwriteMuscleTags");
    },
    get SETUP_CSV() {
      return t("settings.setupCsv");
    },
    GENERATE_EXAMPLES:
      "Create a folder with example exercises and workouts to help you get started.",
    get WEIGHT_UNIT() {
      return t("settings.weightUnit");
    },
  },
  SECTIONS: {
    get CSV_MANAGEMENT() {
      return t("settings.csvManagement");
    },
    get EXAMPLE_DATA() {
      return t("settings.exampleData");
    },
    get FILTERING() {
      return t("settings.filtering");
    },
    get TIMER_PRESETS() {
      return t("settings.timerPresets");
    },
    get TEMPLATES() {
      return t("settings.templates");
    },
    get PROGRESSIVE_OVERLOAD() {
      return t("settings.progressiveOverload");
    },
    get CUSTOM_PROTOCOLS() {
      return t("settings.customProtocols");
    },
    get DURATION_ESTIMATION() {
      return t("settings.durationEstimation");
    },
    get QUICK_LOG() {
      return t("settings.quickLog");
    },
  },
  BUTTONS: {
    get ADD_PRESET() {
      return t("settings.addPreset");
    },
    get DELETE_PRESET() {
      return t("settings.deletePreset");
    },
    get SAVE_PRESET() {
      return t("settings.savePreset");
    },
    get CANCEL() {
      return t("settings.cancel");
    },
    get ADD_PROTOCOL() {
      return t("settings.addProtocol");
    },
    get SAVE_PROTOCOL() {
      return t("settings.saveProtocol");
    },
    get CREATE_MUSCLE_TAGS() {
      return t("settings.createMuscleTags");
    },
    get CREATE_FILES() {
      return t("settings.createFiles");
    },
    get CREATE_EXAMPLES() {
      return t("settings.createExamples");
    },
  },
  OPTIONS: {
    get NONE() {
      return t("settings.none");
    },
    WEIGHT_UNIT: {
      get KG() {
        return t("settings.kg");
      },
      get LB() {
        return t("settings.lb");
      },
    },
  },
  MESSAGES: {
    get PRESET_NAME_REQUIRED() {
      return t("settings.presetNameRequired");
    },
    get PRESET_NAME_EXISTS() {
      return t("settings.presetNameExists");
    },
    get PRESET_DELETED() {
      return t("settings.presetDeleted");
    },
    get PRESET_SAVED() {
      return t("settings.presetSaved");
    },
    get CONFIRM_DELETE_PRESET() {
      return t("settings.confirmDeletePreset");
    },
    get PROTOCOL_NAME_REQUIRED() {
      return t("settings.protocolNameRequired");
    },
    get PROTOCOL_ABBREVIATION_REQUIRED() {
      return t("settings.protocolAbbreviationRequired");
    },
    get PROTOCOL_COLOR_REQUIRED() {
      return t("settings.protocolColorRequired");
    },
    get PROTOCOL_NAME_EXISTS() {
      return t("settings.protocolNameExists");
    },
    get PROTOCOL_DELETED() {
      return t("settings.protocolDeleted");
    },
    get PROTOCOL_SAVED() {
      return t("settings.protocolSaved");
    },
    get CONFIRM_DELETE_PROTOCOL() {
      return t("settings.confirmDeleteProtocol");
    },
    get CSV_FILES_CREATED() {
      return t("settings.csvFilesCreated");
    },
    CSV_FILES_ERROR: (error: string) => `Error creating CSV files: ${error}`,
    get CONFIRM_OVERWRITE_EXAMPLES() {
      return t("settings.confirmOverwriteExamples");
    },
  },
} as const;

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
  /** Technical identifiers used in code (DO NOT TRANSLATE) - @deprecated Use COLUMN_DEFS.*.value instead */
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
  /** Translated labels for column headers - @deprecated Use COLUMN_DEFS.*.label instead */
  COLUMN_LABELS: {
    get DATE() {
      return t("table.columnLabels.date");
    },
    get EXERCISE() {
      return t("table.columnLabels.exercise");
    },
    get REPS() {
      return t("table.columnLabels.reps");
    },
    get WEIGHT() {
      return t("table.columnLabels.weight");
    },
    get VOLUME() {
      return t("table.columnLabels.volume");
    },
    get DURATION() {
      return t("table.columnLabels.duration");
    },
    get DISTANCE() {
      return t("table.columnLabels.distance");
    },
    get HEART_RATE() {
      return t("table.columnLabels.heartRate");
    },
    get NOTES() {
      return t("table.columnLabels.notes");
    },
    get PROTOCOL() {
      return t("table.columnLabels.protocol");
    },
    get ACTIONS() {
      return t("table.columnLabels.actions");
    },
  },
  LABELS: {
    get DATA() {
      return t("table.data");
    },
    get VOLUME() {
      return t("table.volume");
    },
    WEIGHT: "Weight",
    get REPETITIONS() {
      return t("table.repetitions");
    },
    get DURATION() {
      return t("table.duration");
    },
    get DISTANCE() {
      return t("table.distance");
    },
    get HEART_RATE() {
      return t("table.heartRate");
    },
    get NO_DATA() {
      return t("table.noData");
    },
    get INVALID_DATE() {
      return t("table.invalidDate");
    },
    get NOT_AVAILABLE() {
      return t("table.notAvailable");
    },
    get TREND_LINE() {
      return t("table.trendLine");
    },
  },
  TARGET: {
    get REPS_SUFFIX() {
      return t("table.target.repsSuffix");
    },
    get SEPARATOR() {
      return t("table.target.separator");
    },
    PROGRESS_TOOLTIP: (best: number, target: number) =>
      t("table.target.progressTooltip")
        .replace("{best}", String(best))
        .replace("{target}", String(target)),
  },
  /** Abbreviated labels for mobile/compact display */
  LABELS_SHORT: {
    get VOLUME() {
      return t("table.volume");
    },
    WEIGHT: "Wgt",
    get REPETITIONS() {
      return t("table.repetitions");
    },
    get DURATION() {
      return t("table.duration");
    },
    get DISTANCE() {
      return t("table.distance");
    },
    get HEART_RATE() {
      return t("table.heartRate");
    },
    get SETS() {
      return t("table.sets");
    },
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
    get DELETE_CONFIRM() {
      return t("table.deleteConfirm");
    },
    get DELETE_SUCCESS() {
      return t("table.deleteSuccess");
    },
    get DELETE_ERROR() {
      return t("table.deleteError");
    },
    get REFRESH_SUCCESS() {
      return t("table.refreshSuccess");
    },
    get GOTO_EXERCISE() {
      return t("table.gotoExercise");
    },
    get EDIT_TITLE() {
      return t("table.editTitle");
    },
    get DELETE_TITLE() {
      return t("table.deleteTitle");
    },
  },
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
    get REPS() {
      return t("charts.reps");
    },
    get DATE() {
      return t("charts.date");
    },
    get TREND_LINE() {
      return t("charts.trendLine");
    },
    get UP() {
      return t("charts.up");
    },
    get DOWN() {
      return t("charts.down");
    },
    get NEUTRAL() {
      return t("charts.neutral");
    },
    /** @deprecated Use TREND_TITLE instead for dynamic type support */
    get TREND_TITLE_PREFIX() {
      return t("charts.trendTitlePrefix");
    },
    /** Dynamic trend title based on data type */
    TREND_TITLE: (dataType?: CHART_DATA_TYPE) => {
      const typeName = dataType ? DATA_TYPE_NAMES[dataType] : "Volume";
      return `Trend ${typeName}: `;
    },
    get OVERALL_VARIATION_PREFIX() {
      return t("charts.overallVariationPrefix");
    },
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
    get SIGNIFICANT_INCREASE() {
      return t("charts.significantIncrease");
    },
    get FALLBACK_TABLE_MESSAGE() {
      return t("charts.fallbackTableMessage");
    },
  },
  TYPES: {
    get VOLUME() {
      return t("charts.volume");
    },
    WEIGHT: "weight",
    get REPS() {
      return t("charts.reps");
    },
  },
};

/**
 * Timer UI labels - timer types and related display text
 */
export const TIMER_UI = {
  TYPES: {
    get COUNTDOWN() {
      return t("timer.countdown");
    },
    get INTERVAL() {
      return t("timer.interval");
    },
  },
} as const;

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
        TOTAL_VOLUME: `Total volume (${weightUnit})`,
        AVG_VOLUME: `Avg volume (${weightUnit})`,
      },
    },
    RECENT_WORKOUTS: {
      VOLUME_SUFFIX: weightUnit,
    },
    SUMMARY: {
      TOTAL_VOLUME_SUFFIX: weightUnit,
    },
    VOLUME_ANALYTICS: {
      DATASET_LABEL: `Daily volume (${weightUnit})`,
      VOLUME_SUFFIX: weightUnit,
    },
  };
}

/**
 * Dashboard UI labels - section titles, metrics, and display text
 */
export const DASHBOARD_UI = {
  QUICK_ACTIONS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get ADD_WORKOUT_LOG() {
      return t("dashboard.addWorkoutLog");
    },
    get VIEW_EXERCISES() {
      return t("dashboard.viewExercises");
    },
  },
  QUICK_STATS: {
    get TITLE() {
      return t("dashboard.title");
    },
    PERIODS: {
      get WEEK() {
        return t("dashboard.week");
      },
      get MONTH() {
        return t("dashboard.month");
      },
      get YEAR() {
        return t("dashboard.year");
      },
    },
    METRICS: {
      get WORKOUTS() {
        return t("dashboard.workouts");
      },
      get TOTAL_VOLUME() {
        return getDynamicDashboardLabels().QUICK_STATS.METRICS.TOTAL_VOLUME;
      },
      get AVG_VOLUME() {
        return getDynamicDashboardLabels().QUICK_STATS.METRICS.AVG_VOLUME;
      },
    },
  },
  RECENT_WORKOUTS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get FALLBACK_NAME() {
      return t("dashboard.fallbackName");
    },
    get VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().RECENT_WORKOUTS.VOLUME_SUFFIX;
    },
  },
  SUMMARY: {
    get TITLE() {
      return t("dashboard.title");
    },
    get TOTAL_WORKOUTS() {
      return t("dashboard.totalWorkouts");
    },
    get CURRENT_STREAK() {
      return t("dashboard.currentStreak");
    },
    get CURRENT_STREAK_SUFFIX() {
      return t("dashboard.currentStreakSuffix");
    },
    get TOTAL_VOLUME() {
      return t("dashboard.totalVolume");
    },
    get TOTAL_VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().SUMMARY.TOTAL_VOLUME_SUFFIX;
    },
    get PERSONAL_RECORDS() {
      return t("dashboard.personalRecords");
    },
  },
  VOLUME_ANALYTICS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get DATASET_LABEL() {
      return getDynamicDashboardLabels().VOLUME_ANALYTICS.DATASET_LABEL;
    },
    get CHART_TITLE() {
      return t("dashboard.chartTitle");
    },
    get MUSCLE_BREAKDOWN_TITLE() {
      return t("dashboard.muscleBreakdownTitle");
    },
    get VOLUME_SUFFIX() {
      return getDynamicDashboardLabels().VOLUME_ANALYTICS.VOLUME_SUFFIX;
    },
  },
  PROTOCOL_DISTRIBUTION: {
    get TITLE() {
      return t("dashboard.title");
    },
    get SUBTITLE() {
      return t("dashboard.subtitle");
    },
    get NO_DATA() {
      return t("dashboard.noData");
    },
    get SETS_LABEL() {
      return t("dashboard.setsLabel");
    },
    get PERCENT_LABEL() {
      return t("dashboard.percentLabel");
    },
    get FILTER_ACTIVE() {
      return t("dashboard.filterActive");
    },
    get CLEAR_FILTER() {
      return t("dashboard.clearFilter");
    },
    get CLICK_TO_FILTER() {
      return t("dashboard.clickToFilter");
    },
  },
  PROTOCOL_EFFECTIVENESS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get NO_DATA() {
      return t("dashboard.noData");
    },
    get DISCLAIMER() {
      return t("dashboard.disclaimer");
    },
    get COLUMN_PROTOCOL() {
      return t("dashboard.columnProtocol");
    },
    get COLUMN_ENTRIES() {
      return t("dashboard.columnEntries");
    },
    get COLUMN_VOLUME_CHANGE() {
      return t("dashboard.columnVolumeChange");
    },
    get COLUMN_PROGRESSION() {
      return t("dashboard.columnProgression");
    },
  },
  DURATION_COMPARISON: {
    get TITLE() {
      return t("dashboard.title");
    },
    get SUBTITLE() {
      return t("dashboard.subtitle");
    },
    get NO_DATA() {
      return t("dashboard.noData");
    },
    get COLUMN_WORKOUT() {
      return t("dashboard.columnWorkout");
    },
    get COLUMN_DATE() {
      return t("dashboard.columnDate");
    },
    get COLUMN_ESTIMATED() {
      return t("dashboard.columnEstimated");
    },
    get COLUMN_ACTUAL() {
      return t("dashboard.columnActual");
    },
    get COLUMN_VARIANCE() {
      return t("dashboard.columnVariance");
    },
    get VARIANCE_TREND_TITLE() {
      return t("dashboard.varianceTrendTitle");
    },
    get VARIANCE_TREND_IMPROVING() {
      return t("dashboard.varianceTrendImproving");
    },
    get VARIANCE_TREND_DECLINING() {
      return t("dashboard.varianceTrendDeclining");
    },
    get VARIANCE_TREND_STABLE() {
      return t("dashboard.varianceTrendStable");
    },
    get MINUTES_SUFFIX() {
      return t("dashboard.minutesSuffix");
    },
    get OVER_ESTIMATED() {
      return t("dashboard.overEstimated");
    },
    get UNDER_ESTIMATED() {
      return t("dashboard.underEstimated");
    },
  },
  MUSCLE_TAGS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get DESCRIPTION() {
      return t("dashboard.description");
    },
    TOTAL_COUNT: (count: number) => `Total: ${count} tags available`,
    TOOLTIP: (tag: string) => `Click to copy: ${tag}`,
  },
  FILE_ERRORS: {
    get TITLE() {
      return t("dashboard.title");
    },
    get ALL_VALID() {
      return t("dashboard.allValid");
    },
    get NO_TAGS() {
      return t("dashboard.noTags");
    },
    TOO_MANY_TAGS: (count: number) => `Too many muscle tags (${count})`,
    READ_ERROR: (message: string) => `Error reading file: ${message}`,
  },
} as const;

/**
 * Messages displayed to users - notifications, warnings, errors, and status messages
 */
export const MESSAGES_UI = {
  get NO_DATA() {
    return t("messages.noData");
  },
  get LOADING() {
    return t("messages.loading");
  },
  get NO_DATA_PERIOD() {
    return t("messages.noDataPeriod");
  },
  get TIMER_COMPLETED() {
    return t("messages.timerCompleted");
  },
  WARNINGS: {
    get IMBALANCE_ALERTS() {
      return t("messages.imbalanceAlerts");
    },
  },
  SUCCESS: {
    get NO_IMBALANCES() {
      return t("messages.noImbalances");
    },
    get CSV_CREATED() {
      return t("messages.csvCreated");
    },
    get CODE_INSERTED() {
      return t("messages.codeInserted");
    },
    get MUSCLE_TAGS_CSV_CREATED() {
      return t("messages.muscleTagsCsvCreated");
    },
    get TAG_REFERENCE_GENERATED() {
      return t("messages.tagReferenceGenerated");
    },
  },
  ERRORS: {
    get CSV_NOT_FOUND() {
      return t("messages.csvNotFound");
    },
    get FILE_EMPTY() {
      return t("messages.fileEmpty");
    },
    get NO_FRONTMATTER() {
      return t("messages.noFrontmatter");
    },
    get NO_TAGS() {
      return t("messages.noTags");
    },
    MUSCLE_TAGS_CSV_FAILED: (error: string) =>
      `Error creating muscle tags CSV: ${error}`,
    TAG_REFERENCE_FAILED: (error: string) =>
      `Error generating tag reference note: ${error}`,
  },
  STATUS: {
    get INSUFFICIENT_DATA() {
      return t("messages.insufficientData");
    },
  },
} as const;

/**
 * Form-related labels and placeholders
 */
export const FORMS_UI = {
  LABELS: {
    get EXERCISE_NAME() {
      return t("forms.exerciseName");
    },
    get WORKOUT_NAME() {
      return t("forms.workoutName");
    },
  },
  PLACEHOLDERS: {
    get ENTER_EXERCISE_NAME() {
      return t("forms.enterExerciseName");
    },
    get ENTER_CSV_PATH() {
      return t("forms.enterCsvPath");
    },
    get ENTER_FOLDER_PATH() {
      return t("forms.enterFolderPath");
    },
  },
} as const;

/**
 * Statistics display labels
 */
export const STATS_UI = {
  LABELS: {
    get SESSIONS() {
      return t("stats.sessions");
    },
    get RECENT_TREND() {
      return t("stats.recentTrend");
    },
    get AVG_VOLUME() {
      return t("stats.avgVolume");
    },
  },
} as const;

/**
 * Trend-related labels and status indicators
 */
export const TRENDS_UI = {
  STATUS: {
    get STABLE() {
      return t("trends.stable");
    },
    get INVARIANT() {
      return t("trends.invariant");
    },
    get INCREASING() {
      return t("trends.increasing");
    },
    get DECREASING() {
      return t("trends.decreasing");
    },
    get IMPROVING() {
      return t("trends.improving");
    },
    get DECLINING() {
      return t("trends.declining");
    },
    get STABLE_LOWER() {
      return t("trends.stableLower");
    },
    get STABLE_HIGHER() {
      return t("trends.stableHigher");
    },
  },
  DIRECTIONS: {
    get UP() {
      return t("trends.up");
    },
    get DOWN() {
      return t("trends.down");
    },
    get NEUTRAL() {
      return t("trends.neutral");
    },
  },
} as const;

/**
 * Time period labels
 */
export const TIME_PERIODS_UI = {
  get WEEK() {
    return t("timeperiods.week");
  },
  get MONTH() {
    return t("timeperiods.month");
  },
  get YEAR() {
    return t("timeperiods.year");
  },
} as const;

/**
 * Gets dynamic common UI labels with proper weight unit.
 * @returns Object with dynamic weight unit label
 */
export function getDynamicCommonLabels() {
  const weightUnit = getWeightUnit();
  return {
    UNITS: {
      WEIGHT: `Weight (${weightUnit})`,
    },
  };
}

/**
 * Common/shared UI labels and values
 */
export const COMMON_UI = {
  UNITS: {
    get WEIGHT_KG() {
      return getDynamicCommonLabels().UNITS.WEIGHT;
    },
  },
  TYPES: {
    get EXERCISE() {
      return t("common.exercise");
    },
    get WORKOUT() {
      return t("common.workout");
    },
  },
  DEFAULTS: {
    get UNKNOWN() {
      return t("common.unknown");
    },
    get EXERCISE_NAME() {
      return t("common.exerciseName");
    },
    get WORKOUT_NAME() {
      return t("common.workoutName");
    },
  },
  get NOT_AVAILABLE() {
    return t("common.notAvailable");
  },
} as const;

/**
 * Command names/labels
 */
export const COMMANDS_UI = {
  get CREATE_CSV() {
    return t("commands.createCsv");
  },
  get INSERT_TABLE() {
    return t("commands.insertTable");
  },
  get AUDIT_EXERCISE_NAMES() {
    return t("commands.auditExerciseNames");
  },
  get ADD_EXERCISE_BLOCK() {
    return t("commands.addExerciseBlock");
  },
  get QUICK_LOG() {
    return t("commands.quickLog");
  },
  get EXPORT_WORKOUT_TO_CANVAS() {
    return t("commands.exportWorkoutToCanvas");
  },
  get MIGRATE_EXERCISE_TYPES() {
    return t("commands.migrateExerciseTypes");
  },
  get CONVERT_EXERCISE() {
    return t("commands.convertExercise");
  },
  get MANAGE_MUSCLE_TAGS() {
    return t("commands.manageMuscleTags");
  },
  get GENERATE_TAG_REFERENCE() {
    return t("commands.generateTagReference");
  },
} as const;

/**
 * Command descriptions
 */
export const DESCRIPTIONS_UI = {
  get INSERT_TABLE() {
    return t("descriptions.insertTable");
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
      TOTAL_VOLUME: `Total volume (${weightUnit})`,
      AVG_VOLUME: `Average volume (${weightUnit})`,
      TOTAL_WEIGHT: `Total weight (${weightUnit})`,
      AVG_WEIGHT: `Average weight (${weightUnit})`,
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
    get TOTAL_REPS() {
      return t("general.totalReps");
    },
    get AVG_REPS() {
      return t("general.avgReps");
    },
    get WORKOUTS() {
      return t("general.workouts");
    },
    get SEARCH() {
      return t("general.search");
    },
    get FRONT() {
      return t("general.front");
    },
    get BACK() {
      return t("general.back");
    },
    get MUSCLE_HEAT_MAP() {
      return t("general.muscleHeatMap");
    },
    get WORKOUT_DATA() {
      return t("general.workoutData");
    },
    get WORKOUT_LOG() {
      return t("general.workoutLog");
    },
    get CURRENT_FILE() {
      return t("general.currentFile");
    },
    get DASHBOARD() {
      return t("general.dashboard");
    },
  },
  ACTIONS: {
    get EDIT_WORKOUT() {
      return t("general.editWorkout");
    },
    get DELETE_WORKOUT() {
      return t("general.deleteWorkout");
    },
    get EXPORT() {
      return t("general.export");
    },
    get ADD() {
      return t("general.add");
    },
    get ADD_LOG() {
      return t("general.addLog");
    },
    get EDIT() {
      return t("general.edit");
    },
    get EDIT_LOG_ENTRY() {
      return t("general.editLogEntry");
    },
    get DELETE() {
      return t("general.delete");
    },
    get DELETE_LOG_ENTRY() {
      return t("general.deleteLogEntry");
    },
    get DELETE_CONFIRM() {
      return t("general.deleteConfirm");
    },
    get DELETE_SUCCESS() {
      return t("general.deleteSuccess");
    },
    get DELETE_ERROR() {
      return t("general.deleteError");
    },
    get REFRESH_SUCCESS() {
      return t("general.refreshSuccess");
    },
    get CREATE_FILE() {
      return t("general.createFile");
    },
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
    get NO_MATCH_MESSAGE() {
      return t("general.noMatchMessage");
    },
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
