# EmbeddedChartView - Analisi Migliorie

## Stato Attuale

Il sistema attualmente supporta questi tipi di esercizi:

| Tipo | Parametri | Chart Data Types Disponibili |
|------|-----------|------------------------------|
| **Strength** | reps, weight | volume, weight, reps |
| **Timed** | duration | duration |
| **Distance** | distance, duration (opt) | distance, duration, pace |
| **Cardio** | duration, distance (opt), heartRate (opt) | duration, distance, heartRate |
| **Custom** | definiti dall'utente | parametri numerici custom |

---

## Problemi Identificati

### 1. TrendCalculator - Inversione Logica per Pace

**File:** `app/services/data/TrendCalculator.ts:32-44`

**Problema:** Il TrendCalculator considera sempre `slope > 0` come miglioramento (verde).
Per il **pace** (min/km), un valore più BASSO è migliore (corri più veloce).

```typescript
// Attuale - sempre slope positivo = verde
if (slope > slopeThreshold) {
  return { trendDirection: "Increasing", trendColor: "green" }; // ✅ per volume
}
```

**Soluzione:** Aggiungere un parametro `inverseLogic` o `dataType`:

```typescript
static getTrendIndicators(
  slope: number,
  volumeData: number[],
  dataType?: CHART_DATA_TYPE // NUOVO
): TrendIndicators {
  const isLowerBetter = dataType === CHART_DATA_TYPE.PACE;

  if (isLowerBetter) {
    // Per pace: slope negativo = miglioramento
    if (slope < -slopeThreshold) {
      return { trendDirection: "Improving", trendColor: "green" };
    } else if (slope > slopeThreshold) {
      return { trendDirection: "Declining", trendColor: "red" };
    }
  }
  // ... logica normale per altri tipi
}
```

---

### 2. StatsBox - Unità Hardcoded "kg"

**File:** `app/features/dashboard/ui/StatsBox.ts:41-53`

**Problema:** Le unità sono hardcoded come "kg":
- Linea 41: `${stats.avgVolume} kg`
- Linea 46: `${stats.maxVolume} kg`
- Linea 52: `${stats.minVolume} kg`
- Linea 124: `+${changeRecentAbs} kg`

**Soluzione:** Passare il `CHART_DATA_TYPE` e usare una mappa unità:

```typescript
const UNITS_MAP: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: "kg",
  [CHART_DATA_TYPE.WEIGHT]: "kg",
  [CHART_DATA_TYPE.REPS]: "",
  [CHART_DATA_TYPE.DURATION]: "sec",
  [CHART_DATA_TYPE.DISTANCE]: "km",
  [CHART_DATA_TYPE.PACE]: "min/km",
  [CHART_DATA_TYPE.HEART_RATE]: "bpm",
};
```

**Inoltre:** Il titolo "Volume Statistics" (linea 32) dovrebbe essere dinamico:
```typescript
const titleMap = {
  volume: "Volume Statistics",
  weight: "Weight Statistics",
  duration: "Duration Statistics",
  distance: "Distance Statistics",
  pace: "Pace Statistics",
  heartRate: "Heart Rate Statistics",
};
```

---

### 3. StatsBox - Inversione Trend per Pace

**File:** `app/features/dashboard/ui/StatsBox.ts:122-138`

**Problema:** `calculateRecentTrend` assume che aumento = positivo (verde):

```typescript
if (changeRecent > 0.05 * recent[0]) {
  return { text: `+${changeRecentAbs} kg`, color: "green" }; // Sempre verde
}
```

Per **pace**, un aumento (pace più alto) significa che sei più LENTO = rosso.

**Soluzione:** Aggiungere parametro `dataType`:

```typescript
private static calculateRecentTrend(
  data: number[],
  dataType: CHART_DATA_TYPE
): { text: string; color: string; suffix?: string } {
  const isLowerBetter = dataType === CHART_DATA_TYPE.PACE;
  const unit = UNITS_MAP[dataType] || "";

  if (changeRecent > threshold) {
    return {
      text: `+${changeAbs} ${unit}`,
      color: isLowerBetter ? "red" : "green", // Invertito per pace
    };
  }
}
```

---

### 4. TrendHeader - Manca Context sul Tipo

**File:** `app/features/charts/components/TrendHeader.ts:64-67`

**Problema:** La direzione UP/DOWN è basata solo sul valore percentuale:

```typescript
const direction =
  percentValue > 0 ? "up" :    // Sempre "up" = positivo
  percentValue < 0 ? "down" :
  "neutral";
```

Per pace, `percentValue < 0` (pace diminuito) è un MIGLIORAMENTO.

**Soluzione:** Passare `dataType` e invertire logica:

```typescript
static render(
  container: HTMLElement,
  trendIndicators: TrendIndicators,
  volumeData: number[],
  dataType?: CHART_DATA_TYPE // NUOVO
): void {
  const isLowerBetter = dataType === CHART_DATA_TYPE.PACE;

  // Per pace: percentValue < 0 significa miglioramento
  const isImproving = isLowerBetter
    ? percentValue < 0
    : percentValue > 0;

  const direction = isImproving ? "up" : percentValue !== 0 ? "down" : "neutral";
}
```

