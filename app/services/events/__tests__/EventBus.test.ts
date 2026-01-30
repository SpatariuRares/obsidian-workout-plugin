import { EventBus } from "@app/services/events/EventBus";
import type { WorkoutPluginEventPayload } from "@app/services/events/types";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
    jest.clearAllMocks();
  });

  afterEach(() => {
    eventBus.destroy();
  });

  describe("on()", () => {
    it("should subscribe handler correctly", () => {
      const handler = jest.fn();
      eventBus.on("data:changed", handler);

      // Handler should not be called yet
      expect(handler).not.toHaveBeenCalled();
    });

    it("should return an unsubscribe function", () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.on("data:changed", handler);

      expect(typeof unsubscribe).toBe("function");
    });

    it("should allow multiple handlers for the same event", () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("data:changed", handler2);

      // Both handlers should be registered (we'll verify via emit)
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should return noop unsubscribe function after destroy", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      eventBus.destroy();

      const handler = jest.fn();
      const unsubscribe = eventBus.on("data:changed", handler);

      expect(typeof unsubscribe).toBe("function");
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "EventBus: Attempted to subscribe after destroy"
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("emit()", () => {
    it("should deliver events asynchronously", async () => {
      const handler = jest.fn();
      eventBus.on("data:changed", handler);

      const payload: WorkoutPluginEventPayload<"data:changed"> = {
        source: "user",
        timestamp: Date.now(),
      };

      eventBus.emit("data:changed", payload);

      // Handler should not be called synchronously
      expect(handler).not.toHaveBeenCalled();

      // Wait for microtask to complete
      await Promise.resolve();

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it("should call all handlers for the same event", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("data:changed", handler2);
      eventBus.on("data:changed", handler3);

      const payload: WorkoutPluginEventPayload<"data:changed"> = {
        source: "file",
        timestamp: Date.now(),
      };

      eventBus.emit("data:changed", payload);
      await Promise.resolve();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should not call handlers for different events", async () => {
      const dataHandler = jest.fn();
      const settingsHandler = jest.fn();

      eventBus.on("data:changed", dataHandler);
      eventBus.on("settings:changed", settingsHandler);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(dataHandler).toHaveBeenCalledTimes(1);
      expect(settingsHandler).not.toHaveBeenCalled();
    });

    it("should do nothing when no handlers are registered", async () => {
      // Should not throw
      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();
    });

    it("should warn and not emit after destroy", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      const handler = jest.fn();
      eventBus.on("data:changed", handler);
      eventBus.destroy();

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(handler).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "EventBus: Attempted to emit after destroy"
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle all event types correctly", async () => {
      const dataHandler = jest.fn();
      const settingsHandler = jest.fn();
      const cacheHandler = jest.fn();
      const fileHandler = jest.fn();

      eventBus.on("data:changed", dataHandler);
      eventBus.on("settings:changed", settingsHandler);
      eventBus.on("cache:invalidate", cacheHandler);
      eventBus.on("file:modified", fileHandler);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      eventBus.emit("settings:changed", {
        changedKeys: ["csvLogFilePath"],
        timestamp: Date.now(),
      });
      eventBus.emit("cache:invalidate", { cacheType: "all", reason: "test" });
      eventBus.emit("file:modified", {
        filePath: "/test/file.md",
        changeType: "modify",
        timestamp: Date.now(),
      });

      await Promise.resolve();

      expect(dataHandler).toHaveBeenCalledTimes(1);
      expect(settingsHandler).toHaveBeenCalledTimes(1);
      expect(cacheHandler).toHaveBeenCalledTimes(1);
      expect(fileHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("off()", () => {
    it("should remove handler from event", async () => {
      const handler = jest.fn();
      eventBus.on("data:changed", handler);

      eventBus.off("data:changed", handler);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(handler).not.toHaveBeenCalled();
    });

    it("should only remove the specified handler", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("data:changed", handler2);

      eventBus.off("data:changed", handler1);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should handle removing non-existent handler gracefully", () => {
      const handler = jest.fn();

      // Should not throw
      eventBus.off("data:changed", handler);
    });

    it("should handle removing handler from non-existent event gracefully", () => {
      const handler = jest.fn();

      // Subscribe to one event, try to unsubscribe from another
      eventBus.on("data:changed", handler);

      // Should not throw
      eventBus.off("settings:changed", handler);
    });

    it("should clean up empty handler sets", async () => {
      const handler = jest.fn();
      eventBus.on("data:changed", handler);
      eventBus.off("data:changed", handler);

      // Add a new handler to verify the event can still be used
      const newHandler = jest.fn();
      eventBus.on("data:changed", newHandler);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(newHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("unsubscribe function", () => {
    it("should unsubscribe when called", async () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.on("data:changed", handler);

      unsubscribe();

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(handler).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", async () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.on("data:changed", handler);

      unsubscribe();
      unsubscribe(); // Should not throw
      unsubscribe();

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("destroy()", () => {
    it("should clear all handlers", async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const handler3 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("settings:changed", handler2);
      eventBus.on("cache:invalidate", handler3);

      eventBus.destroy();

      // Suppress warnings for this test
      jest.spyOn(console, "warn").mockImplementation();

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      eventBus.emit("settings:changed", {
        changedKeys: [],
        timestamp: Date.now(),
      });
      eventBus.emit("cache:invalidate", { cacheType: "all" });

      await Promise.resolve();

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it("should be safe to call multiple times", () => {
      eventBus.destroy();
      eventBus.destroy(); // Should not throw
      eventBus.destroy();
    });
  });

  describe("error handling", () => {
    it("should not break other handlers when one throws synchronously", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();

      const handler1 = jest.fn();
      const errorHandler = jest.fn(() => {
        throw new Error("Test error");
      });
      const handler2 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("data:changed", errorHandler);
      eventBus.on("data:changed", handler2);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });

      // Wait for all microtasks to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(errorHandler).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'EventBus: Error in handler for "data:changed":',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle async handler errors gracefully", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();

      const handler1 = jest.fn();
      const asyncErrorHandler = jest.fn(async () => {
        throw new Error("Async test error");
      });
      const handler2 = jest.fn();

      eventBus.on("data:changed", handler1);
      eventBus.on("data:changed", asyncErrorHandler);
      eventBus.on("data:changed", handler2);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });

      // Wait for all microtasks and promises to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(asyncErrorHandler).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'EventBus: Error in async handler for "data:changed":',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it("should handle async handlers that resolve successfully", async () => {
      const asyncHandler = jest.fn(async () => {
        await Promise.resolve();
        // Handler completes successfully
      });

      eventBus.on("data:changed", asyncHandler);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(asyncHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("handler modification during emit", () => {
    it("should not affect current emission when handler unsubscribes itself", async () => {
      const results: string[] = [];

      const handler1 = jest.fn(() => {
        results.push("handler1");
      });

      let unsubscribe2: () => void;
      const handler2 = jest.fn(() => {
        results.push("handler2");
        unsubscribe2(); // Unsubscribe during execution
      });

      const handler3 = jest.fn(() => {
        results.push("handler3");
      });

      eventBus.on("data:changed", handler1);
      unsubscribe2 = eventBus.on("data:changed", handler2);
      eventBus.on("data:changed", handler3);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });

      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // All three should have been called since handlers were copied before iteration
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it("should not call newly added handlers during current emission", async () => {
      const results: string[] = [];

      const handler1 = jest.fn(() => {
        results.push("handler1");
        // Add a new handler during emission
        eventBus.on("data:changed", lateHandler);
      });

      const lateHandler = jest.fn(() => {
        results.push("lateHandler");
      });

      eventBus.on("data:changed", handler1);

      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });

      await Promise.resolve();
      await Promise.resolve();

      // Late handler should not have been called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(lateHandler).not.toHaveBeenCalled();

      // But it should be called on next emit
      eventBus.emit("data:changed", { source: "user", timestamp: Date.now() });
      await Promise.resolve();
      await Promise.resolve();

      expect(lateHandler).toHaveBeenCalledTimes(1);
    });
  });
});
