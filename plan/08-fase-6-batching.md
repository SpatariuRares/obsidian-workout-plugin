# Fase 6 — Batching per Operazioni Bulk

## Obiettivo
Permettere di raggruppare multiple mutazioni CSV in un unico evento coalesced, evitando N re-render consecutivi durante import, rename massivo, o altre operazioni bulk.

## Prerequisiti
- Fase 1 (WorkoutEventBus con metodo `batch()`)
- Fase 2 (repository emette eventi)
- Fase 3 (cache si auto-invalida via eventi)

## Cosa cambia
| File | Tipo cambiamento |
|------|-----------------|
| `app/services/data/DataService.ts` | Aggiungere metodo `batchOperation()` |
| `main.ts` | Esporre `batchOperation()` se necessario |
| Feature che usano bulk operations | Usare `batch()` invece di loop singoli |

---

## Identificare le operazioni bulk esistenti

Cercare nel codice operazioni che potrebbero beneficiare del batching:

```bash
# CSV import features
grep -r "import\|bulk\|batch\|renameExercise\|convertExercise" app/ --include="*.ts" -l
```

### Candidati identificati:

1. **`renameExercise`** in `WorkoutLogRepository` — già emette `log:bulk-changed`. OK.

2. **`ExerciseConversionModal`** (probabilmente in `app/features/exercise-conversion/`) — converte un tipo di esercizio in un altro, potenzialmente aggiornando molte righe.

3. **Import CSV** — se esiste una funzionalità di import (da verificare).

4. **`scripts/`** directory — potrebbe contenere script di migrazione dati.

---

## API di Batching in `DataService`

```typescript
// app/services/data/DataService.ts

/**
 * Raggruppa multiple operazioni in un unico evento coalesced.
 * Utile per import CSV, conversioni esercizio, migrate, ecc.
 *
 * @example
 * await dataService.batchOperation('import', async () => {
 *   for (const entry of importedEntries) {
 *     await dataService.addWorkoutLogEntry(entry);
 *   }
 * });
 * // Emette: log:bulk-changed { count: N, operation: 'import' }
 */
public async batchOperation(
  operation: 'import' | 'rename' | 'bulk-delete' | 'other',
  fn: () => Promise<void>,
): Promise<void> {
  if (!this.eventBus) {
    // Senza eventBus, esegui normalmente
    await fn();
    return;
  }
  await this.eventBus.batch(operation, fn);
}
```

---

## Uso in ExerciseConversionModal

```typescript
// PRIMA (ipotetico)
for (const entry of entriesToConvert) {
  await plugin.updateWorkoutLogEntry(entry, convertedEntry);
  // Ogni update emette log:updated → view si aggiorna N volte
}
plugin.triggerWorkoutLogRefresh();

// DOPO
await plugin.dataService.batchOperation('other', async () => {
  for (const entry of entriesToConvert) {
    await plugin.updateWorkoutLogEntry(entry, convertedEntry);
    // Gli eventi sono accodati, non dispatched
  }
});
// Un solo log:bulk-changed emesso → view si aggiorna 1 volta
```

---

## Uso in Import CSV (se esiste)

```typescript
// DOPO
await dataService.batchOperation('import', async () => {
  for (const entry of parsedEntries) {
    await dataService.addWorkoutLogEntry(entry);
  }
});
// count = parsedEntries.length nell'evento log:bulk-changed
```

---

## Esporre batchOperation in `main.ts` (opzionale)

Se operazioni bulk vengono avviate dall'esterno (es. API pubblica o comandi):

```typescript
// main.ts
public async batchOperation(
  operation: 'import' | 'rename' | 'bulk-delete' | 'other',
  fn: () => Promise<void>,
): Promise<void> {
  await this.dataService.batchOperation(operation, fn);
}
```

---

## Test del batching (in DataService.test.ts)

```typescript
describe("DataService.batchOperation", () => {
  it("should coalesce multiple adds into one bulk-changed event", async () => {
    const bulkHandler = jest.fn();
    const addHandler = jest.fn();
    eventBus.on('log:bulk-changed', bulkHandler);
    eventBus.on('log:added', addHandler);

    await dataService.batchOperation('import', async () => {
      await dataService.addWorkoutLogEntry({ exercise: 'Squat', ... });
      await dataService.addWorkoutLogEntry({ exercise: 'Bench', ... });
      await dataService.addWorkoutLogEntry({ exercise: 'Deadlift', ... });
    });

    expect(addHandler).not.toHaveBeenCalled();
    expect(bulkHandler).toHaveBeenCalledTimes(1);
    expect(bulkHandler).toHaveBeenCalledWith({ count: 3, operation: 'import' });
  });

  it("should work without eventBus (executes fn directly)", async () => {
    const dataServiceNoBus = new DataService(mockApp, mockSettings);
    const fn = jest.fn().mockResolvedValue(undefined);

    await dataServiceNoBus.batchOperation('import', fn);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

---

## Performance: confronto atteso

| Scenario | Prima | Dopo |
|----------|-------|------|
| Import 100 entry | 100 re-render | 1 re-render |
| Rename esercizio con 500 occorrenze | 500 re-render | 1 re-render |
| Conversione 50 esercizi | 50 re-render | 1 re-render |

---

## Checklist Fase 6

- [x] Aggiungere `batchOperation()` a `DataService`
- [x] Aggiungere `batchOperation()` a `main.ts` (esposto pubblicamente)
- [x] Identificare feature che usano loop di mutazioni (grep) — trovato `ExerciseConversionService`
- [x] Aggiornare `ExerciseConversionService.convertExerciseData()` per usare `batchOperation('other', ...)`
- [x] Import CSV non esiste come feature standalone (renameExercise già emette bulk-changed da solo)
- [x] Aggiungere test in `DataService.test.ts` (3 test: coalescing, no-bus fallback, error propagation)
- [x] `npm test` — 75/75 suite passano (1216 passed, 4 skipped)
- [x] `npm run build` — nessun errore TypeScript

## Rischi Fase 6
**Basso** — è un feature addativo. Le operazioni existenti continuano a funzionare. Il batching è opt-in per chi vuole usarlo.
