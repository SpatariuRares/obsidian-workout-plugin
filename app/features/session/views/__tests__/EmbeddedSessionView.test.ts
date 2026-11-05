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
  started: number;
  destroyed: boolean;
}
const timers: TimerState[] = [];
jest.mock("@app/features/timer/views/EmbeddedTimerView", () => ({
  EmbeddedTimerView: class {
    state: TimerState = { params: undefined, started: 0, destroyed: false };
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
