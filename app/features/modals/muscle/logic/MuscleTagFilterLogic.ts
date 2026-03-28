import { StringUtils } from "@app/utils/StringUtils";

/**
 * Filters muscle tags based on search value.
 * Searches in both tag names and muscle groups.
 */
export function filterMuscleTags(
  allTags: Map<string, string>,
  searchValue: string,
): Map<string, string> {
  if (!searchValue) {
    return allTags;
  }

  const normalizedSearch = StringUtils.normalize(searchValue);
  const filteredTags = new Map<string, string>();
  for (const [tag, muscleGroup] of allTags) {
    if (
      StringUtils.normalize(tag).includes(normalizedSearch) ||
      StringUtils.normalize(muscleGroup).includes(normalizedSearch)
    ) {
      filteredTags.set(tag, muscleGroup);
    }
  }

  return filteredTags;
}
