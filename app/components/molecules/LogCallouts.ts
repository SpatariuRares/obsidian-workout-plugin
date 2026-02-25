import { MarkdownView } from "obsidian";
import { Button, Text } from "@app/components/atoms";
import { Feedback } from "@app/components/atoms/Feedback";
import type WorkoutChartsPlugin from "main";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { WorkoutDataChangedEvent } from "@app/types/WorkoutEvents";
import { GoToExerciseButton } from "@app/features/tables/ui/GoToExerciseButton";
import { t } from "@app/i18n";

/**
 * Log-related callouts and buttons used across chart/table/dashboard views.
 * These organisms live in the logs feature because they trigger log creation flows.
 */
export class LogCallouts {
  private static openCreateLogModal(
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    onComplete?: (context?: WorkoutDataChangedEvent) => void,
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
      onComplete || ((ctx) => plugin.triggerWorkoutLogRefresh(ctx)),
      undefined,
      !currentPageLink,
    ).open();
  }

  static renderCsvNoDataMessage(
    container: HTMLElement,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    onRefresh?: (context?: WorkoutDataChangedEvent) => void,
    currentPageLink?: string,
  ): void {
    Feedback.renderEmpty(container, "", { className: "workout-log-no-data" });
    const noDataDiv = container.querySelector(
      ".workout-log-no-data",
    ) as HTMLElement;

    Text.create(noDataDiv, {
      text: t("logs.noDataTitle", { exerciseName: exerciseName ?? "exercise" }),
      className: "workout-log-no-data-title",
      tag: "strong",
    });

    const buttonDiv = Button.createContainer(noDataDiv);
    buttonDiv.addClass("workout-charts-button-container");

    const createButton = Button.create(buttonDiv, {
      text: t("logs.createFirstLogButton", {
        exerciseName: exerciseName ?? "exercise",
      }),
      icon: t("icons.actions.add"),
      className: "add-log-button",
      variant: "primary",
      ariaLabel: t("logs.createFirstLogButtonAria", {
        exerciseName: exerciseName ?? "exercise",
      }),
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
        onRefresh || ((ctx) => plugin.triggerWorkoutLogRefresh(ctx)),
        undefined,
        !link,
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
    onLogCreated?: (context?: WorkoutDataChangedEvent) => void,
    signal?: AbortSignal,
    latestEntry?: WorkoutLogData,
  ): void {
    if (!currentPageLink) {
      return;
    }

    const button = Button.create(container, {
      text: t("logs.addLogButtonText", {
        exerciseName: exerciseName ?? "Workout",
      }),
      icon: t("icons.actions.add"),
      variant: "primary",
      ariaLabel: t("logs.addLogButtonAria", {
        exerciseName: exerciseName ?? "Workout",
      }),
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
          false,
        ).open();
      },
      signal,
    );
  }

  static renderCreateLogButtonForExercise(
    container: HTMLElement,
    exerciseName: string,
    plugin: WorkoutChartsPlugin,
    onRefresh?: (context?: WorkoutDataChangedEvent) => void,
  ): void {
    const buttonContainer = Button.createContainer(container);
    buttonContainer.addClass("create-log-button-container");

    const button = Button.create(buttonContainer, {
      text: t("logs.createLogButtonText", {
        exerciseName: exerciseName,
      }),
      icon: t("icons.actions.add"),
      className: "create-log-button",
      variant: "primary",
      ariaLabel: t("logs.createLogButtonAria", {
        exerciseName: exerciseName,
      }),
    });

    Button.onClick(button, () => {
      LogCallouts.openCreateLogModal(plugin, exerciseName, onRefresh);
    });
  }

  static renderNoMatchMessage(container: HTMLElement): void {
    Feedback.renderInfo(container, t("general.noMatchMessage"), {
      icon: t("icons.status.info"),
      className: "workout-log-no-match",
    });
  }
}
