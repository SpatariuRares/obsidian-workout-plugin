# Fase 7 — Cleanup del Codice Deprecato

## Obiettivo
Rimuovere tutto il codice transitorio, i fallback, e i meccanismi legacy introdotti durante la migrazione. Dopo questa fase il codebase non contiene più vestigia del vecchio sistema.

## Prerequisiti
**Tutte le fasi 1-6 completate e stabili in produzione.**
Raccomandato: almeno una settimana di utilizzo reale dopo la Fase 5 prima di procedere con questa fase.

---

## Checklist completa di cosa rimuovere

### 1. `app/types/WorkoutEvents.ts` — eliminare il file

Questo file definisce le interfacce workspace-event del vecchio sistema:
```typescript
// TUTTO DA RIMUOVERE
export interface WorkoutDataChangedEvent { ... }
export interface MuscleTagsChangedEvent { ... }
declare module "obsidian" {
  interface Workspace {
    on(name: "workout-planner:data-changed", ...): EventRef;
    trigger(name: "workout-planner:data-changed", ...): void;
    on(name: "workout-planner:muscle-tags-changed", ...): EventRef;
    trigger(name: "workout-planner:muscle-tags-changed", ...): void;
    on(name: "workout-planner:log-added", ...): EventRef;
    trigger(name: "workout-planner:log-added", ...): void;
  }
}
```

**Verifica prima di rimuovere**:
```bash
grep -r "WorkoutDataChangedEvent\|MuscleTagsChangedEvent\|workout-planner:data-changed\|workout-planner:log-added\|workout-planner:muscle-tags-changed" app/ --include="*.ts"
```
Deve ritornare zero risultati (o solo il file stesso).

---

### 2. `app/services/core/DataAwareRenderChild.ts` — eliminare il file

```bash
grep -r "DataAwareRenderChild" app/ --include="*.ts"
```
Deve ritornare zero risultati prima di eliminare.

---

### 3. `CodeBlockProcessorService.ts` — rimuovere i fallback

Nella Fase 4 abbiamo aggiunto blocchi `if (this.eventBus) { ... } else { DataAwareRenderChild fallback }`. Dopo la Fase 7 il `else` non serve più.

**PRIMA** (Fase 4):
```typescript
if (this.eventBus) {
  ctx.addChild(new EventAwareRenderChild(...));
} else {
  ctx.addChild(new DataAwareRenderChild(...));  // ← RIMUOVERE
}
```

**DOPO** (Fase 7):
```typescript
ctx.addChild(new EventAwareRenderChild(...));
```

Stesso pattern per tutti e 4 gli handler (chart, log, dashboard, timer).

Rimuovere anche:
- Il parametro `eventBus?` → diventa `eventBus: WorkoutEventBus` (non più opzionale)
- L'import di `DataAwareRenderChild`
- L'import di `WorkoutDataChangedEvent` (se ancora presente)

---

### 4. `TimerRenderChild` in `CodeBlockProcessorService.ts` — rimuovere fallback workspace

```typescript
// PRIMA (Fase 4)
if (this.eventBus) {
  this.register(this.eventBus.on('log:added', ...));
} else {
  // Fallback workspace event
  this.registerEvent(
    this.plugin.app.workspace.on("workout-planner:log-added", ...)  // ← RIMUOVERE
  );
}

// DOPO (Fase 7)
this.register(this.eventBus.on('log:added', ...));
```

Rimuovere dal constructor di `TimerRenderChild`:
- Il parametro `private eventBus?: WorkoutEventBus` → `private eventBus: WorkoutEventBus`
- Import di `WorkoutDataChangedEvent`

---

### 5. `WorkoutLogRepository.ts` — rimuovere opzionalità di eventBus

```typescript
// PRIMA
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private columnService: CSVColumnService,
  private cacheService: CSVCacheService,
  private eventBus?: WorkoutEventBus,  // ← opzionale
) {}

// Uso con optional chaining
this.eventBus?.emit(...);

// DOPO
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private columnService: CSVColumnService,
  private cacheService: CSVCacheService,
  private eventBus: WorkoutEventBus,  // ← required
) {}

// Uso diretto
this.eventBus.emit(...);
```

---

### 6. `CSVCacheService.ts` — rimuovere opzionalità di eventBus

