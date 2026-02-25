/**
 * Renderer for duration estimation cards.
 * Handles all DOM creation and styling for duration displays.
 */
import { DurationAnalysisResult } from "@app/features/duration/types";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";

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
      text: t("icons.duration.timer"),
    });

    header.createEl("span", {
      cls: "workout-duration-title",
      text: t("duration.estimatedDuration"),
    });
  }

  /**
   * Renders an error message.
   */
  private renderError(card: HTMLElement, error?: string): void {
    card.createEl("div", {
      cls: "workout-duration-error",
      text: error || t("duration.unableToAnalyze"),
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
      t("duration.restTime"),
      FormatUtils.formatDuration(analysis.totalRestTime),
    );

    // Set time row
    this.renderBreakdownRow(
      breakdown,
      t("duration.setTime"),
      `${FormatUtils.formatDuration(analysis.totalSetTime)} (${analysis.setCount} sets)`,
    );

    // Historical duration row (if available)
    if (analysis.historicalDuration) {
      const dateLabel = analysis.lastSessionDate
        ? ` (${analysis.lastSessionDate})`
        : "";
      this.renderBreakdownRow(
        breakdown,
        t("duration.lastSession"),
        FormatUtils.formatDuration(analysis.historicalDuration) + dateLabel,
      );
    }
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
}
