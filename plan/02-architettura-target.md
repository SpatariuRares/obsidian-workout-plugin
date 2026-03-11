# Architettura Target — Event-Driven Design

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER ACTION                              │
│              (modal submit, table edit/delete)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WorkoutLogRepository                          │
│   add() / update() / delete() / renameExercise() / bulk()       │
│                                                                 │
│   1. Scrive su CSV (vault.process)                              │
│   2. Emette evento al WorkoutEventBus                           │
│      └── NON chiama più cacheService.clearCache() direttamente  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ emette WorkoutEvent
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     WorkoutEventBus                             │
│                                                                 │
│   - Type-safe: WorkoutEvent discriminated union                 │
│   - Batching: batch(fn) → 1 evento coalesced                    │
│   - Listeners: Map<type, Set<handler>>                          │
│   - unsubscribe via returned function                           │
└──────┬─────────────────┬─────────────────┬───────────────────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐
│CSVCacheService│  │EventAware    │  │ ObsidianEventBridge       │
│              │  │RenderChild   │  │ (optional backward compat) │
│ ascolta:     │  │              │  │                            │
│ log:*        │  │ ascolta:     │  │ workspace.trigger()        │
│ → clearCache │  │ log:added    │  │ per plugin terzi           │
│              │  │ log:updated  │  └──────────────────────────┘
└──────────────┘  │ log:deleted  │
                  │ log:bulk     │
                  │ muscle-tags: │
                  │ changed      │
                  │              │
                  │ filtraggio   │
                  │ type-safe +  │
                  │ normalizzato │
                  └──────┬───────┘
                         │ renderFn()
                         ▼
                  ┌─────────────┐
                  │  View       │
                  │ (chart,     │
                  │  table,     │
                  │  dashboard) │
                  └─────────────┘
```

---

## WorkoutEventTypes — Tipi Discriminati

```typescript
// app/services/events/WorkoutEventTypes.ts

