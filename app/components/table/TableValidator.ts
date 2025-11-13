import { EmbeddedTableParams } from "@app/types";
import { TableConfig } from "@app/components/table/TableConfig";

/**
 * @deprecated Use TableConfig directly instead.
 * This class exists for backward compatibility and will be removed in a future version.
 */
export class TableValidator {
  /**
   * @deprecated Use TableConfig.validateParams() instead
   */
  static validateTableParams(params: EmbeddedTableParams): string[] {
    return TableConfig.validateParams(params);
  }

  /**
   * @deprecated Use TableConfig.hasValidationErrors() instead
   */
  static hasValidationErrors(validationErrors: string[]): boolean {
    return TableConfig.hasValidationErrors(validationErrors);
  }

  /**
   * @deprecated Use TableConfig.formatValidationErrors() instead
   */
  static formatValidationErrors(validationErrors: string[]): string {
    return TableConfig.formatValidationErrors(validationErrors);
  }
}
