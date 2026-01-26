# PRD: Phase 3 - Advanced Features

## Introduction

Phase 3 introduces advanced tracking capabilities for specialized workout protocols and time management. These features address the observation that users document advanced techniques (drop sets, myo-reps, 21s protocol) as unstructured text, losing the ability to analyze their effectiveness.

## Goals

- Enable structured tracking of advanced workout protocols
- Provide workout duration estimation and time management
- Enable analytics on protocol effectiveness over time
- Maintain backward compatibility with standard logging

## User Stories

### US-001: Add Protocol Field to Log Entry
**Description:** As a user, I want to select a workout protocol when logging so that my advanced techniques are tracked structurally.

**Acceptance Criteria:**
- [ ] CreateLogModal includes "Protocol" dropdown
- [ ] Options: Standard, Drop Set, Myo-Reps, Rest-Pause, Superset, 21s
- [ ] Default: Standard
- [ ] Protocol saved to CSV in new column
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-002: Display Protocol in Log Table
**Description:** As a user, I want to see which protocol was used for each logged set so that I can review my training variety.

**Acceptance Criteria:**
- [ ] Protocol column added to workout-log table
- [ ] Column shows protocol badge/icon
- [ ] Column is hideable via parameter
- [ ] Standard protocol shows no badge (clean default view)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Filter Log by Protocol
**Description:** As a user, I want to filter my workout log by protocol so that I can analyze specific technique usage.

**Acceptance Criteria:**
- [ ] `protocol` parameter accepted in workout-log blocks
- [ ] Filter accepts single protocol or array of protocols
- [ ] Works in combination with exercise and workout filters
- [ ] Typecheck passes

### US-004: Protocol Statistics in Dashboard
**Description:** As a user, I want to see protocol usage statistics in my dashboard so that I understand my training distribution.

**Acceptance Criteria:**
- [ ] Dashboard includes "Protocol Distribution" card
- [ ] Shows pie chart of protocol usage (last 30 days)
- [ ] Shows count and percentage per protocol
- [ ] Click on slice filters recent workouts by that protocol
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Protocol Effectiveness Analysis
**Description:** As a user, I want to see if certain protocols correlate with better progression so that I can optimize my training.

**Acceptance Criteria:**
- [ ] Dashboard includes "Protocol Effectiveness" section
- [ ] Shows average volume increase per protocol type
- [ ] Compares progression rate between protocols
- [ ] Includes disclaimer about correlation vs causation
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-006: Workout Duration Estimator Widget
**Description:** As a user, I want to see estimated workout duration so that I can plan my gym time.

**Acceptance Criteria:**
- [ ] New code block type: `workout-duration`
- [ ] Calculates based on: timer durations + estimated set time
- [ ] Default set time: 45 seconds (configurable)
- [ ] Shows: total rest time, total set time, total duration
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-007: Duration Estimator Workout Parameter
**Description:** As a user, I want to estimate duration for a specific workout file so that I can use this widget on any page.

**Acceptance Criteria:**
- [ ] `workout` parameter specifies which file to analyze
- [ ] Scans file for workout-timer blocks
- [ ] Counts sets from workout-log blocks
- [ ] Defaults to current file if not specified
- [ ] Typecheck passes

### US-008: Actual Duration Tracking
**Description:** As a user, I want to track actual workout duration so that I can compare estimated vs real time.

**Acceptance Criteria:**
- [ ] Dashboard includes "Duration Comparison" section
- [ ] Shows estimated vs actual for recent workouts
- [ ] Actual derived from first log timestamp to last log timestamp
- [ ] Shows variance trend over time
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-009: Add Custom Protocol
**Description:** As a user, I want to add my own protocols so that I can track techniques not in the default list.

**Acceptance Criteria:**
- [ ] Settings includes "Custom Protocols" section
- [ ] Can add protocol with: name, abbreviation, color
- [ ] Custom protocols appear in CreateLogModal dropdown
- [ ] Custom protocols saved to settings
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Add `protocol` column to CSV schema (default: "standard", backward compatible)
- FR-2: Add `WorkoutProtocol` enum: STANDARD, DROP_SET, MYO_REPS, REST_PAUSE, SUPERSET, TWENTYONE
- FR-3: Add `customProtocols` field to settings (array of {name, abbrev, color})
- FR-4: CreateLogModal includes protocol dropdown populated from enum + custom
- FR-5: TableRenderer includes optional protocol column
- FR-6: DataFilter supports `protocol` filter parameter
- FR-7: Register `workout-duration` code block processor
- FR-8: DurationEstimator scans target file for timer and log blocks
- FR-9: Add `setDuration` field to settings (number, default 45)
- FR-10: Dashboard calculates actual duration from timestamp spread in logs
- FR-11: Add migration for existing CSV entries (set protocol to "standard")

## Non-Goals

- No automatic protocol detection from weight/rep patterns
- No protocol-specific logging UI (e.g., special drop set entry form)
- No integration with workout programming apps
- No protocol recommendations or periodization
- No multi-exercise superset linking

## Technical Considerations

- CSV migration must be backward compatible (empty protocol = standard)
- Duration estimation requires parsing markdown files for code blocks
- Actual duration calculation needs timezone handling for timestamps
- Protocol colors should work in both light and dark themes
- Consider lazy loading for protocol analytics (can be expensive)

## Design Considerations

- Protocol badges should be small and unobtrusive
- Use consistent color scheme across protocol badges
- Duration widget should be visually distinct from timer
- Pie chart should be accessible (patterns, not just colors)

## Success Metrics

- 30% of logged sets use non-standard protocols within 1 month
- Duration estimates within 15% of actual duration on average
- Protocol distribution visible in dashboard drives training variety

## Open Questions

- Should superset protocol link two exercises together?
- How to handle protocols with variable set counts (e.g., drop sets)?
- Should protocol be editable after logging?

---

## Dependencies

- **Phase 1 Required:** For existing timer blocks to be scanned
- **Phase 2 Recommended:** Progressive overload works alongside protocol tracking
