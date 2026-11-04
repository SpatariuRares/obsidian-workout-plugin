import { App } from "obsidian";

import {
  BlockMenu,
  type BlockMenuAction,
} from "@app/features/common/ui/BlockMenu";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { EditTableModal } from "@app/features/tables/modals/EditTableModal";
import { EmbeddedTableParams } from "@app/features/tables/types";
import { openExercisePage } from "@app/features/modals/exercise/openExercisePage";
import { ICONS } from "@app/constants/ui.constants";

/**
 * ExerciseActionSelect - Icon button dropdown for exercise-level actions
 *
 * Offers "Go to exercise" (its page, or creating one) and the block's edit
 * action: "Edit table" when a table has an ID and its note is known, or the
 * one the caller gives
 * via a custom dropdown panel triggered by an icon-only button.
 */
export interface ExerciseActionSelectProps {
  exerciseName: string;
  app: App;
  plugin: WorkoutPluginContext;
  /** A `workout-log` block's parameters: its edit action opens EditTableModal */
  params?: EmbeddedTableParams;
  /** The note the block is written in; without it the table can't be edited */
  sourcePath?: string;
  /** Another block's edit action (a `workout-sets` block), in place of the table's */
  edit?: { label: string; open: () => void };
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
    const { exerciseName, app, plugin, params, sourcePath, edit } = props;

    const actions: BlockMenuAction[] = [
      {
        label: t("table.gotoExercise"),
        icon: ICONS.ACTIONS.GOTO,
        run: () => openExercisePage(plugin, exerciseName),
      },
    ];

    if (edit) {
      actions.push({
        label: edit.label,
        icon: ICONS.ACTIONS.EDIT,
        edits: true,
        run: edit.open,
      });
    } else if (params?.id && sourcePath) {
      // Only show the table's edit option when its code block can be found
      actions.push({
        label: t("table.editTable"),
        icon: ICONS.ACTIONS.EDIT,
        edits: true,
        run: () =>
          new EditTableModal(app, plugin, params, {
            sourcePath,
          }).open(),
      });
    }

    return BlockMenu.render(container, actions, signal);
  }
}
