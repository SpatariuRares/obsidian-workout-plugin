/**
 * Event system barrel export
 */

export type {
  WorkoutPluginEvents,
  WorkoutPluginEventName,
  WorkoutPluginEventPayload,
  EventHandler,
  IEventBus,
} from "@app/services/events/types";

export { EventBus } from "@app/services/events/EventBus";
