import type { MuscleTagImportMode } from "@app/features/modals/muscle/types";

export interface MuscleTagImportMergeResult {
  finalTags: Map<string, string>;
  importedCount: number;
}

/**
 * Merges imported muscle tags with current tags based on import mode.
 * @param mode - "replace" to replace all tags, "merge" to add only new tags
 * @param currentTags - Existing muscle tags
 * @param pendingImportTags - Tags to import
 * @returns Final tags map and count of imported tags
 */
export function mergeMuscleTagImport(
  mode: MuscleTagImportMode,
  currentTags: Map<string, string>,
  pendingImportTags: Map<string, string>,
): MuscleTagImportMergeResult {
  if (mode === "replace") {
    return {
      finalTags: new Map(pendingImportTags),
      importedCount: pendingImportTags.size,
    };
  }

  const finalTags = new Map(currentTags);
  let importedCount = 0;

  for (const [tag, group] of pendingImportTags) {
    if (!finalTags.has(tag)) {
      finalTags.set(tag, group);
      importedCount++;
    }
  }

  return { finalTags, importedCount };
}
