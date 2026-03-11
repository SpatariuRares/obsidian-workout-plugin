# Fase 4 — EventAwareRenderChild

## Obiettivo
Rimpiazzare `DataAwareRenderChild` con `EventAwareRenderChild` — type-safe, con filtraggio normalizzato, e con supporto per il contesto operazione (add/edit/delete).

Il miglioramento chiave: quando un esercizio viene **rinominato** (update da "Squat" a "Leg Press"), le view che mostrano "Squat" vengono aggiornate perché il sistema confronta ANCHE il nome precedente (`previous.exercise`).

## Prerequisiti
- Fase 1 (WorkoutEventBus)
- Fase 2 (repository emette eventi)

## Cosa cambia
| File | Tipo cambiamento |
|------|-----------------|
| `app/services/core/EventAwareRenderChild.ts` | NUOVO file |
| `app/services/core/CodeBlockProcessorService.ts` | Usa EventAwareRenderChild invece di DataAwareRenderChild |
| `app/services/core/DataAwareRenderChild.ts` | Deprecato (mantenuto per ora) |
| `app/services/core/__tests__/EventAwareRenderChild.test.ts` | NUOVO file di test |

---

## File 1: `app/services/core/EventAwareRenderChild.ts`

```typescript
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
      this.eventBus.on('log:added', (payload: LogAddedPayload) => {
        if (this.matchesContext(payload.context.exercise, payload.context.workout)) {
          void this.renderFn();
        }
      })
    );

    // log:updated — confronta ENTRAMBI old e new exercise
    // Necessario per il caso rename: view su "Squat" deve aggiornarsi
    // quando "Squat" diventa "Leg Press"
    this.register(
      this.eventBus.on('log:updated', (payload: LogUpdatedPayload) => {
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
      })
    );

    // log:deleted — confronta exercise nell'entry eliminata
    this.register(
      this.eventBus.on('log:deleted', (payload: LogDeletedPayload) => {
        if (this.matchesContext(payload.context.exercise, payload.context.workout)) {
          void this.renderFn();
        }
      })
    );

    // log:bulk-changed — sempre refresh (rename, import, ecc.)
    this.register(
      this.eventBus.on('log:bulk-changed', (_payload: LogBulkChangedPayload) => {
        void this.renderFn();
      })
    );

    // muscle-tags:changed — solo per view muscleTagsAware (es. dashboard)
    if (this.filter.muscleTagsAware) {
      this.register(
        this.eventBus.on('muscle-tags:changed', (_payload: MuscleTagsChangedPayload) => {
          void this.renderFn();
        })
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
  private matchesContext(exercise: string, workout?: string): boolean {
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
        if (!evtNorm.includes(filterNorm) && !filterNorm.includes(evtNorm)) {
          return false;
        }
      }
    }

    // Match workout se specificato
    if (this.filter.workout && workout) {
      const filterNorm = normalizeExercise(this.filter.workout);
      const evtNorm = normalizeExercise(workout);
      if (!evtNorm.includes(filterNorm) && !filterNorm.includes(evtNorm)) {
        return false;
      }
    }

    return true;
  }
}
```

---

## File 2: Aggiornamento `CodeBlockProcessorService`

Sostituire `DataAwareRenderChild` con `EventAwareRenderChild` nei 4 handler di code block.

### Import da aggiungere
```typescript
import { EventAwareRenderChild } from "@app/services/core/EventAwareRenderChild";
```

### Constructor — ricevere eventBus
```typescript
// PRIMA
constructor(
  private plugin: WorkoutChartsPlugin,
  private dataService: DataService,
  private embeddedChartView: EmbeddedChartView,
  private embeddedTableView: EmbeddedTableView,
  private embeddedDashboardView: EmbeddedDashboardView,
  private activeTimers: Map<string, EmbeddedTimerView>,
) {}

// DOPO
constructor(
  private plugin: WorkoutChartsPlugin,
  private dataService: DataService,
  private embeddedChartView: EmbeddedChartView,
  private embeddedTableView: EmbeddedTableView,
  private embeddedDashboardView: EmbeddedDashboardView,
  private activeTimers: Map<string, EmbeddedTimerView>,
  private eventBus?: WorkoutEventBus,  // nuovo
) {}
```

### `handleWorkoutChart()` — sostituire DataAwareRenderChild

```typescript
// PRIMA (righe 135-142)
ctx.addChild(
  new DataAwareRenderChild(el, this.plugin, params, () =>
    this.embeddedChartView.refreshChart(el, params as EmbeddedChartParams),
  ),
);

// DOPO
if (this.eventBus) {
  ctx.addChild(
    new EventAwareRenderChild(
      el,
      this.eventBus,
      {
        exercise: params.exercise as string | undefined,
        workout: params.workout as string | undefined,
        exactMatch: params.exactMatch as boolean | undefined,
        muscleTagsAware: false,
      },
      () => this.embeddedChartView.refreshChart(el, params as EmbeddedChartParams),
    ),
  );
} else {
  // Fallback: DataAwareRenderChild se eventBus non disponibile
  ctx.addChild(
    new DataAwareRenderChild(el, this.plugin, params, () =>
      this.embeddedChartView.refreshChart(el, params as EmbeddedChartParams),
    ),
  );
}
```

