import { CONSTANTS } from "@app/constants";

export interface MuscleTagSaveValidationResult {
  isValid: boolean;
  notice?: string;
  focusTarget?: "tag" | "group";
}

export class MuscleTagSaveValidationLogic {
  static validate(
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
        notice: CONSTANTS.WORKOUT.MODAL.NOTICES.MUSCLE_TAG_EXISTS(tag),
        focusTarget: "tag",
      };
    }

    return { isValid: true };
  }
}
