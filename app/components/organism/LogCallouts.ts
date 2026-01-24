import { CONSTANTS } from "@app/constants/Constants";
import { MarkdownView } from "obsidian";
import { Button, Text } from "@app/components/atoms";
import { EmptyState } from "@app/components/molecules";
import type WorkoutChartsPlugin from "main";
import { CreateLogModal } from "@app/features/modals/CreateLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * Log-related callouts and buttons used across chart/table/dashboard views.
 * These organisms live in the logs feature because they trigger log creation flows.
 */
export class LogCallouts {
  static renderCsvNoDataMessage(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string
  ): void {
    const noDataDiv = container.createEl("div", {
      cls: "workout-log-no-data",
    });

    noDataDiv.createEl("p");
    Text.create(noDataDiv, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.NO_DATA_TITLE(exerciseName),
      className: "workout-log-no-data-title",
      tag: "strong",
    });
    noDataDiv.createEl("p");

    const buttonDiv = noDataDiv.createEl("div", {
      cls: "workout-charts-button-container",
    });

    const createButton = Button.create(buttonDiv, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_FIRST_LOG_BUTTON_TEXT(exerciseName),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "add-log-button",
      ariaLabel: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_FIRST_LOG_BUTTON_ARIA(exerciseName),
    });

    Button.onClick(createButton, () => {
      const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";

      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        () => {
          plugin.triggerWorkoutLogRefresh();
        }
      ).open();
    });
  }

  static renderAddLogButton(
    container: HTMLElement,
    exerciseName: string,
    currentPageLink: string,
    plugin: WorkoutChartsPlugin,
    onLogCreated?: () => void
  ): void {
    if (!currentPageLink) {
      return;
    }

    const buttonContainer = container.createEl("div", {
      cls: "add-log-button-container",
    });

    const button = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.ADD_LOG_BUTTON_TEXT(exerciseName),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "add-log-button",
      ariaLabel: CONSTANTS.WORKOUT.LABELS.LOGS.ADD_LOG_BUTTON_ARIA(exerciseName),
    });

    Button.onClick(button, () => {
      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        onLogCreated
      ).open();
    });
  }

  static renderCreateLogButtonForExercise(
    container: HTMLElement,
    exerciseName: string,
    plugin: WorkoutChartsPlugin
  ): void {
    const buttonContainer = container.createEl("div", {
      cls: "create-log-button-container",
    });

    const button = Button.create(buttonContainer, {
      text: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_LOG_BUTTON_TEXT(exerciseName),
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "create-log-button",
      ariaLabel: CONSTANTS.WORKOUT.LABELS.LOGS.CREATE_LOG_BUTTON_ARIA(exerciseName),
    });

    Button.onClick(button, () => {
      const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";

      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        currentPageLink,
        () => {
          plugin.triggerWorkoutLogRefresh();
        }
      ).open();
    });
  }

  static renderNoMatchMessage(container: HTMLElement): void {
    EmptyState.create(container, {
      icon: CONSTANTS.WORKOUT.ICONS.STATUS.INFO,
      message: CONSTANTS.WORKOUT.LABELS.LOGS.NO_MATCH_MESSAGE,
      className: "workout-log-no-match",
    });
  }

  static renderRepeatLastButton(
    container: HTMLElement,
    latestEntry: WorkoutLogData,
    plugin: WorkoutChartsPlugin,
    onLogCreated?: () => void
  ): void {
    const button = Button.create(container, {
      text: CONSTANTS.WORKOUT.MODAL.BUTTONS.REPEAT_LAST,
      icon: CONSTANTS.WORKOUT.ICONS.ACTIONS.ADD,
      className: "workout-repeat-last-button",
      ariaLabel: "Repeat last workout entry",
    });

    Button.onClick(button, () => {
      const activeView = plugin.app.workspace.getActiveViewOfType(MarkdownView);
      const currentPageLink = activeView?.file
        ? `[[${activeView.file.basename}]]`
        : "";

      new CreateLogModal(
        plugin.app,
        plugin,
        latestEntry.exercise,
        currentPageLink,
        onLogCreated,
        {
          exercise: latestEntry.exercise,
          weight: latestEntry.weight,
          reps: latestEntry.reps,
          workout: latestEntry.workout || "",
          notes: latestEntry.notes || "",
        }
      ).open();
    });
  }
}
