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
import { EditTableModal } from "@app/features/tables/modals/EditTableModal";
import { tableBlock } from "@app/features/tables/tableBlock";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

const NOTE = [
  "# Leg day",
  "```workout-log",
  "id: a1",
  "exercise: Squat",
  "# heavy week",
  "limit: 12",
  "sortBy: volume",
  "sortOrder: asc",
  "columns: [date, reps, weight]",
  "showProtocol: false",
  "```",
].join("\n");

function openModal() {
  const state = { content: NOTE };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: {
      process: jest.fn(async (_file: unknown, fn: (c: string) => string) => {
        state.content = fn(state.content);
      }),
      getMarkdownFiles: () => [],
    },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const plugin = {
    app,
    settings: { defaultExactMatch: false, recentExercises: [] },
    getWorkoutLogData: async () => [],
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const blockBody = NOTE.split("\n").slice(2, -1).join("\n");
  const params = {
    ...tableBlock.defaults,
    ...tableBlock.parse(blockBody).params,
  };
  const modal = new EditTableModal(app, plugin, params);
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  modal.onOpen();

  const input = (selector: string) =>
    contentEl.querySelector<HTMLInputElement>(selector);
  const update = () =>
    [...contentEl.querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.buttons.updateTable"))!
      .click();
  return { state, contentEl, input, update };
}

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("EditTableModal", () => {
  it("rewrites only the limit and keeps sorting, columns, protocol and comments", async () => {
    const { state, contentEl, update } = openModal();
    const limit = [...contentEl.querySelectorAll<HTMLInputElement>("input")].find(
      (el) => el.value === "12",
    )!;

    limit.value = "20";
    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("limit: 12", "limit: 20"));
  });

  it("leaves the block untouched when nothing changed", async () => {
    const { state, update } = openModal();

    update();
    await flush();

    expect(state.content).toBe(NOTE);
  });
});
