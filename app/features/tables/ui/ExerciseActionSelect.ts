import {
  BlockMenu,
  type BlockMenuAction,
} from "@app/features/common/ui/BlockMenu";
import { t } from "@app/i18n";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { openExercisePage } from "@app/features/modals/exercise/openExercisePage";
import { ICONS } from "@app/constants/ui.constants";

/**
 * The ⋮ menu of a block about one exercise (`workout-log`, `workout-sets`):
 * "Go to exercise" (its page, or creating one) and the block's edit action,
 * which CodeBlockProcessorService builds for every block.
 */
export interface ExerciseActionSelectProps {
  /** Empty: a block that names no exercise yet, so only its edit action */
  exerciseName: string;
  plugin: WorkoutPluginContext;
  /** The block's edit action; without it the menu only goes to the exercise */
  edit?: BlockMenuAction;
  /** The block's other actions, after its edit action (e.g. its rest timer's) */
  more?: BlockMenuAction[];
}

export class ExerciseActionSelect {
  static render(
    container: HTMLElement,
    { exerciseName, plugin, edit, more = [] }: ExerciseActionSelectProps,
    signal?: AbortSignal,
  ): HTMLElement {
    const actions: BlockMenuAction[] = [];
    if (exerciseName) {
      actions.push({
        label: t("table.gotoExercise"),
        icon: ICONS.ACTIONS.GOTO,
        run: () => openExercisePage(plugin, exerciseName),
      });
    }
    if (edit) actions.push(edit);
    actions.push(...more);
    return BlockMenu.render(container, actions, signal);
  }
}
