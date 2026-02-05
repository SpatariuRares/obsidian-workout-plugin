/**
 * Renderer for duration estimation cards.
 * Handles all DOM creation and styling for duration displays.
 */
import { DurationAnalysisResult } from "@app/features/duration/types";
import { FormatUtils } from "@app/utils/FormatUtils";

/** Default set duration in seconds (used for debug display) */
const DEFAULT_SET_DURATION = 45;

export class DurationRenderer {
  /**
   * Renders the duration info card with the analysis results.
   * Uses an info card style distinct from the timer countdown display.
   * @param container - HTML element to render into
   * @param analysis - Analysis results to display
   */
  renderDurationCard(
    container: HTMLElement,
    analysis: DurationAnalysisResult,
  ): void {
    const card = container.createEl("div", {
      cls: "workout-duration-card",
    });

    // Header with icon
    this.renderHeader(card);

    // Handle error state
    if (!analysis.success) {
      this.renderError(card, analysis.error);
      return;
    }

    // Main duration display
    this.renderMainDisplay(card, analysis);

    // Breakdown section
    this.renderBreakdown(card, analysis);
  }

  /**
   * Renders the card header with icon and title.
   */
  private renderHeader(card: HTMLElement): void {
    const header = card.createEl("div", {
      cls: "workout-duration-header",
    });

    header.createEl("span", {
      cls: "workout-duration-icon",
      text: "⏱️",
    });

    header.createEl("span", {
      cls: "workout-duration-title",
      text: "Estimated duration",
    });
  }

  /**
   * Renders an error message.
   */
  private renderError(card: HTMLElement, error?: string): void {
    card.createEl("div", {
      cls: "workout-duration-error",
      text: error || "Unable to analyze workout file",
    });
  }

  /**
   * Renders the main duration display.
   */
  private renderMainDisplay(
    card: HTMLElement,
    analysis: DurationAnalysisResult,
  ): void {
    const mainDisplay = card.createEl("div", {
      cls: "workout-duration-main",
    });

    mainDisplay.createEl("span", {
      cls: "workout-duration-value",
      text: FormatUtils.formatDuration(analysis.totalDuration),
    });
  }

  /**
   * Renders the duration breakdown (rest time and set time).
   */
  private renderBreakdown(
    card: HTMLElement,
    analysis: DurationAnalysisResult,
  ): void {
    const breakdown = card.createEl("div", {
      cls: "workout-duration-breakdown",
    });

    // Rest time row
    this.renderBreakdownRow(
      breakdown,
      "Rest time",
      FormatUtils.formatDuration(analysis.totalRestTime),
    );

    // Set time row
    this.renderBreakdownRow(
      breakdown,
      "Set time",
      `${FormatUtils.formatDuration(analysis.totalSetTime)} (${analysis.setCount} sets)`,
    );
  }

  /**
   * Renders a single breakdown row.
   */
  private renderBreakdownRow(
    container: HTMLElement,
    label: string,
    value: string,
  ): void {
    const row = container.createEl("div", {
      cls: "workout-duration-row",
    });

    row.createEl("span", {
      cls: "workout-duration-label",
      text: label,
    });

    row.createEl("span", {
      cls: "workout-duration-detail",
      text: value,
    });
  }

  /**
   * Renders debug information.
   */
  private renderDebugInfo(
    card: HTMLElement,
    analysis: DurationAnalysisResult,
    setDuration?: number,
  ): void {
    const debugSection = card.createEl("div", {
      cls: "workout-duration-debug",
    });

    debugSection.createEl("div", {
      cls: "workout-duration-debug-title",
      text: "Debug info",
    });

    const debugContent = debugSection.createEl("pre", {
      cls: "workout-duration-debug-content",
    });

    debugContent.textContent = JSON.stringify(
      {
        workoutPath: analysis.workoutPath,
        restPeriodCount: analysis.restPeriodCount,
        setCount: analysis.setCount,
        setDuration: setDuration || DEFAULT_SET_DURATION,
      },
      null,
      2,
    );
  }
}
