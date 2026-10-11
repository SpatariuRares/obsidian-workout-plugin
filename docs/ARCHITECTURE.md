# Obsidian Workout Plugin - Architecture Documentation

> Last Updated: 2026-02-11

## Overview

Il **Workout Charts Plugin** è un plugin Obsidian con ~20k+ linee di codice TypeScript. L'architettura segue pattern riconoscibili: **Facade**, **Repository**, **Atomic Design**.

---

## Directory Structure

```
app/
├── api/                    # Public API for Dataview integration
│   └── WorkoutPlannerAPI.ts    # window.WorkoutPlannerAPI (472 lines)
│
├── components/             # UI Components (Atomic Design)
│   ├── atoms/                  # Button, Input, Feedback, Text, Chip, Icon...
│   ├── molecules/              # StatCard, SearchBox, ProgressBar, Badge...
│   └── organism/               # LogCallouts
│
├── constants/              # Configuration constants
│   ├── ui.constants.ts         # UI strings (33KB - consider splitting)
│   ├── muscles.constants.ts    # Muscle mappings
│   ├── defaults.constants.ts   # Default settings
│   └── validation.constants.ts # Validation rules
│
├── features/               # Feature modules
│   ├── canvas/                 # Canvas export feature
│   ├── charts/                 # Chart rendering (ChartRenderer, config)
│   ├── dashboard/              # Dashboard with body/widgets/business/ui
│   ├── exercise-conversion/    # Exercise type conversion
│   ├── migration/              # Data migration utilities
│   ├── modals/                 # 14 modal classes
│   ├── settings/               # Plugin settings UI
│   ├── tables/                 # Table rendering
│   └── timer/                  # Workout timer
│
├── services/               # Business logic services
│   ├── CodeBlockProcessorService.ts
│   ├── CommandHandlerService.ts
│   ├── ExerciseDefinitionService.ts
│   ├── MuscleTagService.ts        # Muscle tag mappings (CSV-backed, cached)
│   ├── CodeBlockEditorService.ts
│   ├── ExampleGeneratorService.ts
│   ├── data/                   # Data layer
│   │   ├── WorkoutLogFile.ts       # The workout log CSV: format, cache, mutations
│   │   ├── WorkoutLogCodec.ts      # CSV text ⇄ entries (internal to WorkoutLogFile)
│   │   ├── LogStorage.ts           # Seam: VaultLogStorage (prod), InMemoryLogStorage (tests)
│   │   ├── DataFilter.ts
│   │   └── TrendCalculator.ts
│   └── suggest/                # Autocomplete suggestions
│       └── FolderSuggest.ts
│
├── types/                  # TypeScript type definitions
│   └── WorkoutLogData.ts       # Core data types + CSV parsing
│
├── utils/                  # Utility functions (13 files)
│   ├── ChartDataUtils.ts
│   ├── DataAggregation.ts
│   ├── DateUtils.ts
│   ├── DomUtils.ts
│   ├── ExerciseMatchUtils.ts
│   ├── FormUtils.ts
│   ├── FormatUtils.ts
│   ├── FrontmatterParser.ts
│   ├── ParameterUtils.ts
│   ├── StatisticsUtils.ts
│   ├── StringUtils.ts
│   └── ValidationUtils.ts
│
└── views/                  # Embedded views
    ├── BaseView.ts             # Template method base class
    ├── EmbeddedChartView.ts
    ├── EmbeddedTableView.ts
    ├── EmbeddedDashboardView.ts
    └── EmbeddedTimerView.ts
```

---

## Architectural Patterns

### 1. One module for the workout log

`WorkoutLogFile.ts` is the only module that knows the CSV. Behind a small interface (`read`, `add`, `update`, `delete`, `renameExercise`, `stampMissingWeightUnits`) it owns:

- The header and the column order rule (existing columns keep their order, `weightUnit` last)
- Row ⇄ entry conversion in both directions, including the entered weight unit
- Volume (`reps × weight`)
- The 5-second cache and the `log:*` events

It sits on a `LogStorage` seam with two adapters: the vault in production and an in-memory string in tests.

### 2. Atomic writes

Every mutation goes through one `rewrite()` that runs inside `vault.process()`, so a write is one read-modify-write of the whole file.

### 3. Template Method Pattern

`BaseView` provides common functionality for all embedded views:

- Error handling
- Loading indicators
- Data filtering
- Empty state handling

### 4. Atomic Design

Components are organized as:

- **Atoms**: Smallest UI elements (Button, Input, Feedback)
- **Molecules**: Combinations of atoms (StatCard, SearchBox)
- **Organisms**: Complex components (LogCallouts)

### 5. Event-Driven Refresh

All data mutations trigger centralized refresh via Obsidian workspace events:

```
Workout log mutation
  → plugin.triggerWorkoutLogRefresh({exercise?, workout?})
    → clearLogDataCache()
    → workspace.trigger("workout-planner:data-changed", ctx)
    → DataAwareRenderChild instances selectively re-render

Muscle tag mutation
  → plugin.triggerMuscleTagRefresh()
    → muscleTagService.clearCache()
    → workspace.trigger("workout-planner:muscle-tags-changed", {})
    → triggerWorkoutLogRefresh() (refreshes dashboards)
```

**Key components:**

- `DataAwareRenderChild` — extends `MarkdownRenderChild`, listens for `data-changed`, filters by exercise/workout context
- `CodeBlockProcessorService` — wires each code block to its `DataAwareRenderChild`
- `triggerWorkoutLogRefresh(ctx?)` — entry point for workout log changes
- `triggerMuscleTagRefresh()` — entry point for muscle tag changes

**Design principle:** No local `onRefresh` callbacks are passed through view components. All refresh flows through the global event system to prevent double-rendering.

---

---

## API Reference

### WorkoutPlannerAPI (Dataview Integration)

Exposed as `window.WorkoutPlannerAPI`:

```typescript
// Get workout logs
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",
  dateRange: { start: "2026-01-01", end: "2026-01-31" },
});

// Get exercise statistics
const stats = await WorkoutPlannerAPI.getExerciseStats("Bench Press");

// Get available exercises
const exercises = await WorkoutPlannerAPI.getExercises({
  tag: "chest",
});
```

---

## Testing

Tests are located in `__tests__/` subdirectories within each module.

**Well-tested modules:**

- `WorkoutPlannerAPI`
- `DataFilter`
- `TrendCalculator`
- `CodeBlockEditorService`
- `CommandHandlerService`
- `FolderSuggest`

---

## Security

### CSV Formula Injection Protection

`sanitizeCSVValue()` in `WorkoutLogData.ts` prefixes values starting with `=`, `+`, `-`, `@` to prevent Excel formula injection.

---

## Future Improvements

See [ARCHITECTURE.md refactoring proposals](#known-technical-debt) for detailed improvement plans.
