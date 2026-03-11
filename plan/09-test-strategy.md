# Strategia di Testing

## Principio
Ogni fase deve lasciare il test suite verde. Non si procede alla fase successiva se i test falliscono.

---

## File di test nuovi da creare

| File | Fase | Copertura target |
|------|------|-----------------|
| `app/services/events/__tests__/WorkoutEventBus.test.ts` | 1 | 100% |
| `app/services/core/__tests__/EventAwareRenderChild.test.ts` | 4 | ≥90% |

---

## File di test da aggiornare

| File | Fase | Tipo modifica |
|------|------|--------------|
| `app/services/data/__tests__/WorkoutLogRepository.test.ts` | 2 | Aggiungere mock eventBus, test eventi emessi |
| `app/services/data/__tests__/CSVCacheService.test.ts` | 3 | Aggiungere test auto-invalidazione via eventi |
| `app/services/data/__tests__/DataService.test.ts` | 2,3,6 | Aggiungere eventBus nei constructor calls |
| `app/services/core/__tests__/CodeBlockProcessorService.test.ts` | 4 | Aggiornare per EventAwareRenderChild |
| `app/features/modals/base/__tests__/BaseLogModal.test.ts` (se esiste) | 5 | Rimuovere test callback |

---

## Mock strategy per WorkoutEventBus nei test esistenti

Tutti i test che istanziano `WorkoutLogRepository`, `DataService`, o `CSVCacheService` devono passare un mock del bus:

```typescript
// test-helpers/mockEventBus.ts
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";

export function createMockEventBus(): jest.Mocked<WorkoutEventBus> {
  return {
    emit: jest.fn(),
    on: jest.fn().mockReturnValue(jest.fn()),  // ritorna unsub function
    batch: jest.fn().mockImplementation(async (_, fn) => fn()),  // esegue fn direttamente
    destroy: jest.fn(),
  } as unknown as jest.Mocked<WorkoutEventBus>;
}
```

Usare `createMockEventBus()` in tutti i test che istanziano classi che ricevono eventBus.

---

## Test di integrazione manuali (da eseguire dopo ogni fase)

### Fase 2 (Repository emette eventi)
1. Aprire una nota con un `workout-log` code block
2. Aprire CreateLogModal → salvare → verificare che la tabella si aggiorni
3. Aprire EditLogModal → modificare → verificare che la tabella si aggiorni
4. Eliminare una riga → verificare che la tabella si aggiorni

### Fase 3 (Cache reattiva)
1. Aggiungere un log
2. Verificare nei DevTools che il CSV venga riletto una sola volta (no double-read)
3. Aprire console Obsidian → verificare che "csv:cacheMiss" appaia solo quando atteso

### Fase 4 (EventAwareRenderChild)
1. Aprire nota con `workout-chart` filtrato su "Squat"
2. Aggiungere log "Bench Press" → verificare che il chart NON si aggiorni
3. Aggiungere log "Squat" → verificare che il chart SI aggiorni
4. Rinominare esercizio "Squat" → "Leg Press" → verificare che il chart su "Squat" si aggiorni (mostra dati vuoti o messaggio no-data)
5. Timer con exercise=Squat, workout=PushDay → aggiungere log Squat/PushDay → verificare auto-start

### Fase 5 (Modali disaccoppiate)
1. Aprire CreateLogModal dal ribbon → salvare → verificare aggiornamento view
2. Aprire CreateLogModal da tabella → salvare → verificare aggiornamento
3. Aprire muscle tag manager → salvare → verificare aggiornamento dashboard

### Fase 6 (Batching)
1. Usare funzionalità di conversione esercizio su esercizio con molte occorrenze
2. Verificare nei log che "csv:cacheMiss" appaia solo una volta
3. Verificare che la UI non "balli" durante l'operazione

---

## Regression test: comportamenti critici da non rompere

| Comportamento | Come testare |
|--------------|-------------|
| Timer auto-start su log:added | Aggiungere log con exercise+workout matching timer |
| Timer NON auto-start su log:updated | Modificare log → timer non deve startarsi |
| Dashboard si aggiorna su muscle-tags change | Modificare muscle tag → heatmap cambia |
| Chart con exactMatch=true | Aggiungere "Squats" (plurale) → chart su "Squat" non cambia |
| View globale (no filter) si aggiorna sempre | Dashboard senza filtri → si aggiorna su qualsiasi evento |
| Tabella con workout filter | Aggiungere log su workout diverso → tabella non si aggiorna |

---

## Coverage target per ogni nuovo file

```
WorkoutEventBus.ts:         100% (logica deterministica, testabile completamente)
WorkoutEventTypes.ts:       100% (solo tipi + normalizeExercise)
EventAwareRenderChild.ts:   ≥90% (DOM mocking può essere parziale)
```

---

## Comando per verificare la coverage solo dei nuovi file

```bash
npm run test:coverage -- --collectCoverageFrom="app/services/events/**/*.ts" --collectCoverageFrom="app/services/core/EventAwareRenderChild.ts"
```
