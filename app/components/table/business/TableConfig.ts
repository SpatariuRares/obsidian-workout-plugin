import { EmbeddedTableParams } from "@app/types";
import {
  TABLE_LIMITS,
  DEFAULT_VISIBLE_COLUMNS,
  TABLE_DEFAULTS,
  TABLE_VALIDATION_ERRORS,
} from "@app/constants/TableConstats";

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
      limit: TABLE_LIMITS.DEFAULT,
      showAddButton: true,
      buttonText: TABLE_DEFAULTS.BUTTON_TEXT,
      searchByName: false,
      exactMatch: false,
      debug: false,
      columns: [...DEFAULT_VISIBLE_COLUMNS],
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
        limit < TABLE_LIMITS.MIN ||
        limit > TABLE_LIMITS.MAX
      ) {
        errors.push(
          TABLE_VALIDATION_ERRORS.LIMIT_RANGE(
            TABLE_LIMITS.MIN,
            TABLE_LIMITS.MAX,
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
        errors.push(TABLE_VALIDATION_ERRORS.COLUMNS_INVALID_TYPE);
      } else if (
        Array.isArray(params.columns) &&
        !params.columns.every((c) => typeof c === "string")
      ) {
        errors.push(TABLE_VALIDATION_ERRORS.COLUMNS_NOT_STRINGS);
      }
    }

    if (params.buttonText && typeof params.buttonText !== "string") {
      errors.push(TABLE_VALIDATION_ERRORS.BUTTON_TEXT_NOT_STRING);
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
