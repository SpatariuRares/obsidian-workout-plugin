# Services Layer Improvement Plan: B+ → A Grade

## Overview

Elevate all services in `app/services/` to A-grade quality by addressing:

- Event-driven architecture for cache invalidation
- View registry abstraction to reduce coupling
- Parallel file scanning for performance
- Instance-based DataFilter for testability
- Settings change subscriptions

---

## Phase 1: Event Bus Foundation

- [ ] Create `app/services/events/EventBus.ts`
  - [ ] Define `WorkoutPluginEvents` type with all event types
  - [ ] Implement `IEventBus` interface with `on()`, `emit()`, `off()`, `destroy()`
  - [ ] Implement `EventBus` class with handler map and cleanup
- [ ] Create `app/services/events/index.ts` barrel export
- [ ] Create `app/services/FileWatcherService.ts`
  - [ ] Watch CSV file via `vault.on('modify')`
  - [ ] Watch exercise folder for changes
  - [ ] Emit events to EventBus
  - [ ] Use `plugin.registerEvent()` for auto-cleanup
- [ ] Create `app/services/events/__tests__/EventBus.test.ts`

---

## Phase 2: DataService Improvements

- [ ] Add EventBus subscription to `DataService` constructor
  - [ ] Subscribe to `data:changed` event
  - [ ] Subscribe to `settings:changed` event for `csvLogFilePath`
- [ ] Optimize `ensureColumnExists()` method
  - [ ] Append to header only, avoid full CSV re-parse
  - [ ] Add separate column cache (`columnCache: string[] | null`)
- [ ] Improve cache size handling
  - [ ] Add debug logging when cache cleared due to size
- [ ] Create `app/services/interfaces/IDataService.ts` interface
- [ ] Create `app/services/interfaces/index.ts` barrel export
- [ ] Update `app/services/__tests__/DataService.test.ts`
  - [ ] Add EventBus mock tests
  - [ ] Test settings change subscription

---

## Phase 3: View Registry Pattern

- [ ] Create `app/services/ViewRegistry.ts`
  - [ ] Define `VIEW_TYPE` enum (CHART, TABLE, TIMER, DASHBOARD, DURATION)
  - [ ] Define `IViewRegistry` interface
  - [ ] Implement `ViewRegistry` class with register/get/cleanup methods
- [ ] Refactor `CodeBlockProcessorService.ts`
  - [ ] Change constructor from 6 dependencies to 3: plugin, dataService, viewRegistry
  - [ ] Update handler methods to use `viewRegistry.get()`
  - [ ] Handle timer activeTimers map separately or within registry
- [ ] Update `main.ts`
  - [ ] Initialize ViewRegistry in onload()
  - [ ] Register all views with ViewRegistry
  - [ ] Pass ViewRegistry to CodeBlockProcessorService
  - [ ] Call viewRegistry.cleanup() in onunload()
- [ ] Create `app/services/__tests__/ViewRegistry.test.ts`
- [ ] Update `app/services/__tests__/CodeBlockProcessorService.test.ts`

---

## Phase 4: ExerciseDefinitionService Improvements

- [ ] Add EventBus subscription to `ExerciseDefinitionService` constructor
  - [ ] Subscribe to `file:modified` event
  - [ ] Clear cache when exercise folder files change
- [ ] Implement parallel file scanning in `scanExerciseFolder()`
  - [ ] Use `Promise.all()` with batch size of 10
  - [ ] Handle errors gracefully with `.catch(() => null)`
- [ ] Add tests for parallel scanning behavior

---

## Phase 5: DataFilter Refactoring

- [ ] Create filter strategy interfaces
  - [ ] `IFilterStrategy` interface with `filter()` and `appliesTo()` methods
  - [ ] `ExerciseFilterStrategy` class
  - [ ] `WorkoutFilterStrategy` class
  - [ ] `ProtocolFilterStrategy` class
- [ ] Convert `DataFilter` to instance-based
  - [ ] Accept strategies array in constructor
  - [ ] Implement `filterData()` using strategy chain
- [ ] Add backward-compatible static wrapper `DataFilterStatic`
- [ ] Update `app/services/data/__tests__/DataFilter.test.ts`
  - [ ] Test instance methods
  - [ ] Test strategy injection
  - [ ] Test backward compatibility

---

## Phase 6: Integration & Wiring

- [ ] Update `main.ts` initialization order
  1. [ ] Initialize EventBus first
  2. [ ] Initialize DataService with EventBus
  3. [ ] Initialize ExerciseDefinitionService with EventBus
  4. [ ] Initialize FileWatcherService
  5. [ ] Initialize Views
  6. [ ] Initialize ViewRegistry and register views
  7. [ ] Initialize CodeBlockProcessorService with ViewRegistry
