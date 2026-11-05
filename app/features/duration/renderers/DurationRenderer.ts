/**
 * Renderer for the `workout-duration` card (DESIGN.md "Duration card"):
 * a BlockCard with the estimate in big figures and its breakdown as a row
 * of StatCards.
 */
import { DurationAnalysisResult } from "@app/features/duration/types";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";
import { BlockCard, StatCard } from "@app/components/molecules";

export class DurationRenderer {
  /**
   * @param container - HTML element to render into
   * @param analysis - Analysis results to display
   * @param workoutName - The analyzed note's name, when it is not the note the block is in
   */
  renderDurationCard(
    container: HTMLElement,
    analysis: DurationAnalysisResult,
    workoutName?: string,
  ): void {
    const { el: card } = BlockCard.create(container, {
      title: t("duration.estimatedDuration"),
      meta: workoutName,
      className: "workout-duration",
    });

    if (!analysis.success) {
      card.createDiv({
        cls: "workout-duration-error",
        text: analysis.error || t("duration.unableToAnalyze"),
      });
      return;
    }

    card.createDiv({
      cls: "workout-duration-total",
      text: FormatUtils.formatDuration(analysis.totalDuration),
    });

    const row = StatCard.row(card);
    StatCard.create(row, {
      label: t("duration.restTime"),
      value: FormatUtils.formatDuration(analysis.totalRestTime),
    });
    StatCard.create(row, {
      label: t("duration.setTime"),
      value: FormatUtils.formatDuration(analysis.totalSetTime),
      detail: t("duration.setCount", { count: analysis.setCount }),
    });
    if (analysis.historicalDuration) {
      StatCard.create(row, {
        label: t("duration.lastSession"),
        value: FormatUtils.formatDuration(analysis.historicalDuration),
        detail: analysis.lastSessionDate,
      });
    }
  }
}
