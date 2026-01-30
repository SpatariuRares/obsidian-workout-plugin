# PRD: Services Layer Improvement (B+ to A Grade)

## Introduction

Refactor the services layer in `app/services/` to improve maintainability and reduce coupling. The current architecture has tight dependencies between components, making it difficult to add new features and test in isolation. This internal refactoring introduces event-driven architecture, registry patterns, and parallel processing while maintaining all existing functionality.

## Goals

- Reduce CodeBlockProcessorService dependencies from 6 to 3 using ViewRegistry pattern
- Implement asynchronous EventBus for decoupled cache invalidation and settings changes
- Add parallel file scanning for improved ExerciseDefinitionService performance
- Convert DataFilter to instance-based with strategy pattern for better testability
- Achieve 90% test coverage for all new and modified services
- Maintain internal refactor only (no public API changes)

## User Stories

### US-001: Create EventBus Type Definitions
**Description:** As a developer, I need type definitions for the event system so that all event handlers are type-safe.

**Acceptance Criteria:**
- [ ] Create `app/services/events/types.ts` with `WorkoutPluginEvents` type
- [ ] Define event types: `data:changed`, `settings:changed`, `cache:invalidate`, `file:modified`
- [ ] Define `IEventBus` interface with `on()`, `emit()`, `off()`, `destroy()` methods
- [ ] Export all types from barrel file `app/services/events/index.ts`
- [ ] Typecheck passes

### US-002: Implement Asynchronous EventBus Class
**Description:** As a developer, I need an asynchronous event bus implementation so that events can be queued and processed without blocking.

