import { App } from "obsidian";
import { CONSTANTS } from "@app/constants";
import { Button } from "@app/components/atoms";
import { t } from "@app/i18n";

/**
 * GoToExerciseButton - UI component for exercise file navigation
 *
 * Renders a button that navigates to the exercise file in the vault.
 * Pure UI component with navigation logic encapsulated.
 */
export interface GoToExerciseButtonProps {
  exerciseName: string;
  app: App;
}

export class GoToExerciseButton {
  /**
   * Renders a "Goto exercise" button
   * @param container - Parent element
   * @param props - Button properties
   * @param signal - Optional AbortSignal for cleanup
   * @returns The created button element
   */
  static render(
    container: HTMLElement,
    props: GoToExerciseButtonProps,
    signal?: AbortSignal,
  ): HTMLButtonElement {
    const { exerciseName, app } = props;

    const gotoBtn = Button.create(container, {
      icon: t("icons.tables.goto"),
      text: t("table.gotoExercise"),
      variant: "secondary",
      ariaLabel: t("table.gotoExercise"),
    });

    Button.onClick(
      gotoBtn,
      () => {
        this.navigateToExercise(app, exerciseName);
      },
      signal,
    );

    return gotoBtn;
  }

  /**
   * Navigates to the exercise file in the vault
   * @param app - Obsidian App instance
   * @param exerciseName - Name of the exercise to navigate to
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
