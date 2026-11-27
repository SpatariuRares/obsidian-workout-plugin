/** @jest-environment jsdom */

import { exerciseTitleLink } from "@app/features/common/ui/exerciseTitleLink";
import { openExercisePage } from "@app/features/modals/exercise/openExercisePage";
import { ExerciseLibrary } from "@app/services/exercise/ExerciseLibrary";
import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

jest.mock("@app/features/modals/exercise/openExercisePage", () => ({
  openExercisePage: jest.fn(),
}));

function makePlugin(notes: ConstructorParameters<typeof FakeVault>[0] = {}) {
  const vault = new FakeVault(notes);
  const library = new ExerciseLibrary(vault.app as never, {
    exerciseFolderPath: "Exercises",
  });
  library.watch(() => {});
  const trigger = jest.fn();
  const plugin = {
    app: {
      vault: vault.app.vault,
      metadataCache: vault.app.metadataCache,
      workspace: { trigger },
    },
    getExerciseLibrary: () => library,
  } as unknown as WorkoutPluginContext;
  return { vault, library, trigger, plugin };
}

describe("exerciseTitleLink", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns undefined when exerciseName is missing or blank", () => {
    const { plugin } = makePlugin();

    expect(exerciseTitleLink({ plugin })).toBeUndefined();
    expect(exerciseTitleLink({ plugin, exerciseName: "" })).toBeUndefined();
    expect(exerciseTitleLink({ plugin, exerciseName: "   " })).toBeUndefined();
  });

  it("resolves a page matched by filename, exercise_name, or nome_esercizio", () => {
    const { plugin } = makePlugin({
      "Exercises/Squat.md": {},
      "Exercises/Legs/Bench Press.md": { nome_esercizio: "Panca piana" },
      "Exercises/Back/Pullup.md": { exercise_name: "Pull Up" },
    });

    expect(exerciseTitleLink({ plugin, exerciseName: "Squat" })).toMatchObject({
      href: "Exercises/Squat.md",
      unresolved: false,
    });
    expect(exerciseTitleLink({ plugin, exerciseName: "panca piana" })).toMatchObject({
      href: "Exercises/Legs/Bench Press.md",
      unresolved: false,
    });
    expect(exerciseTitleLink({ plugin, exerciseName: "pull up" })).toMatchObject({
      href: "Exercises/Back/Pullup.md",
      unresolved: false,
    });
  });

  it("marks missing exercise pages as unresolved with trimmed exercise name as href", () => {
    const { plugin } = makePlugin({});

    expect(exerciseTitleLink({ plugin, exerciseName: "  Squat  " })).toMatchObject({
      href: "Squat",
      unresolved: true,
    });
  });

  it("opens on click and opens in a new tab on Cmd/Ctrl+click or middle-click", () => {
    const { plugin } = makePlugin({ "Exercises/Squat.md": {} });
    const link = exerciseTitleLink({ plugin, exerciseName: "  Squat  " })!;

    link.onOpen(new MouseEvent("click"));
    expect(openExercisePage).toHaveBeenLastCalledWith(plugin, "Squat", false);

    link.onOpen(new MouseEvent("click", { metaKey: true }));
    expect(openExercisePage).toHaveBeenLastCalledWith(plugin, "Squat", "tab");

    link.onOpen(new MouseEvent("auxclick", { button: 1 }));
    expect(openExercisePage).toHaveBeenLastCalledWith(plugin, "Squat", "tab");
  });

  it("triggers Obsidian page preview on hover only when the exercise page exists", () => {
    const { vault, trigger, plugin } = makePlugin({});
    const targetEl = document.createElement("a");
    const link = exerciseTitleLink({
      plugin,
      exerciseName: "Squat",
      sourcePath: "Workouts/Leg Day.md",
    })!;

    const firstHover = new MouseEvent("mouseover");
    link.onHover?.(firstHover, targetEl);
    expect(trigger).not.toHaveBeenCalled();

    // Creating the page later enables hover preview without rebuilding the link config
    vault.write("Exercises/Squat.md", {});
    const secondHover = new MouseEvent("mouseover");
    link.onHover?.(secondHover, targetEl);

    expect(trigger).toHaveBeenCalledWith(
      "hover-link",
      expect.objectContaining({
        event: secondHover,
        source: "preview",
        hoverParent: expect.objectContaining({ hoverPopover: null }),
        targetEl,
        linktext: "Exercises/Squat.md",
        sourcePath: "Workouts/Leg Day.md",
      }),
    );
  });
});
