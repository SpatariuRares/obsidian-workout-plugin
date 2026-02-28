import { App } from "obsidian";

import { SelectDropdown } from "@app/components/molecules/SelectDropdown";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";
import { EditTableModal } from "@app/features/tables/modals/EditTableModal";
import { EmbeddedTableParams } from "@app/features/tables/types";

/**
 * ExerciseActionSelect - Dropdown select for exercise-level actions
 *
 * Replaces the GoToExerciseButton with a select that offers
 * "Goto exercise" and "Edit table" actions.
 */
export interface ExerciseActionSelectProps {
  exerciseName: string;
  app: App;
  plugin: WorkoutChartsPlugin;
  params: EmbeddedTableParams;
}

export class ExerciseActionSelect {
  /**
   * Renders an action select dropdown with goto and edit options
   * @param container - Parent element
   * @param props - Select properties
   * @param signal - Optional AbortSignal for cleanup
   * @returns The created select element
   */
  static render(
    container: HTMLElement,
    props: ExerciseActionSelectProps,
    signal?: AbortSignal,
  ): HTMLSelectElement {
    const { exerciseName, app, plugin, params } = props;

    const options = [
      {
        label: `${t("icons.tables.goto")} ${t("table.gotoExercise")}`,
        value: "goto",
      },
    ];

    // Only show edit option when the code block has an ID
    if (params.id) {
      options.push({
        label: `${t("icons.tables.edit")} ${t("table.editTable")}`,
        value: "edit",
      });
    }

    const { select } = SelectDropdown.create(container, {
      placeholder: `${t("icons.tables.edit")} ${t("table.actions")}`,
      ariaLabel: t("table.actions"),
      options,
    });

    SelectDropdown.onChange(
      select,
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

    return select;
  }

  /**
   * Navigates to the exercise file in the vault
   */
  private static navigateToExercise(app: App, exerciseName: string): void {
    const searchName = exerciseName.toLowerCase().replace(/\.md$/i, "");

    const exerciseFile = app.vault.getFiles().find((file) => {
      return file.basename.toLowerCase() === searchName;
    });

    if (exerciseFile) {
      void app.workspace.getLeaf(false).openFile(exerciseFile);
    }
  }
}
