# Migration Guide: reps/weight/volume into customFields

## Il problema attuale

`WorkoutLogData` ha un'asimmetria nel data model:

```typescript
interface WorkoutLogData {
  reps: number;        // campo diretto (sempre presente)
  weight: number;      // campo diretto (sempre presente)
  volume: number;      // campo diretto (derivato: reps * weight)
  customFields?: Record<string, string | number | boolean>;  // tutto il resto
}
```

`reps`, `weight`, `volume` sono parametri specifici degli esercizi di forza, ma sono trattati come campi universali. Tutti gli altri parametri (duration, distance, heartRate, custom) vivono in `customFields`.

Questo crea:
- Due percorsi di aggregazione nei charts (`log.volume` vs `ChartDataExtractor.getCustomFieldNumber(log.customFields, "duration")`)
- Codice speciale ovunque per skippare reps/weight dai customFields
- Colonne CSV sempre presenti ma spesso a 0 per esercizi non-strength
- `volume` come campo derivato (`reps * weight`) hardcodato nel codice

## Impatto: cosa tocca la migrazione

**120+ riferimenti diretti** a `.reps`, `.weight`, `.volume` in **31 file TypeScript**.

### Per layer

| Layer | File coinvolti | Complessita |
|-------|---------------|-------------|
| Type definitions | 3 file | Alta - struttura base |
| CSV parsing/writing | 3 file | Alta - formato dati |
| Business logic | 10 file | Alta - calcoli e aggregazioni |
| UI/rendering | 7 file | Media - display e form |
| Constants/config | 5 file | Bassa - label e opzioni |
| Tests | 6+ file | Media - aggiornamento test |
| Public API | 1 file | Alta - breaking change esterna |

### File ad alto impatto

| File | Riferimenti | Cosa fa |
|------|------------|---------|
| `WorkoutLogData.ts` | ~25 | Interfaccia, CSV parsing, CSV serializzazione |
| `DataAggregation.ts` | ~8 | Tutte le aggregazioni usano `.volume` |
| `ChartDataUtils.ts` | ~10 | Aggregazione chart (avg vs sum) |
| `WorkoutPlannerAPI.ts` | ~12 | API pubblica, stats, trend |
| `LogSubmissionHandler.ts` | ~6 | Creazione entry da form |
| `ExerciseConversionService.ts` | ~10 | Conversione tipo esercizio |
| `TargetCalculator.ts` | ~5 | Progressive overload |
| `WorkoutLogRepository.ts` | ~4 | CSV I/O, entry matching |

## Strategia: migrazione in 4 fasi

### Fase 1: Layer di normalizzazione (non-breaking)

Creare funzioni accessor che astraggono l'accesso ai campi. Tutto il codice migra a usare queste funzioni invece di accedere ai campi direttamente.

#### 1.1 Creare `app/utils/data/WorkoutFieldAccessor.ts`

```typescript
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

/**
 * Unified field access layer.
 * Currently reads from direct fields (reps, weight, volume).
 * After migration, will read from customFields.
 */

/** Get a numeric field value from a workout log entry */
export function getFieldValue(log: WorkoutLogData, key: string): number {
  // Phase 1: direct fields take priority
  switch (key) {
    case "reps":
      return log.reps ?? 0;
    case "weight":
      return log.weight ?? 0;
    case "volume":
      return log.volume ?? 0;
    default:
      return getCustomFieldNumber(log.customFields, key);
  }
}

/** Check if a log entry has meaningful data for a field */
export function hasFieldValue(log: WorkoutLogData, key: string): boolean {
  return getFieldValue(log, key) > 0;
}

/** Check if a log entry is a strength exercise (has reps or weight) */
export function isStrengthEntry(log: WorkoutLogData): boolean {
  return getFieldValue(log, "reps") > 0 || getFieldValue(log, "weight") > 0;
}

/** Calculate volume (derived field) */
export function calculateVolume(log: WorkoutLogData): number {
  return getFieldValue(log, "reps") * getFieldValue(log, "weight");
}

function getCustomFieldNumber(
  customFields: Record<string, string | number | boolean> | undefined,
  key: string,
): number {
  if (!customFields) return 0;
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(customFields)) {
    if (k.toLowerCase() === lowerKey) {
      return typeof v === "number" ? v : parseFloat(String(v)) || 0;
    }
  }
  return 0;
}
```

#### 1.2 Migrare i consumatori (file per file)

