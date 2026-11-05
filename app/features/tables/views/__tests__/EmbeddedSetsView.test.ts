/** @jest-environment jsdom */

import { EmbeddedSetsView } from "@app/features/tables/views/EmbeddedSetsView";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
import { localDay } from "@app/services/history/TrainingHistory";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogEntryInput, WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import { t } from "@app/i18n";
import { Notice } from "obsidian";

// Obsidian's global: a fragment with createEl/createSpan
(globalThis as unknown as Record<string, unknown>).createFragment = () => createObsidianContainer();
/** The "set removed" notice's content, and whether it was hidden */
const notices: { message: HTMLElement; hidden: boolean }[] = [];
(Notice as unknown as jest.Mock).mockImplementation((message: unknown) => {
  const shown = { message: message as HTMLElement, hidden: false };
  if (message instanceof HTMLElement) notices.push(shown);
  return { hide: () => (shown.hidden = true) };
});

interface TimerState {
  params: unknown;
  started: number;
}
const timers: TimerState[] = [];
jest.mock("@app/features/timer/views/EmbeddedTimerView", () => ({
  EmbeddedTimerView: class {
    state: TimerState = { params: undefined, started: 0 };
    constructor() {
      timers.push(this.state);
    }
    createTimer(_el: HTMLElement, params: unknown) {
      this.state.params = params;
    }
    reset() {
      this.state.started = 0;
    }
    start() {
      this.state.started++;
    }
    isTimerRunning() {
      return this.state.started > 0;
    }
    destroy() {}
  },
}));

const NOTE_PATH = "Workouts/Push Day.md";
const STRENGTH: ParameterDefinition[] = [
  { key: "reps", label: "Reps", type: "number", required: true, min: 0 },
  { key: "weight", label: "Weight", type: "number", required: true, min: 0 },
];

const today = localDay(new Date());
const set = (
  weight: number,
  reps: number,
  day = today,
  extra: Partial<WorkoutLogData> = {},
): WorkoutLogData =>
  logRow({ date: `${day}T10:00:00`, reps, weight, workout: "Push Day", ...extra });

function setup(
  rows: WorkoutLogData[],
  params: EmbeddedSetsParams = { exercise: "Bench Press", sets: 3 },
  editBlock?: () => void,
) {
  const eventBus = new WorkoutEventBus();
  const added: LogEntryInput[] = [];
  const updated: LogEntryInput[] = [];
  const deleted: WorkoutLogData[] = [];
  const reads = { count: 0 };
  const plugin = {
    app: { vault: { getAbstractFileByPath: () => null } },
    settings: {
      weightUnit: "kg",
      weightIncrement: 2.5,
      achievedTargets: {},
      customProtocols: defaultProtocolEntries(),
    },
    saveSettings: async () => {},
    eventBus,
    getWorkoutLogData: async () => {
      reads.count++;
      return rows;
    },
    getExerciseDefinitionService: () => ({
      getParametersForExercise: async () => STRENGTH,
    }),
    addWorkoutLogEntry: async (entry: LogEntryInput, options: { timestamp?: number } = {}) => {
      added.push(entry);
      const timestamp = options.timestamp ?? Date.now() + added.length;
      rows.push({
        date: new Date().toISOString(),
        ...entry,
        volume: entry.reps * entry.weight,
        timestamp,
      } as WorkoutLogData);
      rows.sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      eventBus.emit({
        type: "log:added",
        payload: {
          entry: rows[rows.length - 1],
          context: { exercise: entry.exercise, workout: entry.workout },
        },
      });
    },
    updateWorkoutLogEntry: async (previous: WorkoutLogData, entry: LogEntryInput) => {
      updated.push(entry);
      const next = { ...previous, ...entry } as WorkoutLogData;
      rows[rows.indexOf(previous)] = next;
      eventBus.emit({ type: "log:updated", payload: { previous, updated: next } });
    },
    deleteWorkoutLogEntry: async (entry: WorkoutLogData) => {
      deleted.push(entry);
      rows.splice(rows.indexOf(entry), 1);
      eventBus.emit({
        type: "log:deleted",
        payload: { entry, context: { exercise: entry.exercise, workout: entry.workout } },
      });
    },
  } as unknown as WorkoutPluginContext;

  const el = createObsidianContainer();
  const view = new EmbeddedSetsView(plugin, new Map());
  const editAction = editBlock && {
    label: t("sets.editBlock"),
    icon: "pencil",
    edits: true,
    run: editBlock,
  };
  const child = view.createSets(el, params, NOTE_PATH, editAction);
  child.load();
  // As CodeBlockProcessorService: one draw, then one on every log change
  void child.render();
  new EventAwareRenderChild(el, eventBus, { exercise: params.exercise, exactMatch: true }, () =>
    child.render(),
  ).load();
  return { el, view, child, plugin, added, updated, deleted, eventBus, reads };
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
};
const rowsOf = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>(".workout-sets-row"));
const inputsOf = (row: HTMLElement) =>
  Array.from(row.querySelectorAll<HTMLInputElement>(".workout-number-field-input"));
