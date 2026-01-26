# PRD: Phase 1 - Quick Wins

## Introduction

Phase 1 focuses on immediate improvements to reduce friction and repetition in daily workout logging. These are low-effort, high-impact changes that address the most common pain points identified in the optimization report: repetitive timer configuration, inconsistent exercise naming, and suboptimal default settings.

## Goals

- Eliminate repetitive timer block configuration across 28+ instances
- Fix exercise name mismatches causing filter failures
- Reduce boilerplate in workout-log blocks by improving defaults
- Improve overall user experience without breaking existing configurations

## User Stories

### US-001: Add Timer Presets to Settings
**Description:** As a user, I want to define reusable timer presets so that I don't have to repeat the same configuration in every workout-timer block.

**Acceptance Criteria:**
- [ ] Settings tab includes "Timer Presets" section
- [ ] Can create/edit/delete named presets (e.g., "standard-rest", "long-rest")
- [ ] Each preset stores: type, duration, showControls, autoStart, sound
- [ ] Presets persist across plugin reloads
- [ ] Typecheck passes

### US-002: Use Timer Preset in Code Block
**Description:** As a user, I want to reference a preset in my workout-timer block so that I only need to specify the preset name.

**Acceptance Criteria:**
- [ ] `preset` parameter accepted in workout-timer blocks
- [ ] Preset values override defaults but can be overridden by explicit parameters
- [ ] Error message shown if preset name doesn't exist
- [ ] Existing blocks without preset continue to work unchanged
- [ ] Typecheck passes

### US-003: Add Default Preset Support
**Description:** As a user, I want to set a default preset so that minimal workout-timer blocks automatically use my preferred settings.

**Acceptance Criteria:**
- [ ] Settings includes "Default Timer Preset" dropdown
- [ ] When set, workout-timer blocks with no parameters use the default preset
- [ ] "None" option available to use hardcoded defaults
- [ ] Typecheck passes

### US-004: Change Default exactMatch to True
**Description:** As a user, I want exactMatch to default to true so that my exercise filters work correctly without explicit configuration.

**Acceptance Criteria:**
- [ ] `DEFAULT_EXACT_MATCH` in Constants.ts changed from `false` to `true`
- [ ] Settings includes toggle for "Default Exact Match" preference
- [ ] Existing blocks with explicit `exactMatch: false` continue to work
- [ ] Documentation updated to reflect new default
- [ ] Typecheck passes

### US-005: Create Exercise Name Audit Command
**Description:** As a user, I want a command to find mismatches between exercise file names and CSV entries so that I can fix data inconsistencies.

**Acceptance Criteria:**
- [ ] Command "Audit Exercise Names" added to command palette
- [ ] Scans all exercise files in configured exercise folder
- [ ] Compares with unique exercise names in CSV
- [ ] Shows modal with list of mismatches (file name vs CSV name)
- [ ] Each mismatch shows: file path, file name, closest CSV match, similarity score
- [ ] Typecheck passes

### US-006: Rename Exercise in CSV via Audit Modal
**Description:** As a user, I want to rename exercises directly from the audit modal so that I can quickly fix inconsistencies.

**Acceptance Criteria:**
- [ ] Each mismatch row has "Rename in CSV" button
- [ ] Clicking opens confirmation with old name → new name preview
- [ ] On confirm, all CSV entries with old name updated to new name
- [ ] Modal refreshes to show updated state
- [ ] Cache invalidated after rename
- [ ] Typecheck passes

### US-007: Rename File via Audit Modal
**Description:** As a user, I want to rename the exercise file to match the CSV so that I have the option to fix either direction.

**Acceptance Criteria:**
- [ ] Each mismatch row has "Rename File" button
- [ ] Clicking opens confirmation with old filename → new filename preview
- [ ] On confirm, file renamed using Obsidian's vault API
- [ ] Internal links updated if possible
- [ ] Modal refreshes to show updated state
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Add `timerPresets` field to WorkoutChartsSettings interface as `Record<string, TimerPresetConfig>`
- FR-2: Add `TimerPresetConfig` type with fields: name, type, duration, showControls, autoStart, sound
- FR-3: Add `preset` optional parameter to TimerParams interface
- FR-4: EmbeddedTimerView resolves preset from settings before applying explicit parameters
- FR-5: Add `defaultTimerPreset` field to settings (string, nullable)
- FR-6: Add `defaultExactMatch` field to settings (boolean, default true)
- FR-7: Change `DEFAULT_EXACT_MATCH` constant to `true`
- FR-8: Register "workout-planner:audit-exercise-names" command
- FR-9: AuditModal scans exercise folder (from settings) for `.md` files
- FR-10: AuditModal compares filenames (without extension) against CSV exercise column
- FR-11: Use fuzzy matching (Levenshtein distance) to suggest closest matches
- FR-12: DataService exposes `renameExercise(oldName: string, newName: string)` method
- FR-13: Rename updates all matching rows in CSV and invalidates cache

## Non-Goals

- No automatic renaming without user confirmation
- No bulk rename operations (one at a time for safety)
- No undo functionality for renames (use git for recovery)
- No migration script for existing timer blocks (manual update)
- No sync between file frontmatter and CSV (only filename comparison)

## Technical Considerations

- Timer preset resolution order: explicit params > preset params > default preset > hardcoded defaults
- Exercise folder path already exists in settings (`exerciseFolderPath`)
- CSV rename requires reading entire file, modifying, and rewriting
- Consider showing progress for large CSV files during rename
- Fuzzy matching can use existing logic from DataFilter if applicable

## Design Considerations

- Settings UI for presets should support add/edit/delete with inline editing
- Audit modal should be sortable by similarity score
- Color-code severity: red for no match, yellow for close match, green for exact match
- Include "Ignore" option for intentional differences

## Success Metrics

- Reduce timer block configuration from 5 lines to 1 line (preset reference only)
- Zero exercise name mismatches after running audit and fixing
- 50% of workout-log blocks can remove explicit `exactMatch: true`

## Open Questions

- Should presets support preset inheritance (preset extending another preset)?
- Should audit also check frontmatter `nome_esercizio` field?
- Should we add a "dry run" mode for CSV renames?

---

## Phase Overview

This is **Phase 1** of an incremental implementation plan:

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Quick Wins (Timer Presets, exactMatch, Name Audit) | Current |
| Phase 2 | Core Features (Auto-Generate Blocks, Progressive Overload) | Planned |
| Phase 3 | Advanced Features (Protocol Logging, Duration Calculator) | Planned |
| Phase 4 | Integrations (Templater, Mobile Quick Entry) | Planned |
| Phase 5 | Refactoring (Constants Split) | Planned |
