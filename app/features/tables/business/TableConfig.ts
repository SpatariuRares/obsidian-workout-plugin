import { CONSTANTS } from "@app/constants";
import {
  EmbeddedTableParams,
  TABLE_SORT_FIELDS,
} from "@app/features/tables/types";
import { t } from "@app/i18n";

/**
 * Configuration and validation for table parameters.
 * Handles default values, validation, and parameter merging.
 */
export class TableConfig {
  /**
   * Get default table parameters
   */
  static getDefaults(): EmbeddedTableParams {
    // columns stays unset: headers are resolved per exercise type
    return {
      limit: CONSTANTS.WORKOUT.TABLE.LIMITS.DEFAULT,
      showAddButton: true,
      exactMatch: CONSTANTS.WORKOUT.TABLE.DEFAULTS.EXACT_MATCH,
      sortBy: "date",
      sortOrder: "desc",
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
            params.limit.toString(),
          ),
        );
      }
    }

    if (
      params.sortBy !== undefined &&
      !TABLE_SORT_FIELDS.includes(params.sortBy)
    ) {
      errors.push(
        t("table.validation.sortByInvalid", {
          value: String(params.sortBy),
          allowed: TABLE_SORT_FIELDS.join(", "),
        }),
      );
    }

    if (
      params.sortOrder !== undefined &&
      params.sortOrder !== "asc" &&
      params.sortOrder !== "desc"
    ) {
      errors.push(
        t("table.validation.sortOrderInvalid", {
          value: String(params.sortOrder),
        }),
      );
    }

    if (params.columns) {
      if (
        !Array.isArray(params.columns) &&
        typeof params.columns !== "string"
      ) {
        errors.push(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS
            .COLUMNS_INVALID_TYPE,
        );
      } else if (
        Array.isArray(params.columns) &&
        !params.columns.every((c) => typeof c === "string")
      ) {
        errors.push(
          CONSTANTS.WORKOUT.TABLE.VALIDATION_ERRORS
            .COLUMNS_NOT_STRINGS,
        );
      }
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
    params: Partial<EmbeddedTableParams>,
  ): EmbeddedTableParams {
    const defined = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined),
    );
    return {
      ...this.getDefaults(),
      ...defined,
    };
  }
}
