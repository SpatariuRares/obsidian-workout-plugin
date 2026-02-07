# Tables Business Layer

> Documentazione tecnica dei moduli in `app/features/tables/business/`

---

## Panoramica

Il layer `business/` contiene la logica pura delle tabelle workout, separata dalla UI e dal rendering.
Tutti i moduli sono classi statiche senza stato interno, consumate principalmente da `EmbeddedTableView`.

```
EmbeddedTableView (view layer)
  |
  |-- TableConfig.validateParams()        --> Valida parametri utente
  |-- TableDataLoader.getOptimizedCSVData() --> Carica dati CSV dal plugin
  |-- TableDataProcessor.processTableData() --> Trasforma dati in righe/colonne
  |-- TableRefresh.refreshTable()         --> Invalida cache e ri-renderizza
  |-- TargetCalculator.*()                --> Calcoli obiettivi (usato da UI)
```

---

## Moduli

### 1. TableConfig

**File**: `TableConfig.ts`
**Scopo**: Configurazione e validazione dei parametri della tabella.

**Metodi**:

| Metodo                 | Input                        | Output               | Cosa fa                                           |
| ---------------------- | ---------------------------- | -------------------- | ------------------------------------------------- |
| `getDefaults()`        | -                            | `EmbeddedTableParams`| Ritorna i valori default (limit: 50, exactMatch, columns) |
| `validateParams()`     | `EmbeddedTableParams`        | `string[]`           | Valida limit (range min-max) e columns (tipo corretto). Ritorna array di errori |
| `hasValidationErrors()`| `string[]`                   | `boolean`            | Controlla se ci sono errori                       |
| `formatValidationErrors()` | `string[]`               | `string`             | Unisce gli errori in stringa per display           |
| `mergeWithDefaults()`  | `Partial<EmbeddedTableParams>` | `EmbeddedTableParams` | Merge parametri utente con i defaults            |

**Consumato da**: `EmbeddedTableView.renderTable()` - prima di ogni render valida i parametri.

---

### 2. TableDataLoader

**File**: `TableDataLoader.ts`
**Scopo**: Caricamento dati CSV con pre-filtraggio ottimizzato.

**Metodi**:

| Metodo                 | Input                                | Output                    | Cosa fa                                                |
| ---------------------- | ------------------------------------ | ------------------------- | ------------------------------------------------------ |
| `getOptimizedCSVData()`| `EmbeddedTableParams`, `plugin`      | `Promise<WorkoutLogData[]>` | Estrae exercise/workout/exactMatch dai params e li passa come filtro early a `plugin.getWorkoutLogData()`. Questo riduce i dati prima del filtraggio complesso in DataFilter |

**Perche' esiste**: Il plugin (`DataService`) supporta un filtro early opzionale che riduce i dati letti dal CSV. Questo modulo fa da ponte tra i parametri tabella e quel filtro, evitando che la view debba conoscere la firma di `getWorkoutLogData()`.

**Consumato da**: `EmbeddedTableView.renderTable()` - dopo la validazione, prima del filtraggio.

---

### 3. TableDataProcessor

**File**: `TableDataProcessor.ts`
**Scopo**: Trasforma i dati filtrati in struttura `TableData` (headers + rows) pronta per il rendering.

**Metodi pubblici**:

| Metodo              | Input                                           | Output              | Cosa fa                                                                       |
| ------------------- | ----------------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `processTableData()`| `WorkoutLogData[]`, `EmbeddedTableParams`, `plugin?` | `Promise<TableData>` | Ordina per data, limita, determina colonne, genera righe. Entry point principale |

**Logica interna** (metodi privati):

