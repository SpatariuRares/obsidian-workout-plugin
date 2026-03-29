import type {
  WorkoutEvent,
  WorkoutEventType,
  WorkoutEventPayload,
  LogBulkChangedPayload,
} from "@app/services/events/WorkoutEventTypes";

type Handler<T> = (payload: T) => void;

export class WorkoutEventBus {
  private listeners = new Map<
    WorkoutEventType,
    Set<Handler<unknown>>
  >();

  // ---- Batching state ----
  private batchActive = false;
  private batchQueue: WorkoutEvent[] = [];

  // ---- Subscribe ----

  /**
   * Sottoscrive a un tipo di evento.
   * @returns funzione di cleanup da chiamare in onunload
   */
  on<T extends WorkoutEventType>(
    type: T,
    handler: Handler<WorkoutEventPayload<T>>,
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler as Handler<unknown>);

    return () => {
      this.listeners.get(type)?.delete(handler as Handler<unknown>);
    };
  }

  // ---- Emit ----

  /**
   * Emette un evento.
   * Se siamo in modalità batch, accoda l'evento senza dispatch immediato.
   */
  emit<T extends WorkoutEvent>(event: T): void {
    if (this.batchActive) {
      this.batchQueue.push(event);
      return;
    }
    this.dispatch(event);
  }

  // ---- Batch ----

  /**
   * Raggruppa più mutazioni in un unico evento coalesced.
   *
   * Regole di coalescing:
   * - Tutti gli eventi log:* accumulati → 1 solo log:bulk-changed con count
   * - muscle-tags:changed → emesso normalmente (non coalesced con log:*)
   * - plugin:error → emesso immediatamente, mai accodato
   * - settings:changed → emesso normalmente
   *
   * @example
   * await eventBus.batch('import', async () => {
   *   for (const entry of entries) await repo.add(entry);
   * });
   * // Emette: log:bulk-changed { count: N, operation: 'import' }
   */
  async batch(
    operation: LogBulkChangedPayload["operation"],
    fn: () => Promise<void>,
  ): Promise<void> {
    this.batchActive = true;
    this.batchQueue = [];

    try {
      await fn();
    } finally {
      this.batchActive = false;
      this.flushBatch(operation);
    }
  }

  // ---- Cleanup ----

  /**
   * Rimuove tutti i listener e annulla eventuali batch attivi.
   * Da chiamare in plugin.onunload().
   */
  destroy(): void {
    this.listeners.clear();
    this.batchQueue = [];
    this.batchActive = false;
  }

  // ---- Private ----

  private dispatch(event: WorkoutEvent): void {
    const handlers = this.listeners.get(event.type);
    if (!handlers || handlers.size === 0) return;

    // Copia il set per evitare problemi se un handler si de-registra durante l'iterazione
    for (const handler of [...handlers]) {
      try {
        handler(event.payload);
      } catch (error) {
        // Gli errori nei handler non devono bloccare gli altri handler
        // Emettiamo un plugin:error se non siamo già in un handler di errore
        if (event.type !== "plugin:error") {
          const errPayload = {
            source: `EventBus.dispatch(${event.type})`,
            error:
              error instanceof Error
                ? error
                : new Error(String(error)),
            recoverable: true,
          };
          this.dispatch({
            type: "plugin:error",
            payload: errPayload,
          });
        }
      }
    }
  }

  private flushBatch(
    operation: LogBulkChangedPayload["operation"],
  ): void {
    const logEvents = this.batchQueue.filter(
      (e) =>
        e.type === "log:added" ||
        e.type === "log:updated" ||
        e.type === "log:deleted",
    );
    const otherEvents = this.batchQueue.filter(
      (e) =>
        e.type !== "log:added" &&
        e.type !== "log:updated" &&
        e.type !== "log:deleted",
    );

    // Emetti altri eventi normalmente (muscle-tags:changed, settings:changed)
    for (const event of otherEvents) {
      this.dispatch(event);
    }

    // Coalesce tutti gli eventi log:* in un unico bulk-changed
    if (logEvents.length > 0) {
      this.dispatch({
        type: "log:bulk-changed",
        payload: { count: logEvents.length, operation },
      });
    }

    this.batchQueue = [];
  }
}
