import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import type { BlockMenuAction } from "@app/features/common/ui/BlockMenu";
import type { CodeBlockMatch } from "@app/services/editor/CodeBlockEditorService";
import type { EmbeddedTimerParams } from "@app/features/timer/types";
import type { EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import { EditRestTimerModal } from "@app/features/tables/modals/EditRestTimerModal";
import { EditTimerModal } from "@app/features/timer/modals/EditTimerModal";
import { ICONS } from "@app/constants";
import { t } from "@app/i18n";

/** How to find the block without an id; a function is read when the menu is used */
type MatchWithoutId = CodeBlockMatch | (() => CodeBlockMatch | undefined) | undefined;

/**
 * The block a rest is written in (sessionPlan's RestBlock): a `workout-sets`
 * block, which takes the timer's options, or a section's `workout-timer`
 */
export type RestBlockRef =
  | { type: "workout-sets"; params: EmbeddedSetsParams; match?: MatchWithoutId }
  | { type: "workout-timer"; params: EmbeddedTimerParams; match?: MatchWithoutId };

/**
 * "Edit rest timer" in a block's ⋮ menu: the timer form on the block the
 * rest is written in
 *
 * @param sourcePath - The note the block is written in
 * @param rest - The timer the sets rest on now (restOf / the session step's rest)
 */
export function restBlockAction(
  plugin: WorkoutPluginContext,
  sourcePath: string,
  block: RestBlockRef,
  rest: EmbeddedTimerParams,
): BlockMenuAction {
  return {
    label: t("sets.editRestTimer"),
    icon: ICONS.TIMER.DURATION,
    run: () => {
      const match = typeof block.match === "function" ? block.match() : block.match;
      const where = { sourcePath, matchWithoutId: match };
      if (block.type === "workout-sets") {
        new EditRestTimerModal(plugin.app, plugin, block.params, rest, where).open();
      } else {
        new EditTimerModal(plugin.app, plugin, block.params, where).open();
      }
    },
  };
}
