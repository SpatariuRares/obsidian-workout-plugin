/**
 * Utility for extracting error messages from unknown error types.
 */
export class ErrorUtils {
  /**
   * Extracts a human-readable message from an unknown error value.
   * @param error - The caught error (unknown type)
   * @returns The error message string
   */
  static getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
