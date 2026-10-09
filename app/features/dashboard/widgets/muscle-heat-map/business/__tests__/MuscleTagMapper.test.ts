import { MuscleTagMapper } from "@app/features/dashboard/widgets/muscle-heat-map/business/MuscleTagMapper";
import type { MuscleTagService } from "@app/services/exercise/MuscleTagService";

jest.mock("@app/utils/exercise/ExercisePathResolver", () => ({
  ExercisePathResolver: { findExerciseFile: () => ({ path: "x.md" }) },
}));
jest.mock("@app/utils/frontmatter/FrontmatterParser", () => ({
  FrontmatterParser: { parseTags: (content: string) => content.split(",") },
}));

const groupsFor = (tags: string, customMap: Map<string, string>) => {
  const mapper = new MuscleTagMapper({
    getTagMap: () => customMap,
  } as unknown as MuscleTagService);
  const plugin = {
    app: { vault: { read: async () => tags } },
    settings: { exerciseFolderPath: "" },
  };
  return mapper.findMuscleGroupsFromTags("Incline Press", plugin as never);
};

describe("MuscleTagMapper.findMuscleGroupsFromTags", () => {
  // A user tag file from before specific muscles existed
  const oldCustomMap = new Map([["petto", "chest"]]);

  it("uses the user's tag map", async () => {
    expect(await groupsFor("petto", oldCustomMap)).toEqual(["chest"]);
  });

  it("recognizes a specific muscle id missing from an older tag file", async () => {
    expect(await groupsFor("upper_chest", oldCustomMap)).toEqual([
      "upper_chest",
    ]);
  });

  it("accepts spaces or dashes instead of underscores", async () => {
    expect(
      (await groupsFor("Side Delts,rear-delts", oldCustomMap)).sort(),
    ).toEqual(["rear_delts", "side_delts"]);
  });
});
