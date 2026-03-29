import { App } from "obsidian";
import { Button, Text } from "@app/components/atoms";
import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";
import { BUTTONVARIANT } from "@app/components/atoms/Button";

/**
 * AchievementBadge - UI component for displaying achievement celebrations
 *
 * Renders a badge when target is achieved, with weight suggestion
 * and dismiss functionality.
 */
export interface AchievementBadgeProps {
  app: App;
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
      app,
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
    const badgeDiv = container.createDiv({
      cls: "workout-achievement-badge",
    });

    Text.createSpan(
      badgeDiv,
      t("modal.notices.targetAchieved"),
      "workout-achievement-text",
    );

    // Render weight suggestion
    const suggestedWeight = targetWeight + weightIncrement;
    const { updateButton } = this.renderWeightSuggestion(
      app,
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
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("modal.notices.dismissAchievement"),
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
    app: App,
    badgeDiv: HTMLElement,
    suggestedWeight: number,
    weightUnit: string,
    onUpdateTarget: (newWeight: number) => Promise<void>,
    signal?: AbortSignal,
  ): { suggestionDiv: HTMLElement; updateButton: HTMLButtonElement } {
    const suggestionDiv = badgeDiv.createDiv({
      cls: "workout-weight-suggestion",
    });

    Text.createSpan(
      suggestionDiv,
      t("modal.notices.suggestedNextWeight", {
        suggestedWeight,
        weightUnit,
      }),
      "workout-suggestion-text",
    );

    const updateButton = Button.create(suggestionDiv, {
      text: t("modal.buttons.updateTargetWeight"),
      ariaLabel: t("modal.buttons.updateTargetWeight"),
      variant: BUTTONVARIANT.PRIMARY,
    });

    Button.onClick(
      updateButton,
      () => {
        new ConfirmModal(
          app,
          t("modal.notices.confirmUpdateTarget", {
            targetWeight: suggestedWeight,
            weightUnit: weightUnit,
          }),
          async () => {
            await onUpdateTarget(suggestedWeight);
          },
        ).open();
      },
      signal,
    );

    return { suggestionDiv, updateButton };
  }
}
