# Analisi Problemi — Architettura Attuale

## 1. Nessun contesto operazione (add / edit / delete)

**File**: `app/types/WorkoutEvents.ts`

```typescript
// ATTUALE — non dice cosa è successo
export interface WorkoutDataChangedEvent {
  exercise?: string;
  workout?: string;
}
```

**Conseguenza**: il timer deve auto-startarsi SOLO su `add`, non su `edit`. Workaround: evento separato `workout-planner:log-added` che deve essere tenuto sincronizzato manualmente.

**Dove si manifesta**:
- `CodeBlockProcessorService.ts` righe 42-56: `TimerRenderChild` ascolta `log-added` invece di `data-changed` per distinguere add da edit
- `main.ts` riga 332: `triggerWorkoutLogRefresh` non passa il tipo operazione

---

## 2. Filtraggio string-based non normalizzato

**File**: `app/services/core/DataAwareRenderChild.ts` righe 36-68

```typescript
private shouldRefresh(evt: WorkoutDataChangedEvent): boolean {
  // ...
  const evtLower = evt.exercise.toLowerCase();
  const viewLower = viewExercise.toLowerCase();
  // includes() bidirezionale — fragile
  if (!evtLower.includes(viewLower) && !viewLower.includes(evtLower))
    return false;
```

**Problemi specifici**:

| Caso | evt.exercise | viewExercise | Risultato atteso | Risultato attuale |
|------|-------------|--------------|-----------------|------------------|
| Spazio extra | "Squat " | "Squat" | refresh | NO refresh (includes fallisce) |
| Substring | "Squat" | "Squats" | NO refresh | refresh (falso positivo) |
| Accento | "Lunges" | "lunges" | refresh | OK (toLowerCase funziona) |
| Rename esercizio | "Old Name" → "New Name" | "Old Name" | refresh (entry rimossa) | NO refresh |

**Il caso rename** è il più pericoloso: se un utente rinomina "Squat" in "Leg Press", le view che mostravano "Squat" non si aggiornano perché `evt.exercise = "Leg Press"` non matcha `viewExercise = "Squat"`.

---

## 3. Cache come side effect di triggerRefresh

**File**: `main.ts` righe 325-334

```typescript
public triggerWorkoutLogRefresh(context?: WorkoutDataChangedEvent): void {
  // Problema: clearCache() è dentro triggerRefresh, non dentro il repository
  this.clearLogDataCache();  // <-- side effect
  this.app.workspace.trigger("workout-planner:data-changed", context ?? {});
}
```

**File**: `app/services/data/WorkoutLogRepository.ts` righe 94-96

```typescript
// La cache viene già invalidata qui, dentro il repository
await this.app.vault.process(csvFile, (content) => { ... });
this.cacheService.clearCache();  // <-- 1° invalidazione
```

**Problema**: la cache viene invalidata DUE volte — una volta nel repository dopo la scrittura CSV, e una volta in `triggerWorkoutLogRefresh`. Questa doppia invalidazione è innocua ma indica separazione delle responsabilità rotta. Se qualcuno chiama `triggerWorkoutLogRefresh` senza mutare dati (es. refresh manuale), invalida comunque la cache.

**Separazione delle responsabilità corretta**:
- Repository: invalida la cache quando scrive dati
- EventBus: notifica le view di aggiornarsi
- Cache: dovrebbe auto-invalidarsi in risposta agli eventi del repository

---

## 4. Modali con callback espliciti

**File**: `app/features/modals/log/CreateLogModal.ts` righe 14-25

```typescript
constructor(
  app: App,
  plugin: WorkoutChartsPlugin,
  exerciseName?: string,
  currentPageLink?: string,
  onLogCreated?: (context?: WorkoutDataChangedEvent) => void,  // <-- callback
  ...
```

**File**: `main.ts` righe 59-73

```typescript
public get createLogModalHandler() {
  return {
    openModal: () => {
      new CreateLogModal(
        this.app,
        this,
        undefined,
        undefined,
        (ctx) => {
          this.triggerWorkoutLogRefresh(ctx);  // <-- passato manualmente
        },
        ...
```

**File**: `main.ts` righe 149-161 (ribbon), righe 59-73 (dashboard handler) — stessa callback ripetuta 2 volte.

**Rischio**: se qualcuno crea una `CreateLogModal` dimenticando il callback, i dati vengono salvati ma nessuna view si aggiorna. Non c'è nessuna garanzia che il refresh avvenga.

