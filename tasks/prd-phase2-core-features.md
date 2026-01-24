# PRD: Phase 2 - Core Features

## Introduction

Phase 2 introduces core features that significantly reduce friction in daily workout logging. These features automate repetitive patterns identified in real usage: manually creating timer+log block pairs and tracking progressive overload through text notes.

## Goals

- Automate generation of exercise block structures (timer + log)
- Provide structured progressive overload tracking with visual feedback
- Reduce time spent on workout documentation setup
- Enable data-driven progression decisions

## User Stories

### US-001: Add Exercise Block Command
**Description:** As a user, I want a command to insert a complete exercise block structure so that I don't have to manually create timer and log blocks each time.

**Acceptance Criteria:**
- [ ] Command "Add Exercise Block" added to command palette
- [ ] Opens modal with exercise name input (with autocomplete from existing exercises)
- [ ] Includes timer duration selector (with preset dropdown if presets exist)
- [ ] Includes workout file selector (defaults to current file)
- [ ] Inserts structured block at cursor position
- [ ] Typecheck passes

### US-002: Configure Exercise Block Template
**Description:** As a user, I want to customize the exercise block template so that it matches my preferred structure.

**Acceptance Criteria:**
- [ ] Settings includes "Exercise Block Template" textarea
- [ ] Template supports placeholders: `{{exercise}}`, `{{duration}}`, `{{workout}}`, `{{preset}}`
- [ ] Default template matches the pattern identified in vault analysis
- [ ] Preview shown in settings
- [ ] Typecheck passes

### US-003: Add Target Weight to Workout Log
**Description:** As a user, I want to set a target weight for an exercise so that the system can track my progression goal.

**Acceptance Criteria:**
- [ ] `targetWeight` parameter accepted in workout-log blocks
- [ ] Target displayed in log header when set
- [ ] Value stored as number (kg)
- [ ] Works with or without targetReps
- [ ] Typecheck passes

### US-004: Add Target Reps to Workout Log
**Description:** As a user, I want to set target reps for an exercise so that the system knows when I've hit my progression threshold.

**Acceptance Criteria:**
- [ ] `targetReps` parameter accepted in workout-log blocks
- [ ] Target displayed in log header when set
- [ ] Value stored as number
- [ ] Works with or without targetWeight
- [ ] Typecheck passes

### US-005: Display Target Progress Indicator
**Description:** As a user, I want to see visual progress toward my target so that I know how close I am to progression.

**Acceptance Criteria:**
- [ ] Progress bar shown when targets are set
- [ ] Bar fills based on best recent performance vs target
- [ ] Different colors for: far (red), close (yellow), achieved (green)
- [ ] Tooltip shows exact numbers
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Target Achievement Notification
**Description:** As a user, I want to see a notification when I achieve my target so that I know it's time to increase the weight.

**Acceptance Criteria:**
- [ ] Badge displayed when latest entry meets or exceeds target reps at target weight
- [ ] Badge text: "Target Reached! Consider increasing weight"
- [ ] Badge is dismissible per exercise
- [ ] Achievement persisted in settings to avoid repeated notifications
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Suggest Next Weight
**Description:** As a user, I want a suggested next weight when I hit my target so that I have a clear progression path.

**Acceptance Criteria:**
- [ ] When target achieved, show "Suggested next: X kg" based on increment setting
- [ ] Default increment: 2.5kg (configurable in settings)
- [ ] Suggestion appears next to achievement badge
- [ ] Clicking suggestion updates targetWeight in the code block
- [ ] Typecheck passes

### US-008: Quick Log with Previous Values
**Description:** As a user, I want to quickly log a set with my previous values so that logging during workouts is faster.

**Acceptance Criteria:**
- [ ] "Repeat Last" button in log table header
- [ ] Clicking opens CreateLogModal pre-filled with previous entry values
- [ ] Weight field has +2.5kg / -2.5kg quick adjust buttons
- [ ] Reps field has +1 / -1 quick adjust buttons
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

## Functional Requirements

- FR-1: Register "workout-planner:add-exercise-block" command
- FR-2: Add `exerciseBlockTemplate` field to settings (string with placeholders)
- FR-3: Add `targetWeight` optional parameter to LogParams interface
- FR-4: Add `targetReps` optional parameter to LogParams interface
- FR-5: Add `weightIncrement` field to settings (number, default 2.5)
- FR-6: Add `achievedTargets` field to settings (Record<string, boolean>) for dismissing notifications
- FR-7: EmbeddedTableView renders target header and progress bar when targets set
- FR-8: TableRenderer includes "Repeat Last" button when entries exist
- FR-9: CreateLogModal accepts pre-fill values via constructor options
- FR-10: Add quick adjust buttons (+/-) to weight and reps fields in CreateLogModal

## Non-Goals

- No automatic weight increase (always user-confirmed)
- No periodization planning or mesocycle tracking
- No integration with external fitness apps
- No AI-based progression recommendations
- No target history tracking (only current target)

## Technical Considerations

- Exercise autocomplete can reuse existing ExerciseAutocomplete component
- Progress calculation: `(currentBestReps / targetReps) * 100` when at targetWeight
- Consider debouncing progress bar updates during rapid data changes
- Target achievement check runs on each render, not as background job
- Template parsing should handle missing placeholders gracefully

## Design Considerations

- Progress bar should be subtle, not dominating the log view
- Achievement badge should be celebratory but not intrusive
- Quick adjust buttons should be easily tappable on mobile
- "Repeat Last" button positioned for thumb access on mobile

## Success Metrics

- Exercise block creation time reduced from ~60 seconds to ~10 seconds
- 80% of exercises have targets set within 2 weeks of feature release
- Logging time per set reduced by 30% with "Repeat Last" feature

## Open Questions

- Should targets be stored in code blocks or in a separate targets file?
- Should we support percentage-based targets (e.g., +5% from PR)?
- Should quick adjust increments be configurable per exercise?

---

## Dependencies

- **Phase 1 Required:** Timer Presets (US-001 uses preset dropdown)
