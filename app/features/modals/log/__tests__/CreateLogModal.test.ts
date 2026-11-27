/** @jest-environment jsdom */
// Time zone: Europe/Rome, pinned in jest.config.js

import { App } from "obsidian";

jest.mock("obsidian", () => {
  const actual = jest.requireActual("obsidian");
  return { ...actual, Platform: { isMobile: false } };
});
import { CreateLogModal } from "@app/features/modals/log/CreateLogModal";
import { getExerciseTypeById } from "@app/constants/exerciseTypes.constants";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { LogFormData } from "@app/types/ModalTypes";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";

async function openModal(
  exercise?: string,
  initialValues?: Partial<LogFormData>,
) {
  const app = {
    workspace: { getActiveViewOfType: () => null },
    vault: { getMarkdownFiles: () => [] },
    metadataCache: { getFileCache: () => null },
  } as unknown as App;
  const addWorkoutLogEntry = jest.fn().mockResolvedValue(undefined);
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
    getExerciseLibrary: () => ({
      pages: () => [],
      find: () => undefined,
    }),
    getExerciseDefinitionService: () => ({
      getParametersForExercise: async () =>
        getExerciseTypeById("strength")!.parameters,
    }),
    addWorkoutLogEntry,
  } as unknown as WorkoutPluginContext;

  const modal = new CreateLogModal(
    app,
    plugin,
    exercise,
    "[[Leg day]]",
    initialValues,
  );
  const contentEl = createObsidianContainer();
  document.body.append(contentEl);
  const close = jest.fn();
  Object.assign(modal, { contentEl, close });
  await modal.onOpen();

  const button = (text: string) =>
    [...contentEl.querySelectorAll("button")].find(
      (b) => b.textContent === text,
    )!;
  const visible = () =>
    [...contentEl.querySelectorAll<HTMLElement>("[data-step-id]")]
      .filter((p) => !p.hidden)
      .map((p) => p.dataset.stepId);
  const log = async () => {
    button(t("modal.buttons.create")).click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  };
  const input = (label: string) =>
    contentEl.querySelector<HTMLInputElement>(
      `input[aria-label="${label}"]`,
    )!;
  const exerciseInput = () =>
    contentEl.querySelector<HTMLInputElement>(
      '[data-step-id="exercise"] input[type="text"]',
    )!;
  const next = () => button(t("wizard.next")).click();
  return {
    contentEl,
    button,
    visible,
    log,
    input,
    exerciseInput,
    next,
    close,
    addWorkoutLogEntry,
  };
}

describe("CreateLogModal wizard", () => {
  it("opens on step 1 of 3 with the stepper and a Log button on every step", async () => {
    const { contentEl, visible, button, next } = await openModal(
      "Squat",
      {
        exercise: "Squat",
        reps: 8,
        weight: 80,
      },
    );

    expect(visible()).toEqual(["exercise"]);
    expect(
      contentEl.querySelector(".workout-wizard-counter")!.textContent,
    ).toBe(t("wizard.stepCounter", { current: 1, total: 3 }));
    expect(
      contentEl.querySelectorAll(".workout-wizard-step"),
    ).toHaveLength(3);
    expect(button(t("modal.buttons.create"))).toBeDefined();
    next();
    expect(visible()).toEqual(["fields"]);
    expect(button(t("modal.buttons.create"))).toBeDefined();
    next();
    expect(visible()).toEqual(["details"]);
    expect(button(t("modal.buttons.create"))).toBeDefined();
  });

  it("logs from the first step exactly the prefilled entry, with protocol, notes and block id", async () => {
    const { log, addWorkoutLogEntry } = await openModal("Squat", {
      exercise: "Squat",
      reps: 8,
      weight: 80,
      notes: "felt good",
      protocol: "drop_set",
      block: "abc123",
    });

    await log();

    expect(addWorkoutLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        exercise: "Squat",
        reps: 8,
        weight: 80,
        notes: "felt good",
        protocol: "drop_set",
        block: "abc123",
        origine: "[[Leg day]]",
      }),
    );
  });

  it("blocks Next with an inline error on the exercise and focuses it", async () => {
    const { contentEl, visible, next, exerciseInput } =
      await openModal();

    next();

    expect(visible()).toEqual(["exercise"]);
    const error = contentEl.querySelector(
      "#workout-log-field-error",
    )!;
    expect(error.textContent).toBe(
      t("modal.notices.validChooseExercise"),
    );
    expect(document.activeElement).toBe(exerciseInput());
  });

  it("blocks leaving the fields step while a required field is empty, and Back keeps what was typed", async () => {
    const {
      contentEl,
      visible,
      next,
      input,
      button,
      addWorkoutLogEntry,
      log,
    } = await openModal("Squat", {
      exercise: "Squat",
      reps: 8,
      weight: 80,
      notes: "n",
    });
    next();
    input("Reps").value = "";

    next();

    expect(visible()).toEqual(["fields"]);
    expect(
      contentEl.querySelector("#workout-log-field-error"),
    ).not.toBeNull();
    expect(document.activeElement).toBe(input("Reps"));

    input("Reps").value = "5";
    input("Reps").dispatchEvent(
      new Event("input", { bubbles: true }),
    );
    next();
    expect(visible()).toEqual(["details"]);
    button(t("wizard.back")).click();
    button(t("wizard.back")).click();
    expect(visible()).toEqual(["exercise"]);
    next();
    expect(input("Reps").value).toBe("5");

    await log();
    expect(addWorkoutLogEntry).toHaveBeenCalledWith(
      expect.objectContaining({ reps: 5, notes: "n" }),
    );
  });

  it("Log from the first step with an empty required field shows its step and error, and writes nothing", async () => {
    const { visible, log, input, addWorkoutLogEntry } =
      await openModal("Squat", {
        exercise: "Squat",
        reps: 8,
        weight: 80,
      });
    input("Reps").value = "";

    await log();

    expect(visible()).toEqual(["fields"]);
    expect(document.activeElement).toBe(input("Reps"));
    expect(addWorkoutLogEntry).not.toHaveBeenCalled();
  });

  it("closing on any step writes nothing", async () => {
    const { button, next, close, addWorkoutLogEntry } =
      await openModal("Squat");
    next();

    button(t("modal.buttons.cancel")).click();

    expect(close).toHaveBeenCalled();
    expect(addWorkoutLogEntry).not.toHaveBeenCalled();
  });
});
