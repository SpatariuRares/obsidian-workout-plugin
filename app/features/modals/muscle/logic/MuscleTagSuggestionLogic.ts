import { StringUtils } from "@app/utils/StringUtils";
import type {
  MuscleTagSimilarityMatch,
  MuscleTagSuggestionItem,
} from "@app/features/modals/muscle/types";

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
    const similarTags = this.findSimilarTagsWithDistance(needle, existingTags);

    return similarTags
      .filter((item) => item.tag.toLowerCase() !== needle)
      .map((item) => ({
        ...item,
        muscleGroup: allTags.get(item.tag) || "",
        isVeryClose: item.distance <= FUZZY_WARNING_DISTANCE,
      }));
  }

  private static findSimilarTagsWithDistance(
    needle: string,
    haystack: string[],
  ): MuscleTagSimilarityMatch[] {
    const matches: MuscleTagSimilarityMatch[] = [];

    for (const tag of haystack) {
      const distance = StringUtils.levenshteinDistance(needle, tag);
      if (distance <= FUZZY_MAX_DISTANCE && distance > 0) {
        matches.push({ tag, distance });
      }
    }

    matches.sort((a, b) => {
      if (a.distance !== b.distance) {
        return a.distance - b.distance;
      }
      return a.tag.localeCompare(b.tag);
    });

    return matches;
  }
}
