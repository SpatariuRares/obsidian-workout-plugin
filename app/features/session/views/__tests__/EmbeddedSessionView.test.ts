/** @jest-environment jsdom */

import { TFile } from "obsidian";
import { EmbeddedSessionView } from "@app/features/session/views/EmbeddedSessionView";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { localDay } from "@app/services/history/TrainingHistory";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import type { WorkoutPluginContext } from "@app/types/PluginPorts";
import { t } from "@app/i18n";
import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";

const openedModals: unknown[][] = [];
jest.mock("@app/features/modals/log/CreateLogModal", () => ({
  CreateLogModal: class {
    constructor(...args: unknown[]) {
      openedModals.push(args);
    }
    open() {}
  },
}));

interface TimerState {
  id?: string;
  params: unknown;
  configured: unknown;
  started: number;
  destroyed: boolean;
}
const timers: TimerState[] = [];
jest.mock("@app/features/timer/views/EmbeddedTimerView", () => ({
  EmbeddedTimerView: class {
    state: TimerState = { params: undefined, configured: undefined, started: 0, destroyed: false };
    constructor(_plugin: unknown, id?: string) {
      this.state.id = id;
      timers.push(this.state);
    }
    getId() {
      return this.state.id;
    }
    createTimer(_el: HTMLElement, params: unknown) {
      this.state.params = params;
    }
    configure(params: unknown) {
      this.state.configured = params;
    }
    reset() {}
    start() {
      this.state.started++;
    }
    isTimerRunning() {
      return this.state.started > 0;
    }
    destroy() {
      this.state.destroyed = true;
    }
  },
}));

const NOTE_PATH = "Workouts/Lower Body A.md";
const NOTE = [
  "```workout-session",
  "```",
  "## Squat",
  "```workout-log",
  "exercise: Squat",
  "sets: 2",
  "targetReps: 8",
  "targetWeight: 100",
  "```",
  "```workout-timer",
  "duration: 120",
  "```",
  "## Leg Press",
  "```workout-log",
  "exercise: Leg Press",
  "sets: 3",
  "```",
].join("\n");

const today = localDay(new Date());
const set = (
  exercise: string,
  weight: number,
  day = today,
): WorkoutLogData =>
  logRow({ date: `${day}T10:00:00`, exercise, weight, workout: "Lower Body A" });

function setup(
  rows: WorkoutLogData[],
  content = NOTE,
  activeTimers = new Map<string, EmbeddedTimerView>(),
) {
  const file = Object.assign(new TFile(), { path: NOTE_PATH });
  let onModify: ((f: unknown) => void) | undefined;
  const note = { content };
  const eventBus = new WorkoutEventBus();
  const plugin = {
    app: {
      vault: {
        getAbstractFileByPath: (path: string) =>
          path === NOTE_PATH ? file : null,
        cachedRead: async () => note.content,
        on: (_name: string, handler: (f: unknown) => void) => {
          onModify = handler;
          return {};
        },
      },
    },
    settings: { weightUnit: "kg", timerPresets: {}, defaultTimerPreset: null },
    eventBus,
    getWorkoutLogData: async () => rows,
    getExerciseDefinitionService: () => ({
      getParametersForExercise: async () => [],
    }),
  } as unknown as WorkoutPluginContext;

  const el = createObsidianContainer();
  const view = new EmbeddedSessionView(plugin, activeTimers);
  const child = view.createSession(el, NOTE_PATH);
  child.load();
  return { el, view, child, eventBus, file, note, modify: () => onModify?.(file) };
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};
const text = (el: HTMLElement) => el.textContent ?? "";
const button = (el: HTMLElement, label: string) =>
  Array.from(el.querySelectorAll("button")).find((b) =>
    b.textContent?.includes(label),
  ) as HTMLButtonElement;

beforeEach(() => {
  openedModals.length = 0;
  timers.length = 0;
});

