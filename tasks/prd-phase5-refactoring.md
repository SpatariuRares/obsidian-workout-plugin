# PRD: Phase 5 - Refactoring (Constants Consolidation)

## Introduction

Phase 5 addresses technical debt by splitting the monolithic `Constants.ts` file (817 lines) into focused, single-responsibility modules. This refactoring improves maintainability, reduces cognitive load, and enables better tree-shaking for bundle size optimization.

## Goals

- Split Constants.ts into logical, single-responsibility modules
- Improve code discoverability and maintainability
- Enable better IDE autocomplete and navigation
- Reduce bundle size through improved tree-shaking
- Zero runtime behavior changes

## User Stories

### US-001: Split UI Constants
**Description:** As a developer, I want UI-related constants in a dedicated file so that I can quickly find labels, icons, and emoji.

**Acceptance Criteria:**
- [ ] Create `app/constants/ui.constants.ts`
- [ ] Move all UI labels, icons, emoji, and display strings
- [ ] Export named exports for each category
- [ ] All imports updated across codebase
- [ ] Typecheck passes
- [ ] All tests pass

### US-002: Split Default Values Constants
**Description:** As a developer, I want default configuration values in a dedicated file so that I can understand plugin defaults at a glance.

**Acceptance Criteria:**
- [ ] Create `app/constants/defaults.constants.ts`
- [ ] Move all DEFAULT_* constants
- [ ] Include default settings object
- [ ] Document each default with JSDoc comment
- [ ] All imports updated across codebase
- [ ] Typecheck passes
- [ ] All tests pass

### US-003: Split Muscle Constants
**Description:** As a developer, I want muscle-related constants in a dedicated file so that heatmap and body-part logic is contained.

**Acceptance Criteria:**
- [ ] Create `app/constants/muscles.constants.ts`
- [ ] Move MUSCLE_GROUPS, MUSCLE_COLORS, HEATMAP_CONFIG
- [ ] Move muscle tag mappings
- [ ] All imports updated across codebase
- [ ] Typecheck passes
- [ ] All tests pass

### US-004: Split Validation Constants
**Description:** As a developer, I want validation messages in a dedicated file so that error handling is consistent.

**Acceptance Criteria:**
- [ ] Create `app/constants/validation.constants.ts`
- [ ] Move all error messages and validation strings
- [ ] Move validation patterns (regex, limits)
- [ ] All imports updated across codebase
- [ ] Typecheck passes
- [ ] All tests pass

### US-005: Create Constants Index
**Description:** As a developer, I want a single import point for constants so that existing code can migrate gradually.

**Acceptance Criteria:**
- [ ] Create `app/constants/index.ts`
- [ ] Re-export all constants from sub-modules
- [ ] Support both `import { X } from '@app/constants'` and `import { X } from '@app/constants/ui.constants'`
- [ ] Deprecation comment on old imports pattern
- [ ] Typecheck passes
- [ ] All tests pass

### US-006: Update Existing Imports
**Description:** As a developer, I want all existing imports updated so that the codebase uses the new structure.

**Acceptance Criteria:**
- [ ] All files importing from Constants.ts updated
- [ ] Prefer specific imports over barrel imports for tree-shaking
- [ ] No circular dependency warnings
- [ ] Typecheck passes
- [ ] All tests pass

### US-007: Remove Original Constants.ts
**Description:** As a developer, I want the original file removed so that the refactoring is complete.

**Acceptance Criteria:**
- [ ] Original `Constants.ts` deleted
- [ ] No references to old file remain
- [ ] Build succeeds
- [ ] Plugin loads and functions correctly
- [ ] Typecheck passes
- [ ] All tests pass

### US-008: Document Constants Structure
**Description:** As a developer, I want documentation for the constants structure so that future contributors understand the organization.

**Acceptance Criteria:**
- [ ] Each constants file has header JSDoc explaining its purpose
- [ ] CLAUDE.md updated with constants structure
- [ ] Example imports shown in documentation
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Create `app/constants/ui.constants.ts` with labels, icons, emoji
- FR-2: Create `app/constants/defaults.constants.ts` with DEFAULT_* values
- FR-3: Create `app/constants/muscles.constants.ts` with muscle data
- FR-4: Create `app/constants/validation.constants.ts` with messages and patterns
- FR-5: Create `app/constants/index.ts` as barrel export
- FR-6: Update all 40+ files importing Constants.ts
- FR-7: Delete original Constants.ts after migration complete
- FR-8: Update CLAUDE.md with new constants structure

## Non-Goals

- No logic changes (pure file reorganization)
- No renaming of constant values
- No type changes
- No new constants added during refactoring
- No performance optimizations beyond tree-shaking

## Technical Considerations

- Use find-and-replace carefully to avoid partial matches
- Test each file category split independently before proceeding
- Maintain git history clarity with focused commits per category
- Watch for circular dependencies between new modules
- ESLint may need barrel file exceptions

## Proposed File Structure

```
app/constants/
├── index.ts              # Barrel export (re-exports all)
├── ui.constants.ts       # ~200 lines: labels, icons, emoji
├── defaults.constants.ts # ~150 lines: DEFAULT_* values
├── muscles.constants.ts  # ~300 lines: muscle groups, colors, heatmap
└── validation.constants.ts # ~100 lines: error messages, patterns
```

## Migration Strategy

1. Create new files with copied content (no imports broken)
2. Update imports file-by-file, testing after each
3. Once all imports updated, delete original
4. Run full test suite and manual testing

## Success Metrics

- Constants.ts reduced from 1 file (817 lines) to 5 focused files
- Average file size under 200 lines
- Zero runtime errors after migration
- Improved IDE navigation (find definition faster)

## Open Questions

- Should chart-specific constants have their own file?
- Should timer constants be separate from defaults?
- Should we use const enums for string literals?

---

## Dependencies

- **No dependencies:** This refactoring can be done at any time
- **Recommended timing:** After Phase 4, before new feature development
