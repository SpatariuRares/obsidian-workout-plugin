import { MarkdownView } from "obsidian";
import { Button, BUTTONVARIANT, Text } from "@app/components/atoms";
import { Feedback } from "@app/components/atoms/Feedback";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { ExerciseActionSelect } from "@app/features/tables/ui/ExerciseActionSelect";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { t } from "@app/i18n";

type CreateLogPlugin = ConstructorParameters<
  typeof CreateLogModal
>[1];
type ExerciseActionPlugin = Parameters<
  typeof ExerciseActionSelect.render
>[1]["plugin"];

/**
 * Log-related callouts and buttons used across chart/table/dashboard views.
 */
export class LogCallouts {
  private static asCreateLogPlugin(
    plugin: WorkoutPluginContext,
  ): CreateLogPlugin {
    return plugin as unknown as CreateLogPlugin;
  }

  private static asExerciseActionPlugin(
    plugin: WorkoutPluginContext,
  ): ExerciseActionPlugin {
    return plugin as unknown as ExerciseActionPlugin;
  }

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
      this.asCreateLogPlugin(plugin),
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
      icon: t("icons.actions.add"),
      className: "add-log-button",
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: t("logs.createFirstLogButtonAria", {
        exerciseName: exerciseName ?? "exercise",
      }),
    });

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
        this.asCreateLogPlugin(plugin),
        exerciseName,
        link,
        undefined,
        !link,
      ).open();
    });

    if (exerciseName) {
      ExerciseActionSelect.render(buttonDiv, {
        exerciseName,
        app: plugin.app,
        plugin: this.asExerciseActionPlugin(plugin),
        params: {
          exercise: exerciseName,
          id: codeBlockId,
        } as EmbeddedTableParams,
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
  ): void {
    if (!currentPageLink) {
      return;
    }

    const button = Button.create(container, {
      text: t("logs.addLogButtonText", {
        exerciseName: exerciseName ?? "Workout",
      }),
      icon: t("icons.actions.add"),
      variant: BUTTONVARIANT.PRIMARY,
      ariaLabel: t("logs.addLogButtonAria", {
        exerciseName: exerciseName ?? "Workout",
      }),
    });

    Button.onClick(
      button,
      () => {
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
          this.asCreateLogPlugin(plugin),
          exerciseName,
          currentPageLink,
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
    plugin: WorkoutPluginContext,
  ): void {
    const buttonContainer = Button.createContainer(container);
    buttonContainer.addClass("create-log-button-container");

    const button = Button.create(buttonContainer, {
      text: t("logs.createLogButtonText", {
        exerciseName: exerciseName,
      }),
      icon: t("icons.actions.add"),
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
      icon: t("icons.status.info"),
      className: "workout-log-no-match",
    });
  }
}
