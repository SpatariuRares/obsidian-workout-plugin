# PRD: Memory Leak Fixes and Performance Improvements

## Introduction

This PRD addresses critical memory leaks, performance bottlenecks, and code quality issues identified in the technical audit of the Obsidian Workout Plugin (version 1.0.17). The audit identified 4 critical memory leaks causing unbounded memory growth, leading to browser/Electron crashes in large vaults. Additionally, performance issues with CSV parsing and filtering reduce responsiveness with large datasets (>5,000 entries). This PRD provides a structured implementation plan to resolve all critical issues and optimize plugin performance.

## Goals

- Eliminate all 4 critical memory leaks (Chart.js instances, event listeners, plugin lifecycle cleanup, infinite recursion risk)
- Implement proper resource cleanup following Obsidian plugin lifecycle patterns
- Optimize CSV parsing and filtering performance for large datasets (10,000+ entries)
- Improve data validation and error handling robustness
- Achieve 70%+ test coverage for critical code paths
- Ensure plugin stability for production use with large vaults

## User Stories

### Phase 1: Critical Memory Leaks

### US-001: Track and destroy Chart.js instances
**Description:** As a user with multiple workout charts open, I want the plugin to properly clean up chart instances so my browser doesn't run out of memory.

**Acceptance Criteria:**
- [ ] Add `chartInstances: Map<string, Chart>` to ChartRenderer class
- [ ] Before creating new chart, destroy existing chart if present using `chart.destroy()`
- [ ] Implement `destroyAllCharts()` method called during plugin unload
- [ ] Generate unique chart IDs based on container element or chart parameters
- [ ] Verify memory doesn't grow unbounded when refreshing charts multiple times
- [ ] Typecheck passes

**Reference:** BUG-001 in implementation.md:10-49

---

### US-002: Refactor EmbeddedTableView with proper lifecycle management
**Description:** As a user with multiple workout log tables, I want event listeners to be properly cleaned up so memory doesn't leak when tables are refreshed.

**Acceptance Criteria:**
- [ ] Create `TableRenderChild` class extending `MarkdownRenderChild`
- [ ] Use `AbortController` for event listener cleanup with `{ signal: abortController.signal }`
- [ ] Implement `onload()` method to register event listeners
- [ ] Implement `onunload()` method to call `abortController.abort()`
- [ ] Register `TableRenderChild` instances with Obsidian's component lifecycle
- [ ] Remove direct `addEventListener` calls without cleanup
- [ ] Typecheck passes

**Reference:** BUG-002 in implementation.md:53-95

---

### US-003: Complete plugin lifecycle cleanup
**Description:** As a user who enables/disables the plugin, I want all resources to be properly cleaned up to prevent memory leaks and zombie event listeners.

**Acceptance Criteria:**
- [ ] Add `cleanup()` methods to EmbeddedChartView, EmbeddedTableView, EmbeddedDashboardView
- [ ] Call all view cleanup methods in `main.ts:onunload()`
- [ ] Call `dataService.clearLogDataCache()` in onunload
- [ ] Destroy all Chart.js instances via ChartRenderer cleanup
- [ ] Nullify service references (`codeBlockProcessorService`, `commandHandlerService`)
- [ ] Document cleanup order in code comments
- [ ] Verify no zombie event listeners remain after unload using browser DevTools
- [ ] Typecheck passes

**Reference:** BUG-004 in implementation.md:142-192

---

### US-004: Add recursion protection to addWorkoutLogEntry
**Description:** As a user trying to log workouts with an invalid CSV path, I want to receive a clear error message instead of a stack overflow crash.

**Acceptance Criteria:**
- [ ] Add `retryCount` parameter to `addWorkoutLogEntry()` with default value 0
- [ ] Define `MAX_RETRIES = 1` constant
- [ ] Throw descriptive error if `retryCount >= MAX_RETRIES`
- [ ] Increment retry count on recursive call
- [ ] Display user-friendly error Notice when CSV creation fails
- [ ] Write unit test for recursion protection scenario
- [ ] Typecheck passes

**Reference:** BUG-003 in implementation.md:99-138

---

### Phase 2: Data Integrity

### US-005: Strengthen CSV parsing validation
**Description:** As a user, I want malformed CSV entries to be rejected with clear warnings so I can identify and fix data quality issues.

