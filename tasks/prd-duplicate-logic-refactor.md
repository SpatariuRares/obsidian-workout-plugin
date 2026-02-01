# PRD: Duplicate Logic Refactor

## Introduction

Eliminate duplicate code patterns identified in the codebase to improve maintainability, reduce bug divergence risk, and establish single sources of truth. This refactor addresses 4 confirmed duplications: date formatting, custom field pre-filling, modal opening patterns, and workout toggle handlers.

## Goals

- Remove all identified duplicate logic patterns
- Consolidate shared functionality into reusable utilities
- Standardize CSS class naming (`workout-opacity-50` prefix convention)
- Maintain 100% backward compatibility (no behavioral changes)
- Add unit tests for all new extracted utilities
- All existing tests continue to pass

## User Stories

### US-001: Consolidate formatDate into DateUtils

**Description:** As a developer, I want a single date formatting function so that date logic is consistent and bug fixes apply everywhere.

**Acceptance Criteria:**

- [ ] `ChartDataUtils.formatDate()` is deleted
- [ ] All usages of `ChartDataUtils.formatDate()` replaced with `DateUtils.formatDateWithFormat()`
- [ ] `ChartDataUtils` imports `DateUtils` and delegates (or is removed if empty)
- [ ] Chart labels still display dates correctly in all 3 formats (DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY)
- [ ] `npm run lint` passes
- [ ] `npm test` passes

### US-002: Extract custom fields pre-fill utility

**Description:** As a developer, I want a shared utility for filling form inputs from custom fields so that the logic is consistent and null-handling is uniform.

**Acceptance Criteria:**

- [ ] New function `fillDynamicInputsFromCustomFields(customFields, inputMap)` added to `app/utils/FormUtils.ts`
- [ ] Function handles both checkbox and text input types
- [ ] Function includes proper null/undefined checks (the stricter version)
- [ ] `BaseLogModal.preFillForm()` uses the new utility
- [ ] `LogFormRenderer.autoFillFromLastEntry()` uses the new utility
- [ ] Unit tests added for `fillDynamicInputsFromCustomFields()` covering:
  - [ ] Text input filling
  - [ ] Checkbox input filling
  - [ ] Null/undefined value handling
  - [ ] Missing input key handling
- [ ] `npm run lint` passes
- [ ] `npm test` passes

### US-003: Extract CreateLogModal opening helper in LogCallouts

**Description:** As a developer, I want the modal opening logic in one place so changes to modal instantiation only need one update.

**Acceptance Criteria:**

- [ ] New private static method `openCreateLogModal(plugin, exerciseName, onComplete?)` in `LogCallouts`
- [ ] `renderCsvNoDataMessage()` uses the new helper
- [ ] `renderCreateLogButtonForExercise()` uses the new helper
- [ ] Both buttons still open the modal correctly
- [ ] Refresh still triggers after modal close
- [ ] `npm run lint` passes
- [ ] `npm test` passes

### US-004: Extract workout toggle handler utility

**Description:** As a developer, I want a reusable workout toggle handler so the enable/disable logic is consistent across all modals.

**Acceptance Criteria:**

- [ ] New function `setupWorkoutToggle(toggle, workoutInput, getFileName)` added to `app/utils/FormUtils.ts`
- [ ] Function uses standardized CSS classes: `workout-opacity-50`, `workout-opacity-100`
- [ ] `CreateExerciseSectionModal` uses the new utility
- [ ] `TargetSectionWithAutocomplete` uses the new utility
- [ ] `LogFormRenderer` uses the new utility (update CSS class from `opacity-50` to `workout-opacity-50`)
- [ ] All 3 toggle behaviors work identically after refactor
- [ ] Unit tests added for `setupWorkoutToggle()` covering:
  - [ ] Toggle checked state disables input and sets value
  - [ ] Toggle unchecked state enables input and clears value
  - [ ] Correct CSS classes applied