describe("EmbeddedSessionView", () => {
  it("shows the first unfinished exercise with its next set and target", async () => {
    const { el } = setup([set("Squat", 100)]);
    await flush();

    expect(text(el)).toContain("Squat");
    expect(
      el.querySelector(".workout-block-title a.internal-link.workout-block-title-link")
        ?.textContent,
    ).toBe("Squat");
    expect(text(el)).toContain(t("session.setOf", { set: 2, sets: 2 }));
    expect(text(el)).toContain(
      t("session.target", {
        target: t("logs.weightedSet", { weight: 100, unit: "kg", reps: 8 }),
      }),
    );
  });

  it("shows last time as the set sheet does: every set of the previous training day", async () => {
    const { el } = setup([
      set("Squat", 90, "2019-12-20"),
      set("Squat", 95, "2020-01-01"),
      set("Squat", 97.5, "2020-01-01"),
    ]);
    await flush();

    expect(text(el)).toContain(
      t("sets.lastTime", {
        date: "01/01",
        sets: [
          t("logs.weightedSet", { weight: 95, unit: "kg", reps: 8 }),
          t("logs.weightedSet", { weight: 97.5, unit: "kg", reps: 8 }),
        ].join(" · "),
      }),
    );
  });

  it("opens the log form prefilled with the targets before the first set", async () => {
    const { el } = setup([set("Squat", 95, "2020-01-01")]);
    await flush();

    button(el, t("session.logSet")).click();

    const [, , exercise, pageLink, prefill] = openedModals[0];
    expect(exercise).toBe("Squat");
    expect(pageLink).toBe("[[Lower Body A]]");
    expect(prefill).toMatchObject({ exercise: "Squat", reps: 8, weight: 100 });
  });

  it("prefills the log form with today's last set once one is logged", async () => {
    const { el } = setup([set("Squat", 105)]);
    await flush();

    button(el, t("session.logSet")).click();

    expect(openedModals[0][4]).toMatchObject({ weight: 105 });
  });

  it("moves between exercises with next and previous", async () => {
    const { el } = setup([]);
    await flush();

    button(el, t("session.next")).click();
    await flush();
    expect(text(el)).toContain("Leg Press");

    button(el, t("session.previous")).click();
    await flush();
    expect(text(el)).toContain("Squat");
  });

  it("counts a logged set and starts the rest timer of its exercise", async () => {
    const rows = [set("Squat", 100)];
    const { el, eventBus } = setup(rows);
    await flush();

    const logged = set("Squat", 100);
    rows.push(logged);
    eventBus.emit({
      type: "log:added",
      payload: {
        entry: logged,
        context: { exercise: "Squat", workout: "Lower Body A" },
      },
    });
    await flush();

    expect(text(el)).toContain("Leg Press");
    const timer = timers[timers.length - 1];
    expect(timer.params).toEqual({ duration: 120 });
    expect(timer.started).toBe(1);
  });

  it("starts no rest after a set of a workout-sets block with rest: 0", async () => {
    const content = [
      "```workout-session",
      "```",
      "## Squat",
      "```workout-timer",
      "duration: 120",
      "```",
      "```workout-sets",
      "exercise: Squat",
      "sets: 3",
      "rest: 0",
      "```",
    ].join("\n");
    const rows: WorkoutLogData[] = [];
    const { el, eventBus } = setup(rows, content);
    await flush();

    const logged = set("Squat", 100);
    rows.push(logged);
    eventBus.emit({
      type: "log:added",
      payload: {
        entry: logged,
        context: { exercise: "Squat", workout: "Lower Body A" },
      },
    });
    await flush();

    expect(text(el)).toContain("Squat");
    expect(timers.every((timer) => timer.started === 0)).toBe(true);
    expect(el.querySelector(".workout-session-rest")).toBeNull();
  });

  it("does not start the rest timer when a warm-up set is logged", async () => {
    const rows: WorkoutLogData[] = [];
    const { el, eventBus } = setup(rows);
    await flush();

    const warmup = { ...set("Squat", 60), protocol: "warmup" };
    rows.push(warmup);
    eventBus.emit({
      type: "log:added",
      payload: {
        entry: warmup,
        context: { exercise: "Squat", workout: "Lower Body A" },
      },
    });
    await flush();

    expect(text(el)).toContain("Squat");
    expect(timers.every((timer) => timer.started === 0)).toBe(true);
  });

  it("logs the set in this note's workout, not the last set's", async () => {
    const { el } = setup([
      { ...set("Squat", 95, "2020-01-01"), workout: "Other note" },
    ]);
    await flush();

    button(el, t("session.logSet")).click();

    expect(openedModals[0][4]).toMatchObject({ workout: "Lower Body A" });
  });

  it("keeps the picked exercise when a set of another workout is logged", async () => {
    const { el, eventBus } = setup([]);
    await flush();
    button(el, t("session.next")).click();
    await flush();

    eventBus.emit({
      type: "log:added",
      payload: {
        entry: set("Squat", 100),
        context: { exercise: "Squat", workout: "Push Day" },
      },
    });
    await flush();

    expect(text(el)).toContain("Leg Press");
    expect(timers[timers.length - 1].started).toBe(0);
  });

  it("does not start a rest after the last planned set", async () => {
    const rows = [
      set("Squat", 100),
      set("Squat", 100),
      set("Leg Press", 200),
      set("Leg Press", 200),
    ];
    const { eventBus } = setup(rows);
    await flush();

    const logged = set("Leg Press", 200);
    rows.push(logged);
    eventBus.emit({
      type: "log:added",
      payload: {
        entry: logged,
        context: { exercise: "Leg Press", workout: "Lower Body A" },
      },
    });
    await flush();

    expect(timers[timers.length - 1].started).toBe(0);
  });

  it("does not redraw when the note changes but its plan does not", async () => {
    const { el, note, modify } = setup([]);
    await flush();
    const card = el.querySelector(".workout-session");

    note.content = NOTE + "\n\nSome notes about today.";
    modify();
    await flush();

    expect(el.querySelector(".workout-session")).toBe(card);
  });

  it("says the workout is done when every set is logged", async () => {
    const { el } = setup([
      set("Squat", 100),
      set("Squat", 100),
      set("Leg Press", 200),
      set("Leg Press", 200),
      set("Leg Press", 200),
    ]);
    await flush();

    expect(text(el)).toContain(t("session.done", { sets: 5 }));
  });

  it("explains how to plan when the note has no exercise table", async () => {
    const { el } = setup([], "```workout-session\n```");
    await flush();

    expect(text(el)).toContain(t("session.empty"));
  });

  it("reads the plan again when the note changes", async () => {
    const { el, note, modify } = setup([]);
    await flush();

    note.content = "```workout-log\nexercise: Deadlift\n```";
    modify();
    await flush();

    expect(text(el)).toContain("Deadlift");
  });

  it("destroys its rest timer when unloaded", async () => {
    const { child } = setup([]);
    await flush();

    child.unload();

    expect(timers.every((timer) => timer.destroyed)).toBe(true);
  });

  it("cleans up once when the plugin and the note both unload it", async () => {
    const { view, child } = setup([]);
    await flush();
    const unload = jest.spyOn(child, "onunload");

    view.cleanup();
    child.unload();

    expect(unload).toHaveBeenCalledTimes(1);
  });
});

