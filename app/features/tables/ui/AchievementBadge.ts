import { CONSTANTS } from "@app/constants";
import { Button } from "@app/components/atoms";
import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * AchievementBadge - UI component for displaying achievement celebrations
 *
 * Renders a badge when target is achieved, with weight suggestion
 * and dismiss functionality.
 */
export interface AchievementBadgeProps {
  exercise: string;
  targetWeight: number;
  targetReps: number;
  filteredData: WorkoutLogData[];
  weightIncrement: number;
  isDismissedForWeight: boolean;
  weightUnit: string;
}

export interface AchievementBadgeCallbacks {
  onDismiss: () => Promise<void>;
  onUpdateTarget: (newWeight: number) => Promise<void>;
}

export interface AchievementBadgeResult {
  container: HTMLElement;
  dismissButton: HTMLButtonElement;
  updateButton: HTMLButtonElement;
}

export class AchievementBadge {
  /**
   * Renders an achievement badge with weight suggestion
   * @param container - Parent element
   * @param props - Badge properties
   * @param callbacks - Event callbacks
   * @param signal - Optional AbortSignal for cleanup
   * @returns Badge elements or null if not achieved or dismissed
   */
  static render(
    container: HTMLElement,
    props: AchievementBadgeProps,
    callbacks: AchievementBadgeCallbacks,
    signal?: AbortSignal,
  ): AchievementBadgeResult | null {
    const {
      targetWeight,
      targetReps,
      filteredData,
      weightIncrement,
      isDismissedForWeight,
      weightUnit,
    } = props;

    // Check if target is achieved
    const isAchieved = TargetCalculator.checkTargetAchieved(
      targetWeight,
      targetReps,
      filteredData,
    );

    if (!isAchieved || isDismissedForWeight) {
      return null;
    }

    // Create achievement badge
    const badgeDiv = container.createDiv({ cls: "workout-achievement-badge" });

    const badgeText = badgeDiv.createSpan({ cls: "workout-achievement-text" });
    badgeText.textContent = CONSTANTS.WORKOUT.MODAL.NOTICES.TARGET_ACHIEVED;

    // Render weight suggestion
    const suggestedWeight = targetWeight + weightIncrement;
    const { updateButton } = this.renderWeightSuggestion(
      badgeDiv,
      suggestedWeight,
      weightUnit,
      callbacks.onUpdateTarget,
      signal,
    );

    // Add dismiss button
    const dismissButton = Button.create(badgeDiv, {
      text: "×",
      className: "workout-achievement-dismiss",
      variant: "secondary",
      ariaLabel: "Dismiss achievement",
    });

    Button.onClick(
      dismissButton,
      async () => {
        await callbacks.onDismiss();
        badgeDiv.remove();
      },
      signal,
    );

    return {
      container: badgeDiv,
      dismissButton,
      updateButton,
    };
  }

  /**
   * Renders weight suggestion section within the badge
   */
  private static renderWeightSuggestion(
    badgeDiv: HTMLElement,
    suggestedWeight: number,
    weightUnit: string,
    onUpdateTarget: (newWeight: number) => Promise<void>,
    signal?: AbortSignal,
  ): { suggestionDiv: HTMLElement; updateButton: HTMLButtonElement } {
    const suggestionDiv = badgeDiv.createDiv({
      cls: "workout-weight-suggestion",
    });

    const suggestionText = suggestionDiv.createSpan({
      cls: "workout-suggestion-text",
    });
    suggestionText.textContent = `${CONSTANTS.WORKOUT.MODAL.NOTICES.SUGGESTED_NEXT_WEIGHT} ${suggestedWeight}${weightUnit}`;

    const updateButton = Button.create(suggestionDiv, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.UPDATE_TARGET_WEIGHT,
      ariaLabel: CONSTANTS.WORKOUT.MODAL.BUTTONS.UPDATE_TARGET_WEIGHT,
      variant: "primary",
    });

    Button.onClick(
      updateButton,
      async () => {
        const confirmed = confirm(
          `${CONSTANTS.WORKOUT.MODAL.NOTICES.CONFIRM_UPDATE_TARGET} ${suggestedWeight}${weightUnit}?`,
        );

        if (confirmed) {
          await onUpdateTarget(suggestedWeight);
        }
      },
      signal,
    );

    return { suggestionDiv, updateButton };
  }
}
