import { CONSTANTS } from "@app/constants";
import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * TargetHeader - UI component for displaying target weight/reps with progress
 *
 * Renders a header showing the target and a progress bar if both
 * targetWeight and targetReps are specified.
 */
export interface TargetHeaderProps {
  targetWeight?: number;
  targetReps?: number;
  filteredData: WorkoutLogData[];
  weightUnit: string;
}

export class TargetHeader {
  /**
   * Renders the target header with optional progress bar
   * @param container - Parent element
   * @param props - Header properties
   * @returns The created header element, or null if no targets set
   */
  static render(
    container: HTMLElement,
    props: TargetHeaderProps,
  ): HTMLElement | null {
    const { targetWeight, targetReps, filteredData, weightUnit } = props;

    // Only render if at least one target is set
    if (targetWeight === undefined && targetReps === undefined) {
      return null;
    }

    const targetDiv = container.createDiv({ cls: "workout-target-header" });

    // Build the target text
    const parts: string[] = [];
    if (targetWeight !== undefined) {
      parts.push(`${targetWeight}${weightUnit}`);
    }
    if (targetReps !== undefined) {
      const separator = targetWeight !== undefined ? " × " : "";
      parts.push(`${separator}${targetReps} reps`);
    }

    const targetText = `${CONSTANTS.WORKOUT.LABELS.TABLE.TARGET_PREFIX} ${parts.join("")}`;
    const targetTextSpan = targetDiv.createSpan({ cls: "workout-target-text" });
    targetTextSpan.textContent = targetText;

    // Render progress bar if both targets are set
    if (targetWeight !== undefined && targetReps !== undefined) {
      this.renderProgressBar(targetDiv, targetWeight, targetReps, filteredData);
    }

    return targetDiv;
  }

  /**
   * Renders a progress bar showing current progress toward target
   */
  private static renderProgressBar(
    container: HTMLElement,
    targetWeight: number,
    targetReps: number,
    filteredData: WorkoutLogData[],
  ): void {
    const bestReps = TargetCalculator.calculateBestRepsAtWeight(
      targetWeight,
      filteredData,
    );

    if (bestReps === 0) {
      // No data at target weight yet
      return;
    }

    const progressPercent = TargetCalculator.calculateProgressPercent(
      bestReps,
      targetReps,
    );
    const progressLevel = TargetCalculator.getProgressLevel(progressPercent);

    // Create progress bar container
    const progressContainer = container.createDiv({
      cls: "workout-progress-container",
    });

    // Create progress bar background
    const progressBar = progressContainer.createDiv({
      cls: "workout-progress-bar",
    });

    // Create progress fill with color coding
    const progressFill = progressBar.createDiv({
      cls: "workout-progress-fill",
    });
    progressFill.style.width = `${progressPercent}%`;

    // Apply color coding based on progress level
    progressFill.addClass(`workout-progress-${progressLevel}`);

    // Add tooltip
    const tooltip = `Best: ${bestReps} reps / Target: ${targetReps} reps`;
    progressBar.setAttribute("title", tooltip);
    progressBar.setAttribute("aria-label", tooltip);
  }
}