describe("EmbeddedSessionView with a section timer that has an id", () => {
  const withTimerId = NOTE.replace("duration: 120", "id: squat-rest\nduration: 120");
  const logSquat = (eventBus: WorkoutEventBus, rows: WorkoutLogData[]) => {
    const logged = set("Squat", 100);
    rows.push(logged);
    eventBus.emit({
      type: "log:added",
      payload: {
        entry: logged,
        context: { exercise: "Squat", workout: "Lower Body A" },
      },
    });
  };

  it("runs the rest on the timer the note's block already runs", async () => {
    const activeTimers = new Map<string, EmbeddedTimerView>();
    const blockTimer = new EmbeddedTimerView({} as WorkoutPluginContext, "squat-rest");
    activeTimers.set("squat-rest", blockTimer);
    const rows: WorkoutLogData[] = [];
    const { eventBus } = setup(rows, withTimerId, activeTimers);
    await flush();

    logSquat(eventBus, rows);
    await flush();

    const started = timers.filter((timer) => timer.started > 0);
    expect(started.map((timer) => timer.id)).toEqual(["squat-rest"]);
  });

  it("shares its timer with the block when the block renders later", async () => {
    const activeTimers = new Map<string, EmbeddedTimerView>();
    setup([], withTimerId, activeTimers);
    await flush();

    expect(activeTimers.get("squat-rest")?.getId()).toBe("squat-rest");
  });

  it("leaves a shared timer running when the session unloads", async () => {
    const activeTimers = new Map<string, EmbeddedTimerView>();
    const { child } = setup([], withTimerId, activeTimers);
    await flush();

    child.unload();

    const shared = timers.find((timer) => timer.id === "squat-rest");
    expect(shared?.destroyed).toBe(false);
  });
});

