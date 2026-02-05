export class MuscleTagFilterLogic {
  static filterTags(
    allTags: Map<string, string>,
    searchValue: string,
  ): Map<string, string> {
    if (!searchValue) {
      return allTags;
    }

    const filteredTags = new Map<string, string>();
    for (const [tag, muscleGroup] of allTags) {
      if (
        tag.toLowerCase().includes(searchValue) ||
        muscleGroup.toLowerCase().includes(searchValue)
      ) {
        filteredTags.set(tag, muscleGroup);
      }
    }

    return filteredTags;
  }
}
