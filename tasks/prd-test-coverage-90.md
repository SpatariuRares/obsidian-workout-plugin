# PRD: Increase Test Coverage to 90-95%

## Introduction

Increase the test coverage from the current ~79% (statements) to 90-95% across all metrics. The current branch coverage (65.39%) is failing the 70% threshold. This effort will systematically add tests starting with the lowest-covered files and expand coverage to currently untested modules.

## Goals

- Achieve 90%+ coverage on statements, branches, functions, and lines
- Fix the current branch coverage failure (65.39% < 70% threshold)
- Review and update coverage exclusions based on actual testability
- Ensure all critical paths have both unit and integration tests where appropriate

## Current State

| Metric     | Current | Target |
|------------|---------|--------|
| Statements | 79.51%  | 90%+   |
| Branches   | 65.39%  | 90%+   |
| Functions  | 77.61%  | 90%+   |
| Lines      | 79.63%  | 90%+   |

### Files with Lowest Coverage (Priority Order)

1. **ParameterUtils.ts** - 12.24% stmts, 0% branches, 0% funcs
2. **DomUtils.ts** - 50% stmts, 0% funcs
3. **DateUtils.ts** - 61.76% stmts, 60% lines (lines 132-185 uncovered)
4. **ChartDataUtils.ts** - 66.66% stmts, 39.17% branches (lines 24-43, 104-143, 236-252)
5. **ChartRenderer.ts** - 82.22% stmts, 50% branches (lines 30, 47-54, 166)
6. **DataService.ts** - 85.71% stmts (lines 72, 99-107)

### Currently Excluded from Coverage

- `FrontmatterParser.ts` - Obsidian API mocking issues
- All constant files except `MuscleTags.ts`
- All `index.ts` barrel files
- Type definition files (`.d.ts`)

### Modules NOT Currently in Coverage Scope

- Components: atoms, molecules, organism (partially covered via manual inclusion)
- Features: modals, tables, timer, dashboard, canvas, settings
- Services: CommandHandlerService, CodeBlockProcessorService, etc.
- Views: BaseView, EmbeddedChartView, EmbeddedTableView, etc.

## User Stories

### Phase 1: Fix Critical Coverage Gaps (Lowest Coverage Files)

#### US-001: Add comprehensive tests for ParameterUtils.ts
**Description:** As a developer, I want ParameterUtils fully tested so that parameter parsing is reliable.

**Acceptance Criteria:**
- [ ] Test all exported functions in ParameterUtils.ts
- [ ] Cover all branches (currently 0%)
- [ ] Achieve 90%+ coverage on this file
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-002: Add tests for DomUtils.ts
**Description:** As a developer, I want DomUtils tested so that DOM manipulation helpers are reliable.

**Acceptance Criteria:**
- [ ] Test all exported functions in DomUtils.ts
- [ ] Cover edge cases (null elements, missing attributes)
- [ ] Achieve 90%+ coverage on this file
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-003: Expand DateUtils.ts coverage
**Description:** As a developer, I want full DateUtils coverage so that date operations are reliable.

**Acceptance Criteria:**
- [ ] Add tests for lines 132-185 (currently uncovered)
- [ ] Cover all date formatting and parsing scenarios
- [ ] Achieve 90%+ coverage on this file
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-004: Expand ChartDataUtils.ts coverage
**Description:** As a developer, I want ChartDataUtils fully tested so that chart data processing is reliable.

**Acceptance Criteria:**
- [ ] Add tests for lines 24-43, 104-143, 236-252
- [ ] Improve branch coverage from 39.17% to 90%+
- [ ] Test edge cases (empty data, null values, boundary conditions)
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-005: Expand ChartRenderer.ts coverage
**Description:** As a developer, I want ChartRenderer fully tested so that chart rendering is reliable.

**Acceptance Criteria:**
- [ ] Add tests for lines 30, 47-54, 166
- [ ] Improve branch coverage from 50% to 90%+
- [ ] Test error handling paths
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-006: Expand DataService.ts coverage
**Description:** As a developer, I want DataService fully tested so that data operations are reliable.

**Acceptance Criteria:**
- [ ] Add tests for lines 72, 99-107
- [ ] Test cache invalidation scenarios
- [ ] Achieve 90%+ coverage on this file
- [ ] Typecheck passes
- [ ] `npm test` passes

### Phase 2: Expand Coverage Scope to New Modules

#### US-007: Add coverage for data services
**Description:** As a developer, I want data-related services tested.

**Acceptance Criteria:**
- [ ] Add `app/services/data/*.ts` to collectCoverageFrom
- [ ] Write tests for CSVCacheService.ts
- [ ] Write tests for CSVColumnService.ts
- [ ] Write tests for DataFilter.ts
- [ ] Write tests for TrendCalculator.ts
- [ ] Write tests for WorkoutLogRepository.ts
- [ ] Achieve 90%+ coverage on these files
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-008: Add coverage for table business logic
**Description:** As a developer, I want table processing logic tested.

**Acceptance Criteria:**
- [ ] Add `app/features/tables/business/*.ts` to collectCoverageFrom
- [ ] Write tests for TableConfig.ts
- [ ] Write tests for TableDataLoader.ts
- [ ] Write tests for TableDataProcessor.ts
- [ ] Write tests for TableRefresh.ts
- [ ] Write tests for TargetCalculator.ts
- [ ] Achieve 90%+ coverage on these files
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-009: Add coverage for timer business logic
**Description:** As a developer, I want timer core logic tested.