### `handleWorkoutLog()` — sostituire DataAwareRenderChild

```typescript
// PRIMA (righe 166-173)
ctx.addChild(
  new DataAwareRenderChild(el, this.plugin, params, () =>
    this.embeddedTableView.refreshTable(el, params as EmbeddedTableParams),
  ),
);

// DOPO
if (this.eventBus) {
  ctx.addChild(
    new EventAwareRenderChild(
      el,
      this.eventBus,
      {
        exercise: params.exercise as string | undefined,
        workout: params.workout as string | undefined,
        exactMatch: params.exactMatch as boolean | undefined,
        muscleTagsAware: false,
      },
      () => this.embeddedTableView.refreshTable(el, params as EmbeddedTableParams),
    ),
  );
} else {
  ctx.addChild(
    new DataAwareRenderChild(el, this.plugin, params, () =>
      this.embeddedTableView.refreshTable(el, params as EmbeddedTableParams),
    ),
  );
}
```

### `handleWorkoutDashboard()` — sostituire DataAwareRenderChild

```typescript
// PRIMA (righe 268-275)
ctx.addChild(
  new DataAwareRenderChild(el, this.plugin, {}, () =>
    this.embeddedDashboardView.refreshDashboard(el, params as EmbeddedDashboardParams),
  ),
);

// DOPO
if (this.eventBus) {
  ctx.addChild(
    new EventAwareRenderChild(
      el,
      this.eventBus,
      {
        // Nessun filtro esercizio/workout = sempre refresh
        muscleTagsAware: true,  // Dashboard mostra muscle heat map
      },
      () => this.embeddedDashboardView.refreshDashboard(el, params as EmbeddedDashboardParams),
    ),
  );
} else {
  ctx.addChild(
    new DataAwareRenderChild(el, this.plugin, {}, () =>
      this.embeddedDashboardView.refreshDashboard(el, params as EmbeddedDashboardParams),
    ),
  );
}
```

### `TimerRenderChild` — aggiornare per usare eventBus

```typescript
// TimerRenderChild — PRIMA
onload() {
  if (!this.exercise || !this.workout) return;

  this.registerEvent(
    this.plugin.app.workspace.on(
      "workout-planner:log-added",
      (evt: WorkoutDataChangedEvent) => { ... }
    ),
  );
}

// TimerRenderChild — DOPO
// Riceve eventBus nel constructor
constructor(
  containerEl: HTMLElement,
  private timerView: EmbeddedTimerView,
  private activeTimers: Map<string, EmbeddedTimerView>,
  private plugin: WorkoutChartsPlugin,
  private persistentId?: string,
  private exercise?: string,
  private workout?: string,
  private eventBus?: WorkoutEventBus,  // NUOVO
) {
  super(containerEl);
}

onload() {
  if (!this.exercise || !this.workout) return;

  if (this.eventBus) {
    // Usa eventBus — type-safe, solo su log:added (non edit/delete)
    const exerciseNorm = normalizeExercise(this.exercise);
    const workoutNorm = normalizeExercise(this.workout);

    this.register(
      this.eventBus.on('log:added', ({ context }) => {
        if (
          normalizeExercise(context.exercise) === exerciseNorm &&
          context.workout && normalizeExercise(context.workout) === workoutNorm &&
          !this.timerView.isTimerRunning()
        ) {
          this.timerView.reset();
          this.timerView.start();
        }
      })
    );
  } else {
    // Fallback: workspace event (backward compat)
    const exerciseLower = this.exercise.toLowerCase();
    const workoutLower = this.workout.toLowerCase();

    this.registerEvent(
      this.plugin.app.workspace.on(
        "workout-planner:log-added",
        (evt: WorkoutDataChangedEvent) => {
          if (
            evt.exercise?.toLowerCase() === exerciseLower &&
            evt.workout?.toLowerCase() === workoutLower &&
            !this.timerView.isTimerRunning()
          ) {
            this.timerView.reset();
            this.timerView.start();
          }
        },
      ),
    );
  }
}
```

---

## Modificare `main.ts` — passare eventBus a CodeBlockProcessorService

```typescript
// PRIMA (riga 103-110)
this.codeBlockProcessorService = new CodeBlockProcessorService(
  this,
  this.dataService,
  this.embeddedChartView,
  this.embeddedTableView,
  this.embeddedDashboardView,
  this.activeTimers,
);

// DOPO
this.codeBlockProcessorService = new CodeBlockProcessorService(
  this,
  this.dataService,
  this.embeddedChartView,
  this.embeddedTableView,
  this.embeddedDashboardView,
  this.activeTimers,
  this.eventBus,  // NUOVO
);
```

---

## File 3: `app/services/core/__tests__/EventAwareRenderChild.test.ts`

