/**
 * @jest-environment jsdom
 */
import {
  EventAwareRenderChild,
  type ViewFilter,
} from "@app/services/core/EventAwareRenderChild";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

// Override the obsidian mock for this test file to include register()
jest.mock(
  "obsidian",
  () => ({
    MarkdownRenderChild: class {
      containerEl: HTMLElement;
      _cleanups: Array<() => void> = [];
      constructor(el: HTMLElement) {
        this.containerEl = el;
      }
      register(fn: () => void) {
        this._cleanups.push(fn);
      }
      onunload() {
        this._cleanups.forEach((fn) => fn());
      }
    },
  }),
  { virtual: true },
);

function makeEntry(
  exercise: string,
  workout = "Test",
): WorkoutLogData {
  return {
    exercise,
    workout,
    date: "2025-01-01",
    reps: 10,
    weight: 50,
  } as WorkoutLogData;
}

describe("EventAwareRenderChild", () => {
  let bus: WorkoutEventBus;
  let el: HTMLElement;
  let renderFn: jest.Mock;

  beforeEach(() => {
    bus = new WorkoutEventBus();
    el = document.createElement("div");
    renderFn = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    bus.destroy();
  });

  function makeChild(filter: ViewFilter): EventAwareRenderChild {
    const child = new EventAwareRenderChild(
      el,
      bus,
      filter,
      renderFn,
    );
    child.onload();
    return child;
  }

  // ---- log:added ----

  describe("log:added", () => {
    it("should refresh when no filter (global view)", () => {
      makeChild({});
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should refresh when exercise matches (normalized)", () => {
      makeChild({ exercise: "squat" });
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when exercise does not match", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });

    it("should handle trailing spaces in exercise name", () => {
      makeChild({ exercise: "Squat " });
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should use partial match by default", () => {
      makeChild({ exercise: "squat" });
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat Paused"),
          context: { exercise: "Squat Paused" },
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should use exact match when exactMatch=true", () => {
      makeChild({ exercise: "Squat", exactMatch: true });
      bus.emit({
        type: "log:added",
        payload: {
          entry: makeEntry("Squat Paused"),
          context: { exercise: "Squat Paused" },
        },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:updated (caso rename) ----

  describe("log:updated", () => {
    it("should refresh when previous exercise matches (rename case)", () => {
      makeChild({ exercise: "Squat" });
      bus.emit({
        type: "log:updated",
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should refresh when updated exercise matches", () => {
      makeChild({ exercise: "Leg Press" });
      bus.emit({
        type: "log:updated",
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when neither old nor new exercise matches", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({
        type: "log:updated",
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),
        },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:deleted ----

  describe("log:deleted", () => {
    it("should refresh when deleted exercise matches", () => {
      makeChild({ exercise: "Squat" });
      bus.emit({
        type: "log:deleted",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when deleted exercise does not match", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({
        type: "log:deleted",
        payload: {
          entry: makeEntry("Squat"),
          context: { exercise: "Squat" },
        },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:bulk-changed ----

  describe("log:bulk-changed", () => {
    it("should always refresh on bulk-changed regardless of filter", () => {
      makeChild({ exercise: "Squat", exactMatch: true });
      bus.emit({
        type: "log:bulk-changed",
        payload: { count: 10, operation: "import" },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });
  });

  // ---- muscle-tags:changed ----

  describe("muscle-tags:changed", () => {
    it("should refresh if muscleTagsAware=true", () => {
      makeChild({ muscleTagsAware: true });
      bus.emit({ type: "muscle-tags:changed", payload: {} });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh if muscleTagsAware=false or undefined", () => {
      makeChild({ muscleTagsAware: false });
      bus.emit({ type: "muscle-tags:changed", payload: {} });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });
});