1. **`sortAndLimitData()`**: Ordina per data (piu' recente prima) e taglia al limit. Ottimizzato per grandi dataset: evita di ordinare tutto se `length > limit`.

2. **Determinazione colonne** (3 livelli di priorita'):
   - **P1**: `params.columns` esplicito dall'utente (override manuale nel code block)
   - **P2**: `determineColumnsForExercise()` - interroga `ExerciseDefinitionService` per colonne dinamiche basate sul tipo esercizio (forza vs cardio vs timed). Aggiunge Volume se ha sia reps che weight.
   - **P3**: Colonne default statiche (Date, Reps, Weight, Volume + Exercise se vista "all logs")

3. **Colonne opzionali** (aggiunte solo se i dati visibili le contengono):
   - Notes: se almeno un log ha note non vuote
   - Protocol: se `showProtocol !== false` E almeno un log ha protocollo non-standard
   - Duration/Distance/HeartRate: se almeno un log ha il custom field con valore > 0
   - Actions: sempre presente (ultima colonna)

4. **`processRowsEfficiently()`**: Per ogni log, costruisce una `baseDataMap` (chiavi normalizzate) e mappa ogni header alla cella corrispondente. Supporta:
   - Header abbreviati (`Wgt` -> `weight`, `HR` -> `heartrate`) via `HEADER_TO_DATA_KEY`
   - Header con unita' (`Wgt (kg)` -> estrae `wgt` -> mappa a `weight`)
   - Custom fields extra dal log

5. **`formatParameterHeader()`**: Abbrevia i nomi (`Weight` -> `Wgt`, `Duration` -> `Dur`) e aggiunge unita' (`Wgt (kg)`).

6. **`formatCustomFieldValue()`**: Formatta valori custom: `0` e vuoto -> "N/A", altrimenti stringa.

**Consumato da**: `EmbeddedTableView.renderTable()` - dopo il filtraggio, produce i dati per `TableRenderer`.

---

### 4. TableRefresh

**File**: `TableRefresh.ts`
**Scopo**: Logica di refresh della tabella: invalida cache, ricarica dati, ri-renderizza.

**Metodi**:

| Metodo           | Input                                                              | Output          | Cosa fa                                                                      |
| ---------------- | ------------------------------------------------------------------ | --------------- | ---------------------------------------------------------------------------- |
| `refreshTable()` | `plugin`, `container`, `params`, `renderCallback`, `callbacks?`    | `Promise<void>` | 1. `clearLogDataCache()` 2. `getWorkoutLogData()` 3. Chiama la renderCallback con i dati freschi 4. Notifica success/error via callbacks |

**Perche' esiste**: Centralizza la logica di refresh che prima era duplicata inline in `EmbeddedTableView`. Separa il "come ricaricare" dal "come renderizzare" tramite la `renderCallback`.

**Consumato da**: `EmbeddedTableView.refreshTable()` - delega completamente a questo modulo.

---

### 5. TargetCalculator

**File**: `TargetCalculator.ts`
**Scopo**: Calcoli puri per il sistema di progressive overload (obiettivi peso/ripetizioni).

**Metodi**:

| Metodo                      | Input                                    | Output                                  | Cosa fa                                                                     |
| --------------------------- | ---------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| `calculateBestRepsAtWeight()` | `targetWeight`, `WorkoutLogData[]`       | `number`                                | Trova il massimo reps raggiunto a un peso specifico                         |
| `checkTargetAchieved()`     | `targetWeight`, `targetReps`, `data[]`   | `boolean`                               | Controlla se l'ultimo allenamento al peso target ha raggiunto le reps target |
| `calculateProgressPercent()`| `bestReps`, `targetReps`                 | `number` (0-100)                        | Percentuale di progresso (capped a 100)                                     |
| `getProgressLevel()`        | `progressPercent`                        | `"complete" \| "high" \| "medium" \| "low"` | Classifica il livello: >=100 complete, >=90 high, >=50 medium, <50 low  |

**Perche' esiste**: Isola i calcoli dalla UI. Funzioni pure senza side effect, facilmente testabili (14 test).

**Consumato da**:
- `TargetHeader` (UI) - mostra la barra progresso
- `AchievementBadge` (UI) - mostra il badge di obiettivo raggiunto

---

## Flusso dati completo

```
Code block YAML (workout-log)
       |
       v
CodeBlockProcessorService
  - Parsa parametri
  - Applica dateRange (pre-filtro temporale)
       |
       v
EmbeddedTableView.createTable(container, logData, params)
       |
       v
  1. TableConfig.validateParams(params)           -- valida
       |
  2. TableDataLoader.getOptimizedCSVData(params)  -- carica con early filter
       |
  3. BaseView.filterData(data, params)            -- DataFilter (fuzzy/exact match)
       |
  4. TableDataProcessor.processTableData(filtered) -- headers + rows
       |
  5. TableRenderer.renderTable(tableData)          -- DOM (fuori da business/)
       |
  [click refresh]
       |
  6. TableRefresh.refreshTable(...)                -- invalida + ricarica + re-render
```

---

## Tipi principali

| Tipo                  | File        | Descrizione                                         |
| --------------------- | ----------- | --------------------------------------------------- |
| `EmbeddedTableParams` | `types.ts`  | Parametri dal code block YAML (exercise, limit, columns, target...) |
| `TableData`           | `types.ts`  | Output di processTableData: headers, rows, totalRows, filterResult |
| `TableRow`            | `types.ts`  | Singola riga: displayRow[], originalDate, dateKey, originalLog |
| `TableCallbacks`      | `types.ts`  | Callbacks per refresh: onRefresh, onError, onSuccess |
| `TableCodeOptions`    | `types.ts`  | Parametri per CodeGenerator (extends EmbeddedTableParams + tableType) |

---

## Test

Ogni modulo ha la propria test suite in `__tests__/`:

| Modulo               | Test file                     | Test | Copertura                                          |
| -------------------- | ----------------------------- | ---- | -------------------------------------------------- |
| `TableConfig`        | `TableConfig.test.ts`         | 6    | Defaults, validazione limit/columns, merge, errori |
| `TableDataLoader`    | `TableDataLoader.test.ts`     | 4    | Passaggio filtri a plugin, gestione params vuoti   |
| `TableDataProcessor` | `TableDataProcessor.test.ts`  | 20+  | Headers dinamici, sorting, limiting, custom fields |
| `TableRefresh`       | `TableRefresh.test.ts`        | 6    | Cache clear, re-render, callbacks success/error    |
| `TargetCalculator`   | `TargetCalculator.test.ts`    | 14   | Calcoli best reps, target achieved, progress, edge cases |
