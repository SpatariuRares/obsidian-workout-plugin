/**
 * Utility for calculating normalized muscle intensity values.
 * Handles intensity normalization and bilateral muscle comparisons.
 */

/**
 * Represents muscle data with optional left/right sides
 */
export interface MuscleData {
	[key: string]: number;
}

/**
 * Calculator for muscle intensity values
 */
export class IntensityCalculator {
	private maxValue: number;

	constructor(maxValue: number) {
		this.maxValue = maxValue;
	}

	/**
	 * Normalizes a single muscle value to 0-1 scale
	 * @param value - Raw muscle value
	 * @returns Normalized intensity (0-1, clamped)
	 */
	normalize(value: number): number {
		return Math.min(value / this.maxValue, 1);
	}

	/**
	 * Calculates intensity for bilateral muscles (takes max of left/right)
	 * @param leftValue - Left side muscle value
	 * @param rightValue - Right side muscle value
	 * @returns Normalized intensity (0-1, clamped)
	 */
	normalizeBilateral(leftValue: number, rightValue: number): number {
		const maxValue = Math.max(leftValue, rightValue);
		return this.normalize(maxValue);
	}

	/**
	 * Calculates intensities for multiple muscles
	 * @param values - Object with muscle names and values
	 * @returns Object with muscle names and normalized intensities
	 */
	normalizeMultiple(values: MuscleData): MuscleData {
		const result: MuscleData = {};
		Object.entries(values).forEach(([key, value]) => {
			result[key] = this.normalize(value);
		});
		return result;
	}

	/**
	 * Calculates average intensity from multiple values
	 * @param values - Array of muscle values
	 * @returns Normalized average intensity (0-1, clamped)
	 */
	normalizeAverage(values: number[]): number {
		if (values.length === 0) return 0;
		const average = values.reduce((sum, val) => sum + val, 0) / values.length;
		return this.normalize(average);
	}

	/**
	 * Updates the max value for normalization
	 * @param maxValue - New maximum value
	 */
	setMaxValue(maxValue: number): void {
		this.maxValue = maxValue;
	}

	/**
	 * Gets the current max value
	 * @returns Current maximum value
	 */
	getMaxValue(): number {
		return this.maxValue;
	}
}

