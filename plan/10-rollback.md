# Piano di Rollback

## Strategia generale
Ogni fase è backward-compatible e può essere revertita indipendentemente. L'uso di `?` (optional) per i nuovi parametri garantisce che il codice esistente continui a funzionare anche se qualcosa va storto.

---

## Rollback per Fase 1 (WorkoutEventBus)

**Cosa rollbackare**: rimuovere i file creati.

```bash
git revert <commit-hash-fase-1>
```

Oppure manualmente:
- Eliminare `app/services/events/WorkoutEventBus.ts`
- Eliminare `app/services/events/WorkoutEventTypes.ts`
- Eliminare `app/services/events/__tests__/WorkoutEventBus.test.ts`
- In `main.ts`: rimuovere `this.eventBus = new WorkoutEventBus()` e cleanup

**Impatto**: zero — il bus non era ancora usato da nessuno.

---

## Rollback per Fase 2 (Repository emette eventi)

**Cosa rollbackare**: rimuovere le chiamate `eventBus?.emit()` dal repository.

```bash
git revert <commit-hash-fase-2>
```

Manualmente in `WorkoutLogRepository.ts`:
- Rimuovere `private eventBus?: WorkoutEventBus` dal constructor
- Rimuovere tutte le chiamate `this.eventBus?.emit(...)` dopo vault.process
- Rimuovere il parametro `eventBus` da `DataService` constructor
- Rimuovere il parametro da `main.ts`

**Impatto**: le view continuano ad aggiornarsi via `triggerWorkoutLogRefresh` (meccanismo esistente). Zero regressioni.

---

## Rollback per Fase 3 (Cache reattiva)

**Cosa rollbackare**: rimuovere i listener nel CSVCacheService, riaggiungere `clearCache()` nel repository.

Manualmente in `CSVCacheService.ts`:
- Rimuovere `private eventBus?: WorkoutEventBus` dal constructor
- Rimuovere `setupEventListeners()` e `destroy()`
- Rimuovere `private unsubscribers` array

Manualmente in `WorkoutLogRepository.ts`:
- Riaggiungere `this.cacheService.clearCache()` dopo ogni `vault.process`

Manualmente in `main.ts`:
- Riaggiungere `this.clearLogDataCache()` in `triggerWorkoutLogRefresh`

**Impatto**: nessuno — si torna al comportamento originale.

---

## Rollback per Fase 4 (EventAwareRenderChild)

**Cosa rollbackare**: rimuovere EventAwareRenderChild e far tornare CodeBlockProcessorService a usare DataAwareRenderChild.

Manualmente in `CodeBlockProcessorService.ts`:
- Rimuovere `private eventBus?: WorkoutEventBus` dal constructor
- Rimuovere i blocchi `if (this.eventBus) { ... EventAwareRenderChild ... }` e lasciare solo i `DataAwareRenderChild` originali
- Rimuovere import di `EventAwareRenderChild`

Eliminare:
- `app/services/core/EventAwareRenderChild.ts`
- `app/services/core/__tests__/EventAwareRenderChild.test.ts`

In `main.ts`:
- Rimuovere `this.eventBus` dal constructor call di `CodeBlockProcessorService`

**Impatto**: le view tornano a usare `workspace.on("data-changed")` — comportamento originale ripristinato.

---

## Rollback per Fase 5 (Modali disaccoppiate)

Questa è la fase più rischiosa per il rollback perché cambia API pubblica.

**Cosa rollbackare**:
- Riaggiungere `onComplete?: (ctx) => void` a `BaseLogModal`
- Riaggiungere `onLogCreated?: (ctx) => void` a `CreateLogModal`
- Riaggiungere callback a `EditLogModal`
- Riaggiungere lambda callback in `main.ts` (×2 — createLogModalHandler e ribbon)
- Riaggiungere callback in `TableActions.handleEdit`
- Riaggiungere `workspace.trigger("workout-planner:log-added")` in `BaseLogModal`

**Impatto**: medio — tutti i call site devono essere aggiornati. Usare git revert è fortemente preferibile al rollback manuale.

**Consiglio**: fare un commit separato per ogni call site modificato durante la Fase 5, così il revert è granulare.

---

## Rollback per Fase 6 (Batching)

**Cosa rollbackare**: rimuovere `batchOperation()` da `DataService` e `main.ts`.

**Impatto**: zero — il batching è opt-in. Il codice che non lo usa non è affected.

---

## Strategia di branch

Raccomandato lavorare su un branch separato per ogni fase:

```bash
git checkout -b refactor/event-bus-phase-1
# ... implementa fase 1 ...
git commit -m "feat: add WorkoutEventBus and WorkoutEventTypes"

git checkout -b refactor/event-bus-phase-2
# ... implementa fase 2 ...
git commit -m "feat: repository emits events to WorkoutEventBus"

# ecc.
```

In questo modo, ogni fase è un branch separato che può essere mergiato o droppato indipendentemente.

---

## Segnali di allerta durante l'implementazione

| Sintomo | Causa probabile | Azione |
|---------|----------------|--------|
| View non si aggiornano dopo edit | eventBus non passato a CodeBlockProcessorService | Verificare main.ts riga init |
| View si aggiornano troppo spesso | Double event emission | Verificare che clearCache in repo sia rimosso (Fase 3) |
| Timer non si avvia su log add | TimerRenderChild usa ancora workspace event | Verificare CodeBlockProcessorService |
| Cache non si invalida | setupEventListeners non chiamato | Verificare CSVCacheService constructor |
| TypeScript errors su eventBus | Importazione errata | Verificare path imports |
| Test falliscono dopo Fase 2 | Test non usano mock eventBus | Aggiungere createMockEventBus() |
