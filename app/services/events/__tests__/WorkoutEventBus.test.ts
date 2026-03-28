import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

// Mock entry helper
function makeEntry(exercise: string): WorkoutLogData {
  return { exercise, workout: 'Test', date: '2025-01-01', reps: 10, weight: 50 } as WorkoutLogData;
}

describe("WorkoutEventBus", () => {
  let bus: WorkoutEventBus;

  beforeEach(() => {
    bus = new WorkoutEventBus();
  });

  afterEach(() => {
    bus.destroy();
  });

  // ---- Subscribe / Emit ----

  describe("on / emit", () => {
    it("should call handler when matching event is emitted", () => {
      const handler = jest.fn();
      bus.on('log:added', handler);
      const entry = makeEntry('Squat');
      bus.emit({ type: 'log:added', payload: { entry, context: { exercise: 'Squat' } } });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ entry, context: { exercise: 'Squat' } });
    });

    it("should NOT call handler for different event type", () => {
      const handler = jest.fn();
      bus.on('log:deleted', handler);
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      expect(handler).not.toHaveBeenCalled();
    });

    it("should support multiple handlers for same event type", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      bus.on('log:added', h1);
      bus.on('log:added', h2);
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);
    });

    it("should support different event types independently", () => {
      const addHandler = jest.fn();
      const deleteHandler = jest.fn();
      bus.on('log:added', addHandler);
      bus.on('log:deleted', deleteHandler);

      const entry = makeEntry('Squat');
      bus.emit({ type: 'log:added', payload: { entry, context: { exercise: 'Squat' } } });
      expect(addHandler).toHaveBeenCalledTimes(1);
      expect(deleteHandler).not.toHaveBeenCalled();
    });
  });

  // ---- Unsubscribe ----

  describe("unsubscribe", () => {
    it("should not call handler after unsubscribe", () => {
      const handler = jest.fn();
      const unsub = bus.on('log:added', handler);
      unsub();
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      expect(handler).not.toHaveBeenCalled();
    });

    it("should only remove the specific handler", () => {
      const h1 = jest.fn();
      const h2 = jest.fn();
      const unsub1 = bus.on('log:added', h1);
      bus.on('log:added', h2);
      unsub1();
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      expect(h1).not.toHaveBeenCalled();
      expect(h2).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Batching ----

  describe("batch", () => {
    it("should coalesce log events into log:bulk-changed", async () => {
      const addHandler = jest.fn();
      const bulkHandler = jest.fn();
      bus.on('log:added', addHandler);
      bus.on('log:bulk-changed', bulkHandler);

      await bus.batch('import', async () => {
        bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
        bus.emit({ type: 'log:added', payload: { entry: makeEntry('Bench'), context: { exercise: 'Bench' } } });
        bus.emit({ type: 'log:added', payload: { entry: makeEntry('Deadlift'), context: { exercise: 'Deadlift' } } });
      });

      // log:added non deve essere emesso direttamente durante batch
      expect(addHandler).not.toHaveBeenCalled();
      // log:bulk-changed deve essere emesso una sola volta con count corretto
      expect(bulkHandler).toHaveBeenCalledTimes(1);
      expect(bulkHandler).toHaveBeenCalledWith({ count: 3, operation: 'import' });
    });

    it("should emit muscle-tags:changed normally during batch", async () => {
      const muscleHandler = jest.fn();
      const bulkHandler = jest.fn();
      bus.on('muscle-tags:changed', muscleHandler);
      bus.on('log:bulk-changed', bulkHandler);

      await bus.batch('import', async () => {
        bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
        bus.emit({ type: 'muscle-tags:changed', payload: {} });
      });

      expect(muscleHandler).toHaveBeenCalledTimes(1);
      expect(bulkHandler).toHaveBeenCalledTimes(1);
    });

    it("should not coalesce if no log events in batch", async () => {
      const bulkHandler = jest.fn();
      const muscleHandler = jest.fn();
      bus.on('log:bulk-changed', bulkHandler);
      bus.on('muscle-tags:changed', muscleHandler);

      await bus.batch('import', async () => {
        bus.emit({ type: 'muscle-tags:changed', payload: {} });
      });

      expect(bulkHandler).not.toHaveBeenCalled();
      expect(muscleHandler).toHaveBeenCalledTimes(1);
    });

    it("should resume normal dispatch after batch completes", async () => {
      const handler = jest.fn();
      bus.on('log:added', handler);

      await bus.batch('import', async () => {
        bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      });

      // Dopo il batch, emissioni normali funzionano
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Bench'), context: { exercise: 'Bench' } } });
      expect(handler).toHaveBeenCalledTimes(1); // solo quello dopo il batch
    });
  });

  // ---- Error handling ----

  describe("error handling", () => {
    it("should not stop other handlers if one throws", () => {
      const throwing = jest.fn(() => { throw new Error("oops"); });
      const safe = jest.fn();
      const errorHandler = jest.fn();

      bus.on('log:added', throwing);
      bus.on('log:added', safe);
      bus.on('plugin:error', errorHandler);

      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });

      expect(safe).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler.mock.calls[0][0].error.message).toBe("oops");
    });

    it("should wrap non-Error thrown values in an Error object", () => {
      const throwing = jest.fn(() => { throw "string error"; });
      const errorHandler = jest.fn();

      bus.on('log:added', throwing);
      bus.on('plugin:error', errorHandler);

      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });

      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(errorHandler.mock.calls[0][0].error).toBeInstanceOf(Error);
      expect(errorHandler.mock.calls[0][0].error.message).toBe("string error");
    });
  });

  // ---- Destroy ----

  describe("destroy", () => {
    it("should remove all listeners", () => {
      const handler = jest.fn();
      bus.on('log:added', handler);
      bus.destroy();
      bus.emit({ type: 'log:added', payload: { entry: makeEntry('Squat'), context: { exercise: 'Squat' } } });
      expect(handler).not.toHaveBeenCalled();
    });
  });
});

describe("normalizeExercise", () => {
  it.each([
    ["Squat", "squat"],
    ["BENCH PRESS", "bench press"],
    ["  Deadlift  ", "deadlift"],
    ["bench  press", "bench press"],
  ])("normalizeExercise(%s) === %s", (input, expected) => {
    const { normalizeExercise } = require("@app/services/events/WorkoutEventTypes");
    expect(normalizeExercise(input)).toBe(expected);
  });
});
