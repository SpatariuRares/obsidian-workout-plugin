import { setsBlock } from "@app/features/sets/setsBlock";
import { generateCodeBlockId } from "@app/utils/IdUtils";

export function generateSetsBlock(
  exercise: string,
  opts: { workout?: string; sets?: number; targetReps?: number; targetWeight?: number } = {},
): string {
  return setsBlock.serialize({ id: generateCodeBlockId(), exercise, ...opts });
}