const check = (row: HTMLElement) =>
  row.querySelector<HTMLButtonElement>("button.workout-check-toggle")!;
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

beforeEach(() => {
  notices.length = 0;
  timers.length = 0;
});

describe("EmbeddedSetsView", () => {
  it("shows today's sets as logged and the rest with last time's values as hints", async () => {
    const { el } = setup([
      set(60, 10, "2020-01-01"),
      set(80, 8, "2020-01-01"),
      set(77.5, 7, "2020-01-01"),
      set(62.5, 10),
    ]);
    await flush();

    const rows = rowsOf(el);
    expect(rows).toHaveLength(3);
    expect(rows[0].classList.contains("is-logged")).toBe(true);
    expect(rows[0].textContent).toContain("62.5");
    expect(inputsOf(rows[1]).map((i) => i.placeholder)).toEqual(["8", "80"]);
    expect(inputsOf(rows[2]).map((i) => i.placeholder)).toEqual(["7", "77.5"]);
    expect(el.textContent).toContain(t("sets.progress", { done: 1, sets: 3 }));
    expect(el.textContent).toContain(
      t("sets.lastTime", { date: "01/01", sets: "60 kg × 10 · 80 kg × 8 · 77.5 kg × 7" }),
    );
  });

  it("logs an untouched row as last time, in this note's workout", async () => {
    const { el, added } = setup([set(80, 8, "2020-01-01")], {
      exercise: "Bench Press",
      sets: 2,
    });
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();

    expect(added).toEqual([
      expect.objectContaining({
        exercise: "Bench Press",
        workout: "Push Day",
        reps: 8,
        weight: 80,
        protocol: "standard",
        origine: "[[Push Day]]",
      }),
    ]);
    expect(rowsOf(el)[0].classList.contains("is-logged")).toBe(true);
    expect(rowsOf(el)).toHaveLength(2);
  });

  it("draws once per logged set, on the log's event", async () => {
    const { el, reads } = setup([], { exercise: "Bench Press", sets: 2, targetReps: 8, targetWeight: 80 });
    await flush();
    const before = reads.count;

    check(rowsOf(el)[0]).click();
    await flush();

    expect(reads.count).toBe(before + 1);
  });

  it("keeps what is typed in other rows when a set is logged", async () => {
    const { el, added } = setup([], { exercise: "Bench Press", sets: 3, targetReps: 8 });
    await flush();

    const [reps2, weight2] = inputsOf(rowsOf(el)[1]);
    type(reps2, "6");
    type(weight2, "90");
    const [, weight1] = inputsOf(rowsOf(el)[0]);
    type(weight1, "85");
    check(rowsOf(el)[0]).click();
    await flush();

    expect(added[0]).toMatchObject({ reps: 8, weight: 85 });
    expect(inputsOf(rowsOf(el)[1]).map((i) => i.value)).toEqual(["6", "90"]);
  });

  it("keeps every row as typed when a set can't be saved", async () => {
    const { el, plugin } = setup([], { exercise: "Bench Press", sets: 3, targetReps: 8 });
    plugin.addWorkoutLogEntry = () => Promise.reject(new Error("disk full"));
    await flush();

    type(inputsOf(rowsOf(el)[0])[1], "85");
    type(inputsOf(rowsOf(el)[1])[1], "90");
    check(rowsOf(el)[0]).click();
    await flush();

    expect(rowsOf(el).filter((row) => row.classList.contains("is-logged"))).toHaveLength(0);
    expect(inputsOf(rowsOf(el)[0]).map((i) => i.value)).toEqual(["", "85"]);
    expect(inputsOf(rowsOf(el)[1]).map((i) => i.value)).toEqual(["", "90"]);
  });

  it("keeps a set logged, and the rows as typed, when it can't be taken back", async () => {
    const logged = set(80, 8);
    const { el, plugin } = setup([logged], { exercise: "Bench Press", sets: 3 });
    plugin.deleteWorkoutLogEntry = () => Promise.reject(new Error("disk full"));
    await flush();

    type(inputsOf(rowsOf(el)[1])[1], "90");
    check(rowsOf(el)[0]).click();
    await flush();

    expect(rowsOf(el)[0].classList.contains("is-logged")).toBe(true);
    expect(rowsOf(el)).toHaveLength(3);
    expect(inputsOf(rowsOf(el)[1]).map((i) => i.value)).toEqual(["", "90"]);
  });

  it("shows why a row can't be logged and logs nothing", async () => {
    const { el, added } = setup([]);
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();

    expect(added).toEqual([]);
    expect(rowsOf(el)[0].querySelector(".workout-field-error")).not.toBeNull();
    expect(inputsOf(rowsOf(el)[0])[0].getAttribute("aria-invalid")).toBe("true");
  });

  it("logs the protocol and notes set in the row's details", async () => {
    const { el, added } = setup([], { exercise: "Bench Press", sets: 1, targetReps: 8, targetWeight: 80 });
    await flush();

    rowsOf(el)[0].querySelector<HTMLButtonElement>(".workout-disclosure-toggle")!.click();
    await flush();
    const chips = Array.from(rowsOf(el)[0].querySelectorAll<HTMLButtonElement>(".workout-chip"));
    expect(chips[0].getAttribute("aria-pressed")).toBe("true");
    chips[2].click();
    await flush();
    const notes = rowsOf(el)[0].querySelector<HTMLTextAreaElement>("textarea")!;
    notes.value = "slow negatives";
    notes.dispatchEvent(new Event("input"));
    check(rowsOf(el)[0]).click();
    await flush();

    expect(added[0]).toMatchObject({ notes: "slow negatives" });
    expect(added[0].protocol).not.toBe("standard");
    expect(added[0].protocol).toBeTruthy();
  });

  it("suggests the protocol of the same set last time", async () => {
    const { el, added } = setup([set(40, 12, "2020-01-01", { protocol: "warmup" })], {
      exercise: "Bench Press",
      sets: 1,
    });
    await flush();

    expect(rowsOf(el)[0].querySelector(".workout-protocol-badge")).not.toBeNull();
    check(rowsOf(el)[0]).click();
    await flush();
    expect(added[0].protocol).toBe("warmup");
  });

  it("adds a row with the add button", async () => {
    const { el } = setup([], { exercise: "Bench Press", sets: 2 });
    await flush();

    const add = Array.from(el.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(t("sets.addSet")),
    )!;
    add.click();
    await flush();

    expect(rowsOf(el)).toHaveLength(3);
  });

  it("removes a row added with the add button, keeping the drafts of the others", async () => {
    const { el, added } = setup([], { exercise: "Bench Press", sets: 1 });
    await flush();
    const addSet = () =>
      Array.from(el.querySelectorAll("button"))
        .find((b) => b.textContent?.includes(t("sets.addSet")))!
        .click();
    const removeButton = (row: HTMLElement) =>
      row.querySelector<HTMLButtonElement>(`button[aria-label="${t("sets.removeSet")}"]`) ??
      undefined;
    const openDetails = async (row: HTMLElement) => {
      row.querySelector<HTMLButtonElement>(".workout-disclosure-toggle")!.click();
      await flush();
    };
    addSet();
    await flush();
    addSet();
    await flush();
    const third = inputsOf(rowsOf(el)[2]);
    third[0].value = "5";
    third[0].dispatchEvent(new Event("input"));

    // A planned row has no remove
    await openDetails(rowsOf(el)[0]);
    expect(removeButton(rowsOf(el)[0])).toBeUndefined();

    await openDetails(rowsOf(el)[1]);
    removeButton(rowsOf(el)[1])!.click();
    await flush();

    expect(rowsOf(el)).toHaveLength(2);
    expect(inputsOf(rowsOf(el)[1])[0].value).toBe("5");
    expect(added).toEqual([]);
  });

  it("takes a logged set back with its tick: deleted, and its row to fill in with its values", async () => {
    const logged = set(80, 8);
    const { el, added, deleted } = setup([logged]);
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();

    expect(deleted).toEqual([logged]);
    expect(rowsOf(el)).toHaveLength(3);
    expect(rowsOf(el)[0].classList.contains("is-logged")).toBe(false);
    expect(inputsOf(rowsOf(el)[0]).map((input) => input.value)).toEqual(["8", "80"]);

    check(rowsOf(el)[0]).click();
    await flush();
    expect(added[0]).toMatchObject({ reps: 8, weight: 80 });
  });

  it("offers to undo a removed set, putting the very set back in its place", async () => {
    const first = set(80, 8, today, { timestamp: 1, protocol: "warmup", notes: "easy" });
    const second = set(85, 6, today, { timestamp: 2 });
    const { el, added, deleted } = setup([first, second]);
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();
    expect(deleted).toEqual([first]);
    expect(notices[0].message.textContent).toContain(t("sets.setRemoved", { set: 1 }));

    notices[0].message.querySelector<HTMLButtonElement>("button")!.click();
    await flush();

    expect(notices[0].hidden).toBe(true);
    expect(added[0]).toMatchObject({ reps: 8, weight: 80, protocol: "warmup", notes: "easy" });
    const rows = rowsOf(el);
    expect(rows.filter((row) => row.classList.contains("is-logged"))).toHaveLength(2);
    expect(rows[0].textContent).toContain("80");
    // The draft went back with the set: one row to fill in, empty
    expect(rows).toHaveLength(3);
    expect(inputsOf(rows[2]).map((input) => input.value)).toEqual(["", ""]);
  });

  it("does nothing on undo when the row was ticked again", async () => {
    const { el, added } = setup([set(80, 8)]);
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();
    check(rowsOf(el)[0]).click();
    await flush();
    notices[0].message.querySelector<HTMLButtonElement>("button")!.click();
    await flush();

    expect(added).toHaveLength(1);
  });

  it("stops the rest the removed set started", async () => {
    const { el } = setup([], { exercise: "Bench Press", sets: 3, targetReps: 8, targetWeight: 80, rest: 60 });
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();
    expect(timers[0].started).toBe(1);
    check(rowsOf(el)[0]).click();
    await flush();

    expect(timers[0].started).toBe(0);
  });

  describe("focus and screen readers", () => {
    it("moves the focus to the next row after a tick, and back to the row taken back", async () => {
      const { el } = setup([], { exercise: "Bench Press", sets: 3, targetReps: 8, targetWeight: 80 });
      document.body.appendChild(el);
      await flush();

      check(rowsOf(el)[0]).click();
      await flush();
      expect(document.activeElement).toBe(inputsOf(rowsOf(el)[1])[0]);

      check(rowsOf(el)[0]).click();
      await flush();
      expect(document.activeElement).toBe(inputsOf(rowsOf(el)[0])[0]);
      el.remove();
    });

    it("keeps the focus on the chevron that opened the details", async () => {
      const { el } = setup([], { exercise: "Bench Press", sets: 2 });
      document.body.appendChild(el);
      await flush();

      rowsOf(el)[1].querySelector<HTMLButtonElement>(".workout-disclosure-toggle")!.click();
      await flush();

      expect(document.activeElement).toBe(
        rowsOf(el)[1].querySelector(".workout-disclosure-toggle"),
      );
      el.remove();
    });

    it("says the progress after a tick, from a region the redraw keeps", async () => {
      jest.useFakeTimers({ doNotFake: ["setTimeout"] });
      const { el } = setup([], { exercise: "Bench Press", sets: 3, targetReps: 8, targetWeight: 80 });
      await flush();
      const live = el.querySelector('[role="status"]')!;

      check(rowsOf(el)[0]).click();
      await flush();
      await new Promise((r) => setTimeout(r, 60));

      expect(el.querySelector('[role="status"]')).toBe(live);
      expect(live.textContent).toBe(t("sets.progress", { done: 1, sets: 3 }));
      jest.useRealTimers();
    });

    it("says each logged value with its field, since the headers are hidden", async () => {
      const { el } = setup([set(80, 8)]);
      await flush();

      const values = Array.from(rowsOf(el)[0].querySelectorAll(".workout-sets-value"));
      expect(values.map((v) => v.querySelector(".workout-visually-hidden")!.textContent)).toEqual([
        t("sets.valueOfSet", { field: "Reps", set: 1, value: "8" }),
        t("sets.valueOfSet", { field: "Weight (kg)", set: 1, value: "80" }),
      ]);
      expect(el.querySelector(".workout-sets-columns")!.getAttribute("aria-hidden")).toBe("true");
    });

    it("groups the protocol chips under their label", async () => {
      const { el } = setup([], { exercise: "Bench Press", sets: 1 });
      await flush();

      rowsOf(el)[0].querySelector<HTMLButtonElement>(".workout-disclosure-toggle")!.click();
      await flush();

      const group = rowsOf(el)[0].querySelector('[role="group"]')!;
      const label = el.querySelector(`#${group.getAttribute("aria-labelledby")}`);
      expect(label!.textContent).toBe(t("sets.protocol"));
      expect(group.querySelectorAll(".workout-chip").length).toBeGreaterThan(1);
    });
  });

  it("changes a logged set's protocol and notes in its details, without a modal", async () => {
    const { el, updated } = setup([set(80, 8)]);
    await flush();

    const logged = rowsOf(el)[0];
    logged.querySelector<HTMLButtonElement>(".workout-disclosure-toggle")!.click();
    await flush();
    Array.from(rowsOf(el)[0].querySelectorAll<HTMLButtonElement>(".workout-chip"))[2].click();
    await flush();
    expect(updated[0].protocol).not.toBe("standard");
    expect(updated[0]).toMatchObject({ reps: 8, weight: 80 });

    const notes = rowsOf(el)[0].querySelector<HTMLTextAreaElement>("textarea")!;
    notes.value = "felt heavy";
    notes.dispatchEvent(new Event("change"));
    await flush();
    expect(updated[1]).toMatchObject({ notes: "felt heavy", protocol: updated[0].protocol });
    expect(rowsOf(el)[0].classList.contains("is-logged")).toBe(true);
  });

  it("shows a set logged in the other unit as entered, like the table", async () => {
    const { el } = setup([set(100, 5, today, { enteredWeight: 220, enteredUnit: "lb" })]);
    await flush();

    expect(rowsOf(el)[0].textContent).toContain("220 lb");
  });

  it("shows the table's target with its progress", async () => {
    const { el } = setup([set(80, 6, "2020-01-01")], {
      exercise: "Bench Press",
      sets: 1,
      targetReps: 8,
      targetWeight: 80,
    });
    await flush();

    expect(el.querySelector(".workout-target-header")).not.toBeNull();
    expect(el.querySelector(".workout-progress-meter")).not.toBeNull();
  });

  const menuItems = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>(".workout-icon-dropdown-item"));

  it("has the table's ⋮ menu in its top row: go to the exercise, edit this block and its rest timer", async () => {
    const editBlock = jest.fn();
    const { el } = setup([], { exercise: "Bench Press" }, editBlock);
    await flush();

    const header = el.querySelector(".workout-block-header")!;
    expect(header.lastElementChild?.classList.contains("workout-block-menu")).toBe(true);
    expect(menuItems(el).map((item) => item.textContent)).toEqual([
      t("table.gotoExercise"),
      t("sets.editBlock"),
      t("sets.editRestTimer"),
    ]);
    menuItems(el)[1].click();
    expect(editBlock).toHaveBeenCalled();
  });

  it("has no rest timer to edit with rest: 0", async () => {
    const { el } = setup([], { exercise: "Bench Press", rest: 0 }, jest.fn());
    await flush();

    expect(menuItems(el).map((item) => item.textContent)).not.toContain(t("sets.editRestTimer"));
  });

  it("keeps the ⋮ menu with edit when the block names no exercise", async () => {
    const editBlock = jest.fn();
    const { el } = setup([], {}, editBlock);
    await flush();

    expect(menuItems(el).map((item) => item.textContent)).toEqual([t("sets.editBlock")]);
  });

  it("shows the rest timer on top and starts it when a set is logged", async () => {
    const { el } = setup([], { exercise: "Bench Press", sets: 2, targetReps: 8, targetWeight: 80, rest: 90 });
    await flush();

    expect(el.querySelector(".workout-sets-rest")).not.toBeNull();
    expect(timers[0].params).toEqual({ type: "countdown", duration: 90 });
    check(rowsOf(el)[0]).click();
    await flush();
    expect(timers[0].started).toBe(1);
  });

  it("does not rest after the last row to fill in", async () => {
    const { el } = setup([], { exercise: "Bench Press", sets: 1, targetReps: 8, targetWeight: 80, rest: 90 });
    await flush();

    check(rowsOf(el)[0]).click();
    await flush();
    expect(timers[0].started).toBe(0);
  });

  it("has no rest timer with rest: 0", async () => {
    const { el } = setup([], { exercise: "Bench Press", rest: 0 });
    await flush();

    expect(el.querySelector(".workout-sets-rest")).toBeNull();
  });


  it("asks for an exercise when the block has none", async () => {
    const { el } = setup([], {});
    await flush();

    expect(el.textContent).toContain(t("sets.noExercise"));
  });
});