**Acceptance Criteria:**
- [ ] Add `app/features/timer/business/*.ts` to collectCoverageFrom
- [ ] Write tests for TimerCore.ts
- [ ] Test timer start, pause, resume, reset
- [ ] Test interval timer logic
- [ ] Achieve 90%+ coverage on this file
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-010: Add coverage for dashboard business logic
**Description:** As a developer, I want dashboard calculations and analytics tested.

**Acceptance Criteria:**
- [ ] Add `app/features/dashboard/business/**/*.ts` to collectCoverageFrom
- [ ] Write tests for MuscleBalanceAnalyzer.ts
- [ ] Write tests for MuscleDataCalculator.ts
- [ ] Write tests for MuscleTagMapper.ts
- [ ] Achieve 90%+ coverage on these files
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-011: Add coverage for chart configuration
**Description:** As a developer, I want chart config builders tested.

**Acceptance Criteria:**
- [ ] Add `app/features/charts/config/*.ts` to collectCoverageFrom
- [ ] Write tests for ChartConfigBuilder.ts
- [ ] Write tests for DatasetStyler.ts
- [ ] Write tests for ChartColors.ts
- [ ] Achieve 90%+ coverage on these files
- [ ] Typecheck passes
- [ ] `npm test` passes

### Phase 3: Review and Expand Exclusions

#### US-012: Review FrontmatterParser exclusion
**Description:** As a developer, I want to evaluate if FrontmatterParser can be tested with proper mocking.

**Acceptance Criteria:**
- [ ] Analyze FrontmatterParser.ts dependencies
- [ ] Determine if Obsidian API can be mocked adequately
- [ ] Either add tests or document why exclusion is necessary
- [ ] Update jest.config.js exclusion comment if keeping exclusion
- [ ] Typecheck passes

#### US-013: Add coverage for modal base classes
**Description:** As a developer, I want modal base logic tested where possible.

**Acceptance Criteria:**
- [ ] Evaluate testability of ModalBase.ts
- [ ] Evaluate testability of BaseInsertModal.ts
- [ ] Add tests for any pure logic functions
- [ ] Document any necessary exclusions
- [ ] Typecheck passes
- [ ] `npm test` passes

#### US-014: Add coverage for validation logic
**Description:** As a developer, I want form validation tested.

**Acceptance Criteria:**
- [ ] Add `app/features/modals/base/logic/*.ts` to collectCoverageFrom
- [ ] Write tests for LogFormValidator.ts
- [ ] Write tests for LogSubmissionHandler.ts (pure logic portions)
- [ ] Achieve 90%+ coverage on testable portions
- [ ] Typecheck passes
- [ ] `npm test` passes

### Phase 4: Update Thresholds and Finalize

#### US-015: Update Jest coverage thresholds
**Description:** As a developer, I want the coverage thresholds updated to enforce the new standard.

**Acceptance Criteria:**
- [ ] Update jest.config.js coverageThreshold to 90 for all metrics
- [ ] All tests pass with new threshold
- [ ] `npm run test:coverage` passes without warnings
- [ ] Typecheck passes

#### US-016: Document coverage exceptions
**Description:** As a developer, I want clear documentation of any remaining exclusions.

**Acceptance Criteria:**
- [ ] Update CLAUDE.md testing section with final exclusion list
- [ ] Add comments in jest.config.js explaining each exclusion
- [ ] Create list of files intentionally excluded and why
- [ ] Typecheck passes

## Functional Requirements

- FR-1: All utils files must have 90%+ coverage (statements, branches, functions, lines)
- FR-2: All business logic files (services, processors, calculators) must have 90%+ coverage
- FR-3: Coverage report must pass with 90% threshold on all metrics
- FR-4: Tests must not rely on implementation details that would break on refactoring
- FR-5: Tests must cover error handling paths, not just happy paths
- FR-6: Integration tests must be added where unit tests are insufficient

## Non-Goals

- UI component visual testing (no snapshot tests for DOM structure)
- End-to-end testing with actual Obsidian runtime
- 100% coverage (diminishing returns past 95%)
- Testing third-party library integrations (Chart.js internals)
- Testing pure type definitions

## Technical Considerations

- **Obsidian API Mocking:** Files that heavily use Obsidian's API (Modal, Plugin, App) may need extensive mocking. Focus on extracting pure logic into testable functions.
- **DOM Testing:** Use the existing node test environment with jsdom if needed for DOM-heavy tests.
- **Async Testing:** Many services have async operations; ensure proper async/await handling in tests.
- **Test Data:** Create shared test fixtures in `__tests__/fixtures/` for reusable mock data.

## Success Metrics

- Coverage report shows 90%+ on all four metrics (statements, branches, functions, lines)
- `npm run test:coverage` passes without threshold violations
- No skipped tests (currently 4 skipped)
- All 600+ tests continue to pass

## Open Questions

1. Should we add per-file coverage thresholds for critical files (e.g., DataService must be 95%)?
2. Should we integrate coverage checks into CI/CD (if not already)?
3. Are there any files that should be permanently excluded but aren't documented?
