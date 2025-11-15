/**
 * Color management for Chart.js visualizations.
 * Provides theme-aware colors using Obsidian CSS variables with fallbacks.
 */

/**
 * Represents a complete color scheme for a chart element
 */
export interface ColorScheme {
	main: string;
	light: string;
	dark: string;
	point: string;
	pointBorder: string;
}

/**
 * Represents the complete color palette for all chart elements
 */
export interface ChartColorPalette {
	primary: ColorScheme;
	secondary: ColorScheme;
	accent: ColorScheme;
	trend: ColorScheme;
	grid: string;
	text: string;
	background: string;
	tooltip: {
		background: string;
		border: string;
		text: string;
	};
}

/**
 * Manages color extraction and conversion for charts.
 * Integrates with Obsidian's theme system using CSS variables.
 */
export class ChartColors {
	private static readonly FALLBACK_COLORS = {
		primary: "#6366F1",
		primaryHover: "#4338CA",
		success: "#10B981",
		successHover: "#059669",
		warning: "#F59E0B",
		warningHover: "#D97706",
		error: "#EF4444",
		errorHover: "#DC2626",
		white: "#FFFFFF",
		gray: "#374151",
		border: "rgba(156, 163, 175, 0.2)",
		backgroundPrimary: "rgba(255, 255, 255, 0.95)",
		backgroundSecondary: "rgba(17, 24, 39, 0.95)",
	};

	/**
	 * Gets a CSS variable value with fallback
	 * @param varName - CSS variable name (without -- prefix)
	 * @param fallback - Fallback value if variable is not defined
	 * @returns The CSS variable value or fallback
	 */
	private static getCSSVar(varName: string, fallback: string): string {
		const style = getComputedStyle(document.documentElement);
		const value = style.getPropertyValue(`--${varName}`).trim();
		return value || fallback;
	}

	/**
	 * Converts a hex color to rgba with specified opacity
	 * @param hex - Hex color code (e.g., "#6366F1")
	 * @param opacity - Opacity value between 0 and 1
	 * @returns RGBA color string
	 */
	private static hexToRgba(hex: string, opacity: number): string {
		// Remove # if present
		hex = hex.replace(/^#/, "");

		// Parse hex values
		const r = parseInt(hex.substring(0, 2), 16);
		const g = parseInt(hex.substring(2, 4), 16);
		const b = parseInt(hex.substring(4, 6), 16);

		return `rgba(${r}, ${g}, ${b}, ${opacity})`;
	}

	/**
	 * Creates a color scheme with main, light, dark, point, and border colors
	 * @param mainVar - CSS variable for main color
	 * @param mainFallback - Fallback for main color
	 * @param hoverVar - CSS variable for hover/dark color
	 * @param hoverFallback - Fallback for hover color
	 * @param lightOpacity - Opacity for light variant (default: 0.2)
	 * @returns Complete color scheme
	 */
	private static createColorScheme(
		mainVar: string,
		mainFallback: string,
		hoverVar: string,
		hoverFallback: string,
		lightOpacity: number = 0.2
	): ColorScheme {
		const main = this.getCSSVar(mainVar, mainFallback);
		const dark = this.getCSSVar(hoverVar, hoverFallback);
		const point = this.getCSSVar(
			"text-on-accent",
			this.FALLBACK_COLORS.white
		);

		return {
			main,
			light: this.hexToRgba(main, lightOpacity),
			dark,
			point,
			pointBorder: dark,
		};
	}

	/**
	 * Gets the complete color palette for charts
	 * Integrates with Obsidian's theme system
	 * @returns Complete chart color palette
	 */
	static getChartColors(): ChartColorPalette {
		return {
			primary: this.createColorScheme(
				"interactive-accent",
				this.FALLBACK_COLORS.primary,
				"interactive-accent-hover",
				this.FALLBACK_COLORS.primaryHover
			),
			secondary: this.createColorScheme(
				"text-success",
				this.FALLBACK_COLORS.success,
				"text-success-hover",
				this.FALLBACK_COLORS.successHover
			),
			accent: this.createColorScheme(
				"text-warning",
				this.FALLBACK_COLORS.warning,
				"text-warning-hover",
				this.FALLBACK_COLORS.warningHover
			),
			trend: this.createColorScheme(
				"text-error",
				this.FALLBACK_COLORS.error,
				"text-error-hover",
				this.FALLBACK_COLORS.errorHover
			),
			grid: this.hexToRgba(
				this.getCSSVar(
					"background-modifier-border",
					this.FALLBACK_COLORS.border
				),
				0.25
			),
			text: this.getCSSVar("text-normal", this.FALLBACK_COLORS.gray),
			background: this.getCSSVar(
				"background-primary",
				this.FALLBACK_COLORS.backgroundPrimary
			),
			tooltip: {
				background: this.hexToRgba(
					this.getCSSVar(
						"background-secondary",
						this.FALLBACK_COLORS.backgroundSecondary
					),
					0.95
				),
				border: this.getCSSVar(
					"interactive-accent",
					this.FALLBACK_COLORS.primary
				),
				text: this.getCSSVar("text-normal", this.FALLBACK_COLORS.white),
			},
		};
	}

	/**
	 * Gets the appropriate color scheme based on chart type
	 * @param chartType - Type of chart data (volume, weight, reps)
	 * @returns Color scheme object
	 */
	static getColorSchemeForType(chartType: string): ColorScheme {
		const colors = this.getChartColors();
		switch (chartType) {
			case "volume":
				return colors.primary;
			case "weight":
				return colors.secondary;
			case "reps":
				return colors.accent;
			default:
				return colors.primary;
		}
	}
}
