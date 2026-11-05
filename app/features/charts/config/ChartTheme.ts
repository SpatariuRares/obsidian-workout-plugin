/**
 * Color management for Chart.js visualizations.
 * Provides theme-aware colors using Obsidian CSS variables with fallbacks.
 */

import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { hexToRgba } from "@app/utils/ColorUtils";

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
 * Integrates with Obsidian's theme system using CSS variables, the way
 * DESIGN.md uses them: one series in the theme accent on an inset surface,
 * muted ink for axes and the trend line, the subtle border for the grid.
 */
export class ChartColors {
  private static readonly FALLBACK_COLORS = {
    primary: "#6366F1",
    primaryHover: "#4338CA",
    muted: "#5c5c5c",
    gray: "#374151",
    border: "rgba(156, 163, 175, 0.2)",
    backgroundPrimary: "rgba(255, 255, 255, 0.95)",
    backgroundSecondary: "rgba(17, 24, 39, 0.95)",
  };

  /** The design system's token first, Obsidian's variable for older styles */
  private static readonly GRID_VARS = ["workout-border-subtle", "background-modifier-border"];
  private static readonly BORDER_VARS = ["workout-border-color", "background-modifier-border"];

  /**
   * A theme color as the canvas can draw it. Themes write colors as
   * `hsl()` or `color-mix()` (and the `--workout-*` tokens mix them), so the
   * browser resolves them on a probe element; where it can't (tests), the
   * variable's own value is used, made transparent when it is a hex color.
   * @param varName - CSS variable name (without -- prefix)
   * @param fallback - Used when the theme doesn't define the variable
   * @param alpha - Opacity, 1 = opaque
   */
  private static getCSSVar(
    varName: string,
    fallback: string,
    alpha = 1,
  ): string {
    // Obsidian defines its theme variables on body.theme-*, not on :root
    const value = getComputedStyle(document.body)
      .getPropertyValue(`--${varName}`)
      .trim();
    if (!value) return this.withAlpha(fallback, alpha);
    return this.resolveOnProbe(varName, alpha) || this.withAlpha(value, alpha);
  }

  private static resolveOnProbe(varName: string, alpha: number): string {
    // Inside body, where the theme variables and --workout-* tokens live
    const probe = document.body.createSpan();
    try {
      probe.style.color =
        alpha < 1
          ? `color-mix(in srgb, var(--${varName}) ${Math.round(alpha * 100)}%, transparent)`
          : `var(--${varName})`;
      return (probe.style.color && getComputedStyle(probe).color) || "";
    } finally {
      probe.remove();
    }
  }

  private static withAlpha(value: string, alpha: number): string {
    return alpha < 1 && value.startsWith("#") ? hexToRgba(value, alpha) : value;
  }

  /** The first variable the theme defines, so a token falls back to Obsidian's */
  private static firstDefined(...varNames: string[]): string {
    const style = getComputedStyle(document.body);
    return (
      varNames.find((name) => style.getPropertyValue(`--${name}`).trim()) ??
      varNames[varNames.length - 1]
    );
  }

  /**
   * Gets the complete color palette for charts
   * Integrates with Obsidian's theme system
   * @returns Complete chart color palette
   */
  static getChartColors(): ChartColorPalette {
    const { FALLBACK_COLORS: fallback } = this;
    const accent = this.getCSSVar("interactive-accent", fallback.primary);
    const muted = this.getCSSVar("text-muted", fallback.muted);
    const page = this.getCSSVar("background-primary", fallback.backgroundPrimary);
    const gridVar = this.firstDefined(...this.GRID_VARS);

    return {
      primary: {
        main: accent,
        light: this.getCSSVar("interactive-accent", fallback.primary, 0.15),
        dark: accent,
        // Points are inset like the card's controls: page color, accent ring
        point: page,
        pointBorder: accent,
      },
      trend: {
        main: muted,
        light: "transparent",
        dark: muted,
        point: muted,
        pointBorder: muted,
      },
      // Lines behind the data: fainter than a border (the token is a 3:1
      // control border, Obsidian's a lighter one)
      grid: this.getCSSVar(
        gridVar,
        fallback.border,
        gridVar === "background-modifier-border" ? 0.25 : 0.4,
      ),
      text: muted,
      background: page,
      tooltip: {
        background: this.getCSSVar("background-secondary", fallback.backgroundSecondary),
        border: this.getCSSVar(
          this.firstDefined(...this.BORDER_VARS),
          fallback.border,
        ),
        text: this.getCSSVar("text-normal", fallback.gray),
      },
    };
  }

  /**
   * The series' color scheme. Every type uses the accent: a chart shows one
   * series, and the accent is the only color the design system draws data in.
   * @param _dataType - Type of chart data (kept for callers)
   */
  static getColorSchemeForType(_dataType: CHART_DATA_TYPE): ColorScheme {
    return this.getChartColors().primary;
  }
}