describe("EmbeddedSessionView with a composite superset step", () => {
  const SUPERSET_NOTE = [
    "```workout-session",
    "```",
    "## Push + Pull",
    "```workout-sets",
    "id: ss1",
    "exercises: [Bench Press, Barbell Row]",
    "sets: 2",
    "restBetween: 30",
    "rest: 90",
    "```",
    "## Squat",
    "```workout-sets",
    "id: sq1",
    "exercise: Squat",
    "sets: 3",
    "rest: 120",
    "```",
  ].join("\n");

  const ssSet = (
    exercise: string,
    weight: number,
    options: { day?: string; block?: string; protocol?: string } = {},
  ): WorkoutLogData => ({
    ...set(exercise, weight, options.day ?? today),
    block: options.block,
    protocol: options.protocol,
  });

  it("displays the composite superset step, active exercise, history, and navigates cleanly past the whole superset", async () => {
    const { el } = setup(
      [
        ssSet("Bench Press", 80, { day: "2020-01-01", block: "ss1", protocol: "superset" }),
        ssSet("Barbell Row", 70, { day: "2020-01-01", block: "ss1", protocol: "superset" }),
        ssSet("Bench Press", 82.5, { block: "ss1", protocol: "superset" }),
      ],
      SUPERSET_NOTE,
    );
    await flush();

    expect(el.querySelector(".workout-block-title")?.textContent).toBe(
      "Bench Press + Barbell Row",
    );
    expect(text(el)).toContain(t("session.exerciseOf", { current: 1, total: 2 }));
    expect(text(el)).toContain(t("session.roundOf", { round: 1, rounds: 2 }));
    expect(
      el.querySelector(".workout-session-superset-active a.internal-link.workout-block-title-link")
        ?.textContent,
    ).toBe("Barbell Row");
    expect(text(el)).toContain(
      t("session.roundExerciseOf", { current: 2, total: 2 }),
    );
    expect(text(el)).toContain(
      t("sets.lastTime", {
        date: "01/01",
        sets: t("logs.weightedSet", { weight: 70, unit: "kg", reps: 8 }),
      }),
    );

    // Next skips the entire composite superset step directly to Squat
    button(el, t("session.next")).click();
    await flush();
    expect(el.querySelector(".workout-block-title")?.textContent).toBe("Squat");

    button(el, t("session.previous")).click();
    await flush();
    expect(el.querySelector(".workout-block-title")?.textContent).toBe(
      "Bench Press + Barbell Row",
    );
  });

  it("prefills CreateLogModal with the active exercise, block, and non-standard protocol", async () => {
    const { el } = setup(
      [ssSet("Bench Press", 80, { day: "2020-01-01", protocol: "standard" })],
      SUPERSET_NOTE,
    );
    await flush();

    button(el, t("session.logSet")).click();
    const [, , exercise, , prefill] = openedModals[0];
    expect(exercise).toBe("Bench Press");
    expect(prefill).toMatchObject({
      exercise: "Bench Press",
      weight: 80,
      block: "ss1",
      protocol: "superset",
      workout: "Lower Body A",
    });
  });

  it("switches between restBetween and round rest on log:added, ignores warmups, and skips round rest after the final round", async () => {
    const rows: WorkoutLogData[] = [];
    const { el, eventBus } = setup(rows, SUPERSET_NOTE);
    await flush();

    const emitLog = (exercise: string, weight: number, protocol = "superset") => {
      const entry = ssSet(exercise, weight, { block: "ss1", protocol });
      rows.push(entry);
      eventBus.emit({
        type: "log:added",
        payload: {
          entry,
          context: { exercise, workout: "Lower Body A" },
        },
      });
    };

    // Warm-up set does not trigger any timer or advance the round
    emitLog("Bench Press", 40, "warmup");
    await flush();
    expect(timers[timers.length - 1].started).toBe(0);
    expect(text(el)).toContain(t("session.roundOf", { round: 1, rounds: 2 }));

    // Round 1, exercise 0 (Bench Press) -> restBetween (30s)
    emitLog("Bench Press", 80);
    await flush();
    expect(timers[timers.length - 1].params).toEqual({ type: "countdown", duration: 30 });
    expect(timers[timers.length - 1].configured).toEqual({ type: "countdown", duration: 30 });
    expect(timers[timers.length - 1].started).toBe(1);
    expect(text(el)).toContain("Barbell Row");

    // Round 1, exercise 1 (Barbell Row) -> round rest (90s)
    emitLog("Barbell Row", 70);
    await flush();
    expect(timers[timers.length - 1].params).toEqual({ type: "countdown", duration: 90 });
    expect(timers[timers.length - 1].configured).toEqual({ type: "countdown", duration: 90 });
    expect(timers[timers.length - 1].started).toBe(2);
    expect(text(el)).toContain(t("session.roundOf", { round: 2, rounds: 2 }));

    // Round 2, exercise 0 (Bench Press) -> restBetween (30s)
    emitLog("Bench Press", 80);
    await flush();
    expect(timers[timers.length - 1].params).toEqual({ type: "countdown", duration: 30 });
    expect(timers[timers.length - 1].configured).toEqual({ type: "countdown", duration: 30 });
    expect(timers[timers.length - 1].started).toBe(3);

    // Round 2 (final round), exercise 1 (Barbell Row) -> skips round rest and advances to Squat
    emitLog("Barbell Row", 70);
    await flush();
    expect(el.querySelector(".workout-block-title")?.textContent).toBe("Squat");
    expect(timers[timers.length - 1].started).toBe(3);
  });
});