- [ ] `npm run lint` passes
- [ ] `npm test` passes

### US-005: Final validation and cleanup

**Description:** As a developer, I want to verify no dead code remains and all tests pass.

**Acceptance Criteria:**

- [ ] No unused imports in modified files
- [ ] No empty utility classes (remove `ChartDataUtils` if it only had `formatDate`)
- [ ] `npm run lint` passes with no warnings
- [ ] `npm test` passes with no failures
- [ ] `npm run build` succeeds
- [ ] Manual smoke test: create a log entry, verify pre-fill works

## Functional Requirements

- FR-1: `DateUtils.formatDateWithFormat()` shall be the single source of truth for date formatting with format string support
- FR-2: `FormUtils.fillDynamicInputsFromCustomFields()` shall iterate custom fields and fill matching inputs, handling checkbox vs text types
- FR-3: `FormUtils.fillDynamicInputsFromCustomFields()` shall skip values that are `null` or `undefined`
- FR-4: `LogCallouts.openCreateLogModal()` shall get the current page link from the active MarkdownView and open CreateLogModal
- FR-5: `FormUtils.setupWorkoutToggle()` shall add a change event listener that toggles input disabled state and opacity classes
- FR-6: All workout toggle implementations shall use the CSS class `workout-opacity-50` (not `opacity-50`)

## Non-Goals

- No new features or behavioral changes
- No refactoring of unrelated code
- No changes to the CSS file itself (classes already exist)
- No modification of test file patterns (test duplication is acceptable)
- No changes to `main.js` (it's the compiled bundle)

## Technical Considerations

### File Locations (per user preference: extend existing files)

- Date utilities: `app/utils/DateUtils.ts` (already exists)
- Form utilities: `app/utils/FormUtils.ts` (new file)
- LogCallouts helper: private method within `app/components/organism/LogCallouts.ts`

### Dependencies

- `FormUtils.ts` will need no external dependencies (pure utility functions)
- `LogCallouts` already imports `MarkdownView` from Obsidian

### Type Signatures

```typescript
// FormUtils.ts
export function fillDynamicInputsFromCustomFields(
  customFields: Record<string, string | number | boolean> | undefined,
  inputMap: Map<string, HTMLInputElement>
): void;

export function setupWorkoutToggle(
  toggle: HTMLInputElement,
  workoutInput: HTMLInputElement,
  getFileName: () => string
): void;
```

### CSS Classes

Standardize on prefixed classes:

- `workout-opacity-50` (disabled state)
- `workout-opacity-100` (enabled state)

## Success Metrics

- Zero duplicate logic patterns for the 4 identified cases
- All 70%+ test coverage thresholds maintained
- No behavioral regressions (existing functionality unchanged)
- Build time unchanged (no new heavy dependencies)

## Open Questions

- None - scope is well-defined from duplicate analysis

## Implementation Order

Recommended sequence to minimize conflicts:

1. **US-001** (formatDate) - Standalone, no dependencies
2. **US-004** (workout toggle) - Creates FormUtils.ts
3. **US-002** (custom fields) - Adds to FormUtils.ts
4. **US-003** (LogCallouts) - Isolated to one file
5. **US-005** (validation) - Final cleanup

## Test Plan

| Story  | Test Type   | What to Verify                                     |
| ------ | ----------- | -------------------------------------------------- |
| US-001 | Unit        | DateUtils.formatDateWithFormat with all 3 formats  |
| US-001 | Integration | Chart renders with correct date labels             |
| US-002 | Unit        | fillDynamicInputsFromCustomFields with various inputs |
| US-002 | Integration | Create/Edit log modal pre-fills correctly          |
| US-003 | Manual      | Both "no data" and "create log" buttons open modal |
| US-004 | Unit        | setupWorkoutToggle toggle states                   |
| US-004 | Integration | All 3 modals toggle correctly                      |
| US-005 | All         | Full test suite, lint, build                       |
