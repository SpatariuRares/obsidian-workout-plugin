/**
 * Asynchronous EventBus implementation for decoupled service communication.
 * Events are queued and delivered asynchronously using queueMicrotask.
 */

import type {
  IEventBus,
  WorkoutPluginEventName,
  WorkoutPluginEventPayload,
  EventHandler,
} from "@app/services/events/types";

/**
 * Internal type for storing handlers
 */
type HandlerSet<T extends WorkoutPluginEventName> = Set<EventHandler<T>>;

/**
 * Asynchronous event bus implementation.
 * Provides type-safe pub/sub for decoupled service communication.
 */
export class EventBus implements IEventBus {
  /**
   * Map of event names to their handler sets
   */
  private handlers: Map<WorkoutPluginEventName, HandlerSet<WorkoutPluginEventName>>;

  /**
   * Flag to track if the bus has been destroyed
   */
  private destroyed: boolean;

  constructor() {
    this.handlers = new Map();
    this.destroyed = false;
  }

  /**
   * Subscribe to an event
   * @param event The event name to subscribe to
   * @param handler The handler function to call when the event is emitted
   * @returns Unsubscribe function
   */
  on<T extends WorkoutPluginEventName>(
    event: T,
    handler: EventHandler<T>
  ): () => void {
    if (this.destroyed) {
      // TODO: delete in future before release
      console.warn("EventBus: Attempted to subscribe after destroy");
      return () => {};
    }

    let handlerSet = this.handlers.get(event) as HandlerSet<T> | undefined;
    if (!handlerSet) {
      handlerSet = new Set();
      this.handlers.set(event, handlerSet as HandlerSet<WorkoutPluginEventName>);
    }

    handlerSet.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Emit an event to all subscribers asynchronously
   * @param event The event name to emit
   * @param payload The event payload
   */
  emit<T extends WorkoutPluginEventName>(
    event: T,
    payload: WorkoutPluginEventPayload<T>
  ): void {
    if (this.destroyed) {
      // TODO: delete in future before release
      console.warn("EventBus: Attempted to emit after destroy");
      return;
    }

    const handlerSet = this.handlers.get(event) as HandlerSet<T> | undefined;
    if (!handlerSet || handlerSet.size === 0) {
      return;
    }

    // Copy handlers to avoid issues if handlers modify the set during iteration
    const handlersToCall = Array.from(handlerSet);

    // Queue async delivery for each handler
    for (const handler of handlersToCall) {
      queueMicrotask(() => {
        this.invokeHandler(event, handler, payload);
      });
    }
  }

  /**
   * Unsubscribe a handler from an event
   * @param event The event name to unsubscribe from
   * @param handler The handler to remove
   */
  off<T extends WorkoutPluginEventName>(
    event: T,
    handler: EventHandler<T>
  ): void {
    const handlerSet = this.handlers.get(event) as HandlerSet<T> | undefined;
    if (handlerSet) {
      handlerSet.delete(handler);
      // Clean up empty sets
      if (handlerSet.size === 0) {
        this.handlers.delete(event);
      }
    }
  }

  /**
   * Destroy the event bus, removing all handlers
   */
  destroy(): void {
    this.handlers.clear();
    this.destroyed = true;
  }

  /**
   * Invoke a handler with error handling
   * Errors are logged but don't break other handlers
   */
  private invokeHandler<T extends WorkoutPluginEventName>(
    event: T,
    handler: EventHandler<T>,
    payload: WorkoutPluginEventPayload<T>
  ): void {
    try {
      const result = handler(payload);
      // Handle async handlers - catch their errors too
      if (result instanceof Promise) {
        result.catch((error) => {
          // TODO: delete in future before release
          console.error(`EventBus: Error in async handler for "${event}":`, error);
        });
      }
    } catch (error) {
      // TODO: delete in future before release
      console.error(`EventBus: Error in handler for "${event}":`, error);
    }
  }
}
