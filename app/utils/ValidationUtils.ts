import { EmbeddedViewParams } from "@app/types/PluginTypes";
import { CHART_DATA_TYPE, CHART_TYPE } from "@app/features/charts/types";

/**
 * Utility class for parameter validation operations
 * Handles validation of user-provided parameters for views
 */
export class ValidationUtils {
  /**
   * Validate user parameters and return errors if present
   */
  static validateUserParams(params: EmbeddedViewParams): string[] {
    const errors: string[] = [];

    // Validate dateRange (exists in chart and table params)
    if ("dateRange" in params && params.dateRange !== undefined) {
      const dateRange = Number(params.dateRange);
      if (isNaN(dateRange) || dateRange < 1 || dateRange > 365) {
        errors.push("dateRange must be a number between 1 and 365");
      }
    }

    // Validate limit (exists in chart and table params)
    if ("limit" in params && params.limit !== undefined) {
      const limit = Number(params.limit);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        errors.push("limit must be a number between 1 and 1000");
      }
    }

    // Validate chartType (exists only in chart params)
    // - exercise: filter by exercise name
    // - workout: filter by workout name
    // - combined: filter by both exercise AND workout
    // - all: show all data from CSV without filtering
    if ("chartType" in params && params.chartType !== undefined) {
      const chartType = params.chartType;
      if (
        ![
          CHART_TYPE.EXERCISE,
          CHART_TYPE.WORKOUT,
          CHART_TYPE.COMBINED,
          CHART_TYPE.ALL,
        ].includes(chartType)
      ) {
        errors.push(
          "chartType must be 'exercise', 'workout', 'combined', or 'all'",
        );
      }
    }

    // Validate type for charts (exists only in chart params)
    // Accepts all valid CHART_DATA_TYPE values including dynamic types
    if ("type" in params && params.type !== undefined) {
      const type = String(params.type);
      const validTypes: string[] = [
        CHART_DATA_TYPE.VOLUME,
        CHART_DATA_TYPE.WEIGHT,
        CHART_DATA_TYPE.REPS,
        CHART_DATA_TYPE.DURATION,
        CHART_DATA_TYPE.DISTANCE,
        CHART_DATA_TYPE.PACE,
        CHART_DATA_TYPE.HEART_RATE,
      ];
      if (!validTypes.includes(type)) {
        errors.push(`type must be one of: ${validTypes.join(", ")}`);
      }
    }

    // Validate duration for timers (exists only in timer params)
    if ("duration" in params && params.duration !== undefined) {
      const duration = Number(params.duration);
      if (isNaN(duration) || duration < 1 || duration > 3600) {
        errors.push("duration must be a number between 1 and 3600 seconds");
      }
    }

    return errors;
  }
}
