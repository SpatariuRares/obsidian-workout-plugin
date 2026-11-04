import { TargetHeader } from "@app/features/tables/ui/TargetHeader";
import { AchievementBadge } from "@app/features/tables/ui/AchievementBadge";
import { CodeBlockEditorService } from "@app/services/editor/CodeBlockEditorService";
import type { CodeBlockSchema } from "@app/services/codeblocks/CodeBlockSchema";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

/** The block parameters the targets read (see PLAN_FIELDS) */
export interface TargetParams {
  id?: string;
  exercise?: string;
  targetWeight?: number;
  targetReps?: number;
}

export interface TargetSectionProps<P extends TargetParams> {
  plugin: WorkoutPluginContext;
  params: P;
  /** The block's schema, to write a raised target weight into it */
  schema: CodeBlockSchema<P>;
  /** The note the block is written in */
  sourcePath: string;
  /** The sets the progress is measured on */
  sets: WorkoutLogData[];
  /** The block now has this target weight: redraw with it */
  onTargetUpdated: (params: P) => Promise<void> | void;
}

/**
 * A block's progressive overload: the target with its progress bar and, once
 * the target is reached, the badge that offers the next weight and writes it
 * into the block. `workout-log` and `workout-sets` show the same section.
 */
export function renderTargetSection<P extends TargetParams>(
  container: HTMLElement,
  props: TargetSectionProps<P>,
  signal?: AbortSignal,
): void {
  const { plugin, params, schema, sourcePath, sets, onTargetUpdated } = props;
  const weightUnit = plugin.settings.weightUnit;

  TargetHeader.render(container, {
    targetWeight: params.targetWeight,
    targetReps: params.targetReps,
    filteredData: sets,
    weightUnit,
  });

  const { targetWeight, targetReps, exercise } = params;
  if (targetWeight === undefined || targetReps === undefined || !exercise) {
    return;
  }

  AchievementBadge.render(
    container,
    {
      app: plugin.app,
      exercise,
      targetWeight,
      targetReps,
      filteredData: sets,
      weightIncrement: plugin.settings.weightIncrement,
      isDismissedForWeight:
        plugin.settings.achievedTargets[exercise] === targetWeight,
      weightUnit,
    },
    {
      onDismiss: async () => {
        plugin.settings.achievedTargets[exercise] = targetWeight;
        await plugin.saveSettings();
      },
      onUpdateTarget: async (newWeight: number) => {
        const success = await CodeBlockEditorService.patchCodeBlock(
          plugin.app,
          schema,
          sourcePath,
          params.id ? { id: params.id } : { exercise },
          { targetWeight: newWeight } as P,
        );
        if (success) await onTargetUpdated({ ...params, targetWeight: newWeight });
      },
    },
    signal,
  );
}
