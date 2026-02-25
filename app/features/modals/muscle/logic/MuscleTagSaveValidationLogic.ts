import { t } from "@app/i18n";

export interface MuscleTagSaveValidationResult {
  isValid: boolean;
  notice?: string;
  focusTarget?: "tag" | "group";
}

/**
 * Validates muscle tag data before saving.
 * @param tag - Tag name to validate
 * @param muscleGroup - Muscle group to validate
 * @param isEditing - Whether editing existing tag (allows duplicates)
 * @param allTags - All existing tags for duplicate checking
 * @returns Validation result with error details if invalid
 */
export function validateMuscleTagSave(
  tag: string,
  muscleGroup: string,
  isEditing: boolean,
  allTags: Map<string, string>,
): MuscleTagSaveValidationResult {
  if (!tag) {
    return {
      isValid: false,
      notice: "Please enter a tag name",
      focusTarget: "tag",
    };
  }

  if (!muscleGroup) {
    return {
      isValid: false,
      notice: "Please select a muscle group",
      focusTarget: "group",
    };
  }

  if (!isEditing && allTags.has(tag)) {
    return {
      isValid: false,
      notice: t("modal.notices.muscleTagExists", { tag }),
      focusTarget: "tag",
    };
  }

  return { isValid: true };
}
