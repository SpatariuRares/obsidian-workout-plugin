import { MarkdownView } from "obsidian";
import { Button, BUTTONVARIANT, Text } from "@app/components/atoms";
import { Feedback } from "@app/components/atoms/Feedback";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { fromLog } from "@app/features/modals/base/logic/LogEntryDraft";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import { t } from "@app/i18n";
import { openGettingStartedGuide } from "@app/services/examples/GettingStartedGuide";
import { TOUR_TARGETS, markTourTarget } from "@app/features/tour/tourTargets";
import { ICONS } from "@app/constants/ui.constants";

/**
 * Log-related callouts and buttons used across chart/table/dashboard views.
 */
export class LogCallouts {
  private static openCreateLogModal(
    plugin: WorkoutPluginContext,
    exerciseName?: string,
  ): void {
    const activeView =
      plugin.app.workspace.getActiveViewOfType(MarkdownView);
    const currentPageLink = activeView?.file
      ? `[[${activeView.file.basename}]]`
      : "";

    new CreateLogModal(
      plugin.app,
      plugin,
      exerciseName,
      currentPageLink,
      undefined,
      !currentPageLink,
    ).open();
  }

  static renderCsvNoDataMessage(
    container: HTMLElement,
    plugin: WorkoutPluginContext,
    exerciseName?: string,
    currentPageLink?: string,
    codeBlockId?: string,
  ): void {
    Feedback.renderEmpty(container, "", {
      className: "workout-log-no-data",
    });
    const noDataDiv = container.querySelector(
      ".workout-log-no-data",
    ) as HTMLElement;

    Text.create(noDataDiv, {
      text: t("logs.noDataTitle", {
        exerciseName: exerciseName ?? "exercise",
      }),
      className: "workout-log-no-data-title",
      tag: "strong",
    });

    const buttonDiv = Button.createContainer(noDataDiv);
    buttonDiv.addClass("workout-charts-button-container");

    const createButton = Button.create(buttonDiv, {
      text: t("logs.createFirstLogButton", {
        exerciseName: exerciseName ?? "exercise",
      }),
      icon: ICONS.ACTIONS.ADD,
      className: "add-log-button",
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: t("logs.createFirstLogButtonAria", {
        exerciseName: exerciseName ?? "exercise",
      }),
    });
    // On an empty log this is the only way to a first set (tour step 1)
    markTourTarget(createButton, TOUR_TARGETS.tableAddButton);

    Button.onClick(createButton, () => {
      let link = currentPageLink;
      if (!link) {
        const activeView =
          plugin.app.workspace.getActiveViewOfType(MarkdownView);
        link = activeView?.file
          ? `[[${activeView.file.basename}]]`
          : "";
      }

      new CreateLogModal(
        plugin.app,
        plugin,
        exerciseName,
        link,
        undefined,
        !link,
      ).open();
    });

    // Only an empty log reaches this callout, so it is the place to offer the examples
    const exampleLink = noDataDiv.createEl("a", {
      text: t("logs.exploreExampleData"),
      cls: "workout-log-example-link",
      href: "#",
    });
    exampleLink.addEventListener("click", (event) => {
      event.preventDefault();
      void openGettingStartedGuide(plugin);
    });

    if (exerciseName) {
      ExerciseActionSelect.render(buttonDiv, {
        exerciseName,
        app: plugin.app,
        plugin,
        params: {
          exercise: exerciseName,
          id: codeBlockId,
        },
      });
    }
  }

  static renderAddLogButton(
    container: HTMLElement,
    exerciseName: string,
    currentPageLink: string,
    plugin: WorkoutPluginContext,
    signal?: AbortSignal,
    latestEntry?: WorkoutLogData,
    firstLog = false,
  ): void {
    const button = Button.create(container, {
      text: t(firstLog ? "logs.createFirstLogButton" : "logs.addLogButtonText", {
        exerciseName: exerciseName ?? "Workout",
      }),
      icon: ICONS.ACTIONS.ADD,
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: t(
        firstLog ? "logs.createFirstLogButtonAria" : "logs.addLogButtonAria",
        { exerciseName: exerciseName ?? "Workout" },
      ),
    });
    markTourTarget(button, TOUR_TARGETS.tableAddButton);

    Button.onClick(
      button,
      () => {
        const prefillData = latestEntry ? fromLog(latestEntry) : undefined;
        if (prefillData) prefillData.date = undefined;

        new CreateLogModal(
          plugin.app,
          plugin,
          exerciseName,
          currentPageLink,
          prefillData,
          !currentPageLink,
        ).open();
      },
      signal,
    );
  }

  static renderCreateLogButtonForExercise(
    container: HTMLElement,
    exerciseName: string,
    plugin: WorkoutPluginContext,
  ): void {
    const buttonContainer = Button.createContainer(container);
    buttonContainer.addClass("create-log-button-container");

    const button = Button.create(buttonContainer, {
      text: t("logs.createLogButtonText", {
        exerciseName: exerciseName,
      }),
      icon: ICONS.ACTIONS.ADD,
      className: "create-log-button",
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: t("logs.createLogButtonAria", {
        exerciseName: exerciseName,
      }),
    });

    Button.onClick(button, () => {
      LogCallouts.openCreateLogModal(plugin, exerciseName);
    });
  }

  static renderNoMatchMessage(container: HTMLElement): void {
    Feedback.renderInfo(container, t("general.noMatchMessage"), {
      icon: ICONS.STATUS.INFO,
      className: "workout-log-no-match",
    });
  }
}