---

### 5. MobileTable - Solo 3 Tipi Supportati

**File:** `app/features/tables/ui/MobileTable.ts:42-48`

**Problema:** Il header della colonna supporta solo volume/weight/reps:

```typescript
headerRow.createEl("th", {
  text:
    chartType === CHART_DATA_TYPE.VOLUME ? "Volume" :
    chartType === CHART_DATA_TYPE.WEIGHT ? "Weight" :
    "Repetitions",  // Fallback per tutto il resto!
});
```

**Soluzione:** Estendere la mappa:

```typescript
const COLUMN_LABELS: Record<CHART_DATA_TYPE, string> = {
  [CHART_DATA_TYPE.VOLUME]: "Volume (kg)",
  [CHART_DATA_TYPE.WEIGHT]: "Weight (kg)",
  [CHART_DATA_TYPE.REPS]: "Reps",
  [CHART_DATA_TYPE.DURATION]: "Duration",
  [CHART_DATA_TYPE.DISTANCE]: "Distance (km)",
  [CHART_DATA_TYPE.PACE]: "Pace (min/km)",
  [CHART_DATA_TYPE.HEART_RATE]: "Heart Rate (bpm)",
};

headerRow.createEl("th", {
  text: COLUMN_LABELS[chartType] || chartType,
});
```

---

### 6. EmbeddedChartView - Propagare dataType

**File:** `app/views/EmbeddedChartView.ts:278-320`

**Problema:** I componenti downstream non ricevono il `CHART_DATA_TYPE` risolto.

**Modifiche necessarie:**

```typescript
// Linea 121-124: Passare dataType a TrendCalculator
const trendIndicators = TrendCalculator.getTrendIndicators(
  slope,
  volumeData,
  resolvedType // NUOVO
);

// Linea 279: Passare dataType a TrendHeader
TrendHeader.render(contentDiv, trendIndicators, volumeData, resolvedType);

// Linea 313-319: Passare dataType a StatsBox
StatsBox.render(
  contentDiv,
  labels,
  volumeData,
  params.chartType || CHART_TYPE.EXERCISE,
  resolvedType // NUOVO
);
```

---

## Nuove Funzionalità Proposte

### 7. Formattazione Intelligente Durata

**Problema:** La durata è mostrata in secondi grezzi (es. "3600 sec").

**Soluzione:** Formattare come tempo leggibile:

```typescript
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}
```

---

### 8. Formattazione Pace

**Problema:** Il pace è mostrato come numero decimale (es. "5.5 min/km").

**Soluzione:** Formattare come tempo standard (es. "5:30 min/km"):

```typescript
function formatPace(minPerKm: number): string {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
```

---

### 9. Label Y-Axis Dinamiche

**File:** `app/features/charts/config/ChartConstants.ts:101-112`

**Attuale:** Solo volume/weight/reps

**Estensione:**

```typescript
export function getYAxisLabel(chartType: string): string {
  const labels: Record<string, string> = {
    volume: "Volume (kg)",
    weight: "Weight (kg)",
    reps: "Reps",
    duration: "Duration",
    distance: "Distance (km)",
    pace: "Pace (min/km)",
    heartRate: "Heart Rate (bpm)",
  };
  return labels[chartType] || chartType;
}
```

---

### 10. Colori Semantici per Tipi

Attualmente i colori sono definiti in `ChartDataUtils.getChartDataForType()`.

**Proposta di standardizzazione:**

| Tipo | Colore | Hex | Significato |
|------|--------|-----|-------------|
| Volume | Verde | #4CAF50 | Forza |
| Weight | Arancione | #FF9800 | Carico |
| Reps | Arancione | #FF9800 | Ripetizioni |
| Duration | Blu | #2196F3 | Tempo |
| Distance | Viola | #9C27B0 | Distanza |
| Pace | Rosa | #E91E63 | Velocità |
| HeartRate | Rosso | #F44336 | Cardio |

---

## Riepilogo Priorità

| # | Miglioria | Impatto | Effort |
|---|-----------|---------|--------|
| 1 | TrendCalculator inverso per pace | Alto | Basso |
| 2 | StatsBox unità dinamiche | Alto | Medio |
| 3 | StatsBox trend inverso | Alto | Basso |
| 4 | TrendHeader context type | Alto | Basso |
| 5 | MobileTable estensione tipi | Medio | Basso |
| 6 | Propagazione dataType | Alto | Medio |
| 7 | Formattazione durata | Medio | Basso |
| 8 | Formattazione pace | Medio | Basso |
| 9 | Y-Axis labels | Basso | Basso |
| 10 | Colori standard | Basso | Basso |

---

## File da Modificare

1. `app/services/data/TrendCalculator.ts`
2. `app/features/dashboard/ui/StatsBox.ts`
3. `app/features/charts/components/TrendHeader.ts`
4. `app/features/tables/ui/MobileTable.ts`
5. `app/views/EmbeddedChartView.ts`
6. `app/features/charts/config/ChartConstants.ts`
7. (Nuovo) `app/utils/FormatUtils.ts` - per formattazione durata/pace
