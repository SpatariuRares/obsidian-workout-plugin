import { EmbeddedTableParams } from "@app/types";
import { TableDataProcessor } from "@app/components/table/TableDataProcessor";

export class TableValidator {
  /**
   * Validate table parameters using existing TableDataProcessor validation
   */
  static validateTableParams(params: EmbeddedTableParams): string[] {
    return TableDataProcessor.validateTableParams(params);
  }

  /**
   * Check if validation errors exist and should prevent rendering
   */
  static hasValidationErrors(validationErrors: string[]): boolean {
    return validationErrors.length > 0;
  }

  /**
   * Format validation errors for display
   */
  static formatValidationErrors(validationErrors: string[]): string {
    return validationErrors.join(", ");
  }
}