import { App, Notice } from "obsidian";
import { Button, BUTTONVARIANT, Icon, Text } from "@app/components/atoms";
import { ICONS } from "@app/constants/ui.constants";
import { TargetCalculator } from "@app/features/tables/business/TargetCalculator";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";
import { ErrorUtils } from "@app/utils/ErrorUtils";
import { ConfirmModal } from "@app/features/modals/common/ConfirmModal";

/**
 * AchievementBadge - UI component for displaying achievement celebrations
 *
 * A row inset into the block's card once the target is reached: the news
 * in success text, the next weight with the button that writes it into the
 * block, and a dismiss (×) at the right end.
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

    const message = badgeDiv.createDiv({ cls: "workout-achievement-message" });
    Icon.create(message, {
      name: ICONS.STATUS.SUCCESS,
      className: "workout-achievement-icon",
    });
    Text.createSpan(
      message,
      t("modal.notices.targetAchieved"),
      "workout-achievement-text",
    );

    // Render weight suggestion
    const suggestedWeight = targetWeight + weightIncrement;
    const { updateButton } = this.renderWeightSuggestion(
      app,
      message,
      suggestedWeight,
      weightUnit,
      callbacks.onUpdateTarget,
      signal,
    );

    // Add dismiss button
    const dismissButton = Button.create(badgeDiv, {
      icon: ICONS.ACTIONS.REMOVE,
      className: "workout-achievement-dismiss",
      variant: BUTTONVARIANT.SECONDARY,
      ariaLabel: t("modal.notices.dismissAchievement"),
    });

    Button.onClick(
      dismissButton,
      () => {
        // Keep the badge if the dismissal was not saved
        callbacks.onDismiss().then(
          () => badgeDiv.remove(),
          (error: unknown) => {
            new Notice(
              t("modal.notices.genericError", {
                error: ErrorUtils.getErrorMessage(error),
              }),
            );
          },
        );
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
    message: HTMLElement,
    suggestedWeight: number,
    weightUnit: string,
    onUpdateTarget: (newWeight: number) => Promise<void>,
    signal?: AbortSignal,
  ): { suggestionDiv: HTMLElement; updateButton: HTMLButtonElement } {
    const suggestionDiv = message.createDiv({
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
      className: "workout-update-target-button",
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
