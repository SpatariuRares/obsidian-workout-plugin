/**
 * Utility for generating heat map colors based on intensity values.
 * Provides a gradient from gray (no activity) to red (high intensity).
 */

/**
 * Color thresholds for heat map gradient
 */
const INTENSITY_THRESHOLDS = {
	LOW: 0.3,
	MEDIUM: 0.7,
} as const;

/**
 * Base colors for the gradient
 */
const BASE_COLORS = {
	ZERO: "#e9ecef", // No activity color
	LOW_START: { r: 200, g: 200, b: 200 }, // Light gray
	LOW_END: { r: 255, g: 150, b: 100 }, // Light orange
	MEDIUM_START: { r: 255, g: 150, b: 100 }, // Light orange
	MEDIUM_END: { r: 255, g: 50, b: 20 }, // Bright red
	HIGH_START: { r: 255, g: 50, b: 20 }, // Bright red
	HIGH_END: { r: 155, g: 0, b: 0 }, // Dark red
} as const;

/**
 * Manages heat map color generation for muscle intensity visualization
 */
export class HeatMapColors {
	/**
	 * Interpolates between two values
	 * @param start - Start value
	 * @param end - End value
	 * @param t - Interpolation factor (0-1)
	 * @returns Interpolated value
	 */
	private static interpolate(start: number, end: number, t: number): number {
		return Math.floor(start + (end - start) * t);
	}

	/**
	 * Generates an RGB color string from components
	 * @param r - Red component (0-255)
	 * @param g - Green component (0-255)
	 * @param b - Blue component (0-255)
	 * @returns RGB color string
	 */
	private static rgb(r: number, g: number, b: number): string {
		return `rgb(${r}, ${g}, ${b})`;
	}

	/**
	 * Calculates color for low intensity range (0-0.3)
	 * Gradient from light gray to light orange
	 * @param intensity - Normalized intensity value (0-0.3)
	 * @returns RGB color string
	 */
	private static getLowIntensityColor(intensity: number): string {
		const t = intensity / INTENSITY_THRESHOLDS.LOW;
		const r = this.interpolate(BASE_COLORS.LOW_START.r, BASE_COLORS.LOW_END.r, t);
		const g = this.interpolate(BASE_COLORS.LOW_START.g, BASE_COLORS.LOW_END.g, t);
		const b = this.interpolate(BASE_COLORS.LOW_START.b, BASE_COLORS.LOW_END.b, t);
		return this.rgb(r, g, b);
	}

	/**
	 * Calculates color for medium intensity range (0.3-0.7)
	 * Gradient from light orange to bright red
	 * @param intensity - Normalized intensity value (0.3-0.7)
	 * @returns RGB color string
	 */
	private static getMediumIntensityColor(intensity: number): string {
		const t =
			(intensity - INTENSITY_THRESHOLDS.LOW) /
			(INTENSITY_THRESHOLDS.MEDIUM - INTENSITY_THRESHOLDS.LOW);
		const r = this.interpolate(BASE_COLORS.MEDIUM_START.r, BASE_COLORS.MEDIUM_END.r, t);
		const g = this.interpolate(BASE_COLORS.MEDIUM_START.g, BASE_COLORS.MEDIUM_END.g, t);
		const b = this.interpolate(BASE_COLORS.MEDIUM_START.b, BASE_COLORS.MEDIUM_END.b, t);
		return this.rgb(r, g, b);
	}

	/**
	 * Calculates color for high intensity range (0.7-1)
	 * Gradient from bright red to dark red
	 * @param intensity - Normalized intensity value (0.7-1)
	 * @returns RGB color string
	 */
	private static getHighIntensityColor(intensity: number): string {
		const t =
			(intensity - INTENSITY_THRESHOLDS.MEDIUM) /
			(1 - INTENSITY_THRESHOLDS.MEDIUM);
		const r = this.interpolate(BASE_COLORS.HIGH_START.r, BASE_COLORS.HIGH_END.r, t);
		const g = this.interpolate(BASE_COLORS.HIGH_START.g, BASE_COLORS.HIGH_END.g, t);
		const b = this.interpolate(BASE_COLORS.HIGH_START.b, BASE_COLORS.HIGH_END.b, t);
		return this.rgb(r, g, b);
	}

	/**
	 * Generates a heat map color based on intensity value
	 * @param intensity - Normalized intensity (0-1)
	 * @returns RGB color string representing the intensity
	 *
	 * @example
	 * HeatMapColors.getColor(0) // "#e9ecef" (gray - no activity)
	 * HeatMapColors.getColor(0.15) // Light orange (low intensity)
	 * HeatMapColors.getColor(0.5) // Orange-red (medium intensity)
	 * HeatMapColors.getColor(0.9) // Dark red (high intensity)
	 */
	static getColor(intensity: number): string {
		// No activity
		if (intensity === 0) {
			return BASE_COLORS.ZERO;
		}

		// Low intensity: gray to light orange
		if (intensity < INTENSITY_THRESHOLDS.LOW) {
			return this.getLowIntensityColor(intensity);
		}

		// Medium intensity: orange to bright red
		if (intensity < INTENSITY_THRESHOLDS.MEDIUM) {
			return this.getMediumIntensityColor(intensity);
		}

		// High intensity: bright red to dark red
		return this.getHighIntensityColor(intensity);
	}

	/**
	 * Generates colors for multiple intensity values
	 * @param intensities - Object with muscle names and intensity values
	 * @returns Object with muscle names and color strings
	 */
	static getColors(intensities: Record<string, number>): Record<string, string> {
		const result: Record<string, string> = {};
		Object.entries(intensities).forEach(([key, intensity]) => {
			result[key] = this.getColor(intensity);
		});
		return result;
	}
}

