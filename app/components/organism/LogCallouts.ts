import { CONSTANTS } from "@app/constants";
import { MarkdownView } from "obsidian";
import { Button, Text } from "@app/components/atoms";
import { Feedback } from "@app/components/atoms/Feedback";
import type WorkoutChartsPlugin from "main";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { GoToExerciseButton } from "@app/features/tables/ui/GoToExerciseButton";

/**
 * Log-related callouts and buttons used across chart/table/dashboard views.
 * These organisms live in the logs feature because they trigger log creation flows.
 */
export class LogCallouts {
  private static openCreateLogModal(
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    onComplete?: () => void,
  ): void {
    const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const currentPageLink = activeView?.file
      ? `[[${activeView.file.basename}]]`
      : "";

    new CreateLogModal(
      plugin.app,
      plugin,
      exerciseName,
      currentPageLink,
      onComplete || (() => plugin.triggerWorkoutLogRefresh()),
    ).open();
  }

  static renderCsvNoDataMessage(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    onRefresh?: () => void,
    currentPageLink?: string,
  ): void {
    Feedback.renderEmpty(container, "", { className: "workout-log-no-data" });
    const noDataDiv = container.querySelector(
      ".workout-log-no-data",
    ) as HTMLElement;

    Text.create(noDataDiv, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.NO_DATA_TITLE(exerciseName),
      className: "workout-log-no-data-title",
      tag: "strong",
    });

    const buttonDiv = Button.createContainer(noDataDiv);
    buttonDiv.addClass("workout-charts-button-container");

    const createButton = Button.create(buttonDiv, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_FIRST_LOG_BUTTON_TEXT(
        exerciseName,
      ),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "add-log-button",
      variant: "primary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_FIRST_LOG_BUTTON_ARIA(
          exerciseName,
        ),
    });

    Button.onClick(createButton, () => {
      // Determine the link: use passed one, or fallback to active view
      let link = currentPageLink;
      if (!link) {
        const activeView =
          plugin.app.workspace.getActiveViewOfType(MarkdownView);
        link = activeView?.file ? `[[${activeView.file.basename}]]` : "";
      }

      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        link,
        onRefresh || (() => plugin.triggerWorkoutLogRefresh()),
        undefined,
      ).open();
    });

    GoToExerciseButton.render(buttonDiv, {
      exerciseName: exerciseName || "",
      app: plugin.app,
    }); 
 
  }

  static renderAddLogButton(
    container: HTMLElement,
    exerciseName: string,
    currentPageLink: string,
    plugin: WorkoutChartsPlugin,
    onLogCreated?: () => void,
    signal?: AbortSignal,
    latestEntry?: WorkoutLogData,
  ): void {
    if (!currentPageLink) {
      return;
    }

    const button = Button.create(container, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.ADD_LOG_BUTTON_TEXT(exerciseName),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      variant: "primary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.LOGS.ADD_LOG_BUTTON_ARIA(exerciseName),
    });

    Button.onClick(
      button,
      () => {
        // If there's a latest entry, pre-fill the form with those values
        // Include all fields: reps, weight, protocol, and customFields
        const prefillData = latestEntry
          ? {
            exercise: latestEntry.exercise,
            weight: latestEntry.weight,
            reps: latestEntry.reps,
            workout: latestEntry.workout || "",
            notes: latestEntry.notes || "",
            protocol: latestEntry.protocol,
            customFields: latestEntry.customFields,
          }
          : undefined;

        new CreateLogModal(
          plugin.app,
          plugin,
          exerciseName,
          currentPageLink,
          onLogCreated,
          prefillData,
        ).open();
      },
      signal,
    );
  }

  static renderCreateLogButtonForExercise(
    container: HTMLElement,
    exerciseName: string,
    plugin: WorkoutChartsPlugin,
    onRefresh?: () => void,
  ): void {
    const buttonContainer = Button.createContainer(container);
    buttonContainer.addClass("create-log-button-container");

    const button = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_LOG_BUTTON_TEXT(exerciseName),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "create-log-button",
      variant: "primary",
      ariaLabel:
        CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_LOG_BUTTON_ARIA(exerciseName),
    });

    Button.onClick(button, () => {
      LogCallouts.openCreateLogModal(plugin, exerciseName, onRefresh);
    });
  }

  static renderNoMatchMessage(container: HTMLElement): void {
    Feedback.renderInfo(
      container,
      CONSTANTS.WORKOUT.LABELS.LOGS.NO_MATCH_MESSAGE,
      {
        icon: CONSTANTS.WORKOUT.ICONS.STATUS.INFO,
        className: "workout-log-no-match",
      },
    );
  }
}
