/** @jest-environment jsdom */
// Time zone: Europe/Rome, pinned in jest.config.js

import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Platform: { isMobile: false },
    Modal: class {
      constructor(public app: App) {}
      open() {}
      close() {}
    },
  };
});
import { EditLogModal } from "@app/features/modals/log/EditLogModal";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { WorkoutProtocol, type WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

// Logged at 00:30 in Rome on 10 March, i.e. 23:30 UTC on 9 March
const original: WorkoutLogData = {
  date: "2026-03-09T23:30:00.000Z",
  exercise: "Squat",
  reps: 5,
  weight: 45.36,
  volume: 226.8,
  enteredWeight: 100,
  enteredUnit: "lb",
  workout: "Leg day",
  notes: "late session",
  timestamp: 1000,
  protocol: WorkoutProtocol.STANDARD,
  origine: "[[Leg day]]",
};

async function openModal() {
  const app = {
    workspace: { getActiveViewOfType: () => null },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const updateWorkoutLogEntry = jest.fn().mockResolvedValue(undefined);
  const plugin = {
    app,
    settings: {
      weightUnit: "kg",
      customProtocols: [],
      recentExercises: [],
      weightIncrement: 2.5,
      quickWeightIncrement: 2.5,
    },
    saveSettings: jest.fn(),
    getWorkoutLogData: async () => [],
    findLastEntryForExercise: async () => undefined,
    getExerciseLibrary: () => ({ pages: () => [], find: () => undefined }),
    getExerciseDefinitionService: () => ({
      getParametersForExercise: async () =>
        getExerciseTypeById("strength")!.parameters,
    }),
    updateWorkoutLogEntry,
  } as unknown as WorkoutPluginContext;

  const modal = new EditLogModal(app, plugin, original);
  const contentEl = createObsidianContainer();
  Object.assign(modal, { contentEl, close: jest.fn() });
  await modal.onOpen();

  const save = async () => {
    [...contentEl.querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.buttons.update"))!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { contentEl, save, updateWorkoutLogEntry };
}

describe("EditLogModal", () => {
  it("shows the day the set was done, not the UTC day", async () => {
    const { contentEl } = await openModal();

    expect(contentEl.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe(
      "2026-03-10",
    );
  });

  it("saves an untouched set exactly as it was, after midnight and in lb", async () => {
    const { save, updateWorkoutLogEntry } = await openModal();

    await save();

    expect(updateWorkoutLogEntry).toHaveBeenCalledWith(
      original,
      expect.objectContaining({
        date: "2026-03-09T23:30:00.000Z",
        reps: 5,
        weight: 100,
        weightUnit: "lb",
        notes: "late session",
        workout: "Leg day",
        origine: "[[Leg day]]",
      }),
    );
  });
});
