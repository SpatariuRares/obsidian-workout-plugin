/**
 * @fileoverview Validation Constants
 *
 * This file contains validation-related constants including:
 * - Error type classifications
 *
 * Part of the Phase 5 refactoring to split Constants.ts into focused modules.
 */

/**
 * Error type classifications for error handling
 */
export const ERROR_TYPES = {
  /** Validation error type */
  VALIDATION: "Validation error",
  /** Table-related error type */
  TABLE: "Table error",
  /** Generic error type */
  GENERIC: "Error",
} as const;