/** Normalizza exercise name per confronti */
export function normalizeExercise(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// ---- Payload types ----

export interface LogEventContext {
  exercise: string;
  workout?: string;
}

export interface LogAddedPayload {
  entry: WorkoutLogEntry;
  context: LogEventContext;
}

export interface LogUpdatedPayload {
  previous: WorkoutLogEntry;  // entry PRIMA della modifica
  updated: WorkoutLogEntry;   // entry DOPO la modifica
}

export interface LogDeletedPayload {
  entry: WorkoutLogEntry;
  context: LogEventContext;
}

export interface LogBulkChangedPayload {
  count: number;             // quante righe sono cambiate
  operation: 'import' | 'rename' | 'bulk-delete';
}

export interface MuscleTagsChangedPayload {
  // vuoto — il cambio è sempre globale
}

export interface SettingsChangedPayload {
  key: keyof WorkoutChartsSettings;
  previousValue: unknown;
  newValue: unknown;
}

export interface PluginErrorPayload {
  source: string;            // es. "ChartRenderer", "CSVCacheService"
  error: Error;
  recoverable: boolean;
}

// ---- Discriminated Union ----

export type WorkoutEvent =
  | { type: 'log:added';        payload: LogAddedPayload }
  | { type: 'log:updated';      payload: LogUpdatedPayload }
  | { type: 'log:deleted';      payload: LogDeletedPayload }
  | { type: 'log:bulk-changed'; payload: LogBulkChangedPayload }
  | { type: 'muscle-tags:changed'; payload: MuscleTagsChangedPayload }
  | { type: 'settings:changed'; payload: SettingsChangedPayload }
  | { type: 'plugin:error';     payload: PluginErrorPayload }

export type WorkoutEventType = WorkoutEvent['type'];

// Helper per estrarre il payload di un tipo specifico
export type WorkoutEventPayload<T extends WorkoutEventType> =
  Extract<WorkoutEvent, { type: T }>['payload'];
```

---

## WorkoutEventBus — API

```typescript
// app/services/events/WorkoutEventBus.ts

export class WorkoutEventBus {
  /**
   * Emette un evento. Se siamo in modalità batch, accoda l'evento.
   */
  emit<T extends WorkoutEvent>(event: T): void

  /**
   * Sottoscrive a un tipo di evento.
   * Ritorna una funzione per de-sottoscriversi (usare in onunload).
   */
  on<T extends WorkoutEventType>(
    type: T,
    handler: (payload: WorkoutEventPayload<T>) => void
  ): () => void

  /**
   * Raggruppa più emit in un unico evento coalesced.
   * Utile per import bulk, rename, ecc.
   *
   * Strategia di coalescing:
   * - N eventi log:added/updated/deleted → 1 log:bulk-changed con count
   * - muscle-tags:changed viene emesso normalmente (non coalesced)
   * - plugin:error viene emesso normalmente (non coalesced)
   */
  async batch(
    operation: 'import' | 'rename' | 'bulk-delete',
    fn: () => Promise<void>
  ): Promise<void>

  /**
   * Rimuove tutti i listener. Chiamare in plugin.onunload().
   */
  destroy(): void
}
```

---

## Flusso Dati — Confronto

### ATTUALE: Add log

```
CreateLogModal.handleSubmit()
  → plugin.addWorkoutLogEntry(entry)
    → DataService.addWorkoutLogEntry(entry)
      → WorkoutLogRepository.addWorkoutLogEntry(entry)
        → vault.process() [scrittura CSV]
        → cacheService.clearCache()          ← 1° clear
  → onLogCreated callback(context)           ← DEVE essere passato, o niente refresh!
    → plugin.triggerWorkoutLogRefresh(ctx)
      → clearLogDataCache()                  ← 2° clear (ridondante)
      → workspace.trigger("data-changed")
        → DataAwareRenderChild.shouldRefresh()
          → string matching (fragile)
          → refreshFn()
```

### TARGET: Add log

```
CreateLogModal.handleSubmit()
  → plugin.addWorkoutLogEntry(entry)
    → DataService.addWorkoutLogEntry(entry)
      → WorkoutLogRepository.addWorkoutLogEntry(entry)
        → vault.process() [scrittura CSV]
        → eventBus.emit({ type: 'log:added', payload: { entry, context } })
          ↓ (sincrono, tutti i listener ricevono l'evento)
          ├── CSVCacheService: clearCache()  ← 1 solo clear, nel posto giusto
          └── EventAwareRenderChild(s):
                matches(entry.exercise)?
                  → refreshFn()             ← type-safe, normalizzato
  // Nessun callback necessario nella modal!
  // Il modal chiude e basta.
```

### ATTUALE: Muscle tags change

```
MuscleTagManagerModal.onSave()
  → plugin.triggerMuscleTagRefresh()
    → muscleTagService.clearCache()
    → workspace.trigger("muscle-tags-changed")      ← event A
    → plugin.triggerWorkoutLogRefresh()             ← cascade
      → clearLogDataCache()
      → workspace.trigger("data-changed", {})       ← event B (globale)
        → TUTTI i DataAwareRenderChild si aggiornano
```

### TARGET: Muscle tags change

```
MuscleTagManagerModal.onSave()
  → muscleTagService.save(tags)
    → eventBus.emit({ type: 'muscle-tags:changed', payload: {} })
      ├── MuscleTagService: clearCache()   ← reattivo
      └── EventAwareRenderChild(s) con interesse muscle-tags:
            → refreshFn()                 ← solo chi serve
```

---

## Gestione Errori

```typescript
// Qualsiasi servizio può emettere errori
try {
  await embeddedChartView.refreshChart(el, params);
} catch (error) {
  eventBus.emit({
    type: 'plugin:error',
    payload: {
      source: 'EmbeddedChartView',
      error: error instanceof Error ? error : new Error(String(error)),
      recoverable: true,
    }
  });
}

// Handler centrale in main.ts (registrato una volta)
eventBus.on('plugin:error', ({ source, error, recoverable }) => {
  console.error(`[workout-plugin:${source}]`, error);
  if (!recoverable) {
    new Notice(`Workout Plugin error in ${source}: ${error.message}`);
  }
});
```

---

## Compatibilità Backward — ObsidianEventBridge

Per non rompere plugin di terze parti che potrebbero ascoltare gli eventi workspace:

```typescript
// app/services/events/ObsidianEventBridge.ts
// Opzionale — attivato solo se necessario

export class ObsidianEventBridge {
  constructor(
    private eventBus: WorkoutEventBus,
    private workspace: Workspace
  ) {
    // Traduce eventi interni → eventi workspace (backward compat)
    eventBus.on('log:added', ({ context }) =>
      workspace.trigger('workout-planner:data-changed', context)
    );
    eventBus.on('log:updated', ({ updated }) =>
      workspace.trigger('workout-planner:data-changed', {
        exercise: updated.exercise,
        workout: updated.workout,
      })
    );
    eventBus.on('log:deleted', ({ context }) =>
      workspace.trigger('workout-planner:data-changed', context)
    );
    eventBus.on('log:bulk-changed', () =>
      workspace.trigger('workout-planner:data-changed', {})
    );
    eventBus.on('muscle-tags:changed', () =>
      workspace.trigger('workout-planner:muscle-tags-changed', {})
    );
  }
}
```

Questo bridge mantiene la compatibilità con il codice esistente (es. DataAwareRenderChild vecchi, plugin terzi) durante la migrazione.

---

## Struttura File Finale

```
app/services/events/
├── WorkoutEventTypes.ts          # Tipi discriminati + normalizeExercise()
├── WorkoutEventBus.ts            # Il bus centrale
├── ObsidianEventBridge.ts        # Bridge per backward compat (opzionale)
└── __tests__/
    └── WorkoutEventBus.test.ts   # Test del bus

app/services/core/
├── EventAwareRenderChild.ts      # Nuovo — rimpiazza DataAwareRenderChild
├── DataAwareRenderChild.ts       # Mantenuto durante migrazione, poi rimosso
├── CodeBlockProcessorService.ts  # Aggiornato per usare EventAwareRenderChild
└── __tests__/
    └── EventAwareRenderChild.test.ts

app/types/
└── WorkoutEvents.ts              # Deprecato ma mantenuto per backward compat
                                  # (solo le augmentazioni workspace)
```
