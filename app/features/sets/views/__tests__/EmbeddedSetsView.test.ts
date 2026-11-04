/** @jest-environment jsdom */

import { EmbeddedSetsView } from "@app/features/sets/views/EmbeddedSetsView";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { localDay } from "@app/services/history/TrainingHistory";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { EmbeddedSetsParams } from "@app/features/sets/setsBlock";
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
) {
  const eventBus = new WorkoutEventBus();
  const added: LogEntryInput[] = [];
  const plugin = {
    app: {},
    settings: { weightUnit: "kg", customProtocols: defaultProtocolEntries() },
    eventBus,
    getWorkoutLogData: async () => rows,
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
  const view = new EmbeddedSetsView(plugin);
  const child = view.createSets(el, params, NOTE_PATH);
  child.load();
  return { el, view, child, added, eventBus };
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

  it("asks for an exercise when the block has none", async () => {
    const { el } = setup([], {});
    await flush();

    expect(el.textContent).toContain(t("sets.noExercise"));
  });
});