- [ ] Update `main.ts` cleanup order (reverse)
  1. [ ] Cleanup ViewRegistry
  2. [ ] Destroy EventBus
  3. [ ] Rest of existing cleanup

---

## New Files Summary

| File                                             | Purpose                  |
| ------------------------------------------------ | ------------------------ |
| `app/services/events/EventBus.ts`                | Event bus implementation |
| `app/services/events/index.ts`                   | Barrel export            |
| `app/services/events/__tests__/EventBus.test.ts` | EventBus tests           |
| `app/services/FileWatcherService.ts`             | File change monitoring   |
| `app/services/ViewRegistry.ts`                   | View factory/registry    |
| `app/services/__tests__/ViewRegistry.test.ts`    | ViewRegistry tests       |
| `app/services/interfaces/IDataService.ts`        | DataService interface    |
| `app/services/interfaces/index.ts`               | Interfaces barrel        |

---

## Modified Files Summary

| File                                        | Changes                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `app/services/DataService.ts`               | EventBus integration, column cache, optimized ensureColumnExists |
| `app/services/CodeBlockProcessorService.ts` | ViewRegistry pattern, reduced dependencies                       |
| `app/services/ExerciseDefinitionService.ts` | Parallel scanning, EventBus integration                          |
| `app/services/data/DataFilter.ts`           | Instance-based with strategy pattern                             |
| `main.ts`                                   | Service wiring, EventBus initialization                          |

---

## Verification Checklist

### Unit Tests

- [ ] Run `npm test -- app/services/` - all tests pass
- [ ] Coverage remains at 70%+

### Manual Testing

- [ ] Open vault with workout plugin
- [ ] Create workout log entry via modal - verify data appears
- [ ] Verify charts/tables auto-refresh after log entry (EventBus working)
- [ ] Modify CSV file externally - verify cache invalidates
- [ ] Add new exercise file - verify ExerciseDefinitionService picks it up
- [ ] Check console for no errors/warnings

### Performance Check

- [ ] Open note with 10+ workout-chart blocks
- [ ] Verify no duplicate CSV reads (check with debug logging)
- [ ] Add custom column - verify no full CSV re-parse

---

## Success Criteria

- [ ] All existing tests pass
- [ ] Coverage remains at 70%+
- [ ] CodeBlockProcessorService has 3 dependencies (down from 6)
- [ ] DataService responds to file changes automatically
- [ ] ExerciseDefinitionService scans in parallel
- [ ] DataFilter is mockable via constructor injection
- [ ] No console errors in normal operation

---

## Implementation Order (Suggested)

```
Week 1: Phase 1 (EventBus) + Phase 2 (DataService)
        Foundation for all other improvements

Week 2: Phase 3 (ViewRegistry) + Phase 4 (ExerciseDefinitionService)
        Decoupling and parallel improvements

Week 3: Phase 5 (DataFilter) + Phase 6 (Integration)
        Final refactoring and wiring
```

---

## Code Examples

### EventBus Types

```typescript
export type WorkoutPluginEvents = {
  "data:changed": { source: string };
  "settings:changed": { changedKeys: (keyof WorkoutChartsSettings)[] };
  "cache:invalidate": { cacheType: "data" | "exercise" | "all" };
  "file:modified": { path: string };
};
```

### ViewRegistry Usage

```typescript
// Before (6 dependencies)
constructor(
  private plugin: WorkoutChartsPlugin,
  private dataService: DataService,
  private embeddedChartView: EmbeddedChartView,
  private embeddedTableView: EmbeddedTableView,
  private embeddedDashboardView: EmbeddedDashboardView,
  private activeTimers: Map<string, EmbeddedTimerView>,
)

// After (3 dependencies)
constructor(
  private plugin: WorkoutChartsPlugin,
  private dataService: IDataService,
  private viewRegistry: IViewRegistry,
)
```

### Parallel Scanning

```typescript
const BATCH_SIZE = 10;
for (let i = 0; i < files.length; i += BATCH_SIZE) {
  const batch = files.slice(i, i + BATCH_SIZE);
  const results = await Promise.all(
    batch.map((file) => this.parseExerciseFile(file).catch(() => null)),
  );
  results.forEach((def) => def && definitions.set(def.name, def));
}
```

### DataFilter Strategy Pattern

```typescript
export interface IFilterStrategy {
  appliesTo(params: FilterParams): boolean;
  filter(data: WorkoutLogData[], params: FilterParams): FilterResult;
}

export class DataFilter {
  constructor(private strategies: IFilterStrategy[] = defaultStrategies) {}

  filterData(logData: WorkoutLogData[], params: FilterParams): FilterResult {
    let result = {
      filteredData: logData,
      filterMethodUsed: "none",
      titlePrefix: "",
    };
    for (const strategy of this.strategies) {
      if (strategy.appliesTo(params)) {
        result = strategy.filter(result.filteredData, params);
      }
    }
    return result;
  }
}
```
