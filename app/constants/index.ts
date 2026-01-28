/**
 * Constants Barrel Export
 *
 * This module provides a single import point for all constants.
 * Supports both barrel imports and direct module imports:
 *
 * @example
 * // Barrel import (convenient)
 * import { ICONS, DEFAULT_SETTINGS, MUSCLE_TAGS } from '@app/constants';
 *
 * // Direct import (better tree-shaking)
 * import { ICONS } from '@app/constants/ui.constants';
 * import { DEFAULT_SETTINGS } from '@app/constants/defaults.constants';
 */

// Re-export from individual constant modules
export * from "@app/constants/ui.constants";
export * from "@app/constants/defaults.constants";
export * from "@app/constants/muscles.constants";
export * from "@app/constants/validation.constants";

// Re-export from original modules (for backward compatibility)
export * from "@app/constants/Constants";
export * from "@app/constants/MuscleTags";
