import { MarkdownRenderChild } from "obsidian";
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import {
  normalizeExercise,
  type LogAddedPayload,
  type LogUpdatedPayload,
  type LogDeletedPayload,
  type LogBulkChangedPayload,
  type MuscleTagsChangedPayload,
} from "@app/services/events/WorkoutEventTypes";

export interface ViewFilter {
  exercise?: string;
  workout?: string;
  exactMatch?: boolean;
  /** Se true, questa view deve aggiornarsi anche su muscle-tags:changed */
  muscleTagsAware?: boolean;
}

/**
 * RenderChild che ascolta eventi dal WorkoutEventBus e aggiorna la view
 * in modo selettivo e type-safe.
 *
 * Sostituisce DataAwareRenderChild con:
 * - Filtraggio normalizzato (toLowerCase + trim + collapse spaces)
 * - Supporto per log:updated con confronto su ENTRAMBI i nomi (vecchio e nuovo)
 * - Supporto esplicito per muscle-tags:changed
 * - No accoppiamento con workspace.on/trigger
 */
export class EventAwareRenderChild extends MarkdownRenderChild {
  constructor(
    containerEl: HTMLElement,
    private eventBus: WorkoutEventBus,
    private filter: ViewFilter,
    private renderFn: () => Promise<void>,
  ) {
    super(containerEl);
  }

  onload(): void {
    // log:added — confronta exercise nel nuovo entry
    this.register(
      this.eventBus.on("log:added", (payload: LogAddedPayload) => {
        if (
          this.matchesContext(
            payload.context.exercise,
            payload.context.workout,
          )
        ) {
          void this.renderFn();
        }
      }),
    );

    // log:updated — confronta ENTRAMBI old e new exercise
    // Necessario per il caso rename: view su "Squat" deve aggiornarsi
    // quando "Squat" diventa "Leg Press"
    this.register(
      this.eventBus.on(
        "log:updated",
        (payload: LogUpdatedPayload) => {
          const matchesPrevious = this.matchesContext(
            payload.previous.exercise,
            payload.previous.workout,
          );
          const matchesUpdated = this.matchesContext(
            payload.updated.exercise,
            payload.updated.workout,
          );
          if (matchesPrevious || matchesUpdated) {
            void this.renderFn();
          }
        },
      ),
    );

    // log:deleted — confronta exercise nell'entry eliminata
    this.register(
      this.eventBus.on(
        "log:deleted",
        (payload: LogDeletedPayload) => {
          if (
            this.matchesContext(
              payload.context.exercise,
              payload.context.workout,
            )
          ) {
            void this.renderFn();
          }
        },
      ),
    );

    // log:bulk-changed — sempre refresh (rename, import, ecc.)
    this.register(
      this.eventBus.on(
        "log:bulk-changed",
        (_payload: LogBulkChangedPayload) => {
          void this.renderFn();
        },
      ),
    );

    // muscle-tags:changed — solo per view muscleTagsAware (es. dashboard)
    if (this.filter.muscleTagsAware) {
      this.register(
        this.eventBus.on(
          "muscle-tags:changed",
          (_payload: MuscleTagsChangedPayload) => {
            void this.renderFn();
          },
        ),
      );
    }
  }

  /**
   * Verifica se questa view deve aggiornarsi per un dato esercizio/workout.
   *
   * Logica:
   * - Nessun filtro sulla view → sempre refresh
   * - Filtro exercise presente:
   *   - exactMatch=true → confronto esatto normalizzato
   *   - exactMatch=false → confronto parziale normalizzato (substring)
   * - Filtro workout presente → confronto parziale normalizzato
   */
  private matchesContext(
    exercise: string,
    workout?: string,
  ): boolean {
    const hasFilter = this.filter.exercise || this.filter.workout;

    // Nessun filtro → view mostra tutto → aggiorna sempre
    if (!hasFilter) return true;

    // Match exercise se specificato
    if (this.filter.exercise) {
      const filterNorm = normalizeExercise(this.filter.exercise);
      const evtNorm = normalizeExercise(exercise);

      if (this.filter.exactMatch) {
        if (evtNorm !== filterNorm) return false;
      } else {
        // Partial match: event include filter O filter include event
        if (
          !evtNorm.includes(filterNorm) &&
          !filterNorm.includes(evtNorm)
        ) {
          return false;
        }
      }
    }

    // Match workout se specificato
    if (this.filter.workout && workout) {
      const filterNorm = normalizeExercise(this.filter.workout);
      const evtNorm = normalizeExercise(workout);
      if (
        !evtNorm.includes(filterNorm) &&
        !filterNorm.includes(evtNorm)
      ) {
        return false;
      }
    }

    return true;
  }
}