**Dove appaiono i callback**:
- `main.ts:65` — dashboard quick action
- `main.ts:155` — ribbon icon
- `app/features/tables/components/TableActions.ts:19` — edit action
- `app/features/tables/components/TableActions.ts:34` — delete action (inline, non callback)
- Vari punti nelle settings (`MuscleTagManagerModal`, `ExerciseConversionModal`, ecc.)

---

## 5. Cascade refresh muscle tags

**File**: `main.ts` righe 344-351

```typescript
public triggerMuscleTagRefresh(): void {
  this.muscleTagService.clearCache();
  this.app.workspace.trigger("workout-planner:muscle-tags-changed", {});
  this.triggerWorkoutLogRefresh();  // <-- chiama clearCache() di nuovo E trigger data-changed
}
```

**Flusso reale**:
1. `triggerMuscleTagRefresh()` → clearCache() + trigger `muscle-tags-changed`
2. → chiama `triggerWorkoutLogRefresh()`
3. → clearCache() ANCORA
4. → trigger `data-changed` (globale, senza contesto)
5. → TUTTI i DataAwareRenderChild si aggiornano

**Problema**: il dashboard si aggiorna due volte — una su `muscle-tags-changed` (se lo ascolta) e una su `data-changed`. Le dashboard widget attuali non ascoltano `muscle-tags-changed` direttamente, ma la doppia-chiamata a `clearCache()` è rumore.

---

## 6. Nessun batching per operazioni bulk

**File**: `app/services/data/WorkoutLogRepository.ts` — ogni operazione chiama `cacheService.clearCache()` individualmente.

**Scenario problematico**: import CSV con 500 righe

```typescript
// Codice di import ipotetico — ogni riga emette un evento
for (const entry of importedEntries) {
  await plugin.addWorkoutLogEntry(entry);  // → clearCache() + trigger data-changed
}
// Risultato: 500 eventi data-changed, 500 re-render, possibile UI freeze
```

Non esiste attualmente un modo per raggruppare mutazioni multiple in un unico evento di refresh.

---

## 7. Nessuna propagazione errori nel bus eventi

**File**: `app/services/core/CodeBlockProcessorService.ts` righe 143-146

```typescript
} catch (error) {
  const errorMessage = ErrorUtils.getErrorMessage(error);
  Feedback.renderError(el, `Error loading chart: ${errorMessage}`);
}
```

Gli errori delle view vengono renderizzati localmente ma non propagati. Se una view fallisce durante un refresh (es. CSV corrotto durante il refresh), l'errore è visibile solo in quella view. Non c'è logging centralizzato, nessun evento di errore a cui altri componenti possano reagire.

---

## 8. TimerRenderChild — logica di lifecycle fragile

**File**: `app/services/core/CodeBlockProcessorService.ts` righe 59-71

```typescript
onunload() {
  const timerId = this.timerView.getId();
  if (!this.persistentId) {
    this.timerView.destroy();
    if (this.activeTimers.has(timerId)) {
      this.activeTimers.delete(timerId);
    }
  }
  // Se ha persistentId — il timer rimane in activeTimers anche dopo DOM removal
}
```

**Problema**: i timer con `persistentId` sopravvivono alla rimozione del code block dalla view, ma il DOM a cui erano collegati è stato rimosso. Al prossimo render dello stesso code block, il timer viene recuperato da `activeTimers` (riga 214: `timerView = this.activeTimers.get(params.id)`) e ri-utilizzato — ma questo richiede che `timerView.createTimer()` sia chiamato con il nuovo container.

Il problema è che non è chiaro quando un timer "persistente" debba essere davvero distrutto. Attualmente sopravvive finché il plugin non viene scaricato.

---

## Riepilogo Severità

| # | Problema | Severità | Breaking? | Frequenza |
|---|----------|----------|-----------|-----------|
| 1 | Nessun contesto operazione | Alta | No | Ogni mutazione |
| 2 | Filtraggio string-based | Alta | No | Ogni refresh |
| 3 | Cache come side effect | Media | No | Ogni mutazione |
| 4 | Callback modali | Alta | No | Ogni apertura modale |
| 5 | Cascade muscle tags | Bassa | No | Ogni cambio muscle tag |
| 6 | Nessun batching | Alta | No | Solo operazioni bulk |
| 7 | Nessun error bus | Media | No | Ogni errore view |
| 8 | Timer lifecycle fragile | Media | No | Ogni ricarica nota |