**Acceptance Criteria:**
- [ ] Create `app/services/events/EventBus.ts` implementing `IEventBus`
- [ ] Use async event queue with `queueMicrotask()` or `setTimeout(0)` for async delivery
- [ ] Implement handler map with proper TypeScript generics
- [ ] Implement `destroy()` method that clears all handlers
- [ ] Handle errors in handlers gracefully (log but don't break other handlers)
- [ ] Typecheck passes

### US-003: Add EventBus Unit Tests
**Description:** As a developer, I need comprehensive tests for EventBus to ensure reliable event delivery.

**Acceptance Criteria:**
- [ ] Create `app/services/events/__tests__/EventBus.test.ts`
- [ ] Test `on()` subscribes handler correctly
- [ ] Test `emit()` delivers events asynchronously
- [ ] Test `off()` removes handler
- [ ] Test `destroy()` clears all handlers
- [ ] Test multiple handlers for same event
- [ ] Test error in one handler doesn't break others
- [ ] Coverage at 90%+ for EventBus.ts
- [ ] Typecheck passes

### US-004: Create FileWatcherService
**Description:** As a developer, I need a service that watches file changes and emits events so that caches can be invalidated automatically.

**Acceptance Criteria:**
- [ ] Create `app/services/FileWatcherService.ts`
- [ ] Accept `plugin`, `eventBus`, and `settings` in constructor
- [ ] Watch CSV file via `vault.on('modify')` and emit `data:changed` event
- [ ] Watch exercise folder for file changes and emit `file:modified` event
- [ ] Use `plugin.registerEvent()` for automatic cleanup on plugin unload
- [ ] Implement `destroy()` method for manual cleanup
- [ ] Typecheck passes

### US-005: Add FileWatcherService Unit Tests
**Description:** As a developer, I need tests for FileWatcherService to verify file watching behavior.

**Acceptance Criteria:**
- [ ] Create `app/services/__tests__/FileWatcherService.test.ts`
- [ ] Test CSV file modification emits `data:changed` event
- [ ] Test exercise folder file modification emits `file:modified` event
- [ ] Test `destroy()` stops watching
- [ ] Mock Obsidian vault events appropriately
- [ ] Coverage at 90%+ for FileWatcherService.ts
- [ ] Typecheck passes

### US-006: Create IDataService Interface
**Description:** As a developer, I need an interface for DataService so that it can be easily mocked in tests.

**Acceptance Criteria:**
- [ ] Create `app/services/interfaces/IDataService.ts`
- [ ] Define all public methods of DataService in the interface
- [ ] Create `app/services/interfaces/index.ts` barrel export
- [ ] Update DataService to implement IDataService
- [ ] Typecheck passes

### US-007: Add EventBus Integration to DataService
**Description:** As a developer, I need DataService to subscribe to events so that cache is invalidated automatically when files change.

**Acceptance Criteria:**
- [ ] Add optional `eventBus` parameter to DataService constructor
- [ ] Subscribe to `data:changed` event to clear cache
- [ ] Subscribe to `settings:changed` event for `csvLogFilePath` changes
- [ ] Unsubscribe in `destroy()` method
- [ ] Maintain backward compatibility (eventBus is optional)
- [ ] Typecheck passes

### US-008: Optimize DataService ensureColumnExists Method
**Description:** As a developer, I need optimized column management so that adding columns doesn't require full CSV re-parse.

**Acceptance Criteria:**
- [ ] Add separate `columnCache: string[] | null` property
- [ ] Modify `ensureColumnExists()` to append to header only when column missing
- [ ] Invalidate columnCache when data cache is cleared
- [ ] Add debug logging when cache cleared due to size limit
- [ ] Typecheck passes

### US-009: Update DataService Tests for EventBus
**Description:** As a developer, I need updated tests to verify EventBus integration in DataService.

**Acceptance Criteria:**
- [ ] Update `app/services/__tests__/DataService.test.ts`
- [ ] Test cache clears on `data:changed` event
- [ ] Test cache clears on `settings:changed` event for csvLogFilePath
- [ ] Test backward compatibility without eventBus
- [ ] Test columnCache invalidation
- [ ] Coverage at 90%+ for DataService.ts
- [ ] Typecheck passes

### US-010: Create ViewRegistry Type Definitions
**Description:** As a developer, I need type definitions for the view registry pattern.

**Acceptance Criteria:**
- [ ] Create `app/services/ViewRegistry.ts` with type definitions
- [ ] Define `VIEW_TYPE` enum: CHART, TABLE, TIMER, DASHBOARD, DURATION
- [ ] Define `IViewRegistry` interface with `register()`, `get()`, `cleanup()` methods
- [ ] Typecheck passes

### US-011: Implement ViewRegistry Class
**Description:** As a developer, I need a ViewRegistry implementation to manage view instances and reduce coupling.

**Acceptance Criteria:**
- [ ] Implement `ViewRegistry` class in `app/services/ViewRegistry.ts`
- [ ] Implement `register(type, view)` method
- [ ] Implement `get(type)` method with proper typing
- [ ] Implement `cleanup()` method that calls cleanup on all registered views
- [ ] Handle missing view gracefully (return undefined or throw descriptive error)
- [ ] Typecheck passes

### US-012: Add ViewRegistry Unit Tests
**Description:** As a developer, I need comprehensive tests for ViewRegistry.

**Acceptance Criteria:**
- [ ] Create `app/services/__tests__/ViewRegistry.test.ts`
- [ ] Test `register()` stores view correctly
- [ ] Test `get()` retrieves correct view by type
- [ ] Test `get()` returns undefined for unregistered type
- [ ] Test `cleanup()` calls cleanup on all views
- [ ] Coverage at 90%+ for ViewRegistry.ts
- [ ] Typecheck passes

### US-013: Create TimerRegistry for Timer State Management
**Description:** As a developer, I need a separate registry for timer-specific state management.

**Acceptance Criteria:**
- [ ] Create `app/services/TimerRegistry.ts`
- [ ] Define `ITimerRegistry` interface with `register()`, `get()`, `remove()`, `getAll()`, `cleanup()` methods
- [ ] Implement `TimerRegistry` class managing `activeTimers: Map<string, EmbeddedTimerView>`
- [ ] Implement `cleanup()` that stops all active timers
- [ ] Typecheck passes

### US-014: Add TimerRegistry Unit Tests
**Description:** As a developer, I need tests for TimerRegistry to verify timer state management.

**Acceptance Criteria:**
- [ ] Create `app/services/__tests__/TimerRegistry.test.ts`
- [ ] Test `register()` adds timer with unique ID
- [ ] Test `get()` retrieves timer by ID
- [ ] Test `remove()` removes timer and calls cleanup
- [ ] Test `getAll()` returns all active timers
- [ ] Test `cleanup()` stops all timers
- [ ] Coverage at 90%+ for TimerRegistry.ts
- [ ] Typecheck passes

### US-015: Refactor CodeBlockProcessorService to Use ViewRegistry
**Description:** As a developer, I need CodeBlockProcessorService refactored to use ViewRegistry for reduced coupling.

**Acceptance Criteria:**
- [ ] Change constructor from 6 dependencies to: `plugin`, `dataService`, `viewRegistry`, `timerRegistry`
- [ ] Update handler methods to use `viewRegistry.get()` instead of direct view references
- [ ] Update timer handling to use `timerRegistry`
- [ ] Maintain all existing functionality
- [ ] Typecheck passes

### US-016: Update CodeBlockProcessorService Tests
**Description:** As a developer, I need updated tests for the refactored CodeBlockProcessorService.

**Acceptance Criteria:**
- [ ] Update `app/services/__tests__/CodeBlockProcessorService.test.ts`
- [ ] Test with mocked ViewRegistry
- [ ] Test with mocked TimerRegistry
- [ ] Test all code block types still work correctly
- [ ] Coverage at 90%+ for CodeBlockProcessorService.ts
- [ ] Typecheck passes

### US-017: Add EventBus Integration to ExerciseDefinitionService
**Description:** As a developer, I need ExerciseDefinitionService to subscribe to file events for automatic cache invalidation.

**Acceptance Criteria:**
- [ ] Add optional `eventBus` parameter to constructor
- [ ] Subscribe to `file:modified` event
- [ ] Clear cache when exercise folder files change
- [ ] Unsubscribe in cleanup/destroy method
- [ ] Maintain backward compatibility (eventBus is optional)
- [ ] Typecheck passes

### US-018: Implement Parallel File Scanning in ExerciseDefinitionService
**Description:** As a developer, I need parallel file scanning so that exercise definitions load faster.

**Acceptance Criteria:**
- [ ] Modify `scanExerciseFolder()` to use `Promise.all()` with batch size of 10
- [ ] Handle errors gracefully with `.catch(() => null)` per file
- [ ] Filter out null results from failed parses
- [ ] Maintain same output format as before
- [ ] Typecheck passes

### US-019: Update ExerciseDefinitionService Tests
**Description:** As a developer, I need updated tests for ExerciseDefinitionService improvements.

**Acceptance Criteria:**
- [ ] Update tests for EventBus integration
- [ ] Test cache clears on `file:modified` event
- [ ] Test parallel scanning processes files correctly
- [ ] Test error handling in parallel scanning (one file failure doesn't break others)
- [ ] Coverage at 90%+ for ExerciseDefinitionService.ts
- [ ] Typecheck passes

### US-020: Create Filter Strategy Interfaces
**Description:** As a developer, I need strategy interfaces for DataFilter to enable flexible filtering.

**Acceptance Criteria:**
- [ ] Create `app/services/data/filters/types.ts` with `IFilterStrategy` interface
- [ ] Define `appliesTo(params: FilterParams): boolean` method
- [ ] Define `filter(data: WorkoutLogData[], params: FilterParams): FilterResult` method
- [ ] Create barrel export `app/services/data/filters/index.ts`
- [ ] Typecheck passes

### US-021: Implement ExerciseFilterStrategy
**Description:** As a developer, I need an exercise filter strategy for the strategy pattern.

**Acceptance Criteria:**
- [ ] Create `app/services/data/filters/ExerciseFilterStrategy.ts`
- [ ] Implement `IFilterStrategy` interface
- [ ] Extract exercise filtering logic from current DataFilter
- [ ] Handle exact match, fuzzy match, filename match, exercise field match
- [ ] Typecheck passes

### US-022: Implement WorkoutFilterStrategy
**Description:** As a developer, I need a workout filter strategy for the strategy pattern.

**Acceptance Criteria:**
- [ ] Create `app/services/data/filters/WorkoutFilterStrategy.ts`
- [ ] Implement `IFilterStrategy` interface
- [ ] Extract workout filtering logic from current DataFilter
- [ ] Typecheck passes

### US-023: Implement ProtocolFilterStrategy
**Description:** As a developer, I need a protocol filter strategy for the strategy pattern.

**Acceptance Criteria:**
- [ ] Create `app/services/data/filters/ProtocolFilterStrategy.ts`
- [ ] Implement `IFilterStrategy` interface
- [ ] Extract protocol filtering logic from current DataFilter
- [ ] Typecheck passes

### US-024: Convert DataFilter to Instance-Based with Strategy Pattern
**Description:** As a developer, I need DataFilter converted to instance-based so strategies can be injected for testing.

**Acceptance Criteria:**
- [ ] Convert DataFilter class to accept strategies array in constructor
- [ ] Implement `filterData()` using strategy chain
- [ ] Use default strategies when none provided
- [ ] Maintain all existing filtering behavior
- [ ] Typecheck passes

### US-025: Add Backward-Compatible DataFilter Static Wrapper
**Description:** As a developer, I need a static wrapper for backward compatibility with existing code.

**Acceptance Criteria:**
- [ ] Create `DataFilterStatic` class or static methods that wrap instance
- [ ] Existing code using static methods continues to work
- [ ] No changes required to code using DataFilter statically
- [ ] Typecheck passes

### US-026: Update DataFilter Tests for Strategy Pattern
**Description:** As a developer, I need comprehensive tests for the refactored DataFilter.

**Acceptance Criteria:**
- [ ] Update `app/services/data/__tests__/DataFilter.test.ts`
- [ ] Test instance methods with default strategies
- [ ] Test custom strategy injection
- [ ] Test strategy chain execution order
- [ ] Test backward compatibility with static wrapper
- [ ] Coverage at 90%+ for DataFilter.ts and all strategy files
- [ ] Typecheck passes

### US-027: Update main.ts Service Initialization
**Description:** As a developer, I need main.ts updated to initialize services in correct dependency order.

**Acceptance Criteria:**
- [ ] Initialize EventBus first
- [ ] Initialize DataService with EventBus
- [ ] Initialize ExerciseDefinitionService with EventBus
- [ ] Initialize FileWatcherService with EventBus
- [ ] Initialize Views
- [ ] Initialize ViewRegistry and register views
- [ ] Initialize TimerRegistry
- [ ] Initialize CodeBlockProcessorService with ViewRegistry and TimerRegistry
- [ ] Typecheck passes

### US-028: Update main.ts Service Cleanup
**Description:** As a developer, I need main.ts to clean up services in correct reverse order.

**Acceptance Criteria:**
- [ ] Cleanup TimerRegistry first (stop active timers)
- [ ] Cleanup ViewRegistry
- [ ] Cleanup FileWatcherService
- [ ] Destroy EventBus (clears all handlers)
- [ ] Rest of existing cleanup unchanged
- [ ] No console errors during plugin unload
- [ ] Typecheck passes

### US-029: Integration Testing - Full Service Layer
**Description:** As a developer, I need integration tests to verify all services work together correctly.

**Acceptance Criteria:**
- [ ] Create `app/services/__tests__/integration.test.ts`
- [ ] Test EventBus -> DataService cache invalidation flow
- [ ] Test EventBus -> ExerciseDefinitionService cache invalidation flow
- [ ] Test FileWatcherService -> EventBus -> Services flow
- [ ] Test ViewRegistry with CodeBlockProcessorService
- [ ] Test TimerRegistry with CodeBlockProcessorService
- [ ] All integration tests pass
- [ ] Typecheck passes

## Functional Requirements

- FR-1: EventBus must deliver events asynchronously using microtask queue
- FR-2: EventBus must support multiple handlers per event type
- FR-3: EventBus must handle errors in handlers without affecting other handlers
- FR-4: FileWatcherService must use Obsidian's registerEvent for automatic cleanup
- FR-5: DataService cache must invalidate on `data:changed` and `settings:changed` events
- FR-6: ExerciseDefinitionService must scan files in parallel batches of 10
- FR-7: ViewRegistry must support registering and retrieving views by type
- FR-8: TimerRegistry must track active timers and support cleanup
- FR-9: DataFilter must execute strategies in order, passing filtered data through chain
- FR-10: All new services must be destroyable/cleanable for proper plugin unload
- FR-11: Backward compatibility must be maintained for optional EventBus injection

## Non-Goals

- No changes to public plugin API or code block syntax
- No changes to UI components or views
- No changes to modal implementations
- No changes to settings structure
- No performance optimizations beyond parallel scanning
- No new features beyond architectural improvements

## Technical Considerations

- Use TypeScript generics for type-safe event handling in EventBus
- Use `queueMicrotask()` for async event delivery (better than setTimeout)
- Strategy pattern allows easy addition of new filter types in future
- Registry pattern allows easy addition of new view types in future
- All services should be injectable for testing
- Maintain existing 5-second cache TTL in DataService

## Success Metrics

- CodeBlockProcessorService has 4 dependencies (down from 6)
- All services achieve 90%+ test coverage
- All existing tests continue to pass
- No console errors in normal operation
- Plugin loads and unloads cleanly
- Cache invalidation works automatically on file changes

## Open Questions

- None at this time - all clarifications received

