import { CONSTANTS } from "@app/constants/Constants";
import { EmbeddedTableParams } from "@app/types";

/**
 * Configuration and validation for table parameters.
 * Handles default values, validation, and parameter merging.
 */
export class TableConfig {
  /**
   * Get default table parameters
   */
  static getDefaults(): EmbeddedTableParams {
    return {
      limit: CONSTANTS.WORKOUT.TABLE.LIMITS.DEFAULT,
      showAddButton: true,
      buttonText: CONSTANTS.WORKOUT.TABLE.DEFAULTS.BUTTON_TEXT,
      searchByName: false,
      exactMatch: CONSTANTS.WORKOUT.TABLE.DEFAULTS.EXACT_MATCH,
      columns: [...CONSTANTS.WORKOUT.TABLE.DEFAULT_VISIBLE_COLUMNS],
    };
  }

  /**
   * Validate table parameters
   */
  static validateParams(params: EmbeddedTableParams): string[] {
    const errors: string[] = [];

    if (params.limit !== undefined) {
      const limit = parseInt(params.limit.toString());
      if (
        isNaN(limit) ||
        limit < CONSTANTS.WORKOUT.TABLE.LIMITS.MIN ||
        limit > CONSTANTS.WORKOUT.TABLE.LIMITS.MAX
      ) {
        errors.push(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.LIMIT_RANGE(
            CONSTANTS.WORKOUT.TABLE.LIMITS.MIN,
            CONSTANTS.WORKOUT.TABLE.LIMITS.MAX,
            params.limit.toString()
          )
        );
      }
    }

    if (params.columns) {
      if (
        !Array.isArray(params.columns) &&
        typeof params.columns !== "string"
      ) {
        errors.push(CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.COLUMNS_INVALID_TYPE);
      } else if (
        Array.isArray(params.columns) &&
        !params.columns.every((c) => typeof c === "string")
      ) {
        errors.push(CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.COLUMNS_NOT_STRINGS);
      }
    }

    if (params.buttonText && typeof params.buttonText !== "string") {
      errors.push(CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS.BUTTON_TEXT_NOT_STRING);
    }

    return errors;
  }

  /**
   * Check if validation errors exist
   */
  static hasValidationErrors(errors: string[]): boolean {
    return errors.length > 0;
  }

  /**
   * Format validation errors for display
   */
  static formatValidationErrors(errors: string[]): string {
    return errors.join(", ");
  }

  /**
   * Merge user params with defaults
   */
  static mergeWithDefaults(
    params: Partial<EmbeddedTableParams>
  ): EmbeddedTableParams {
    return {
      ...this.getDefaults(),
      ...params,
    };
  }
}

