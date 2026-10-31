/** @jest-environment jsdom */
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import {
  completeOnEvent,
  completeOnLogAdded,
  completeOnInsertCommand,
  completeOnTargetClick,
} from "@app/features/tour/completions";
import type { StepCompletion } from "@app/features/tour/TourStep";

const logRow = {
  date: "2026-01-01",
  exercise: "Squat",
  reps: 5,
  weight: 100,
  volume: 500,
};

function arm(completion: StepCompletion) {
  const complete = jest.fn();
  const dispose = completion.arm({ complete });
  return { complete, dispose };
}

describe("tour completions", () => {
  let bus: WorkoutEventBus;
  beforeEach(() => {
    bus = new WorkoutEventBus();
  });

  describe("completeOnLogAdded", () => {
    it("completes on log:added and not on unrelated events", () => {
      const { complete } = arm(completeOnLogAdded(bus));

      bus.emit({ type: "muscle-tags:changed", payload: {} });
      bus.emit({
        type: "log:deleted",
        payload: { entry: logRow, context: { exercise: "Squat" } },
      });
      expect(complete).not.toHaveBeenCalled();

      bus.emit({
        type: "log:added",
        payload: { entry: logRow, context: { exercise: "Squat" } },
      });
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it("stops listening once disposed", () => {
      const { complete, dispose } = arm(completeOnLogAdded(bus));
      dispose();
      bus.emit({
        type: "log:added",
        payload: { entry: logRow, context: { exercise: "Squat" } },
      });
      expect(complete).not.toHaveBeenCalled();
    });

    it("completes only once", () => {
      const { complete } = arm(completeOnLogAdded(bus));
      const added = {
        type: "log:added" as const,
        payload: { entry: logRow, context: { exercise: "Squat" } },
      };
      bus.emit(added);
      bus.emit(added);
      expect(complete).toHaveBeenCalledTimes(1);
    });
  });

  describe("completeOnEvent", () => {
    it("honours the filter", () => {
      const { complete } = arm(
        completeOnEvent(bus, "log:updated", (p) => p.updated.exercise === "Bench"),
      );
      bus.emit({
        type: "log:updated",
        payload: { previous: logRow, updated: logRow },
      });
      expect(complete).not.toHaveBeenCalled();
      bus.emit({
        type: "log:updated",
        payload: { previous: logRow, updated: { ...logRow, exercise: "Bench" } },
      });
      expect(complete).toHaveBeenCalledTimes(1);
    });
  });

  describe("completeOnInsertCommand", () => {
    it("completes when any insert command ran", () => {
      const { complete } = arm(completeOnInsertCommand(bus));
      bus.emit({ type: "log:bulk-changed", payload: { count: 1, operation: "other" } });
      expect(complete).not.toHaveBeenCalled();
      bus.emit({ type: "command:insert", payload: { kind: "timer" } });
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it("can wait for one kind", () => {
      const { complete } = arm(completeOnInsertCommand(bus, "chart"));
      bus.emit({ type: "command:insert", payload: { kind: "table" } });
      expect(complete).not.toHaveBeenCalled();
      bus.emit({ type: "command:insert", payload: { kind: "chart" } });
      expect(complete).toHaveBeenCalledTimes(1);
    });
  });

  describe("completeOnTargetClick", () => {
    const addTarget = (id: string) => {
      const el = document.createElement("button");
      el.setAttribute("data-tour", id);
      document.body.appendChild(el);
      return el;
    };
    afterEach(() => {
      document.body.innerHTML = "";
    });

    it("completes on a click inside the target, even if it was rendered after arming", () => {
      const { complete } = arm(completeOnTargetClick("timer-start"));
      addTarget("other").click();
      expect(complete).not.toHaveBeenCalled();
      addTarget("timer-start").click();
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it("counts clicks on a child of the target", () => {
      const { complete } = arm(completeOnTargetClick("timer-start"));
      const start = addTarget("timer-start");
      const icon = document.createElement("span");
      start.appendChild(icon);
      icon.click();
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it("stops listening once disposed", () => {
      const { complete, dispose } = arm(completeOnTargetClick("timer-start"));
      dispose();
      addTarget("timer-start").click();
      expect(complete).not.toHaveBeenCalled();
    });
  });
});
