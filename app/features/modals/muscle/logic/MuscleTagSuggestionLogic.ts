import { StringUtils } from "@app/utils/StringUtils";
import type { MuscleTagSuggestionItem } from "@app/features/modals/muscle/types";

const FUZZY_MAX_DISTANCE = 2;
const FUZZY_WARNING_DISTANCE = 1;

export class MuscleTagSuggestionLogic {
  static getSuggestions(
    needle: string,
    allTags: Map<string, string>,
  ): MuscleTagSuggestionItem[] {
    if (needle.length < 2) {
      return [];
    }

    const existingTags = Array.from(allTags.keys());
    const similarTags = StringUtils.findSimilar(needle, existingTags, {
      max: FUZZY_MAX_DISTANCE,
      min: 1,
    }).map(({ value, distance }) => ({ tag: value, distance }));

    return similarTags
      .filter((item) => item.tag.toLowerCase() !== needle)
      .map((item) => ({
        ...item,
        muscleGroup: allTags.get(item.tag) || "",
        isVeryClose: item.distance <= FUZZY_WARNING_DISTANCE,
      }));
  }
}
