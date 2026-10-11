import { openExercisePage } from "@app/features/modals/exercise/openExercisePage";
import { CreateExercisePageModal } from "@app/features/modals/exercise/CreateExercisePageModal";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";

jest.mock("@app/features/modals/exercise/CreateExercisePageModal", () => ({
  CreateExercisePageModal: jest.fn().mockImplementation(() => ({ open: jest.fn() })),
}));

function plugin(notes: ConstructorParameters<typeof FakeVault>[0]) {
  const vault = new FakeVault(notes);
  const library = new ExerciseLibrary(vault.app as never, {
    exerciseFolderPath: "Exercises",
  });
  const openFile = jest.fn().mockResolvedValue(undefined);
  const app = { workspace: { getLeaf: () => ({ openFile }) } };
  return {
    vault,
    openFile,
    plugin: {
      app,
      getExerciseLibrary: () => library,
      templateGeneratorService: {},
    } as never,
  };
}

describe("openExercisePage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should open the exercise's page, found like a log name", () => {
    const { vault, openFile, plugin: p } = plugin({
      "Exercises/Legs/Bench Press.md": { nome_esercizio: "Panca piana" },
    });

    openExercisePage(p, "panca piana");

    expect(openFile).toHaveBeenCalledWith(vault.file("Exercises/Legs/Bench Press.md"));
    expect(CreateExercisePageModal).not.toHaveBeenCalled();
  });

  it("should not open a note outside the exercise folder", () => {
    const { openFile, plugin: p } = plugin({ "Notes/Squat.md": {} });

    openExercisePage(p, "Squat");

    expect(openFile).not.toHaveBeenCalled();
  });

  it("should offer to create the page, filled in with the name, when there is none", () => {
    const { plugin: p } = plugin({});

    openExercisePage(p, "Squat");

    expect(CreateExercisePageModal).toHaveBeenCalledWith(
      expect.anything(),
      p,
      "Squat",
    );
  });
});