Ordine consigliato per la migrazione dei consumatori:

**Passo 1 - Business logic** (logica pura, facile da testare):

```typescript
// PRIMA (DataAggregation.ts)
data.reduce((sum, d) => sum + d.volume, 0)

// DOPO
import { getFieldValue } from "@app/utils/data/WorkoutFieldAccessor";
data.reduce((sum, d) => sum + getFieldValue(d, "volume"), 0)
```

```typescript
// PRIMA (ChartDataUtils.ts)
existing.volume += log.volume || 0;
existing.weight += log.weight || 0;
existing.reps += log.reps || 0;

// DOPO
existing.volume += getFieldValue(log, "volume");
existing.weight += getFieldValue(log, "weight");
existing.reps += getFieldValue(log, "reps");
```

```typescript
// PRIMA (TargetCalculator.ts)
data.filter((entry) => entry.weight === targetWeight)

// DOPO
data.filter((entry) => getFieldValue(entry, "weight") === targetWeight)
```

```typescript
// PRIMA (SpacerRowCalculator.ts)
if (log.reps > 0 || log.weight > 0)

// DOPO
if (isStrengthEntry(log))
```

**Passo 2 - Charts** (unifica i due percorsi di aggregazione):

```typescript
// PRIMA (ChartDataUtils.ts) - due percorsi diversi
existing.volume += log.volume || 0;                                    // diretto
existing.duration += ChartDataExtractor.getCustomFieldNumber(log.customFields, "duration"); // custom

// DOPO - un solo percorso
existing.volume += getFieldValue(log, "volume");
existing.duration += getFieldValue(log, "duration");
existing.distance += getFieldValue(log, "distance");
existing.heartRate += getFieldValue(log, "heartRate");
```

Questo elimina `ChartDataExtractor.getCustomFieldNumber()` - la sua logica e' gia' in `getFieldValue()`.

**Passo 3 - Tables**:

```typescript
// PRIMA (TableRowProcessor.ts)
log.reps?.toString() || NOT_AVAILABLE
log.weight?.toString() || NOT_AVAILABLE

// DOPO
const reps = getFieldValue(log, "reps");
reps > 0 ? reps.toString() : NOT_AVAILABLE
```

**Passo 4 - Forms/Modals**:

```typescript
// PRIMA (LogSubmissionHandler.ts)
if (key === "reps" || key === "weight") continue;  // skip speciale
reps: data.reps || 0,
weight: data.weight || 0,
volume: (data.reps || 0) * (data.weight || 0),

// DOPO - nessun skip, tutti i campi sono in customFields
volume: calculateVolume(data),  // derivato
```

**Passo 5 - API pubblica**:

```typescript
// PRIMA (WorkoutPlannerAPI.ts)
reps: log.reps,
weight: log.weight,
volume: log.volume,

// DOPO
reps: getFieldValue(log, "reps"),
weight: getFieldValue(log, "weight"),
volume: getFieldValue(log, "volume"),
```

#### 1.3 Checklist file da migrare

Business logic:
- [ ] `app/utils/data/DataAggregation.ts` (8 ref: volume, weight aggregazioni)
- [ ] `app/features/charts/business/ChartDataUtils.ts` (10 ref: aggregazione dati chart)
- [ ] `app/features/charts/business/ChartDataExtractor.ts` (3 ref: switch volume/weight/reps)
- [ ] `app/features/tables/business/TargetCalculator.ts` (5 ref: weight/reps per target)
- [ ] `app/features/tables/business/SpacerRowCalculator.ts` (4 ref: volume/weight/reps somme)
- [ ] `app/features/dashboard/widgets/muscle-heat-map/business/MuscleDataCalculator.ts` (6 ref: volume)
- [ ] `app/features/dashboard/widgets/muscle-heat-map/business/MuscleBalanceAnalyzer.ts` (3 ref: volume)
- [ ] `app/features/dashboard/widgets/protocol-effectiveness/ProtocolEffectiveness.ts` (2 ref: weight, volume)
- [ ] `app/features/exercise-conversion/logic/ExerciseConversionService.ts` (10 ref: reps/weight/volume get/set)

