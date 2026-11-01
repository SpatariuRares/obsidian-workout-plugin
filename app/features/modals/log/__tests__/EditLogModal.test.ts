/** @jest-environment jsdom */
// Time zone: Europe/Rome, pinned in jest.config.js

import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return {
    ...actual,
    Platform: { isMobile: false },
    // Opening a modal draws it into the document, so the confirmation the
    // edit form asks for can be read and clicked
    Modal: class {
      contentEl?: HTMLElement;
      constructor(public app: App) {}
      open() {
        const { createObsidianContainer } = jest.requireActual(
          "@app/components/__tests__/obsidianDomMocks",
        );
        this.contentEl = createObsidianContainer();
        document.body.append(this.contentEl!);
        mockOpened.push(this.contentEl!);
        (this as unknown as { onOpen(): void }).onOpen();
      }
      close() {}
    },
  };
});
const mockOpened: HTMLElement[] = [];
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

async function openModal(log: WorkoutLogData = original) {
  const app = {
    workspace: { getActiveViewOfType: () => null },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const updateWorkoutLogEntry = jest.fn().mockResolvedValue(undefined);
  const deleteWorkoutLogEntry = jest.fn().mockResolvedValue(undefined);
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
    deleteWorkoutLogEntry,
  } as unknown as WorkoutPluginContext;

  const modal = new EditLogModal(app, plugin, log);
  const contentEl = createObsidianContainer();
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  await modal.onOpen();

  const save = async () => {
    [...contentEl.querySelectorAll("button")]
      .find((b) => b.textContent === t("modal.buttons.update"))!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  return { contentEl, save, close, updateWorkoutLogEntry, deleteWorkoutLogEntry };
}

describe("EditLogModal", () => {
  it("deletes the set from the save bar icon, only after a confirmation that names it", async () => {
    const { contentEl, close, deleteWorkoutLogEntry } = await openModal();
    const button = (text: string) =>
      [...document.querySelectorAll("button")].find((b) => b.textContent === text)!;

    const trash = contentEl.querySelector<HTMLButtonElement>(
      `.workout-log-actions button[aria-label="${t("modal.buttons.deleteSet")}"]`,
    )!;
    expect(trash.dataset.icon).toBe("trash-2");
    trash.click();

    expect(deleteWorkoutLogEntry).not.toHaveBeenCalled();
    expect(mockOpened).toHaveLength(1);
    expect(mockOpened[0].textContent).toContain(
      t("table.deleteSetMessage", { set: "Squat · 45.36 kg × 5 · 10/03" }),
    );
    const confirmButton = button(t("table.deleteTitle"));
    expect(confirmButton.classList.contains("workout-btn-danger")).toBe(true);

    confirmButton.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(deleteWorkoutLogEntry).toHaveBeenCalledWith(original);
    expect(close).toHaveBeenCalled();
  });

  it("shows the day the set was done, not the UTC day", async () => {
    const { contentEl } = await openModal();

    expect(contentEl.querySelector<HTMLInputElement>('input[type="date"]')!.value).toBe(
      "2026-03-10",
    );
  });

  it("shows why a set can't be saved under the field to fix, until it is edited", async () => {
    const { contentEl, save, updateWorkoutLogEntry } = await openModal();
    document.body.append(contentEl); // focus needs a connected element
    const reps = contentEl.querySelector<HTMLInputElement>('input[aria-label="Reps"]')!;
    reps.value = "";

    await save();

    const error = contentEl.querySelector(".workout-field-error")!;
    expect(error.textContent).toBe(t("modal.notices.validMissingField", { field: "Reps" }));
    expect(error.getAttribute("role")).toBe("alert");
    expect(reps.closest(".workout-input-with-adjust")!.nextElementSibling).toBe(error);
    expect(reps.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(reps);
    expect(updateWorkoutLogEntry).not.toHaveBeenCalled();

    reps.value = "5";
    reps.dispatchEvent(new Event("input"));

    expect(contentEl.querySelector(".workout-field-error")).toBeNull();
    expect(reps.hasAttribute("aria-invalid")).toBe(false);
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

  it("keeps the protocol of a set whose protocol is no longer in the settings list", async () => {
    // Drop set deleted from Settings → Protocols: the list is empty here
    const dropSet = { ...original, protocol: WorkoutProtocol.DROP_SET };
    const { contentEl, save, updateWorkoutLogEntry } = await openModal(dropSet);

    const option = [...contentEl.querySelectorAll("option")].find(
      (o) => o.value === WorkoutProtocol.DROP_SET,
    );
    expect(option?.textContent).toBe(t("modal.selectOptions.dropSet"));

    await save();

    expect(updateWorkoutLogEntry).toHaveBeenCalledWith(
      dropSet,
      expect.objectContaining({ protocol: WorkoutProtocol.DROP_SET }),
    );
  });
});
