/**
 * Error Logger - E Layer (Execution)
 *
 * Deterministic error logging for the DOE Framework learning system.
 * Logs errors to error-log.json for pattern analysis and directive updates.
 *
 * Usage:
 *   import { logError, logBuildError } from './scripts/learning/error-logger.mjs';
 *
 *   await logError({
 *     type: 'service_error',
 *     component: 'DataService',
 *     error: errorObject,
 *     context: { method: 'fetchData', params: {...} }
 *   });
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ERROR_LOG_PATH = path.join(__dirname, "error-log.json");
const MAX_LOG_SIZE = 1000; // Keep last 1000 errors

/**
 * Error log entry structure
 */
class ErrorLogEntry {
  constructor(data) {
    this.id = this.generateId();
    this.timestamp = new Date().toISOString();
    this.type = data.type || "unknown";
    this.component = data.component || data.service || data.modal || data.view || data.script || "unknown";
    this.message = data.error?.message || data.error || "No error message";
    this.stack = data.error?.stack || null;
    this.context = data.context || {};
    this.resolved = false;
    this.resolution = null;
    this.directiveUpdated = null;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      type: this.type,
      component: this.component,
      message: this.message,
      stack: this.stack,
      context: this.context,
      resolved: this.resolved,
      resolution: this.resolution,
      directiveUpdated: this.directiveUpdated,
    };
  }
}

/**
 * Read existing error log
 */
async function readErrorLog() {
  try {
    const content = await fs.readFile(ERROR_LOG_PATH, "utf-8");
    const data = JSON.parse(content);
    return data.errors || [];
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist - return empty log
      return [];
    }
    throw error;
  }
}

/**
 * Write error log
 */
async function writeErrorLog(errors) {
  const data = {
    version: "1.0",
    lastUpdated: new Date().toISOString(),
    totalErrors: errors.length,
    errors: errors,
  };

  await fs.writeFile(ERROR_LOG_PATH, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Log an error to the error log
 *
 * @param {Object} errorData - Error data
 * @param {string} errorData.type - Error type (view_error, service_error, etc.)
 * @param {string} errorData.component - Component name (optional, derived from service/modal/view/script)
 * @param {Error|string} errorData.error - Error object or message
 * @param {Object} errorData.context - Additional context
 * @returns {Promise<string>} Error ID
 */
export async function logError(errorData) {
  try {
    // Read existing log
    const errors = await readErrorLog();

    // Create new entry
    const entry = new ErrorLogEntry(errorData);

    // Add to log
    errors.push(entry.toJSON());

    // Trim log if too large (keep most recent)
    if (errors.length > MAX_LOG_SIZE) {
      errors.splice(0, errors.length - MAX_LOG_SIZE);
    }

    // Write log
    await writeErrorLog(errors);

    return entry.id;
  } catch (error) {
    // If error logging fails, write to console but don't throw
    // (we don't want error logging to break the application)
    console.error("[ErrorLogger] Failed to log error:", error.message);
    return null;
  }
}

/**
 * Log a build error (convenience function for build scripts)
 *
 * @param {Object} errorData - Error data
 * @param {string} errorData.script - Script name (e.g., 'build-css.mjs')
 * @param {Error} errorData.error - Error object
 * @param {Object} errorData.context - Additional context
 * @returns {Promise<string>} Error ID
 */
export async function logBuildError(errorData) {
  return await logError({
    type: "build_error",
    component: errorData.script,
    error: errorData.error,
    context: {
      ...errorData.context,
      cwd: process.cwd(),
      nodeVersion: process.version,
    },
  });
}

/**
 * Mark an error as resolved
 *
 * @param {string} errorId - Error ID
 * @param {string} resolution - How the error was resolved
 * @param {string} directiveUpdated - Which directive was updated (if any)
 */
export async function markResolved(errorId, resolution, directiveUpdated = null) {
  try {
    const errors = await readErrorLog();
    const error = errors.find((e) => e.id === errorId);

    if (error) {
      error.resolved = true;
      error.resolution = resolution;
      error.directiveUpdated = directiveUpdated;
      error.resolvedAt = new Date().toISOString();

      await writeErrorLog(errors);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[ErrorLogger] Failed to mark error as resolved:", error.message);
    return false;
  }
}

/**
 * Get error statistics
 */
export async function getErrorStats() {
  try {
    const errors = await readErrorLog();

    const stats = {
      total: errors.length,
      resolved: errors.filter((e) => e.resolved).length,
      unresolved: errors.filter((e) => !e.resolved).length,
      byType: {},
      byComponent: {},
      recentErrors: errors.slice(-10).reverse(),
    };

    // Count by type
    errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.byComponent[error.component] = (stats.byComponent[error.component] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error("[ErrorLogger] Failed to get error stats:", error.message);
    return null;
  }
}

/**
 * Clear resolved errors older than N days
 *
 * @param {number} days - Number of days (default: 30)
 */
export async function pruneResolvedErrors(days = 30) {
  try {
    const errors = await readErrorLog();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filtered = errors.filter((error) => {
      if (!error.resolved) return true; // Keep all unresolved errors

      const resolvedDate = new Date(error.resolvedAt || error.timestamp);
      return resolvedDate > cutoffDate; // Keep recent resolved errors
    });

    await writeErrorLog(filtered);

    return {
      before: errors.length,
      after: filtered.length,
      removed: errors.length - filtered.length,
    };
  } catch (error) {
    console.error("[ErrorLogger] Failed to prune errors:", error.message);
    return null;
  }
}

/**
 * Initialize error log (create empty log if doesn't exist)
 */
export async function initErrorLog() {
  try {
    await readErrorLog();
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeErrorLog([]);
      console.log("✓ Created error-log.json");
    } else {
      throw error;
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];

  switch (command) {
    case "init":
      await initErrorLog();
      break;

    case "stats":
      const stats = await getErrorStats();
      console.log(JSON.stringify(stats, null, 2));
      break;

    case "prune":
      const days = parseInt(process.argv[3]) || 30;
      const result = await pruneResolvedErrors(days);
      console.log(`Pruned ${result.removed} resolved errors older than ${days} days`);
      break;

    default:
      console.log(`
Error Logger CLI

Usage:
  node error-logger.mjs init          # Initialize error log
  node error-logger.mjs stats         # Show error statistics
  node error-logger.mjs prune [days]  # Prune resolved errors (default: 30 days)
      `);
  }
}
