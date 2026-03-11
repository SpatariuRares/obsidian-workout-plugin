# Fase 5 — Disaccoppiamento Modali

## Obiettivo
Rimuovere il pattern callback dalle modali. Le modali non hanno più bisogno di ricevere `onLogCreated?: (ctx) => void` — gli eventi vengono emessi automaticamente dal repository (Fase 2) e le view si aggiornano da sole (Fase 4).

## Prerequisiti
- Fase 2 (repository emette eventi)
- Fase 4 (EventAwareRenderChild ascolta eventi)

## Cosa cambia
| File | Tipo cambiamento |
|------|-----------------|
| `app/features/modals/log/CreateLogModal.ts` | Rimuove `onLogCreated` callback |
| `app/features/modals/log/EditLogModal.ts` | Rimuove callback |
| `app/features/modals/base/BaseLogModal.ts` | Rimuove `onComplete` / `onLogCreated` |
| `main.ts` | Rimuove lambda `(ctx) => triggerWorkoutLogRefresh(ctx)` |
| `app/features/tables/components/TableActions.ts` | Rimuove callback da EditLogModal |
| `app/features/modals/base/__tests__/BaseLogModal.test.ts` | Aggiornare test |

## Cosa NON cambia ancora
- `triggerWorkoutLogRefresh()` in `main.ts` rimane per backward compat (possibili usi esterni)
- `triggerMuscleTagRefresh()` rimane (viene semplificato nella stessa fase)

---

## Analisi: dove appaiono i callback

### 1. `main.ts` — createLogModalHandler (riga 60-68)
```typescript
// PRIMA
new CreateLogModal(
  this.app, this, undefined, undefined,
  (ctx) => { this.triggerWorkoutLogRefresh(ctx); },  // ← callback
  undefined, true,
).open();
```

### 2. `main.ts` — updateQuickLogRibbon (riga 149-159)
```typescript
// PRIMA
new CreateLogModal(
  this.app, this, undefined, undefined,
  (ctx) => { this.triggerWorkoutLogRefresh(ctx); },  // ← stesso callback
  undefined, true,
).open();
```

### 3. `app/features/tables/components/TableActions.ts` — handleEdit (riga 19-21)
```typescript
// PRIMA
const modal = new EditLogModal(plugin.app, plugin, log, (ctx) => {
  plugin.triggerWorkoutLogRefresh(ctx);  // ← callback
});
```

### 4. Vari altri punti (settings, muscle tag manager, exercise conversion)
Da verificare con: `grep -r "triggerWorkoutLogRefresh" app/`

---

## Modifiche a `BaseLogModal`

La classe base gestisce il pattern callback. Qui lo rimuoviamo.

```typescript
// PRIMA — BaseLogModal constructor (ipotetico)
constructor(
  app: App,
  protected plugin: WorkoutChartsPlugin,
  protected exerciseName?: string,
  protected currentPageLink?: string,
  protected onComplete?: (context?: WorkoutDataChangedEvent) => void,
) {
  super(app);
}

// DOPO — senza onComplete
constructor(
  app: App,
  protected plugin: WorkoutChartsPlugin,
  protected exerciseName?: string,
  protected currentPageLink?: string,
) {
  super(app);
}
```

Il metodo che chiama `onComplete` (probabilmente in `handleFormSubmit` o simile):

```typescript
// PRIMA — BaseLogModal dopo submit
protected async handleFormSubmit(data: LogFormData): Promise<void> {
  try {
    await this.handleSubmit(data);  // chiama addWorkoutLogEntry / updateWorkoutLogEntry

    // Evento log:added viene già emesso dal repository (Fase 2)
    // Workspace event per timer (backward compat — Fase 4 gestisce con eventBus)
    this.plugin.app.workspace.trigger("workout-planner:log-added", {
      exercise: data.exercise,
      workout: data.workout,
    });

    // PRIMA: chiamava onComplete che chiamava triggerWorkoutLogRefresh
    this.onComplete?.({
      exercise: data.exercise,
      workout: data.workout,
    });

    new Notice(this.getSuccessMessage());
    this.close();
  } catch (error) {
    // gestione errore
  }
}

// DOPO — senza callback, senza workspace.trigger (eventBus gestisce tutto)
protected async handleFormSubmit(data: LogFormData): Promise<void> {
  try {
    await this.handleSubmit(data);
    // Il repository emette l'evento al bus (Fase 2)
    // CSVCacheService si auto-invalida (Fase 3)
    // EventAwareRenderChild si aggiorna (Fase 4)
    // Niente da fare qui!
    new Notice(this.getSuccessMessage());
    this.close();
  } catch (error) {
    // gestione errore
  }
}
```

