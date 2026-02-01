# UI Atomization Analysis

Data analisi: 2026-02-01

## Componenti esistenti e loro utilizzo

| Componente | Tipo | File che lo usano | Percorso |
|------------|------|-------------------|----------|
| **Button** | Atom | 21 file | `app/components/atoms/Button.ts` |
| **CopyableBadge** | Molecule | MuscleTagsWidget, ProtocolDistribution | `app/components/molecules/CopyableBadge.ts` |
| **FilterIndicator** | Molecule | ProtocolDistribution | `app/components/molecules/FilterIndicator.ts` |
| **TrendIndicator** | Molecule | TrendHeader | `app/components/molecules/TrendIndicator.ts` |
| **StatCard** | Molecule | QuickStatsCards | `app/components/molecules/StatCard.ts` |
| **SpacerStat** | Atom | TableRenderer | `app/components/atoms/SpacerStat.ts` |
| **ProtocolBadge** | Atom | TableRenderer | `app/components/atoms/ProtocolBadge.ts` |
| **Chip** | Atom | QuickLogModal | `app/components/atoms/Chip.ts` |

---

## Pattern da atomizzare (priorità alta)

### 1. ListItem (5 file)

**File coinvolti:**
- `app/features/dashboard/widgets/RecentWorkouts.ts`
- `app/features/dashboard/widgets/VolumeAnalytics.ts`
- `app/features/dashboard/widgets/WidgetsFileError.ts`
- `app/features/dashboard/ui/StatsBox.ts`
- `app/features/exercise-conversion/components/ConversionPreview.ts`

**Pattern attuale:**
```typescript
const listEl = container.createEl("ul", { cls: "workout-*-list" });
const itemEl = listEl.createEl("li", { cls: "workout-*-item" });
itemEl.createEl("span", { text: label, cls: "workout-*-name" });
itemEl.createEl("span", { text: value, cls: "workout-*-value" });
```

**Componente suggerito:** `ListItem` molecule
```typescript
interface ListItemProps {
  label: string;
  value: string | number;
  icon?: string;
  className?: string;
  onClick?: () => void;
}
```

---

### 2. EditDeleteButtonPair (3 file)

**File coinvolti:**
- `app/features/settings/components/CustomProtocolsSettings.ts`
- `app/features/settings/components/TimerPresetsSettings.ts`
- `app/features/settings/components/GeneralSettings.ts`

**Pattern attuale:**
```typescript
setting
  .addButton((button) =>
    button
      .setIcon("pencil")
      .setTooltip("Edit")
      .onClick(() => { /* edit logic */ })
  )
  .addButton((button) =>
    button
      .setIcon("trash")
      .setTooltip("Delete")
      .onClick(() => { /* delete logic */ })
  );
```

**Componente suggerito:** `EditDeleteButtonPair` molecule
```typescript
interface EditDeleteButtonPairProps {
  onEdit: () => void;
  onDelete: () => void;
  editTooltip?: string;
  deleteTooltip?: string;
  confirmDelete?: boolean;
}
```

---

### 3. FormGroup / LabeledInput (3 file)

**File coinvolti:**
- `app/features/modals/CreateExercisePageModal.ts`
- `app/features/modals/QuickLogModal.ts`
- `app/features/modals/base/ModalBase.ts`

**Pattern attuale:**
```typescript
const group = container.createEl("div", { cls: "workout-*-field" });
group.createEl("label", { text: labelText });
const input = group.createEl("input", { type: "text", ... });
```

**Componente suggerito:** `FormGroup` molecule (estensione di FormField esistente)
```typescript
interface FormGroupProps {
  label: string;
  inputType: "text" | "number" | "select" | "checkbox";
  value?: string | number;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}
```

---

## Pattern da atomizzare (priorità media)

### 4. VarianceStatusBadge (1 file, ma logica complessa)

**File:** `app/features/dashboard/widgets/DurationComparison.ts` (linee 325-340)

**Pattern attuale:**
```typescript
const varianceClass =
  Math.abs(session.variancePercent) <= 10
    ? "workout-duration-comparison-variance-good"
    : Math.abs(session.variancePercent) <= 25
    ? "workout-duration-comparison-variance-moderate"
    : "workout-duration-comparison-variance-poor";

varianceCell.createEl("span", {
  text: `${varianceSign}${session.variancePercent.toFixed(0)}%`,
  cls: varianceClass,
});
```

