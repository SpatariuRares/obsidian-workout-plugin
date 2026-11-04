/** @jest-environment jsdom */

import { EmbeddedSetsView } from "@app/features/tables/views/EmbeddedSetsView";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
import { localDay } from "@app/services/history/TrainingHistory";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { EmbeddedSetsParams } from "@app/features/tables/setsBlock";
import type { ParameterDefinition } from "@app/types/ExerciseTypes";
import type { LogEntryInput, WorkoutLogData } from "@app/types/WorkoutLogData";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { defaultProtocolEntries } from "@app/services/protocols/ProtocolCatalog";
import { t } from "@app/i18n";

const editedSets: unknown[] = [];
jest.mock("@app/features/modals/log/EditLogModal", () => ({
  EditLogModal: class {
    constructor(_app: unknown, _plugin: unknown, set: unknown) {
      editedSets.push(set);
    }
    open() {}
  },
}));

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
    reset() {}
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
): WorkoutLogData => ({
  date: `${day}T10:00:00`,
  exercise: "Bench Press",
  reps,
  weight,
  volume: weight * reps,
  workout: "Push Day",
  ...extra,
});

function setup(
  rows: WorkoutLogData[],
  params: EmbeddedSetsParams = { exercise: "Bench Press", sets: 3 },
  editBlock?: () => void,
) {
  const eventBus = new WorkoutEventBus();
  const added: LogEntryInput[] = [];
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
    addWorkoutLogEntry: async (entry: LogEntryInput) => {
      added.push(entry);
      rows.push({
        ...entry,
        date: new Date().toISOString(),
        volume: entry.reps * entry.weight,
        timestamp: Date.now() + added.length,
      } as WorkoutLogData);
      eventBus.emit({
        type: "log:added",
        payload: {
          entry: rows[rows.length - 1],
          context: { exercise: entry.exercise, workout: entry.workout },
        },
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
  return { el, view, child, added, eventBus, reads };
}

const flush = async () => {
  for (let i = 0; i < 6; i++) await new Promise((r) => setTimeout(r, 0));
};
const rowsOf = (el: HTMLElement) =>
  Array.from(el.querySelectorAll<HTMLElement>(".workout-sets-row"));
const inputsOf = (row: HTMLElement) =>
  Array.from(row.querySelectorAll<HTMLInputElement>(".workout-sets-input"));
const check = (row: HTMLElement) =>
  row.querySelector<HTMLButtonElement>("button.workout-sets-check")!;
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input"));
};

beforeEach(() => {
  editedSets.length = 0;
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

    rowsOf(el)[0].querySelector<HTMLButtonElement>(".workout-sets-details-toggle")!.click();
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

  it("opens the edit form when a logged set is tapped", async () => {
    const logged = set(80, 8);
    const { el } = setup([logged]);
    await flush();

    rowsOf(el)[0].querySelector<HTMLElement>(".workout-sets-row-main")!.click();

    expect(editedSets).toEqual([logged]);
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
    expect(el.querySelector(".workout-progress-fill")).not.toBeNull();
  });

  const menuItems = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>(".workout-icon-dropdown-item"));

  it("has the table's ⋮ menu in its top row: edit this block, go to the exercise", async () => {
    const editBlock = jest.fn();
    const { el } = setup([], { exercise: "Bench Press" }, editBlock);
    await flush();

    const header = el.querySelector(".workout-sets-header")!;
    expect(header.lastElementChild?.classList.contains("workout-block-menu")).toBe(true);
    expect(menuItems(el).map((item) => item.textContent)).toEqual([
      t("table.gotoExercise"),
      t("sets.editBlock"),
    ]);
    menuItems(el)[1].click();
    expect(editBlock).toHaveBeenCalled();
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