**ATTENZIONE**: Il workspace.trigger `log-added` era usato da `TimerRenderChild` per auto-start. Dopo la Fase 4, `TimerRenderChild` usa `eventBus.on('log:added')` invece. Quindi il workspace.trigger diventa ridondante.

Tuttavia, se vogliamo mantenere backward compat per plugin terzi che potrebbero ascoltare `workout-planner:log-added`, possiamo mantenerlo o delegarlo all'`ObsidianEventBridge`.

**Decisione**: rimuoverlo dalla modal (è responsabilità del bridge se necessario).

---

## Modifiche a `CreateLogModal`

```typescript
// PRIMA
export class CreateLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    onLogCreated?: (context?: WorkoutDataChangedEvent) => void,  // ← rimuovere
    initialValues?: Partial<LogFormData>,
    currentWorkoutDoesntExist = false,
  ) {
    super(app, plugin, exerciseName, currentPageLink, onLogCreated);  // ← rimuovere
    // ...
  }
}

// DOPO
export class CreateLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    exerciseName?: string,
    currentPageLink?: string,
    // onLogCreated rimosso
    initialValues?: Partial<LogFormData>,
    currentWorkoutDoesntExist = false,
  ) {
    super(app, plugin, exerciseName, currentPageLink);
    // ...
  }
}
```

**NOTA**: cambiare la firma del constructor è un breaking change. Tutti i call site devono essere aggiornati. Fare grep completo prima di procedere.

---

## Modifiche a `EditLogModal`

```typescript
// PRIMA
export class EditLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    private originalLog: WorkoutLogData,
    onLogEdited?: (context?: WorkoutDataChangedEvent) => void,  // ← rimuovere
  ) {
    super(app, plugin, originalLog.exercise, undefined, onLogEdited);
  }
}

// DOPO
export class EditLogModal extends BaseLogModal {
  constructor(
    app: App,
    plugin: WorkoutChartsPlugin,
    private originalLog: WorkoutLogData,
  ) {
    super(app, plugin, originalLog.exercise, undefined);
  }
}
```

---

## Modifiche a `main.ts` — createLogModalHandler e ribbon

```typescript
// PRIMA
new CreateLogModal(
  this.app, this, undefined, undefined,
  (ctx) => { this.triggerWorkoutLogRefresh(ctx); },
  undefined, true,
).open();

// DOPO
new CreateLogModal(
  this.app, this,
  undefined, undefined,  // exercise, pageLink
  undefined, true,       // initialValues, currentWorkoutDoesntExist
).open();
```

---

## Modifiche a `TableActions`

```typescript
// PRIMA
static handleEdit(log: WorkoutLogData, plugin: WorkoutChartsPlugin): void {
  const modal = new EditLogModal(plugin.app, plugin, log, (ctx) => {
    plugin.triggerWorkoutLogRefresh(ctx);  // ← rimuovere
  });
  modal.open();
}

// DOPO
static handleEdit(log: WorkoutLogData, plugin: WorkoutChartsPlugin): void {
  const modal = new EditLogModal(plugin.app, plugin, log);
  modal.open();
}
```

---

## Semplificare `triggerMuscleTagRefresh` in `main.ts`

```typescript
// PRIMA
public triggerMuscleTagRefresh(): void {
  this.muscleTagService.clearCache();
  this.app.workspace.trigger("workout-planner:muscle-tags-changed", {});
  this.triggerWorkoutLogRefresh();  // cascade ridondante
}

// DOPO (con eventBus)
public triggerMuscleTagRefresh(): void {
  this.muscleTagService.clearCache();
  // Emetti direttamente sul bus — EventAwareRenderChild con muscleTagsAware=true si aggiorna
  this.eventBus.emit({ type: 'muscle-tags:changed', payload: {} });
  // NON chiamare più triggerWorkoutLogRefresh — già gestito sopra
}
```