```typescript
import { EventAwareRenderChild, type ViewFilter } from "@app/services/core/EventAwareRenderChild";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

// Mock MarkdownRenderChild
jest.mock("obsidian", () => ({
  MarkdownRenderChild: class {
    containerEl: HTMLElement;
    constructor(el: HTMLElement) { this.containerEl = el; }
    register(fn: () => void) { this._cleanups.push(fn); }
    _cleanups: Array<() => void> = [];
    onunload() { this._cleanups.forEach(fn => fn()); }
  },
}));

function makeEntry(exercise: string, workout = "Test"): WorkoutLogData {
  return { exercise, workout, date: "2025-01-01", reps: 10, weight: 50 } as WorkoutLogData;
}

describe("EventAwareRenderChild", () => {
  let bus: WorkoutEventBus;
  let el: HTMLElement;
  let renderFn: jest.Mock;

  beforeEach(() => {
    bus = new WorkoutEventBus();
    el = document.createElement("div");
    renderFn = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    bus.destroy();
  });

  function makeChild(filter: ViewFilter): EventAwareRenderChild {
    const child = new EventAwareRenderChild(el, bus, filter, renderFn);
    child.onload();
    return child;
  }

  // ---- log:added ----

  describe("log:added", () => {
    it("should refresh when no filter (global view)", () => {
      makeChild({});
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } } });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should refresh when exercise matches (normalized)", () => {
      makeChild({ exercise: "squat" });
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } } });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when exercise does not match", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } } });
      expect(renderFn).not.toHaveBeenCalled();
    });

    it("should handle trailing spaces in exercise name", () => {
      makeChild({ exercise: "Squat " });  // spazio finale
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } } });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should use partial match by default", () => {
      makeChild({ exercise: "squat" });
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat Paused"), context: { exercise: "Squat Paused" } } });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should use exact match when exactMatch=true", () => {
      makeChild({ exercise: "Squat", exactMatch: true });
      bus.emit({ type: 'log:added', payload: { entry: makeEntry("Squat Paused"), context: { exercise: "Squat Paused" } } });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:updated (caso rename) ----

  describe("log:updated", () => {
    it("should refresh when previous exercise matches (rename case)", () => {
      makeChild({ exercise: "Squat" });
      bus.emit({
        type: 'log:updated',
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),  // rinominato
        },
      });
      // La view su "Squat" deve aggiornarsi perché l'entry "Squat" è cambiata
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should refresh when updated exercise matches", () => {
      makeChild({ exercise: "Leg Press" });
      bus.emit({
        type: 'log:updated',
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),
        },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when neither old nor new exercise matches", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({
        type: 'log:updated',
        payload: {
          previous: makeEntry("Squat"),
          updated: makeEntry("Leg Press"),
        },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:deleted ----

  describe("log:deleted", () => {
    it("should refresh when deleted exercise matches", () => {
      makeChild({ exercise: "Squat" });
      bus.emit({
        type: 'log:deleted',
        payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } },
      });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh when deleted exercise does not match", () => {
      makeChild({ exercise: "Bench Press" });
      bus.emit({
        type: 'log:deleted',
        payload: { entry: makeEntry("Squat"), context: { exercise: "Squat" } },
      });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });

  // ---- log:bulk-changed ----

  describe("log:bulk-changed", () => {
    it("should always refresh on bulk-changed regardless of filter", () => {
      makeChild({ exercise: "Squat", exactMatch: true });
      bus.emit({ type: 'log:bulk-changed', payload: { count: 10, operation: 'import' } });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });
  });

  // ---- muscle-tags:changed ----

  describe("muscle-tags:changed", () => {
    it("should refresh if muscleTagsAware=true", () => {
      makeChild({ muscleTagsAware: true });
      bus.emit({ type: 'muscle-tags:changed', payload: {} });
      expect(renderFn).toHaveBeenCalledTimes(1);
    });

    it("should NOT refresh if muscleTagsAware=false or undefined", () => {
      makeChild({ muscleTagsAware: false });
      bus.emit({ type: 'muscle-tags:changed', payload: {} });
      expect(renderFn).not.toHaveBeenCalled();
    });
  });
});
```

---

## Checklist Fase 4

- [x] Creare `app/services/core/EventAwareRenderChild.ts`
- [x] Creare `app/services/core/__tests__/EventAwareRenderChild.test.ts` (14 test)
- [x] Aggiornare `CodeBlockProcessorService` — aggiungere `eventBus?` al constructor
- [x] Aggiornare `handleWorkoutChart()` — usa EventAwareRenderChild se eventBus disponibile
- [x] Aggiornare `handleWorkoutLog()` — usa EventAwareRenderChild se eventBus disponibile
- [x] Aggiornare `handleWorkoutDashboard()` — usa EventAwareRenderChild + `muscleTagsAware: true`
- [x] Aggiornare `TimerRenderChild` — usa eventBus per `log:added` se disponibile
- [x] Aggiornare `main.ts` — passare `this.eventBus` a `CodeBlockProcessorService`
- [x] `npm test` — 75 suite, 1214 passed, 4 skipped
- [x] `npm run build` — nessun errore TypeScript

## Rischi Fase 4
**Medio** — la logica di filtering cambia. Il fallback su `DataAwareRenderChild` garantisce backward compat se `eventBus` non è disponibile. Testare manualmente che le view si aggiornino correttamente dopo edit/delete/rename.
