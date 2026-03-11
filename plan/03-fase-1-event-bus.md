# Fase 1 — WorkoutEventBus

## Obiettivo
Creare il bus eventi interno type-safe, senza toccare nulla del codice esistente.
Questa fase è **zero-risk** — non rompe niente, non cambia nessun comportamento.

## Prerequisiti
Nessuno. Questa fase è completamente indipendente.

## Deliverable
- `app/services/events/WorkoutEventTypes.ts`
- `app/services/events/WorkoutEventBus.ts`
- `app/services/events/__tests__/WorkoutEventBus.test.ts`

---

## File 1: `app/services/events/WorkoutEventTypes.ts`

```typescript
import type { WorkoutLogData, WorkoutChartsSettings } from "@app/types/WorkoutLogData";

// ---- Normalizzazione ----

/**
 * Normalizza un nome esercizio per confronti case-insensitive e whitespace-agnostic.
 * "Squat " → "squat"
 * "bench  press" → "bench press"
 */
export function normalizeExercise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ---- Context e Payload ----

export interface LogEventContext {
  exercise: string;
  workout?: string;
}

export interface LogAddedPayload {
  entry: WorkoutLogData;
  context: LogEventContext;
}

export interface LogUpdatedPayload {
  previous: WorkoutLogData;
  updated: WorkoutLogData;
}

export interface LogDeletedPayload {
  entry: WorkoutLogData;
  context: LogEventContext;
}

export interface LogBulkChangedPayload {
  count: number;
  operation: 'import' | 'rename' | 'bulk-delete' | 'other';
}

export interface MuscleTagsChangedPayload {
  // Intenzionalmente vuoto: il cambio è sempre globale
}

export interface SettingsChangedPayload {
  key: keyof WorkoutChartsSettings;
  previousValue: unknown;
  newValue: unknown;
}

export interface PluginErrorPayload {
  source: string;
  error: Error;
  recoverable: boolean;
}

// ---- Discriminated Union ----

export type WorkoutEvent =
  | { type: 'log:added';           payload: LogAddedPayload }
  | { type: 'log:updated';         payload: LogUpdatedPayload }
  | { type: 'log:deleted';         payload: LogDeletedPayload }
  | { type: 'log:bulk-changed';    payload: LogBulkChangedPayload }
  | { type: 'muscle-tags:changed'; payload: MuscleTagsChangedPayload }
  | { type: 'settings:changed';    payload: SettingsChangedPayload }
  | { type: 'plugin:error';        payload: PluginErrorPayload }

export type WorkoutEventType = WorkoutEvent['type'];

/** Estrae il payload di un tipo specifico (utile nei test) */
export type WorkoutEventPayload<T extends WorkoutEventType> =
  Extract<WorkoutEvent, { type: T }>['payload'];
```

---

## File 2: `app/services/events/WorkoutEventBus.ts`

```typescript
import type {
  WorkoutEvent,
  WorkoutEventType,
  WorkoutEventPayload,
  LogBulkChangedPayload,
} from "@app/services/events/WorkoutEventTypes";

type Handler<T> = (payload: T) => void;

export class WorkoutEventBus {
  private listeners = new Map<WorkoutEventType, Set<Handler<unknown>>>();

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
    operation: LogBulkChangedPayload['operation'],
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
        if (event.type !== 'plugin:error') {
          const errPayload = {
            source: `EventBus.dispatch(${event.type})`,
            error: error instanceof Error ? error : new Error(String(error)),
            recoverable: true,
          };
          this.dispatch({ type: 'plugin:error', payload: errPayload });
        }
      }
    }
  }

  private flushBatch(operation: LogBulkChangedPayload['operation']): void {
    const logEvents = this.batchQueue.filter(e =>
      e.type === 'log:added' ||
      e.type === 'log:updated' ||
      e.type === 'log:deleted'
    );
    const otherEvents = this.batchQueue.filter(e =>
      e.type !== 'log:added' &&
      e.type !== 'log:updated' &&
      e.type !== 'log:deleted'
    );

    // Emetti altri eventi normalmente (muscle-tags:changed, settings:changed)
    for (const event of otherEvents) {
      this.dispatch(event);
    }

    // Coalesce tutti gli eventi log:* in un unico bulk-changed
    if (logEvents.length > 0) {
      this.dispatch({
        type: 'log:bulk-changed',
        payload: { count: logEvents.length, operation },
      });
    }

    this.batchQueue = [];
  }
}
```

---

## File 3: `app/services/events/__tests__/WorkoutEventBus.test.ts`

```typescript
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
    ["bench  press", "bench press"],  // spazi multipli
  ])("normalizeExercise(%s) === %s", (input, expected) => {
    const { normalizeExercise } = require("@app/services/events/WorkoutEventTypes");
    expect(normalizeExercise(input)).toBe(expected);
  });
});
```

---

## Integrazione in main.ts (Fase 1 — solo inizializzazione)

Aggiungere `eventBus` come proprietà del plugin, inizializzarlo in `onload`, distruggerlo in `onunload`.
**Nessun altro cambiamento** — il bus esiste ma non viene ancora usato da nessuno.

```typescript
// main.ts — aggiunte per Fase 1
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

export default class WorkoutChartsPlugin extends Plugin {
  // ... proprietà esistenti ...
  public eventBus!: WorkoutEventBus;  // nuovo

  async onload() {
    // ... codice esistente ...

    // Fase 1: inizializza event bus (non ancora usato)
    this.eventBus = new WorkoutEventBus();

    // Registra error handler centrale
    this.eventBus.on('plugin:error', ({ source, error, recoverable }) => {
      console.error(`[workout-plugin:${source}]`, error);
      if (!recoverable) {
        new Notice(`Workout Plugin [${source}]: ${error.message}`);
      }
    });
  }

  onunload() {
    // ... cleanup esistente ...
    this.eventBus?.destroy();  // nuovo — PRIMA di tutto il resto
  }
}
```

---

## Checklist Fase 1

- [x] Creare `app/services/events/WorkoutEventTypes.ts`
- [x] Creare `app/services/events/WorkoutEventBus.ts`
- [x] Creare `app/services/events/__tests__/WorkoutEventBus.test.ts`
- [x] Aggiungere `eventBus` a `main.ts` (init + destroy)
- [x] Eseguire `npm test` — tutti i test esistenti devono passare
- [x] Eseguire `npm run build` — nessun errore TypeScript
- [x] Verificare che la coverage del nuovo file sia ≥ 90% (risultato: Stmts 100% | Branch 91.66% | Funcs 100% | Lines 100%)

## Rischi Fase 1
**Nessuno** — nessun codice esistente viene modificato. Il bus è inerte finché non viene usato.
