/**
 * Ready-made `StepCompletion`s for tour steps: each one waits for a real
 * action (an event on the `WorkoutEventBus`, or a click on the step's target)
 * and completes the step once.
 */
import type { StepCompletion } from "@app/features/tour/TourStep";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type {
  InsertCommandKind,
  WorkoutEventPayload,
  WorkoutEventType,
} from "@app/services/events/WorkoutEventTypes";

/** Completes when `type` is emitted (and `filter`, if given, accepts the payload). */
export function completeOnEvent<T extends WorkoutEventType>(
  bus: WorkoutEventBus,
  type: T,
  filter?: (payload: WorkoutEventPayload<T>) => boolean,
): StepCompletion {
  return {
    arm(ctx) {
      let done = false;
      const off = bus.on(type, (payload) => {
        if (done || (filter && !filter(payload))) return;
        done = true;
        ctx.complete();
      });
      return off;
    },
  };
}

/** A log entry was added (e.g. through the Create log modal). */
export function completeOnLogAdded(bus: WorkoutEventBus): StepCompletion {
  return completeOnEvent(bus, "log:added");
}

/** An "Insert workout ..." command ran: any of them, or only `kind`. */
export function completeOnInsertCommand(
  bus: WorkoutEventBus,
  kind?: InsertCommandKind,
): StepCompletion {
  return completeOnEvent(
    bus,
    "command:insert",
    kind ? (payload) => payload.kind === kind : undefined,
  );
}

/**
 * The user clicked the element (or a child of it) carrying `data-tour="<target>"`.
 * Listens on the document, so it still works when a re-render replaces the element.
 */
export function completeOnTargetClick(target: string): StepCompletion {
  return {
    arm(ctx) {
      let done = false;
      const onClick = (event: MouseEvent) => {
        if (done || !(event.target instanceof Element)) return;
        const hit = event.target.closest("[data-tour]");
        if (hit?.getAttribute("data-tour") !== target) return;
        done = true;
        ctx.complete();
      };
      // Capture: runs even if the target stops propagation.
      document.addEventListener("click", onClick, true);
      return () => document.removeEventListener("click", onClick, true);
    },
  };
}
