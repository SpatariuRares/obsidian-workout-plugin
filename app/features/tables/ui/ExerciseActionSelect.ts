import { App } from "obsidian";

import { IconDropdown } from "@app/components/molecules/IconDropdown";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";
import { EditTableModal } from "@app/features/tables/modals/EditTableModal";
import { EmbeddedTableParams } from "@app/features/tables/types";

/**
 * ExerciseActionSelect - Icon button dropdown for exercise-level actions
 *
 * Offers "Goto exercise" and (when an ID is set) "Edit table" actions
 * via a custom dropdown panel triggered by an icon-only button.
 */
export interface ExerciseActionSelectProps {
  exerciseName: string;
  app: App;
  plugin: WorkoutChartsPlugin;
  params: EmbeddedTableParams;
}

export class ExerciseActionSelect {
  /**
   * Renders an icon button with a dropdown action panel.
   * @param container - Parent element
   * @param props - Select properties
   * @param signal - Optional AbortSignal for cleanup
   * @returns The created wrapper element
   */
  static render(
    container: HTMLElement,
    props: ExerciseActionSelectProps,
    signal?: AbortSignal,
  ): HTMLElement {
    const { exerciseName, app, plugin, params } = props;

    const options = [
      {
        icon: t("icons.tables.goto"),
        label: t("table.gotoExercise"),
        value: "goto",
      },
    ];

    // Only show edit option when the code block has an ID
    if (params.id) {
      options.push({
        icon: t("icons.tables.edit"),
        label: t("table.editTable"),
        value: "edit",
      });
    }

    const { wrapper } = IconDropdown.create(container, {
      icon: t("icons.timer.menu"),
      ariaLabel: t("table.actions"),
      options,
    });

    IconDropdown.onChange(
      wrapper,
      (value) => {
        if (value === "goto") {
          this.navigateToExercise(app, exerciseName);
        } else if (value === "edit") {
          const modal = new EditTableModal(app, plugin, params);
          modal.open();
        }
      },
      signal,
    );

    return wrapper;
  }

  /**
   * Navigates to the exercise file in the vault
   */
  private static navigateToExercise(
    app: App,
    exerciseName: string,
  ): void {
    const searchName = exerciseName
      .toLowerCase()
      .replace(/\.md$/i, "");

    const exerciseFile = app.vault.getFiles().find((file) => {
      return file.basename.toLowerCase() === searchName;
    });

    if (exerciseFile) {
      void app.workspace.getLeaf(false).openFile(exerciseFile);
    }
  }
}
