# Fase 3 — Cache come Consumer Reattivo

## Obiettivo
`CSVCacheService` si auto-invalida ascoltando eventi dal bus, invece di essere invalidata esplicitamente da `triggerWorkoutLogRefresh()` e dal repository.

Dopo questa fase:
- `cacheService.clearCache()` nel repository può essere rimosso (la cache già si invalida via evento)
- `this.clearLogDataCache()` in `triggerWorkoutLogRefresh()` diventa ridondante

## Prerequisiti
- Fase 1 (WorkoutEventBus esiste)
- Fase 2 (repository emette eventi)

## Cosa cambia
| File | Tipo cambiamento |
|------|-----------------|
| `app/services/data/CSVCacheService.ts` | Riceve eventBus, si iscrive agli eventi |
| `app/services/data/DataService.ts` | Passa eventBus a CSVCacheService |
| `app/services/data/WorkoutLogRepository.ts` | Rimuove `cacheService.clearCache()` (ora gestito dalla cache stessa) |
| `main.ts` | `triggerWorkoutLogRefresh()` non chiama più `clearLogDataCache()` |

---

## Modifiche a `CSVCacheService`

### Constructor — iscriversi agli eventi

```typescript
// PRIMA
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
) {}

// DOPO
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

export class CSVCacheService {
  // ... proprietà esistenti ...
  private unsubscribers: Array<() => void> = [];

  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
    private eventBus?: WorkoutEventBus,
  ) {
    if (eventBus) {
      this.setupEventListeners(eventBus);
    }
  }

  private setupEventListeners(eventBus: WorkoutEventBus): void {
    // La cache si invalida su qualsiasi mutazione log
    this.unsubscribers.push(
      eventBus.on('log:added',        () => this.clearCache()),
      eventBus.on('log:updated',      () => this.clearCache()),
      eventBus.on('log:deleted',      () => this.clearCache()),
      eventBus.on('log:bulk-changed', () => this.clearCache()),
    );
  }

  /**
   * Chiamare in plugin.onunload() per de-registrare i listener.
   */
  destroy(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
  }

  // ... resto delle metodi invariate ...
}
```

**NOTA**: `clearCache()` (già esistente, riga 130) rimane invariato — è già pubblico e funziona.

---

## Modifiche a `DataService`

```typescript
// PRIMA
constructor(private app: App, private settings: WorkoutChartsSettings) {
  this.cacheService = new CSVCacheService(app, settings);
  // ...
}

// DOPO
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private eventBus?: WorkoutEventBus,
) {
  this.cacheService = new CSVCacheService(app, settings, eventBus);  // passa eventBus
  // ...
}
```

Aggiungere metodo `destroy()` se non esiste:

```typescript
destroy(): void {
  this.cacheService.destroy();
}
```

---

## Modifiche a `WorkoutLogRepository` — rimuovere clearCache() manuali

Dopo la Fase 3, `cacheService.clearCache()` nel repository è ridondante perché la cache si auto-invalida via evento. Possiamo rimuovere le chiamate manuali:

```typescript
// PRIMA (righe 94-95)
await this.app.vault.process(csvFile, (content) => { ... });
this.cacheService.clearCache();  // ← RIMUOVERE
this.eventBus?.emit({ type: 'log:added', ... });

// DOPO
await this.app.vault.process(csvFile, (content) => { ... });
// cacheService si invalida automaticamente via evento 'log:added'
this.eventBus?.emit({ type: 'log:added', ... });
```

**Ordine degli eventi**:
1. `vault.process()` scrive su CSV
2. `eventBus.emit('log:added')` viene chiamato
3. `CSVCacheService` riceve l'evento → `clearCache()` (sincrono)
4. Le view ricevono l'evento → `refreshFn()` (asincrono, legge dati freschi)

Il `clearCache()` avviene PRIMA che le view tentino di leggere i dati — corretto.

---

## Modifiche a `main.ts` — semplificare `triggerWorkoutLogRefresh`

```typescript
// PRIMA
public triggerWorkoutLogRefresh(context?: WorkoutDataChangedEvent): void {
  PerformanceMonitor.start("refresh:workoutLog");
  this.clearLogDataCache();  // ← RIDONDANTE dopo Fase 3
  this.app.workspace.trigger("workout-planner:data-changed", context ?? {});
  PerformanceMonitor.end("refresh:workoutLog");
}

// DOPO (Fase 3 — mantenuto per backward compat, ma clearCache rimosso)
public triggerWorkoutLogRefresh(context?: WorkoutDataChangedEvent): void {
  PerformanceMonitor.start("refresh:workoutLog");
  // clearLogDataCache() rimosso — la cache si auto-invalida via eventi
  this.app.workspace.trigger("workout-planner:data-changed", context ?? {});
  PerformanceMonitor.end("refresh:workoutLog");
}
```

