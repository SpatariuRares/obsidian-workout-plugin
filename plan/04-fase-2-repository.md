# Fase 2 — Repository come Producer di Eventi

## Obiettivo
Fare in modo che `WorkoutLogRepository` emetta eventi sul bus **dopo ogni scrittura CSV**.
La cache viene ancora invalidata nel repository (come già accade), ma ora l'evento viene propagato al bus invece di dover essere triggerato manualmente dall'esterno.

## Prerequisiti
- Fase 1 completata (`WorkoutEventBus` e `WorkoutEventTypes` esistono)
- `main.ts` ha `this.eventBus` inizializzato

## Cosa cambia
| File | Tipo cambiamento |
|------|-----------------|
| `app/services/data/WorkoutLogRepository.ts` | Riceve `eventBus` nel constructor, emette eventi |
| `app/services/data/DataService.ts` | Passa `eventBus` al repository |
| `main.ts` | Passa `eventBus` a `DataService` |
| `app/services/data/__tests__/WorkoutLogRepository.test.ts` | Aggiornare test con mock eventBus |

## Cosa NON cambia (ancora)
- `triggerWorkoutLogRefresh()` in `main.ts` esiste ancora e continua a funzionare
- `cacheService.clearCache()` nel repository rimane (per ora)
- Le modali continuano a passare callback e chiamare `triggerWorkoutLogRefresh`
- I `DataAwareRenderChild` esistenti continuano a funzionare

**Strategia**: il bus emette eventi IN AGGIUNTA al flow attuale. Le view esistenti non se ne accorgono.

---

## Modifiche a `WorkoutLogRepository`

### Constructor — aggiungere eventBus

```typescript
// PRIMA
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private columnService: CSVColumnService,
  private cacheService: CSVCacheService,
) {}

// DOPO
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private columnService: CSVColumnService,
  private cacheService: CSVCacheService,
  private eventBus?: WorkoutEventBus,  // opzionale per backward compat
) {}
```

### `addWorkoutLogEntry()` — emette log:added

```typescript
// Dopo vault.process() e cacheService.clearCache() (righe 82-95 attuali):

this.cacheService.clearCache();

// AGGIUNTA: emetti evento al bus
// Costruiamo il WorkoutLogData dall'entry (serve per il payload)
const addedLog: WorkoutLogData = {
  ...entry,
  timestamp: newTimestamp, // timestamp generato durante vault.process
  // ... altri campi necessari
};
this.eventBus?.emit({
  type: 'log:added',
  payload: {
    entry: addedLog,
    context: {
      exercise: entry.exercise,
      workout: entry.workout,
    },
  },
});
```

**Problema**: il timestamp viene generato dentro `vault.process()` ma non è accessibile fuori. Soluzione: estrarre il timestamp generato.

```typescript
// MODIFICA a addWorkoutLogEntry per esporre il timestamp
let generatedTimestamp: number = Date.now();

await this.app.vault.process(csvFile, (content) => {
  const csvEntries = parseCSVLogFile(content);
  generatedTimestamp = Date.now();  // catturiamo il timestamp

  const newEntry: CSVWorkoutLogEntry = {
    ...entry,
    timestamp: generatedTimestamp,
  };

  csvEntries.push(newEntry);
  return entriesToCSVContent(csvEntries, existingCustomColumns);
});

this.cacheService.clearCache();

this.eventBus?.emit({
  type: 'log:added',
  payload: {
    entry: { ...entry, timestamp: generatedTimestamp } as WorkoutLogData,
    context: { exercise: entry.exercise, workout: entry.workout },
  },
});
```

### `updateWorkoutLogEntry()` — emette log:updated

```typescript
// Dopo vault.process() e cacheService.clearCache():

this.cacheService.clearCache();

this.eventBus?.emit({
  type: 'log:updated',
  payload: {
    previous: originalLog,
    updated: {
      ...updatedEntry,
      timestamp: originalLog.timestamp,
    } as WorkoutLogData,
  },
});
```

### `deleteWorkoutLogEntry()` — emette log:deleted

```typescript
// Dopo vault.process() e cacheService.clearCache():

this.cacheService.clearCache();

this.eventBus?.emit({
  type: 'log:deleted',
  payload: {
    entry: logToDelete,
    context: {
      exercise: logToDelete.exercise,
      workout: logToDelete.workout,
    },
  },
});
```

### `renameExercise()` — emette log:bulk-changed

```typescript
// Dopo vault.process() e cacheService.clearCache():

this.cacheService.clearCache();

this.eventBus?.emit({
  type: 'log:bulk-changed',
  payload: {
    count: updateCount,
    operation: 'rename',
  },
});

return updateCount;
```

---

## Modifiche a `DataService`

### Constructor — riceve e passa eventBus

```typescript
// PRIMA
export class DataService {
  constructor(private app: App, private settings: WorkoutChartsSettings) {
    this.cacheService = new CSVCacheService(app, settings);
    this.columnService = new CSVColumnService(app, settings);
    this.repository = new WorkoutLogRepository(app, settings, this.columnService, this.cacheService);
    // ...
  }
}

// DOPO
import type { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

export class DataService {
  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
    private eventBus?: WorkoutEventBus,  // nuovo parametro opzionale
  ) {
    this.cacheService = new CSVCacheService(app, settings);
    this.columnService = new CSVColumnService(app, settings);
    this.repository = new WorkoutLogRepository(
      app,
      settings,
      this.columnService,
      this.cacheService,
      eventBus,  // passato al repository
    );
    // ...
  }
}
```

---

## Modifiche a `main.ts`

```typescript
// PRIMA (riga 92)
this.dataService = new DataService(this.app, this.settings);

// DOPO
this.dataService = new DataService(this.app, this.settings, this.eventBus);
```

