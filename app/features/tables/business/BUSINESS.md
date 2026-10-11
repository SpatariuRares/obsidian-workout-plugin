# Tables Business Layer

> Documentazione tecnica dei moduli in `app/features/tables/business/`

---

## Panoramica

Il layer `business/` contiene la logica pura delle tabelle workout, separata dalla UI e dal rendering.
Tutti i moduli sono classi statiche senza stato interno, consumate principalmente da `EmbeddedTableView`.

```
EmbeddedTableView (view layer)
  |
  |-- TableDataProcessor.processTableData() --> Trasforma dati in righe/colonne
  |-- TargetCalculator.*()                --> Calcoli obiettivi (usato da UI)
```

---

## Moduli

### 1. Parametri del blocco (`../tableBlock.ts`)

Parametri, tipi, default (limit: 50, sortBy: date, sortOrder: desc, showAddButton e showProtocol: true) e valori ammessi stanno nello schema `tableBlock`. `CodeBlockProcessorService` legge il blocco con `tableBlock.parse()`, mostra gli errori al posto della tabella e passa alla view i parametri con i default già applicati. I modali scrivono con `tableBlock.serialize()` (inserimento) e `CodeBlockEditorService.patchCodeBlock()` (modifica).

---

### 2. TableDataProcessor

**File**: `TableDataProcessor.ts`
**Scopo**: Trasforma i dati filtrati in struttura `TableData` (headers + rows) pronta per il rendering.

**Metodi pubblici**:

| Metodo               | Input                                                | Output               | Cosa fa                                                                          |
| -------------------- | ---------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `processTableData()` | `WorkoutLogData[]`, `EmbeddedTableParams`, `plugin?` | `Promise<TableData>` | Ordina per data, limita, determina colonne, genera righe. Entry point principale |

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

4. **`processRows()`**: Per ogni log mappa ogni header al valore tramite `fieldKey()` (`app/services/exercise/ExerciseFields.ts`), l'unico punto che sa che `Wgt (kg)`, `weight`, `HR`, `heart rate` indicano lo stesso campo. I custom field si confrontano ignorando maiuscole, spazi, `_` e `-` (una colonna CSV `heartrate` riempie la colonna HR).

5. **`columnHeader()` / `userColumns()` / `formatParameterHeader()`**: Header standard di un campo (`Rep`, `Wgt (kg)`, `Dur (min)`); le colonne scritte in `columns:` (`reps`, `weight`…) diventano gli stessi header, tradotti dal renderer. I parametri custom mostrano la loro label con l'unita'.

6. **`formatCustomFieldValue()`**: Formatta valori custom: `0` e vuoto -> "N/A", altrimenti stringa.

**Consumato da**: `EmbeddedTableView.renderTable()` - dopo il filtraggio, produce i dati per `TableRenderer`.

---

### 4. TargetCalculator

**File**: `TargetCalculator.ts`
**Scopo**: Calcoli puri per il sistema di progressive overload (obiettivi peso/ripetizioni).

**Metodi**:

| Metodo                        | Input                                  | Output                                      | Cosa fa                                                                      |
| ----------------------------- | -------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `calculateBestRepsAtWeight()` | `targetWeight`, `WorkoutLogData[]`     | `number`                                    | Trova il massimo reps raggiunto a un peso specifico                          |
| `checkTargetAchieved()`       | `targetWeight`, `targetReps`, `data[]` | `boolean`                                   | Controlla se l'ultimo allenamento al peso target ha raggiunto le reps target |
| `calculateProgressPercent()`  | `bestReps`, `targetReps`               | `number` (0-100)                            | Percentuale di progresso (capped a 100)                                      |
| `getProgressLevel()`          | `progressPercent`                      | `"complete" \| "high" \| "medium" \| "low"` | Classifica il livello: >=100 complete, >=90 high, >=50 medium, <50 low       |

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
  - tableBlock.parse(source): parametri tipizzati + errori, poi i default
  - Carica dati raw da WorkoutLogFile (via `plugin.getWorkoutLogData()`)
       |
       v
EmbeddedTableView.createTable(container, logData, params)
       |
       v
  1. BaseView.filterData(logData, params)         -- DataFilter (dateRange/fuzzy/exact/protocol)
       |
  2. TableDataProcessor.processTableData(filtered) -- headers + rows
       |
  3. TableRenderer.renderTable(tableData)          -- DOM (fuori da business/)
       |
  [click refresh]
       |
  4. EmbeddedTableView.refreshTable(...)           -- ricarica + re-render (errori nella tabella)
```

---

## Tipi principali

| Tipo                  | File       | Descrizione                                                           |
| --------------------- | ---------- | --------------------------------------------------------------------- |
| `EmbeddedTableParams` | `types.ts` | Parametri del code block, ricavati dallo schema `tableBlock`          |
| `TableData`           | `types.ts` | Output di processTableData: headers, rows, totalRows, filterResult    |
| `TableRow`            | `types.ts` | Singola riga: displayRow[], originalDate, dateKey, originalLog        |

---

## Test

Ogni modulo ha la propria test suite in `__tests__/`:

| Modulo               | Test file                    | Test | Copertura                                                |
| -------------------- | ---------------------------- | ---- | -------------------------------------------------------- |
| `TableDataProcessor` | `TableDataProcessor.test.ts` | 20+  | Headers dinamici, sorting, limiting, custom fields       |
| `TargetCalculator`   | `TargetCalculator.test.ts`   | 14   | Calcoli best reps, target achieved, progress, edge cases |