UI/Rendering:
- [ ] `app/features/tables/business/TableRowProcessor.ts` (3 ref: display)
- [ ] `app/features/modals/base/BaseLogModal.ts` (5 ref: prefill form)
- [ ] `app/features/modals/base/components/LogFormRenderer.ts` (2 ref: last entry prefill)
- [ ] `app/features/modals/base/logic/LogSubmissionHandler.ts` (6 ref: extract/create entry)
- [ ] `app/features/modals/log/EditLogModal.ts` (4 ref: original log)
- [ ] `app/features/modals/log/CreateLogModal.ts` (2 ref: prefill)
- [ ] `app/components/organism/LogCallouts.ts` (2 ref: latest entry display)

API:
- [ ] `app/api/WorkoutPlannerAPI.ts` (12 ref: stats, trends, format)

CSV layer (fase 2):
- [ ] `app/types/WorkoutLogData.ts` (25 ref: interface, parsing, serializzazione)
- [ ] `app/services/data/WorkoutLogRepository.ts` (4 ref: header, entry matching)
- [ ] `app/services/examples/ExampleGeneratorService.ts` (1 ref: CSV row generation)

Tests:
- [ ] `app/types/__tests__/WorkoutLogData.test.ts`
- [ ] `app/utils/__tests__/DataAggregation.test.ts`
- [ ] `app/features/dashboard/__tests__/DashboardCalculations.test.ts`
- [ ] `app/utils/__tests__/ParameterUtils.test.ts`
- [ ] `app/services/core/__tests__/CodeBlockProcessorService.test.ts`
- [ ] `app/features/tables/views/__tests__/EmbeddedTableView.test.ts`

### Fase 2: Migrazione CSV (breaking change)

Dopo che tutti i consumatori usano `WorkoutFieldAccessor`, il formato CSV puo' cambiare.

#### 2.1 Nuovo formato CSV

```
PRIMA:
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,distance,duration

DOPO:
date,exercise,origine,workout,timestamp,notes,protocol,reps,weight,volume,distance,duration
```

`reps`, `weight`, `volume` diventano colonne custom come `distance` e `duration`. L'ordine delle colonne custom e' gestito da `CSVColumnService.getCustomColumns()`.

#### 2.2 Comando di migrazione

Creare un comando Obsidian per migrare i CSV esistenti:

```typescript
// app/services/data/CSVMigrationService.ts

export class CSVMigrationService {
  constructor(
    private app: App,
    private settings: WorkoutChartsSettings,
  ) {}

  async migrateToUnifiedFields(): Promise<MigrationResult> {
    const csvPath = this.settings.csvFilePath;
    const file = this.app.vault.getFileByPath(csvPath);
    if (!file) return { success: false, error: "CSV file not found" };

    // 1. Leggere il CSV attuale
    const content = await this.app.vault.read(file);
    const lines = content.split("\n");
    const header = lines[0];

    // 2. Verificare se gia' migrato
    const columns = header.split(",");
    const standardCols = ["date", "exercise", "origine", "workout", "timestamp", "notes", "protocol"];
    if (!columns.includes("reps") || columns.indexOf("reps") > standardCols.length) {
      return { success: true, message: "Already migrated" };
    }

    // 3. Backup
    const backupPath = csvPath.replace(".csv", `_backup_${Date.now()}.csv`);
    await this.app.vault.create(backupPath, content);

    // 4. Ricostruire header
    //    Le colonne standard restano: date, exercise, origine, workout, timestamp, notes, protocol
    //    reps, weight, volume diventano custom columns (in coda)
    const newStandardCols = ["date", "exercise", "origine", "workout", "timestamp", "notes", "protocol"];
    const oldCustomStart = STANDARD_CSV_COLUMNS.length; // 10
    const existingCustomCols = columns.slice(oldCustomStart);
    const newCustomCols = ["reps", "weight", "volume", ...existingCustomCols];

    // 5. Riscrivere ogni riga con nuovo ordine colonne
    const newHeader = [...newStandardCols, ...newCustomCols].join(",");
    const newLines = [newHeader];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseCSVLine(lines[i]);
      // Mappa vecchie posizioni alle nuove
      const newValues = [
        values[0], // date
        values[1], // exercise
        values[5], // origine
        values[6], // workout
        values[7], // timestamp
        values[8], // notes
        values[9], // protocol
        values[2], // reps (ora custom)
        values[3], // weight (ora custom)
        values[4], // volume (ora custom)
        ...values.slice(oldCustomStart), // existing custom columns
      ];
      newLines.push(newValues.join(","));
    }

    // 6. Scrivere il file migrato
    await this.app.vault.modify(file, newLines.join("\n"));

    return {
      success: true,
      message: `Migrated ${newLines.length - 1} entries. Backup: ${backupPath}`,
    };
  }
}
```