---

## Modifiche ai test di `WorkoutLogRepository`

I test devono mockare `WorkoutEventBus` e verificare che gli eventi vengano emessi correttamente.

```typescript
// app/services/data/__tests__/WorkoutLogRepository.test.ts (aggiunte)

import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

// Setup
let mockEventBus: jest.Mocked<WorkoutEventBus>;

beforeEach(() => {
  mockEventBus = {
    emit: jest.fn(),
    on: jest.fn(),
    batch: jest.fn(),
    destroy: jest.fn(),
  } as unknown as jest.Mocked<WorkoutEventBus>;

  repository = new WorkoutLogRepository(
    mockApp,
    mockSettings,
    mockColumnService,
    mockCacheService,
    mockEventBus,
  );
});

// Test eventi

it("should emit log:added event after successful add", async () => {
  // Setup: mock vault.process
  mockApp.vault.process = jest.fn().mockResolvedValue("csv content");

  await repository.addWorkoutLogEntry({
    exercise: "Squat",
    workout: "Push Day",
    reps: 10,
    weight: 100,
    // ...
  });

  expect(mockEventBus.emit).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'log:added',
      payload: expect.objectContaining({
        context: { exercise: "Squat", workout: "Push Day" },
      }),
    })
  );
});

it("should emit log:updated event after successful update", async () => {
  const originalLog = { exercise: "Squat", timestamp: 123 } as WorkoutLogData;
  const updatedEntry = { exercise: "Squat", reps: 12, weight: 110 };
  mockApp.vault.process = jest.fn().mockResolvedValue("csv content");

  await repository.updateWorkoutLogEntry(originalLog, updatedEntry);

  expect(mockEventBus.emit).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'log:updated',
      payload: expect.objectContaining({
        previous: originalLog,
      }),
    })
  );
});

it("should emit log:deleted event after successful delete", async () => {
  const logToDelete = { exercise: "Squat", workout: "Push Day", timestamp: 123 } as WorkoutLogData;
  mockApp.vault.process = jest.fn().mockResolvedValue("csv content");

  await repository.deleteWorkoutLogEntry(logToDelete);

  expect(mockEventBus.emit).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'log:deleted',
      payload: expect.objectContaining({
        context: { exercise: "Squat", workout: "Push Day" },
      }),
    })
  );
});

it("should emit log:bulk-changed after renameExercise", async () => {
  mockApp.vault.process = jest.fn().mockResolvedValue("csv content");
  // mock parseCSVLogFile per ritornare entries con "Squat"

  await repository.renameExercise("Squat", "Leg Press");

  expect(mockEventBus.emit).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'log:bulk-changed',
      payload: expect.objectContaining({
        operation: 'rename',
      }),
    })
  );
});

it("should NOT emit event if vault.process throws", async () => {
  mockApp.vault.process = jest.fn().mockRejectedValue(new Error("IO error"));

  await expect(repository.addWorkoutLogEntry({ exercise: "Squat" })).rejects.toThrow();
  expect(mockEventBus.emit).not.toHaveBeenCalled();
});

it("should work without eventBus (backward compat)", async () => {
  // Repository senza eventBus passato
  const repoWithoutBus = new WorkoutLogRepository(
    mockApp,
    mockSettings,
    mockColumnService,
    mockCacheService,
    // nessun eventBus
  );

  mockApp.vault.process = jest.fn().mockResolvedValue("csv content");
  // Non deve lanciare anche senza eventBus
  await expect(repoWithoutBus.addWorkoutLogEntry({ exercise: "Squat" })).resolves.not.toThrow();
});
```

---

## Verifica: Flusso parallelo durante Fase 2

Durante la Fase 2, ENTRAMBI i meccanismi sono attivi contemporaneamente:

```
addWorkoutLogEntry()
  → vault.process()
  → cacheService.clearCache()   ← dal repository
  → eventBus.emit(log:added)    ← NUOVO (fase 2)
  [ritorna al chiamante]
  → onLogCreated callback()     ← ANCORA ATTIVO (Fase 5 lo rimuove)
    → triggerWorkoutLogRefresh()
      → clearCache() di nuovo   ← ridondante ma innocuo
      → workspace.trigger("data-changed")  ← ANCORA ATTIVO
        → DataAwareRenderChild.shouldRefresh()
          → refreshFn()         ← ANCORA FUNZIONA
```

I DataAwareRenderChild vedono ancora l'evento `data-changed` e si aggiornano. Il bus emette `log:added` ma nessuno lo ascolta ancora (EventAwareRenderChild non esiste ancora). Sistema funzionante.

---

## Checklist Fase 2

- [x] Modificare `WorkoutLogRepository` — aggiungere `eventBus?` al constructor
- [x] Aggiungere `eventBus?.emit()` in `addWorkoutLogEntry()`
- [x] Aggiungere `eventBus?.emit()` in `updateWorkoutLogEntry()`
- [x] Aggiungere `eventBus?.emit()` in `deleteWorkoutLogEntry()`
- [x] Aggiungere `eventBus?.emit()` in `renameExercise()`
- [x] Modificare `DataService` — ricevere e passare `eventBus`
- [x] Modificare `main.ts` — passare `this.eventBus` a `DataService`
- [x] Aggiornare `WorkoutLogRepository.test.ts` — aggiungere mock eventBus e test eventi (6 nuovi test)
- [x] `npm test` — 74 suite, 1193 passed, 4 skipped
- [x] `npm run build` — nessun errore TypeScript

## Rischi Fase 2
**Basso** — il codice esistente non viene modificato nel suo comportamento. Il bus emette eventi che nessuno ancora ascolta. Se `eventBus` non viene passato (backward compat), le emit sono no-op grazie all'optional chaining `?.emit()`.