**Acceptance Criteria:**
- [ ] Add validation for `reps`, `weight`, `volume` using `isNaN()` checks
- [ ] Reject entries where `reps <= 0` or `weight < 0`
- [ ] Log warning with line number for skipped invalid entries
- [ ] Continue parsing remaining entries (don't fail entire file)
- [ ] Document expected CSV format in error messages
- [ ] Write unit tests for malformed CSV input scenarios
- [ ] Typecheck passes

**Reference:** QUALITY-001 in implementation.md:351-382

---

### US-006: Fix weak parameter parsing
**Description:** As a developer debugging code block parameters, I want proper validation so empty strings aren't silently converted to 0.

**Acceptance Criteria:**
- [ ] Add `value &&` check before `!isNaN(Number(value))`
- [ ] Prevent empty strings and whitespace from becoming 0
- [ ] Write unit tests for parameter parsing edge cases
- [ ] Document parameter parsing behavior in code comments
- [ ] Typecheck passes

**Reference:** QUALITY-002 in implementation.md:386-409

---

### Phase 3: Performance Optimization

### US-007: Implement cache size limits
**Description:** As a user with a large workout history (10,000+ entries), I want the plugin cache to have size limits so it doesn't consume excessive memory.

**Acceptance Criteria:**
- [ ] Define `MAX_CACHE_SIZE = 5000` constant in DataService
- [ ] Add cache size check in `getWorkoutLogData()` before using cached data
- [ ] Clear cache if size exceeds limit before repopulating
- [ ] Add cache statistics logging in debug mode (size, hit rate, eviction count)
- [ ] Document cache strategy in DataService comments
- [ ] Write unit tests for cache eviction scenarios
- [ ] Typecheck passes

**Reference:** PERF-001 in implementation.md:198-230

---

### US-008: Optimize filtering string operations
**Description:** As a user filtering workout logs, I want fast filtering performance even with thousands of entries.

**Acceptance Criteria:**
- [ ] Pre-compute normalized filter parameters once before filtering loop
- [ ] Store normalized `exercise` and `workout` filters in variables
- [ ] Remove redundant `toLowerCase().replace().trim()` calls inside loop
- [ ] Measure performance improvement with 10,000 entry benchmark
- [ ] Document optimization in code comments
- [ ] Write unit tests verifying filter correctness is preserved
- [ ] Typecheck passes

**Reference:** PERF-002 in implementation.md:234-278

---

### Phase 4: API Compliance

### US-009: Replace custom trigger logic with Obsidian APIs
**Description:** As a plugin user, I want workout log refreshes to use proper Obsidian APIs so the plugin doesn't depend on external plugins or use undocumented APIs.

**Acceptance Criteria:**
- [ ] Replace `app.workspace.trigger("dataview:refresh-views")` with Obsidian-native refresh
- [ ] Use `workspace.iterateRootLeaves()` to find active editors
- [ ] Use `app.metadataCache.trigger("changed", file)` for metadata updates
- [ ] Remove dependency on Dataview plugin for refreshes
- [ ] Test refresh behavior without Dataview installed
- [ ] Document refresh strategy in code comments
- [ ] Typecheck passes

**Reference:** API-001 in implementation.md:299-327

---

### Phase 5: Testing Infrastructure

### US-010: Add critical path unit tests
**Description:** As a developer, I want comprehensive test coverage for critical code paths to prevent regressions.

**Acceptance Criteria:**
- [ ] Write tests for DataService CSV parsing with malformed input
- [ ] Write tests for Chart.js instance tracking and destruction (mock Chart.js)
- [ ] Write tests for recursion protection in addWorkoutLogEntry
- [ ] Write tests for cache eviction logic
- [ ] Write tests for filtering optimization correctness
- [ ] Achieve 70%+ test coverage for DataService, ChartRenderer, filtering logic
- [ ] Configure Jest coverage thresholds in jest.config.js
- [ ] All tests pass with `npm test`

**Reference:** Section 7 in implementation.md:525-536

---

### Phase 6: Code Quality

### US-011: Enable TypeScript strict mode
**Description:** As a developer, I want strict null checks enabled to catch potential null/undefined errors at compile time.

**Acceptance Criteria:**
- [ ] Add `"strict": true` to tsconfig.json
- [ ] Add `"strictNullChecks": true` to tsconfig.json
- [ ] Add `"noImplicitAny": true` to tsconfig.json
- [ ] Fix all TypeScript errors revealed by strict mode
- [ ] Typecheck passes with strict mode enabled
- [ ] Document strict mode benefits in CLAUDE.md

**Reference:** QUALITY-003 in implementation.md:413-432

---

### US-012: Add CSV injection protection (optional)
**Description:** As a user exporting workout data to external spreadsheets, I want protection against CSV formula injection.

**Acceptance Criteria:**
- [ ] Add formula injection detection regex: `/^[=+\-@]/`
- [ ] Prefix detected formulas with single quote `'` character
- [ ] Write unit tests for formula injection scenarios
- [ ] Document security considerations in code comments
- [ ] Typecheck passes

**Reference:** SEC-001 in implementation.md:435-474

---

## Functional Requirements

### Memory Management
- FR-1: Chart.js instances must be tracked in a Map and destroyed when no longer needed
- FR-2: Event listeners must use AbortController for automatic cleanup on component unload
- FR-3: Plugin `onunload()` must clean up all views, services, timers, and chart instances
- FR-4: Recursive file creation must have retry limit with clear error messages

### Data Validation
- FR-5: CSV parsing must reject entries with invalid numeric values (NaN, negative reps, negative weight)
- FR-6: Invalid CSV entries must log warnings with line numbers for debugging
- FR-7: Parameter parsing must not convert empty strings to 0

### Performance
- FR-8: Data cache must have configurable size limit (default 5000 entries)
- FR-9: Cache must be cleared when size exceeds limit before repopulating
- FR-10: String normalization for filtering must be pre-computed outside loops
- FR-11: Cache hit rate and eviction statistics must be logged in debug mode

### API Compliance
- FR-12: Workspace refreshes must use `workspace.iterateRootLeaves()` instead of custom triggers
- FR-13: Metadata updates must use `metadataCache.trigger()` instead of raw vault events
- FR-14: Plugin must not depend on external plugins (Dataview) for core functionality

### Testing
- FR-15: Critical code paths must have unit tests with 70%+ coverage
- FR-16: Tests must cover error scenarios, malformed input, and resource cleanup
- FR-17: Jest coverage thresholds must be configured to enforce minimum coverage

### Code Quality
- FR-18: TypeScript strict mode must be enabled with `strictNullChecks` and `noImplicitAny`
- FR-19: All code must pass TypeScript compilation with strict mode enabled

## Non-Goals (Out of Scope)

- No UI/UX changes - this PRD focuses exclusively on stability and performance
- No new features - only bug fixes and optimizations
- No changes to CSV file format or data schema
- No migration of existing data
- No refactoring of chart/table/timer UI components (unless required for memory leak fixes)
- No changes to plugin settings interface
- No mobile-specific optimizations (focus on core memory/performance issues first)

## Technical Considerations

### Memory Leak Prevention Patterns
- Use `MarkdownRenderChild` for all components with DOM event listeners
- Use `AbortController` with `{ signal }` option for event listener cleanup
- Store Chart.js instances in Map with unique IDs for lifecycle tracking
- Implement cleanup methods on all view classes called from plugin `onunload()`

### Performance Optimization Strategy
- Implement cache size limits with LRU eviction policy
- Pre-compute normalized filter strings before filtering loops
- Consider streaming CSV parser for very large files (>10,000 entries) in future iteration
- Benchmark performance improvements with 10,000 entry dataset

### Testing Strategy
- Mock Chart.js in unit tests to verify `destroy()` calls
- Use Jest spy functions to verify cleanup methods are called
- Create test fixtures with malformed CSV data
- Measure test coverage with `npm run test:coverage`

### Obsidian API Best Practices
- Follow lifecycle patterns from Obsidian plugin developer documentation
- Use `workspace.iterateRootLeaves()` for workspace iteration
- Use `metadataCache.trigger()` for metadata updates
- Register all event handlers with `registerEvent()` for automatic cleanup

## Success Metrics

- **Memory Stability**: Plugin memory usage remains stable (<50MB increase) after 100 chart refreshes
- **Performance**: Filtering 10,000 entries completes in <500ms (currently ~2-3 seconds)
- **Test Coverage**: Achieve 70%+ code coverage for DataService, ChartRenderer, filtering components
- **Bug Resolution**: All 4 critical bugs resolved and verified fixed
- **Type Safety**: Zero TypeScript errors with strict mode enabled
- **User Impact**: Zero user-reported crashes related to memory leaks after release

## Implementation Order

### Week 1: Critical Memory Leaks (Phase 1)
1. US-001: Chart.js instance tracking (Estimated: 2 hours)
2. US-002: EmbeddedTableView lifecycle refactor (Estimated: 3 hours)
3. US-003: Plugin lifecycle cleanup (Estimated: 2 hours)
4. US-004: Recursion protection (Estimated: 1 hour)

**Total Week 1**: 8 hours

### Week 2: Data Integrity (Phase 2)
5. US-005: CSV parsing validation (Estimated: 1 hour)
6. US-006: Parameter parsing fix (Estimated: 1 hour)

**Total Week 2**: 2 hours

### Week 3: Performance (Phase 3)
7. US-007: Cache size limits (Estimated: 3 hours)
8. US-008: Filtering optimization (Estimated: 2 hours)

**Total Week 3**: 5 hours

### Week 4: API Compliance & Testing (Phases 4-5)
9. US-009: Replace custom trigger logic (Estimated: 2 hours)
10. US-010: Add critical path tests (Estimated: 4 hours)

**Total Week 4**: 6 hours

### Week 5: Code Quality (Phase 6)
11. US-011: Enable TypeScript strict mode (Estimated: 3 hours)
12. US-012: CSV injection protection (Optional, Estimated: 1 hour)

**Total Week 5**: 4 hours

**Grand Total Estimated Effort**: 25 hours over 5 weeks

## Open Questions

1. Should cache eviction use LRU (Least Recently Used) or simple size threshold?
   - Recommendation: Start with size threshold (simpler), implement LRU in future iteration if needed

2. What is the maximum acceptable memory usage for the plugin?
   - Recommendation: Target <100MB for vaults with 10,000+ entries

3. Should we add telemetry/metrics for cache hit rate and performance?
   - Recommendation: Add debug logging only (no external telemetry)

4. Should we implement streaming CSV parser now or later?
   - Recommendation: Later - cache optimization should handle 10,000 entries adequately

5. Should CSV injection protection be included in initial release?
   - Recommendation: Include if time permits (low priority, 1-hour task)

## Risk Assessment

### High Risk
- **TypeScript strict mode migration**: May reveal many hidden null/undefined issues across codebase
- **Mitigation**: Allocate buffer time (50% extra) for strict mode fixes

### Medium Risk
- **MarkdownRenderChild refactor**: Changes event listener architecture significantly
- **Mitigation**: Thorough testing in development vault before release

### Low Risk
- **Cache optimization**: Well-understood problem with clear solution
- **CSV validation**: Isolated change with minimal side effects

## Dependencies

- Obsidian API (no version changes required)
- Chart.js v4.4.0 (no changes required)
- Jest test framework (already configured)
- TypeScript compiler (no upgrade needed)

## Testing Plan

### Unit Tests (Jest)
- DataService CSV parsing with malformed input
- Chart.js instance tracking and destruction (mocked)
- Recursion protection scenarios
- Cache eviction logic
- Filtering optimization correctness

### Manual Testing Checklist
- [ ] Create vault with 10,000+ workout log entries
- [ ] Refresh charts 100 times and monitor memory usage
- [ ] Verify no memory growth beyond 50MB
- [ ] Test with multiple workout-log code blocks on single page
- [ ] Disable and re-enable plugin multiple times
- [ ] Verify no console errors or warnings
- [ ] Test in both light and dark themes (CSS compatibility)
- [ ] Test on Windows, macOS, Linux

### Performance Benchmarks
- [ ] Measure CSV parsing time for 10,000 entries (target: <1 second)
- [ ] Measure filtering time for 10,000 entries (target: <500ms)
- [ ] Measure memory usage after 100 chart refreshes (target: <50MB growth)

## Documentation Updates

- Update CLAUDE.md with testing best practices
- Document cache strategy in DataService comments
- Add JSDoc comments for cleanup methods
- Update DEBUG_GUIDE.md with memory leak debugging tips

## Release Notes Template

```markdown
## Version 1.1.0 - Stability and Performance Release

### Critical Bug Fixes
- Fixed memory leak in Chart.js instance cleanup (BUG-001)
- Fixed event listener memory leak in table views (BUG-002)
- Fixed incomplete plugin lifecycle cleanup (BUG-004)
- Fixed infinite recursion risk in CSV file creation (BUG-003)

### Performance Improvements
- Implemented cache size limits for large datasets (PERF-001)
- Optimized filtering string operations (PERF-002)
- Improved CSV parsing performance for 10,000+ entries

### Data Integrity
- Added validation for malformed CSV entries (QUALITY-001)
- Fixed weak parameter parsing (QUALITY-002)

### Code Quality
- Enabled TypeScript strict mode for better type safety
- Achieved 70%+ test coverage for critical code paths
- Replaced custom event triggers with Obsidian API best practices

### Breaking Changes
None - this release is fully backward compatible.
```