Registrare il comando in `CommandHandlerService`:

```typescript
this.plugin.addCommand({
  id: "migrate-csv-unified-fields",
  name: "Migrate CSV to unified field format",
  callback: async () => {
    const confirm = await new ConfirmModal(
      this.plugin.app,
      "This will restructure your CSV file. A backup will be created. Continue?",
    ).waitForResult();

    if (confirm) {
      const service = new CSVMigrationService(this.plugin.app, this.plugin.settings);
      const result = await service.migrateToUnifiedFields();
      new Notice(result.message);
    }
  },
});
```

#### 2.3 Aggiornare il CSV parser

```typescript
// PRIMA (WorkoutLogData.ts)
const STANDARD_CSV_COLUMNS = [
  "date", "exercise", "reps", "weight", "volume",
  "origine", "workout", "timestamp", "notes", "protocol"
];

// DOPO
const STANDARD_CSV_COLUMNS = [
  "date", "exercise",
  "origine", "workout", "timestamp", "notes", "protocol"
];
// reps, weight, volume sono ora custom columns
```

Il parser gia' gestisce le custom columns dinamicamente. Dopo la migrazione, `reps`/`weight`/`volume` verranno parsate automaticamente come customFields.

#### 2.4 Aggiornare WorkoutFieldAccessor

```typescript
// Fase 2: customFields ha priorita'
export function getFieldValue(log: WorkoutLogData, key: string): number {
  // Try customFields first (post-migration format)
  const customValue = getCustomFieldNumber(log.customFields, key);
  if (customValue !== 0) return customValue;

  // Fallback to direct fields (pre-migration backward compat)
  switch (key) {
    case "reps": return log.reps ?? 0;
    case "weight": return log.weight ?? 0;
    case "volume": return log.volume ?? 0;
    default: return 0;
  }
}
```

### Fase 3: Rimuovere i campi diretti dall'interfaccia

Dopo che tutti gli utenti hanno migrato (o dopo un periodo di transizione), rendere i campi opzionali e poi rimuoverli:

```typescript
// Fase 3a: campi opzionali con deprecation
interface WorkoutLogData {
  /** @deprecated Use getFieldValue(log, "reps") instead */
  reps?: number;
  /** @deprecated Use getFieldValue(log, "weight") instead */
  weight?: number;
  /** @deprecated Use getFieldValue(log, "volume") instead */
  volume?: number;
  customFields?: Record<string, string | number | boolean>;
}

// Fase 3b: rimozione completa
interface WorkoutLogData {
  date: string;
  exercise: string;
  file?: TFile;
  origine?: string;
  workout?: string;
  notes?: string;
  timestamp?: number;
  protocol?: WorkoutProtocol;
  customFields?: Record<string, string | number | boolean>;
}
```

### Fase 4: Aggiornare l'API pubblica

```typescript
// PRIMA
interface DataviewWorkoutLog {
  reps: number;
  weight: number;
  volume: number;
}

// DOPO - breaking change per Dataview users
interface DataviewWorkoutLog {
  reps: number;        // estratto da customFields
  weight: number;      // estratto da customFields
  volume: number;      // estratto da customFields
  customFields?: Record<string, string | number | boolean>;
}
```

L'API pubblica puo' continuare a esporre `reps`/`weight`/`volume` come campi di primo livello per backward compatibility, estraendoli internamente da customFields.

## Casi speciali da gestire

### 1. Volume come campo derivato

`volume = reps * weight` e' attualmente calcolato in `LogSubmissionHandler.ts:91-93` e in `ExerciseConversionService.ts:111`.

Dopo la migrazione, `volume` resta un campo derivato. Opzioni:
- **A)** Continuare a salvarlo nel CSV (ridondante ma veloce per aggregazioni)
- **B)** Calcolarlo on-the-fly (elimina ridondanza, ma rallenta aggregazioni)

**Raccomandazione**: Opzione A - continuare a salvare volume nel CSV. Il costo di storage e' trascurabile e le aggregazioni sono molto frequenti.

### 2. Entry identification fallback

`WorkoutLogRepository.ts:148-149` usa `reps/weight` come fallback per identificare entry quando il timestamp non e' disponibile:

```typescript
entry.reps === originalLog.reps && entry.weight === originalLog.weight
```

Dopo la migrazione, usare `getFieldValue()`:

```typescript
getFieldValue(entry, "reps") === getFieldValue(originalLog, "reps") &&
getFieldValue(entry, "weight") === getFieldValue(originalLog, "weight")
```

### 3. Validazione entry con reps <= 0

`WorkoutLogData.ts:195` accetta entry con `reps <= 0` se hanno custom data validi. Dopo la migrazione, questa logica diventa:

```typescript
// Tutti i campi sono custom, verifica che almeno uno abbia un valore > 0
const hasAnyValue = Object.values(entry.customFields || {}).some(
  v => typeof v === "number" && v > 0
);
```

### 4. Form handling: skip reps/weight

`LogSubmissionHandler.ts:49` fa `if (key === "reps" || key === "weight") continue` per evitare di mettere reps/weight nei customFields. Dopo la migrazione, questo skip va rimosso - reps e weight diventano customFields normali.

### 5. DynamicFieldsRenderer: step speciali per reps/weight

`DynamicFieldsRenderer.ts:138-178` ha logica speciale per determinare lo step dei campi reps e weight. Questa logica e' gia' basata su `param.key`, quindi funzionera' senza modifiche anche dopo la migrazione.

### 6. ExerciseConversionService: clearing fields

`ExerciseConversionService.ts:94-97` azzera reps/weight quando si converte a un tipo non-strength:

```typescript
if (!targetFieldKeys.has("reps")) updatedEntry.reps = 0;
if (!targetFieldKeys.has("weight")) updatedEntry.weight = 0;
```

Dopo la migrazione, questo diventa la rimozione del campo da customFields (gia' implementato per gli altri campi alle righe successive).

## Rischi e mitigazioni

| Rischio | Probabilita | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Dati persi durante migrazione CSV | Bassa | Critico | Backup automatico prima della migrazione |
| Plugin di terze parti che usano API pubblica | Media | Alto | Mantenere campi nell'API, estrarre da customFields |
| Performance aggregazioni | Bassa | Medio | `getFieldValue` e' O(n) su customFields, ma n e' piccolo (5-10 campi) |
| Utenti non migrano il CSV | Media | Medio | Backward compat nel parser per entrambi i formati |
| Test regressions | Alta | Medio | Migrare test insieme ai consumatori |

## Sequenza consigliata di implementazione

```
Fase 1 (non-breaking, incrementale):
  1. Creare WorkoutFieldAccessor.ts + test
  2. Migrare business logic (DataAggregation, ChartDataUtils, TargetCalculator, SpacerRowCalculator)
  3. Migrare charts (ChartDataExtractor - unificare i due percorsi)
  4. Migrare dashboard widgets (MuscleDataCalculator, ProtocolEffectiveness)
  5. Migrare tables (TableRowProcessor)
  6. Migrare modals (LogSubmissionHandler, BaseLogModal, LogFormRenderer)
  7. Migrare ExerciseConversionService
  8. Migrare API pubblica (WorkoutPlannerAPI)
  9. Migrare LogCallouts
  10. npm test - tutti i test devono passare

Fase 2 (breaking CSV change):
  1. Creare CSVMigrationService + test
  2. Registrare comando di migrazione
  3. Aggiornare STANDARD_CSV_COLUMNS
  4. Aggiornare WorkoutFieldAccessor (customFields first)
  5. Aggiornare CSV parser
  6. npm test

Fase 3 (cleanup):
  1. Deprecare campi diretti nell'interfaccia
  2. Rimuovere codice di backward compat dopo N versioni
  3. Aggiornare documentazione

Fase 4 (API):
  1. Major version bump
  2. Aggiornare DataviewWorkoutLog
  3. Documentare breaking changes
```

## Benefici attesi

Dopo la migrazione completa:

1. **Un solo percorso di accesso ai dati** - `getFieldValue(log, key)` per qualsiasi campo
2. **Charts semplificati** - nessun doppio percorso di aggregazione
3. **Forms semplificati** - nessun skip speciale per reps/weight
4. **CSV puliti** - colonne presenti solo se l'esercizio le usa
5. **Estensibilita** - aggiungere un nuovo parametro non richiede modifiche all'interfaccia
6. **`ChartDataExtractor.getCustomFieldNumber()` eliminabile** - la logica e' in `getFieldValue()`
