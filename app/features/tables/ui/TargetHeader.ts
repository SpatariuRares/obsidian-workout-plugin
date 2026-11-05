import { Icon, ProgressMeter } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { t } from "@app/i18n";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * TargetHeader - UI component for displaying target weight/reps with progress
 *
 * The goal of the block as its own panel, inset into the card: the target in
 * big figures and, when both weight and reps are set, the best reps at that
 * weight with a progress meter (done once reached). The achievement row,
 * when there is one, goes inside the same panel (TargetSection).
 */
export interface TargetHeaderProps {
  targetWeight?: number;
  targetReps?: number;
  filteredData: WorkoutLogData[];
  weightUnit: string;
}

export class TargetHeader {
  /**
   * Renders the target panel with optional progress meter
   * @param container - Parent element
   * @param props - Header properties
   * @returns The created panel, or null if no targets set
   */
  static render(
    container: HTMLElement,
    props: TargetHeaderProps,
  ): HTMLElement | null {
    const { targetWeight, targetReps, filteredData, weightUnit } =
      props;

    // Only render if at least one target is set
    if (targetWeight === undefined && targetReps === undefined) {
      return null;
    }

    const targetDiv = container.createDiv({
      cls: "workout-target-header",
    });
    const top = targetDiv.createDiv({ cls: "workout-target-row" });
    Icon.create(top, {
      name: ICONS.TABLE.TARGET,
      className: "workout-target-icon",
    });
    top.createSpan({
      cls: "workout-target-label",
      text: t("table.labels.target"),
    });

    // Build the target text
    const parts: string[] = [];
    if (targetWeight !== undefined) {
      parts.push(`${targetWeight}${weightUnit}`);
    }
    if (targetReps !== undefined) {
      const separator =
        targetWeight !== undefined ? t("table.target.separator") : "";
      parts.push(
        `${separator}${targetReps} ${t("table.target.repsSuffix")}`,
      );
    }
    targetDiv.createDiv({
      cls: "workout-target-text",
      text: parts.join(""),
    });

    // Progress only when both targets are set
    if (targetWeight !== undefined && targetReps !== undefined) {
      this.renderProgress(
        targetDiv,
        top,
        targetWeight,
        targetReps,
        filteredData,
        weightUnit,
      );
    }

    return targetDiv;
  }

  /**
   * The best reps at the target weight, in words and as a meter
   */
  private static renderProgress(
    targetDiv: HTMLElement,
    top: HTMLElement,
    targetWeight: number,
    targetReps: number,
    filteredData: WorkoutLogData[],
    weightUnit: string,
  ): void {
    const bestReps = TargetCalculator.calculateBestRepsAtWeight(
      targetWeight,
      filteredData,
    );
    const counts = {
      best: String(bestReps),
      target: String(targetReps),
    };

    top.createSpan({
      cls: "workout-target-progress",
      text:
        bestReps === 0
          ? t("table.target.noSetsYet", {
              weight: `${targetWeight}${weightUnit}`,
            })
          : t("table.target.progress", counts),
    });
    const meter = ProgressMeter.create(targetDiv, {
      value: bestReps,
      max: targetReps,
      label: t("table.target.progressTooltip", counts),
    });
    if (meter.classList.contains("is-done")) targetDiv.addClass("is-done");
  }
}
