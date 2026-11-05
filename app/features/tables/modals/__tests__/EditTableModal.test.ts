/** @jest-environment jsdom */
import { App, TFile } from "obsidian";

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

function openModal(note = NOTE) {
  const state = { content: note };
  const app = {
    workspace: {
      getActiveViewOfType: () => ({ file: { path: "Leg day.md", basename: "Leg day" } }),
      getActiveFile: () => ({ path: "Leg day.md", basename: "Leg day" }),
    },
    vault: {
      getAbstractFileByPath: (path: string) =>
        Object.assign(new TFile(), { path }),
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
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getExerciseNames: async () => [],
      getExerciseDefinitions: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const blockBody = note.split("\n").slice(2, -1).join("\n");
  const params = {
    ...tableBlock.defaults,
    ...tableBlock.parse(blockBody).params,
  };
  const modal = new EditTableModal(app, plugin, params, {
    sourcePath: "Leg day.md",
  });
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
  it("removes the limit and keeps sorting, columns, protocol and comments", async () => {
    const { state, update } = openModal();

    update();
    await flush();

    expect(state.content).toBe(NOTE.replace("limit: 12\n", ""));
  });

  it("writes the planned sets typed in the form", async () => {
    const { state, contentEl, update } = openModal();
    const field = [...contentEl.querySelectorAll(".workout-field-with-adjust")].find(
      (el) => el.textContent?.includes(t("modal.labels.plannedSets")),
    )!;

    field.querySelector("input")!.value = "4";
    update();
    await flush();

    expect(state.content).toContain("sets: 4");
    expect(state.content).toContain("# heavy week");
  });

  it("keeps planned sets already in the block", async () => {
    const note = NOTE.replace("limit: 12", "sets: 3");
    const { state, update } = openModal(note);

    update();
    await flush();

    expect(state.content).toBe(note);
  });

  it("leaves a block without limit untouched when nothing changed", async () => {
    const note = NOTE.replace("limit: 12\n", "");
    const { state, update } = openModal(note);

    update();
    await flush();

    expect(state.content).toBe(note);
  });

  describe("table type", () => {
    const chip = (contentEl: HTMLElement, label: string) =>
      [...contentEl.querySelectorAll<HTMLButtonElement>(".workout-chip-group button")].find(
        (b) => b.textContent === label,
      )!;
    const shown = (el: Element | null) =>
      !!el && !el.classList.contains("workout-display-none") &&
      (el as HTMLElement).style.display !== "none";

    it("opens on the block's type: an exercise only shows the exercise field", () => {
      const { contentEl } = openModal();

      expect(
        chip(contentEl, t("modal.selectOptions.specificExercise")).getAttribute("aria-pressed"),
      ).toBe("true");
      expect(shown(contentEl.querySelector(".workout-target-exercise"))).toBe(true);
      expect(shown(contentEl.querySelector(".workout-target-workout"))).toBe(false);
      expect(contentEl.querySelector("select")).toBeNull();
    });

    it("hides the target and the plan when all logs are picked, and drops the exercise", async () => {
      const { state, contentEl, update } = openModal();

      chip(contentEl, t("modal.selectOptions.allLogs")).click();

      expect(shown(contentEl.querySelector(".workout-target-exercise")?.closest(".workout-modal-section") ?? null)).toBe(false);
      update();
      await flush();
      expect(state.content).not.toContain("exercise: Squat");
    });

    it("shows the workout field once the workout is picked", () => {
      const { contentEl } = openModal();

      chip(contentEl, t("modal.selectOptions.completeWorkout")).click();

      expect(shown(contentEl.querySelector(".workout-target-workout"))).toBe(true);
      expect(shown(contentEl.querySelector(".workout-target-exercise"))).toBe(false);
    });
  });
});
