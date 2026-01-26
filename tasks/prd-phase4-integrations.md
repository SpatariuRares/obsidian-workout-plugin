# PRD: Phase 4 - Integrations

## Introduction

Phase 4 extends the plugin's capabilities through integrations with the Obsidian ecosystem and mobile-first features. These integrations address the observation that logging in the gym requires speed, and that the vault uses Templater and Dataview extensively.

## Goals

- Enable rapid logging during workouts via mobile-optimized UI
- Provide Templater functions for exercise template creation
- Expose workout data to Dataview queries for advanced users
- Generate visual workout representations via Canvas

## User Stories

### US-001: Mobile Quick Log Ribbon Icon
**Description:** As a user, I want a ribbon icon for quick logging so that I can log sets with minimal taps during workouts.

**Acceptance Criteria:**
- [ ] Dumbbell icon added to left ribbon
- [ ] Icon visible on both desktop and mobile
- [ ] Clicking opens QuickLogModal
- [ ] Icon can be hidden via settings
- [ ] Typecheck passes

### US-002: Quick Log Modal
**Description:** As a user, I want a simplified logging modal so that I can log a set in under 5 seconds.

**Acceptance Criteria:**
- [ ] Modal shows only: exercise, reps, weight, confirm button
- [ ] Exercise field has recent exercises as quick-select buttons (last 5)
- [ ] Weight field defaults to last weight for selected exercise
- [ ] Large touch targets for mobile use
- [ ] Swipe right to confirm (optional gesture)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-003: Quick Weight Adjustment
**Description:** As a user, I want to quickly adjust weight from my last set so that common progressions are instant.

**Acceptance Criteria:**
- [ ] "+2.5" and "-2.5" buttons flanking weight input
- [ ] Button increment configurable in settings
- [ ] Visual feedback on tap
- [ ] Haptic feedback on mobile (if supported)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-004: Recent Exercise Quick Select
**Description:** As a user, I want to tap my recent exercises so that I don't need to search every time.

**Acceptance Criteria:**
- [ ] Top 5 recent exercises shown as chips above search
- [ ] Tapping chip selects exercise and moves focus to reps
- [ ] Recent list updates after each log
- [ ] Recent exercises persisted in settings
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

### US-005: Templater Exercise Template Function
**Description:** As a Templater user, I want a function to generate exercise blocks so that my templates can include workout structures.

**Acceptance Criteria:**
- [ ] Exposes `tp.user.workoutExerciseBlock(name, duration, workout)` function
- [ ] Function returns formatted exercise block string
- [ ] Uses configured exercise block template
- [ ] Documentation provided for Templater setup
- [ ] Typecheck passes

### US-006: Templater Exercise List Function
**Description:** As a Templater user, I want a function to get exercise names so that I can build dynamic templates.

**Acceptance Criteria:**
- [ ] Exposes `tp.user.workoutExercises()` function
- [ ] Returns array of exercise names from configured folder
- [ ] Can filter by muscle tag: `tp.user.workoutExercises({tag: "glutes"})`
- [ ] Documentation provided
- [ ] Typecheck passes

### US-007: Dataview Workout Logs Accessor
**Description:** As a Dataview user, I want to query my workout logs so that I can create custom views.

**Acceptance Criteria:**
- [ ] Exposes `dv.workoutLogs(filter)` function via plugin API
- [ ] Filter supports: exercise, workout, dateRange, protocol
- [ ] Returns array of log entries compatible with Dataview
- [ ] Example query provided in documentation
- [ ] Typecheck passes

### US-008: Dataview Exercise Stats Function
**Description:** As a Dataview user, I want exercise statistics so that I can build custom dashboards.

**Acceptance Criteria:**
- [ ] Exposes `dv.workoutStats(exercise)` function
- [ ] Returns: totalVolume, maxWeight, totalSets, trend
- [ ] Works with inline queries
- [ ] Example queries provided
- [ ] Typecheck passes

### US-009: Export Workout to Canvas
**Description:** As a user, I want to visualize my workout as a Canvas so that I can see the structure visually.

**Acceptance Criteria:**
- [ ] Command "Export Workout to Canvas" added
- [ ] Opens file picker for workout file
- [ ] Generates `.canvas` file with exercise nodes
- [ ] Nodes colored by muscle group
- [ ] Supersets connected with edges
- [ ] Typecheck passes

### US-010: Canvas Layout Options
**Description:** As a user, I want layout options for canvas export so that I can customize the visualization.

**Acceptance Criteria:**
- [ ] Layout options: horizontal flow, vertical flow, grouped by muscle
- [ ] Option to include timer durations on nodes
- [ ] Option to include last performance on nodes
- [ ] Settings in export modal
- [ ] Typecheck passes

## Functional Requirements

- FR-1: Add ribbon icon with configurable visibility setting
- FR-2: Create QuickLogModal with minimal UI optimized for speed
- FR-3: Add `recentExercises` field to settings (array of string, max 10)
- FR-4: Add `quickWeightIncrement` field to settings (number, default 2.5)
- FR-5: Expose Templater user functions via plugin script registration
- FR-6: Create `scripts/templater-functions.js` for Templater integration
- FR-7: Expose `window.WorkoutPlannerAPI` for Dataview access
- FR-8: API includes: `getWorkoutLogs(filter)`, `getExerciseStats(name)`, `getExercises(filter)`
- FR-9: Create CanvasExporter class for canvas file generation
- FR-10: Canvas format follows Obsidian canvas JSON schema

## Non-Goals

- No Templater plugin dependency (functions work when Templater is available)
- No Dataview plugin dependency (API available regardless)
- No real-time canvas sync (one-time export only)
- No mobile-specific swipe gestures (use standard buttons)
- No voice input for logging

## Technical Considerations

- Ribbon icon uses Obsidian's `addRibbonIcon` API
- Templater functions require user to add script folder to Templater settings
- Dataview integration uses `app.plugins.plugins` access pattern
- Canvas JSON schema must match Obsidian's expected format exactly
- Quick log modal should work offline (queue logs for sync)

## Design Considerations

- Quick log modal: large fonts, high contrast, thumb-friendly zones
- Weight adjustment buttons: minimum 44x44px touch targets
- Recent exercise chips: horizontally scrollable, pill-shaped
- Canvas nodes: readable labels, consistent sizing

## Success Metrics

- Quick log modal: average logging time under 5 seconds
- 50% of mobile logging uses quick log after adoption
- Templater functions used in 3+ user templates
- Canvas export used monthly by power users

## Open Questions

- Should quick log support barbell plate calculator?
- Should Dataview API support live queries (observable)?
- Should canvas export include rest times between exercises?
- How to handle Templater async function support?

---

## Dependencies

- **Phase 1 Recommended:** Timer presets make Templater templates cleaner
- **Phase 2 Recommended:** Quick log benefits from "repeat last" pattern
- **Phase 3 Optional:** Protocol field in quick log modal
