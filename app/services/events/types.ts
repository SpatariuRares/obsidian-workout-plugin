/**
 * Event type definitions for the workout plugin event bus system.
 * Provides type-safe event handling across services.
 */

/**
 * Event payload types for each event in the system
 */
export interface WorkoutPluginEvents {
  /**
   * Emitted when workout data changes (CSV file modified, entry added/removed)
   */
  "data:changed": {
    source: "file" | "user" | "import";
    timestamp: number;
  };

  /**
   * Emitted when plugin settings change
   */
  "settings:changed": {
    changedKeys: string[];
    timestamp: number;
  };

  /**
   * Emitted when cache should be invalidated
   */
  "cache:invalidate": {
    cacheType: "data" | "exercise" | "all";
    reason?: string;
  };

  /**
   * Emitted when a file in the exercise folder is modified
   */
  "file:modified": {
    filePath: string;
    changeType: "create" | "modify" | "delete" | "rename";
    timestamp: number;
  };
}

/**
 * Type helper to get event names
 */
export type WorkoutPluginEventName = keyof WorkoutPluginEvents;

/**
 * Type helper to get payload type for a specific event
 */
export type WorkoutPluginEventPayload<T extends WorkoutPluginEventName> =
  WorkoutPluginEvents[T];

/**
 * Event handler function type
 */
export type EventHandler<T extends WorkoutPluginEventName> = (
  payload: WorkoutPluginEventPayload<T>
) => void | Promise<void>;

/**
 * Interface for the event bus implementation.
 * Provides a typed pub/sub system for decoupled service communication.
 */
export interface IEventBus {
  /**
   * Subscribe to an event
   * @param event The event name to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns Unsubscribe function
   */
  on<T extends WorkoutPluginEventName>(
    event: T,
    handler: EventHandler<T>
  ): () => void;

  /**
   * Emit an event to all subscribers
   * @param event The event name to emit
   * @param payload The event payload
   */
  emit<T extends WorkoutPluginEventName>(
    event: T,
    payload: WorkoutPluginEventPayload<T>
  ): void;

  /**
   * Unsubscribe a handler from an event
   * @param event The event name to unsubscribe from
   * @param handler The handler to remove
   */
  off<T extends WorkoutPluginEventName>(
    event: T,
    handler: EventHandler<T>
  ): void;

  /**
   * Destroy the event bus, removing all handlers
   */
  destroy(): void;
}