```typescript
// PRIMA
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private eventBus?: WorkoutEventBus,  // ← opzionale
) {
  if (eventBus) {
    this.setupEventListeners(eventBus);
  }
}

// DOPO
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private eventBus: WorkoutEventBus,  // ← required
) {
  this.setupEventListeners(eventBus);
}
```

---

### 7. `DataService.ts` — rimuovere opzionalità di eventBus

```typescript
// PRIMA
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private eventBus?: WorkoutEventBus,
) {
  this.cacheService = new CSVCacheService(app, settings, eventBus);
  this.repository = new WorkoutLogRepository(..., eventBus);
}

// DOPO
constructor(
  private app: App,
  private settings: WorkoutChartsSettings,
  private eventBus: WorkoutEventBus,
) {
  this.cacheService = new CSVCacheService(app, settings, eventBus);
  this.repository = new WorkoutLogRepository(..., eventBus);
}
```

---

### 8. `main.ts` — rimuovere metodi e chiamate legacy

#### Rimuovere `triggerWorkoutLogRefresh()` (se nessuno lo chiama ancora)
```bash
grep -r "triggerWorkoutLogRefresh" app/ main.ts --include="*.ts"
```

Se zero risultati (escluso la definizione stessa e i test), rimuovere il metodo.

#### Rimuovere `clearLogDataCache()` (sostituito da eventi)
```bash
grep -r "clearLogDataCache" app/ main.ts --include="*.ts"
```
Se il metodo non viene più usato esternamente, rimuovere.

#### Rimuovere `triggerMuscleTagRefresh()` (se le chiamate sono state migrate)
Verificare che tutte le chiamate usino `eventBus.emit({ type: 'muscle-tags:changed' })` direttamente.

#### Semplificare `onunload()`
Dopo la Fase 3, `this.dataService?.clearLogDataCache()` in `onunload()` è ridondante (il bus viene distrutto, le cache verranno GC). Rimuovere.

```typescript
// PRIMA onunload() con vestigia
onunload() {
  // ...
  this.dataService?.clearLogDataCache();    // ← rimuovere (Fase 3 lo gestisce)
  this.exerciseDefinitionService?.clearCache(); // ← mantenere (ExerciseDef non usa il bus)
  // ...
}
```

---

### 9. Rimuovere import inutilizzati ovunque

Dopo il cleanup, eseguire:
```bash
npm run lint:fix
```

E verificare manualmente che non rimangano import di:
- `WorkoutDataChangedEvent`
- `MuscleTagsChangedEvent`
- `DataAwareRenderChild`

---

### 10. `app/services/events/ObsidianEventBridge.ts` — valutare rimozione

Se non ci sono plugin terzi che ascoltano `workout-planner:data-changed` via workspace, questo file può essere eliminato.

**Verifica**: controllare CHANGELOG, README, e eventuale documentazione API pubblica per capire se qualcuno dipende da questi eventi workspace.

Se il bridge viene mantenuto (backward compat con plugin terzi), documentarlo esplicitamente:
```typescript
/**
 * @deprecated
 * Mantiene compatibilità con plugin terzi che ascoltano eventi workspace.
 * Verrà rimosso nella prossima major version.
 */
export class ObsidianEventBridge { ... }
```

---

### 11. Aggiornare i test dei file modificati