**NOTA**: se esistono punti del codice che ascoltano `workout-planner:muscle-tags-changed` via `workspace.on`, dovranno essere migrati per usare `eventBus.on('muscle-tags:changed')` o aggiungiamo il bridge.

---

## Semplificare `triggerWorkoutLogRefresh` in `main.ts`

Dopo la Fase 5, `triggerWorkoutLogRefresh` non viene più chiamato dalle modali. Può rimanere come utility per:
- Refresh manuale dall'utente (comando "Refresh views")
- Backward compat con plugin terzi

```typescript
// DOPO — funzione ridotta
public triggerWorkoutLogRefresh(context?: WorkoutDataChangedEvent): void {
  // Manteniamo per backward compat — forza refresh globale via workspace
  this.app.workspace.trigger("workout-planner:data-changed", context ?? {});
}
```

Oppure, se vogliamo rimuoverlo completamente:
```typescript
// Se nessun plugin terzo lo usa, rimuovere
// Ma attenzione: è usato da CodeBlockProcessorService.test.ts e altri test
```

**Decisione consigliata**: mantenerlo come shortcut pubblico ma documentare che non è più il meccanismo primario.

---

## Ricerca completa dei call site

Prima di implementare, eseguire queste grep per trovare tutti i punti da aggiornare:

```bash
# Tutti i posti che usano onLogCreated / onComplete callback
grep -r "triggerWorkoutLogRefresh" app/ --include="*.ts"
grep -r "onLogCreated" app/ --include="*.ts"
grep -r "CreateLogModal" app/ --include="*.ts"
grep -r "EditLogModal" app/ --include="*.ts"
grep -r "log-added" app/ --include="*.ts"
grep -r "workspace.trigger" app/ --include="*.ts"
```

---

## Checklist Fase 5

- [x] Grep completo dei call site (vedere sezione sopra)
- [x] Modificare `BaseLogModal` — rimuovere `onComplete` param e chiamate
- [x] Modificare `CreateLogModal` — rimuovere `onLogCreated` param
- [x] Modificare `EditLogModal` — rimuovere callback param
- [x] Aggiornare `main.ts` — rimuovere lambda callback da CreateLogModal (×2)
- [x] Aggiornare `TableActions.handleEdit()` — rimuovere callback
- [x] Semplificare `triggerMuscleTagRefresh()` — usa eventBus
- [x] Aggiornare `LogCallouts` — rimuovere `onRefresh`/`onLogCreated` params
- [x] Aggiornare `EmbeddedTableView` — rimuovere callback da renderAddLogButton
- [x] Aggiornare `BaseView` — aggiornare call site renderCsvNoDataMessage
- [x] Aggiornare `CodeBlockProcessorService` — aggiornare call site renderCsvNoDataMessage
- [x] Aggiornare test `TableActions.test.ts`
- [x] Aggiornare test `LogCallouts.test.ts`
- [x] Aggiornare test `EmbeddedTableView.test.ts`
- [x] Aggiornare test `CodeBlockProcessorService.test.ts`
- [x] `npm test` — 75/75 suite passano (1213 passed, 4 skipped)
- [x] `npm run build` — nessun errore TypeScript
- [x] Test manuale: creare log → tabella si aggiorna, grafico si aggiorna
- [x] Test manuale: modificare log → tabella si aggiorna
- [x] Test manuale: eliminare log → tabella si aggiorna

## Rischi Fase 5
**Medio-alto** — cambia l'API pubblica delle modali. I test esistenti devono essere aggiornati. Il rischio principale è dimenticare un call site (grep aiuta a mitigare).

**Breaking change**: chiunque crei una `CreateLogModal` con il 5° parametro callback dovrà aggiornare il codice. Se la modal viene usata esternamente (es. `WorkoutPlannerAPI`), valutare una deprecation graduale.
