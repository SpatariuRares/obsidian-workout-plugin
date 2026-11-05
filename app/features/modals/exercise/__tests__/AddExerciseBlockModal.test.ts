/** @jest-environment jsdom */
import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { AddExerciseBlockModal } from "@app/features/modals/exercise/AddExerciseBlockModal";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { setsBlock } from "@app/features/tables/setsBlock";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";

function openModal() {
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { timerPresets: {}, defaultTimerPreset: null, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const modal = new AddExerciseBlockModal(app, plugin);
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();
  const generate = () =>
    (modal as unknown as { generateCode(): string }).generateCode();
  const exercise = () =>
    contentEl.querySelector<HTMLInputElement>("input[type='text']")!;
  return { generate, exercise };
}

/** The block's parameters, read back with its schema */
function blockParams(code: string) {
  const body = /```workout-sets\n([\s\S]*?)```/.exec(code)?.[1] ?? "";
  return setsBlock.parse(body);
}

describe("AddExerciseBlockModal", () => {
  it("writes the exercise's section with its workout-sets block", () => {
    const { generate, exercise } = openModal();
    exercise().value = "Squat";

    const code = generate();

    expect(code.startsWith("## Squat\n\n```workout-sets\n")).toBe(true);
    expect(blockParams(code)).toMatchObject({
      params: { exercise: "Squat", sets: 3, rest: 90 },
    });
  });

  it("gives the block an id, so it can be edited later", () => {
    const { generate, exercise } = openModal();
    exercise().value = "Squat";

    expect(blockParams(generate())).toMatchObject({
      params: { id: expect.any(String) },
    });
  });

  it("leaves the workout out, so the block follows the note's name", () => {
    const { generate, exercise } = openModal();
    exercise().value = "Squat";

    expect(generate()).not.toContain("workout:");
  });

  it("asks for an exercise", () => {
    const { generate } = openModal();

    expect(() => generate()).toThrow();
  });
});