Tutti i test che passavano `undefined` o omettevano `eventBus` (grazie all'opzionalità) devono essere aggiornati per passare un `mockEventBus`:

```bash
# Trovare tutti i test che istanziano classi refactored
grep -r "new WorkoutLogRepository\|new CSVCacheService\|new DataService\|new CodeBlockProcessorService" app/ --include="*.test.ts"
```

Per ognuno, assicurarsi che usi `createMockEventBus()` (definito in `09-test-strategy.md`).

---

### 12. Aggiornare `CLAUDE.md` — sezione "Refresh Architecture"

La sezione attuale descrive il vecchio sistema con `workspace.trigger`. Dopo il cleanup va riscritta:

```markdown
## Refresh Architecture (Event-Driven)

Tutte le mutazioni dati emettono eventi tramite `WorkoutEventBus`.
Le view si aggiornano ascoltando eventi specifici.

### WorkoutEventBus (app/services/events/WorkoutEventBus.ts)
- `log:added` — nuovo log aggiunto
- `log:updated` — log esistente modificato (contiene entry precedente e nuova)
- `log:deleted` — log eliminato
- `log:bulk-changed` — operazione bulk (import, rename massivo)
- `muscle-tags:changed` — mapping muscle tags modificato
- `settings:changed` — impostazione cambiata
- `plugin:error` — errore recuperabile o non

### Flow mutazione → refresh
1. Repository scrive su CSV
2. Repository emette evento su `WorkoutEventBus`
3. `CSVCacheService` riceve evento → invalida cache
4. `EventAwareRenderChild` riceve evento → filtra per exercise/workout → chiama `renderFn()`

### Batching
Per operazioni bulk usare `dataService.batchOperation('import', async () => { ... })`
→ emette un solo `log:bulk-changed` invece di N eventi individuali
```

---

## Ordine di esecuzione del cleanup

1. **Grep di sicurezza** — verificare zero usi dei simboli da rimuovere
2. **Rimuovere `WorkoutEvents.ts`** — il più sicuro, nessun codice runtime
3. **Rimuovere fallback `else` in `CodeBlockProcessorService`** — sicuro, eventBus è always present
4. **Rendere `eventBus` required** — in Repository, CacheService, DataService
5. **Rimuovere `DataAwareRenderChild.ts`** — dopo aver rimosso tutti gli usi
6. **Rimuovere metodi legacy da `main.ts`**
7. **`npm run lint:fix`** — rimuove import inutilizzati
8. **`npm test`** — verifica zero regressioni
9. **`npm run build`** — verifica TypeScript pulito
10. **Aggiornare `CLAUDE.md`**

---

## Checklist Fase 7

- [x] Grep di sicurezza su tutti i simboli deprecati
- [x] Eliminare `app/types/WorkoutEvents.ts`
- [x] Eliminare `app/services/core/DataAwareRenderChild.ts`
- [x] Rimuovere blocchi `else { DataAwareRenderChild }` in `CodeBlockProcessorService`
- [x] Rimuovere fallback workspace event da `TimerRenderChild`
- [x] Rendere `eventBus` required in `WorkoutLogRepository` (rimuovere `?`, rimuovere optional chaining)
- [x] Rendere `eventBus` required in `CSVCacheService` (rimuovere `?`)
- [x] Rendere `eventBus` required in `DataService` (rimuovere `?`, rimuovere fallback in batchOperation)
- [x] Rendere `eventBus` required in `CodeBlockProcessorService` (rimuovere `?`)
- [x] Rimuovere `triggerWorkoutLogRefresh` da `TableActions.handleDelete` (ridondante, repo emette log:deleted)
- [x] Rimuovere `triggerWorkoutLogRefresh` da `ConvertExerciseDataModal` (ridondante, batchOperation emette log:bulk-changed)
- [x] Migrare `GeneralSettings` da `triggerWorkoutLogRefresh({})` a `eventBus.emit(log:bulk-changed)`
- [x] Semplificare `triggerWorkoutLogRefresh()` in `main.ts` → emette `log:bulk-changed` sul bus (deprecato, solo per API esterna)
- [x] Rimuovere import `WorkoutDataChangedEvent` da `main.ts`
- [x] `CanvasExporter`: passare `plugin.eventBus` a `new DataService(...)`
- [x] `ObsidianEventBridge.ts` non esiste — N/A
- [x] Aggiornare test `CSVCacheService.test.ts` (eventBus required, rimozione "no-bus" test)
- [x] Aggiornare test `WorkoutLogRepository.test.ts` (eventBus required, rimozione "no-bus" test)
- [x] Aggiornare test `DataService.test.ts` (eventBus required, rimozione "no-bus" test, pulizia batchOperation tests)
- [x] Aggiornare test `CodeBlockProcessorService.test.ts` (eventBus required, afterEach destroy)
- [x] `npm run lint:fix` — lint rotto per missing package (non bloccante, cleanup manuale fatto)
- [x] `npm test` — 75/75 suite passano (1213 passed, 4 skipped)
- [x] `npm run build` — zero errori TypeScript
- [x] Aggiornare sezione "Refresh Architecture" in `CLAUDE.md`

## Rischi Fase 7
**Basso** se tutte le fasi precedenti sono stabili. Il rischio principale è rimuovere metodi (`triggerWorkoutLogRefresh`) che potrebbero ancora essere usati in test o in codice non ancora identificato. I grep di sicurezza all'inizio della fase mitigano questo rischio.
