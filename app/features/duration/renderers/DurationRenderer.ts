/**
 * Renderer for duration estimation cards.
 * Handles all DOM creation and styling for duration displays.
 */
import { DurationAnalysisResult } from "@app/features/duration/types";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";
import { Icon } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";

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
    const card = container.createDiv({
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
    const header = card.createDiv({
      cls: "workout-duration-header",
    });

    Icon.create(header, {
      name: ICONS.TIMER.DURATION,
      className: "workout-duration-icon",
    });

    header.createSpan({
      cls: "workout-duration-title",
      text: t("duration.estimatedDuration"),
    });
  }

  /**
   * Renders an error message.
   */
  private renderError(card: HTMLElement, error?: string): void {
    card.createDiv({
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
    const mainDisplay = card.createDiv({
      cls: "workout-duration-main",
    });

    mainDisplay.createSpan({
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
    const breakdown = card.createDiv({
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
        FormatUtils.formatDuration(analysis.historicalDuration) +
          dateLabel,
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
    const row = container.createDiv({
      cls: "workout-duration-row",
    });

    row.createSpan({
      cls: "workout-duration-label",
      text: label,
    });

    row.createSpan({
      cls: "workout-duration-detail",
      text: value,
    });
  }
}