**Componente suggerito:** `VarianceBadge` atom
```typescript
interface VarianceBadgeProps {
  value: number;
  thresholds?: { good: number; moderate: number };
  showSign?: boolean;
  suffix?: string;
}
```

---

### 5. TrendDirectionIndicator (1 file)

**File:** `app/features/dashboard/widgets/DurationComparison.ts` (linee 349-398)

**Pattern attuale:**
```typescript
const icon =
  trend.direction === "improving" ? "↗"
  : trend.direction === "declining" ? "↘"
  : "→";

messageEl.createEl("span", {
  text: icon,
  cls: "workout-duration-comparison-trend-icon",
});
```

**Componente suggerito:** `TrendDirectionBadge` atom
```typescript
interface TrendDirectionBadgeProps {
  direction: "improving" | "declining" | "stable";
  showIcon?: boolean;
  showLabel?: boolean;
}
```

---

### 6. FormattedNumber utility (18 file)

**File coinvolti:** Molti widget e tabelle

**Pattern attuale:**
```typescript
value.toLocaleString()
value.toFixed(0)
`${value}kg`
`${value.toLocaleString()} vol`
```

**Utility suggerita:** `NumberFormatter` o estensione di `FormatUtils`
```typescript
class NumberFormatter {
  static volume(value: number): string;
  static weight(value: number, unit?: string): string;
  static percentage(value: number, decimals?: number): string;
  static compact(value: number): string; // 1.2k, 3.4M
}
```

---

## File più grandi da refactorare

| File | Linee | Pattern inline |
|------|-------|----------------|
| `CreateExercisePageModal.ts` | 428+ | FormGroup ripetuti |
| `DurationComparison.ts` | 399 | VarianceBadge, TrendDirection |
| `TimerPresetsSettings.ts` | 374 | EditDeleteButtonPair |
| `ProtocolEffectiveness.ts` | 368 | Table structure inline |
| `ProtocolDistribution.ts` | 367 | Chart legend items |
| `TableRenderer.ts` | 339 | SpacerStat (già atomizzato) |

---

## Checklist implementazione

- [x] **ListItem** molecule - COMPLETATO (5 file aggiornati)
  - `app/components/molecules/ListItem.ts` creato con metodi:
    - `create()` - label-value pairs
    - `createList()` - ul container
    - `createSimple()` - shorthand label-value
    - `createText()` - text-only items
    - `createStat()` - label: **value** (suffix) pattern
    - `createEmpty()` - for custom content
  - `app/components/molecules/__tests__/ListItem.test.ts` creato (18 test)
  - Aggiornato: `VolumeAnalytics.ts`, `RecentWorkouts.ts`, `ConversionPreview.ts`, `WidgetsFileError.ts`, `StatsBox.ts`
- [ ] **EditDeleteButtonPair** molecule - 3 file da aggiornare
- [ ] **FormGroup** molecule - 3 file da aggiornare
- [ ] **VarianceBadge** atom - 1 file
- [ ] **TrendDirectionBadge** atom - 1 file
- [ ] **NumberFormatter** utility - 18 file (graduale)

---

## Note

- Seguire pattern esistente in `app/components/atoms/` e `app/components/molecules/`
- Ogni componente deve avere test in `__tests__/`
- Esportare da barrel file (`atoms/index.ts`, `molecules/index.ts`)
- Usare CONSTANTS per stringhe UI

---

## Changelog

### 2026-02-01
- Creato `ListItem` molecule con 6 metodi:
  - `create()` - full props (label, value, secondary, icon, suffix, className, onClick, dataAttributes)
  - `createList()` - ul container con items opzionali
  - `createSimple()` - shorthand per label-value
  - `createText()` - solo testo (per ConversionPreview)
  - `createStat()` - label: **value** (suffix) pattern (per StatsBox)
  - `createEmpty()` - li vuoto per contenuto custom (per WidgetsFileError)
- 18 test in `ListItem.test.ts`
- Aggiornati 5 file:
  - `VolumeAnalytics.ts` - usa `create()` per muscle breakdown
  - `RecentWorkouts.ts` - usa `create()` con secondary per date
  - `ConversionPreview.ts` - usa `createText()` per mappings
  - `WidgetsFileError.ts` - usa `createEmpty()` + `createList()` nested
  - `StatsBox.ts` - usa `createStat()` per stats + `createEmpty()` per trend