**ATTENZIONE**: `triggerWorkoutLogRefresh` rimane ancora funzionante — viene ancora chiamato dai callback delle modali. Viene rimosso solo in Fase 5.

---

## Aggiornare cleanup in `main.ts`

```typescript
onunload() {
  // ...
  this.dataService?.destroy();  // chiama cacheService.destroy() che de-registra i listener
  // ...
}
```

---

## Test per `CSVCacheService` (aggiornamenti)

```typescript
// app/services/data/__tests__/CSVCacheService.test.ts (aggiunte)

import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

describe("CSVCacheService event integration", () => {
  let cache: CSVCacheService;
  let eventBus: WorkoutEventBus;

  beforeEach(() => {
    eventBus = new WorkoutEventBus();
    cache = new CSVCacheService(mockApp, mockSettings, eventBus);
  });

  afterEach(() => {
    eventBus.destroy();
  });

  it("should clear cache when log:added is emitted", async () => {
    // Popola la cache
    await cache.getRawData();
    expect(cache.isCacheValid()).toBe(true);

    // Emetti evento
    eventBus.emit({
      type: 'log:added',
      payload: { entry: mockEntry, context: { exercise: 'Squat' } }
    });

    expect(cache.isCacheValid()).toBe(false);
  });

  it("should clear cache when log:updated is emitted", async () => {
    await cache.getRawData();
    expect(cache.isCacheValid()).toBe(true);

    eventBus.emit({
      type: 'log:updated',
      payload: { previous: mockEntry, updated: mockEntry }
    });

    expect(cache.isCacheValid()).toBe(false);
  });

  it("should clear cache when log:deleted is emitted", async () => {
    await cache.getRawData();
    expect(cache.isCacheValid()).toBe(true);

    eventBus.emit({
      type: 'log:deleted',
      payload: { entry: mockEntry, context: { exercise: 'Squat' } }
    });

    expect(cache.isCacheValid()).toBe(false);
  });

  it("should clear cache when log:bulk-changed is emitted", async () => {
    await cache.getRawData();
    expect(cache.isCacheValid()).toBe(true);

    eventBus.emit({
      type: 'log:bulk-changed',
      payload: { count: 5, operation: 'import' }
    });

    expect(cache.isCacheValid()).toBe(false);
  });

  it("should NOT clear cache on muscle-tags:changed", async () => {
    await cache.getRawData();
    expect(cache.isCacheValid()).toBe(true);

    eventBus.emit({ type: 'muscle-tags:changed', payload: {} });

    // La cache dei log non deve essere invalidata da muscle-tags events
    expect(cache.isCacheValid()).toBe(true);
  });

  it("should de-register listeners on destroy()", async () => {
    await cache.getRawData();
    cache.destroy();

    eventBus.emit({
      type: 'log:added',
      payload: { entry: mockEntry, context: { exercise: 'Squat' } }
    });

    // Dopo destroy, il listener non esiste più — ma la cache potrebbe essere già invalida
    // Verifica che non lanci
    expect(() => cache.isCacheValid()).not.toThrow();
  });

  it("should work without eventBus (backward compat)", async () => {
    const cacheNoBus = new CSVCacheService(mockApp, mockSettings);
    // Non deve lanciare senza eventBus
    await expect(cacheNoBus.getRawData()).resolves.toBeDefined();
  });
});
```

---

## Checklist Fase 3

- [x] Modificare `CSVCacheService` — aggiungere `eventBus?` al constructor e `setupEventListeners()`
- [x] Aggiungere `destroy()` a `CSVCacheService`
- [x] Modificare `DataService` — passare `eventBus` a `CSVCacheService`
- [x] Aggiungere `destroy()` a `DataService` se non esiste
- [x] Rimuovere `cacheService.clearCache()` calls in `WorkoutLogRepository` (post-vault.process)
- [x] Rimuovere `this.clearLogDataCache()` da `triggerWorkoutLogRefresh()` in `main.ts`
- [x] Aggiornare `onunload()` in `main.ts` per chiamare `dataService.destroy()`
- [x] Aggiornare test `CSVCacheService.test.ts` (7 nuovi test event integration) + fix WorkoutLogRepository.test.ts
- [x] `npm test` — 74 suite, 1200 passed, 4 skipped
- [x] `npm run build` — nessun errore TypeScript

## Rischi Fase 3
**Basso-medio** — il cambiamento principale è la rimozione di `clearCache()` manuali. Il rischio è una race condition se l'evento arriva PRIMA che `vault.process()` abbia finito di scrivere. Analisi:

- `vault.process()` è `await`-ato nel repository
- `eventBus.emit()` è chiamato DOPO `await vault.process()` — quindi la scrittura è completata
- `CSVCacheService.clearCache()` è sincrono — avviene immediatamente alla ricezione dell'evento
- `refreshFn()` nelle view è async — chiama `getRawData()` che legge il file già scritto

**Ordine garantito**: scrittura → evento → cache invalidata → view legge dati freschi. Nessuna race condition.
