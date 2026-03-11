# Refactoring Plan: Event-Driven Architecture

## Indice

| File | Contenuto |
|------|-----------|
| [README.md](./README.md) | Questo file — overview, motivazioni, indice |
| [01-analisi-problemi.md](./01-analisi-problemi.md) | Diagnosi dettagliata dei problemi attuali con riferimenti al codice |
| [02-architettura-target.md](./02-architettura-target.md) | Design della nuova architettura event-driven |
| [03-fase-1-event-bus.md](./03-fase-1-event-bus.md) | Fase 1 — WorkoutEventBus (fondamenta) |
| [04-fase-2-repository.md](./04-fase-2-repository.md) | Fase 2 — Repository come producer di eventi |
| [05-fase-3-cache.md](./05-fase-3-cache.md) | Fase 3 — Cache come consumer reattivo |
| [06-fase-4-render-child.md](./06-fase-4-render-child.md) | Fase 4 — EventAwareRenderChild type-safe |
| [07-fase-5-modals.md](./07-fase-5-modals.md) | Fase 5 — Disaccoppiamento modali |
| [08-fase-6-batching.md](./08-fase-6-batching.md) | Fase 6 — Batching e debouncing |
| [09-test-strategy.md](./09-test-strategy.md) | Strategia di testing per ogni fase |
| [10-rollback.md](./10-rollback.md) | Piano di rollback se qualcosa va storto |
| [11-fase-7-cleanup.md](./11-fase-7-cleanup.md) | Fase 7 — Rimozione codice deprecato e legacy |

---

## Motivazione

Il sistema di eventi attuale funziona, ma ha **accumulo di debito tecnico** che diventerà bloccante:

### Problema principale
`triggerWorkoutLogRefresh()` è il punto di accoppiamento centrale — qualsiasi componente che muta dati deve chiamarlo esplicitamente, con il rischio che se lo dimentica le view rimangono stale.

### Problemi secondari (in ordine di severità)

1. **Nessun contesto operazione** — `data-changed` non distingue add/edit/delete → workaround con `log-added` separato
2. **Filtraggio fragile** — `shouldRefresh()` usa `includes()` su stringhe non normalizzate
3. **Cache come side effect** — `clearCache()` viene chiamato come effetto collaterale di `triggerRefresh()`, non come reazione ai dati
4. **Modali con callback** — le modali accettano `onLogCreated?: (ctx) => void` e i caller devono passare `triggerWorkoutLogRefresh`
5. **Refresh cascata muscle tags** → `muscle-tags-changed` → `triggerWorkoutLogRefresh()` → double refresh
6. **Nessun batching** — import bulk = N eventi
7. **Nessuna propagazione errori** nel bus eventi

---

## Approccio

**Migrazione incrementale** — ogni fase è indipendente, backward-compatible, e deployabile singolarmente.

```
Fase 1 → WorkoutEventBus (nuovo layer, niente rompe)
Fase 2 → Repository emette eventi (rimpiazza cacheService.clearCache() calls)
Fase 3 → Cache si auto-invalida (rimpiazza clearCache() in triggerRefresh)
Fase 4 → EventAwareRenderChild (rimpiazza DataAwareRenderChild)
Fase 5 → Modali disaccoppiate (rimpiazza callback pattern)
Fase 6 → Batching (nuovo feature, non breaking)
Fase 7 → Cleanup (rimozione fallback, codice legacy, parametri opzionali → required)
         ⚠ Solo dopo stabilità in produzione delle fasi 1-6
```

---

## Stato attuale del codice

### File coinvolti nel refactoring

| File | Ruolo attuale | Cambiamento |
|------|--------------|-------------|
| `app/types/WorkoutEvents.ts` | Definisce interfacce eventi workspace | Rimpiazzato con tipi discriminati |
| `app/services/core/DataAwareRenderChild.ts` | Filtraggio string-based | Rimpiazzato con EventAwareRenderChild |
| `app/services/core/CodeBlockProcessorService.ts` | Registra DataAwareRenderChild | Usa EventAwareRenderChild |
| `app/services/data/WorkoutLogRepository.ts` | CRUD + clearCache() manuale | Repository emette eventi |
| `app/services/data/CSVCacheService.ts` | Cache passiva | Cache si auto-invalida |
| `app/services/data/DataService.ts` | Facade | Riceve EventBus nel constructor |
| `main.ts` | triggerWorkoutLogRefresh(), triggerMuscleTagRefresh() | Semplificato, delegato all'EventBus |
| `app/features/modals/log/CreateLogModal.ts` | Accetta callback onLogCreated | Nessun callback — eventi automatici |
| `app/features/modals/log/EditLogModal.ts` | Accetta callback | Nessun callback |
| `app/features/tables/components/TableActions.ts` | Chiama triggerWorkoutLogRefresh | Nessun cambiamento (già corretto) |

### Nuovi file da creare

| File | Scopo |
|------|-------|
| `app/services/events/WorkoutEventBus.ts` | Il bus centrale |
| `app/services/events/WorkoutEventTypes.ts` | Tipi discriminati per tutti gli eventi |
| `app/services/core/EventAwareRenderChild.ts` | Rimpiazzo di DataAwareRenderChild |
| `app/services/events/__tests__/WorkoutEventBus.test.ts` | Test del bus |
| `app/services/core/__tests__/EventAwareRenderChild.test.ts` | Test del render child |
