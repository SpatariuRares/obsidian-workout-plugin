/**
 * ErrorCollector - O Layer (Orchestration)
 *
 * Collects and categorizes errors for the DOE Framework learning system.
 * Acts as bridge between application code and error logging infrastructure.
 *
 * This service intercepts errors from views, services, modals, and other components,
 * then delegates to the E-layer (error-logger.mjs) for deterministic logging.
 */

export interface ErrorLogData {
	type: ErrorType;
	component?: string;
	service?: string;
	modal?: string;
	view?: string;
	script?: string;
	method?: string;
	error: Error | string;
	context?: Record<string, any>;
}

export type ErrorType =
	| "view_error"
	| "service_error"
	| "service_error_non_critical"
	| "modal_error"
	| "repository_error"
	| "build_error"
	| "chart_error"
	| "event_handler_error"
	| "cache_error"
	| "unknown";

/**
 * Error Collector Service
 *
 * Singleton service for collecting errors across the application.
 * Errors are queued and can be flushed to external logging system.
 */
export class ErrorCollector {
	private static instance: ErrorCollector | null = null;
	private errorQueue: ErrorLogData[] = [];
	private isEnabled = true;

	private constructor() {
		// Private constructor for singleton
	}

	/**
	 * Get singleton instance
	 */
	static getInstance(): ErrorCollector {
		if (!ErrorCollector.instance) {
			ErrorCollector.instance = new ErrorCollector();
		}
		return ErrorCollector.instance;
	}

	/**
	 * Log an error to the collection system
	 *
	 * @param errorData - Error information to log
	 * @returns Error ID (for future reference)
	 */
	static logError(errorData: ErrorLogData): string {
		const instance = ErrorCollector.getInstance();

		if (!instance.isEnabled) {
			return ""; // Logging disabled
		}

		// Normalize error data
		const normalized = instance.normalizeErrorData(errorData);

		// Add to queue
		instance.errorQueue.push(normalized);

		// Generate simple ID (timestamp + random)
		const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

		// In development mode, also log to console
		if (instance.isDevelopmentMode()) {
			// eslint-disable-next-line no-console
			console.error(`[ErrorCollector] ${normalized.type}:`, {
				component: normalized.component,
				message:
					normalized.error instanceof Error
						? normalized.error.message
						: normalized.error,
				context: normalized.context,
			});
		}

		return id;
	}

	/**
	 * Normalize error data (ensure component field exists)
	 */
	private normalizeErrorData(errorData: ErrorLogData): ErrorLogData {
		return {
			...errorData,
			component:
				errorData.component ||
				errorData.service ||
				errorData.modal ||
				errorData.view ||
				errorData.script ||
				"unknown",
		};
	}

	/**
	 * Check if in development mode
	 */
	private isDevelopmentMode(): boolean {
		// In Obsidian plugin context, we don't have process.env
		// Check if console.debug is available (desktop app)
		// eslint-disable-next-line no-console
		return typeof console.debug === "function";
	}

	/**
	 * Get queued errors (for testing or external processing)
	 */
	static getQueuedErrors(): ErrorLogData[] {
		const instance = ErrorCollector.getInstance();
		return [...instance.errorQueue];
	}

	/**
	 * Clear error queue
	 */
	static clearQueue(): void {
		const instance = ErrorCollector.getInstance();
		instance.errorQueue = [];
	}

	/**
	 * Enable error collection
	 */
	static enable(): void {
		const instance = ErrorCollector.getInstance();
		instance.isEnabled = true;
	}

	/**
	 * Disable error collection (useful for testing)
	 */
	static disable(): void {
		const instance = ErrorCollector.getInstance();
		instance.isEnabled = false;
	}

	/**
	 * Get error statistics
	 */
	static getStats(): {
		total: number;
		byType: Record<string, number>;
		byComponent: Record<string, number>;
	} {
		const instance = ErrorCollector.getInstance();
		const errors = instance.errorQueue;

		const stats = {
			total: errors.length,
			byType: {} as Record<string, number>,
			byComponent: {} as Record<string, number>,
		};

		errors.forEach((error) => {
			stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
			stats.byComponent[error.component || "unknown"] =
				(stats.byComponent[error.component || "unknown"] || 0) + 1;
		});

		return stats;
	}

	/**
	 * Reset singleton (useful for testing)
	 */
	static reset(): void {
		if (ErrorCollector.instance) {
			ErrorCollector.instance.errorQueue = [];
			ErrorCollector.instance.isEnabled = true;
		}
		ErrorCollector.instance = null;
	}
}

