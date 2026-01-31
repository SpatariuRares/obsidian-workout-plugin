# PRD: Dynamic Exercise Types with Custom Parameters

## Introduction

Extend the workout tracking system to support different exercise types beyond the current reps×weight model. Users will be able to define exercises with custom parameters (time-based for planks, distance for running, floors for stairs, etc.), and the system will dynamically add columns to the CSV and adapt the UI to display relevant fields.

**Problem:** Currently, all exercises are forced into a reps×weight model, which doesn't fit time-based exercises (planks, stretches), cardio (running, cycling), or custom activities (stair climbing with floors). Users cannot track diverse training modalities in a single system.

**Solution:** Create an exercise definition system where each exercise specifies its parameter schema. The CSV dynamically accommodates new columns, and modals/charts/tables read exercise definitions to show only relevant fields.

## Goals

- Support multiple exercise types: Reps×Weight (strength), Time-based (holds/stretches), Distance-based (cardio), and custom types
- Allow users to define new exercise types with custom parameters via modal or exercise folder files
- Dynamically extend CSV columns when new parameter types are introduced
- Adapt charts and tables to display parameters relevant to each exercise type
- Maintain backward compatibility with existing reps×weight data

## User Stories

### US-001: Define Exercise Type Schema Interface
**Description:** As a developer, I need a TypeScript interface to represent exercise type definitions so the system can understand what parameters each exercise requires.

**Acceptance Criteria:**
- [ ] Create `ExerciseTypeDefinition` interface in `app/types/ExerciseTypes.ts` with:
  - `id`: string (unique identifier, e.g., "strength", "timed", "distance", "stairs")
  - `name`: string (display name)
  - `parameters`: array of `ParameterDefinition` objects
- [ ] Create `ParameterDefinition` interface with:
  - `key`: string (CSV column name, e.g., "reps", "duration", "distance")
  - `label`: string (UI display label)
  - `type`: "number" | "string" | "boolean"
  - `unit?`: string (optional unit display, e.g., "kg", "sec", "km", "floors")
  - `required`: boolean
  - `default?`: any (default value)
  - `min?`: number (validation)
  - `max?`: number (validation)
- [ ] Create `ExerciseDefinition` interface with:
  - `name`: string (exercise name)
  - `typeId`: string (references ExerciseTypeDefinition.id)
  - `muscleGroups?`: string[] (muscle tags)
  - `customParameters?`: ParameterDefinition[] (exercise-specific overrides)
- [ ] Export interfaces from barrel file `app/types/index.ts`
- [ ] Typecheck passes

---

### US-002: Create Built-in Exercise Type Definitions
**Description:** As a user, I want predefined exercise types so I can quickly create common exercises without manual configuration.

**Acceptance Criteria:**
- [ ] Create `app/constants/exerciseTypes.constants.ts` with built-in types:
  - **Strength** (id: "strength"): reps (number, required), weight (number, required, unit: kg)
  - **Timed** (id: "timed"): duration (number, required, unit: sec)
  - **Distance** (id: "distance"): distance (number, required, unit: km), duration (number, optional, unit: sec)
  - **Cardio** (id: "cardio"): duration (number, required, unit: min), distance (number, optional, unit: km), heartRate (number, optional, unit: bpm)
  - **Custom** (id: "custom"): no predefined parameters (user defines all)
- [ ] Export `BUILT_IN_EXERCISE_TYPES: ExerciseTypeDefinition[]`
- [ ] Export `getExerciseTypeById(id: string): ExerciseTypeDefinition | undefined`
- [ ] Update `app/constants/index.ts` barrel to export
- [ ] Typecheck passes

---

### US-003: Create ExerciseDefinitionService
**Description:** As a developer, I need a service to load, save, and manage exercise definitions from exercise folder files.

**Acceptance Criteria:**
- [ ] Create `app/services/ExerciseDefinitionService.ts` with methods:
  - `getExerciseDefinition(exerciseName: string): Promise<ExerciseDefinition | null>` - reads from exercise .md frontmatter
  - `getAllExerciseDefinitions(): Promise<ExerciseDefinition[]>` - scans exercise folder
  - `saveExerciseDefinition(definition: ExerciseDefinition): Promise<void>` - updates frontmatter
  - `getParametersForExercise(exerciseName: string): Promise<ParameterDefinition[]>` - combines type + custom params
- [ ] Parse exercise type from frontmatter field `exercise_type: strength` (default: "strength" for backward compatibility)
- [ ] Parse custom parameters from frontmatter field `parameters: [...]` (YAML array)
- [ ] Cache definitions with 10-second TTL (similar to DataService pattern)
- [ ] Register service in main.ts plugin initialization
- [ ] Typecheck passes

---

### US-004: Extend CSV Schema for Dynamic Columns
**Description:** As a developer, I need the CSV to support dynamic columns so new exercise parameters can be stored.

**Acceptance Criteria:**
- [ ] Update `WorkoutLogData` interface to include `customFields?: Record<string, string | number | boolean>`
- [ ] Update `CSVWorkoutLogEntry` interface similarly
- [ ] Modify `parseCSVLogFile()` in WorkoutLogData.ts to:
  - Read CSV header dynamically (not hardcoded columns)
  - Map known columns (date, exercise, reps, weight, volume, etc.) to typed fields
  - Map unknown columns to `customFields` object
- [ ] Modify `formatCSVLogEntry()` to:
  - Write known columns first
  - Append custom field columns after known columns
- [ ] Ensure empty/null values written as empty string in CSV (nullable columns)
- [ ] Backward compatible: existing CSVs with only standard columns still work
- [ ] Typecheck passes

---

### US-005: Extend DataService for Dynamic Column Management
**Description:** As a developer, I need DataService to handle CSV files with varying columns and add new columns when needed.

**Acceptance Criteria:**
- [ ] Add method `getCSVColumns(): Promise<string[]>` - returns current CSV header columns
- [ ] Add method `ensureColumnExists(columnName: string): Promise<void>` - adds column to CSV if missing
- [ ] Modify `addWorkoutLogEntry()` to:
  - Check if entry has customFields with new column keys
  - Call `ensureColumnExists()` for any new columns before writing
  - Write entry with all columns (empty string for unused)
- [ ] Modify `updateWorkoutLogEntry()` similarly
- [ ] Clear cache after column structure changes
- [ ] Typecheck passes

---

### US-006: Update CreateExercisePageModal for Exercise Types
**Description:** As a user, I want to select an exercise type when creating a new exercise so the system knows what parameters to track.

**Acceptance Criteria:**
- [ ] Add exercise type dropdown to CreateExercisePageModal (after exercise name input)
- [ ] Show built-in types: Strength, Timed, Distance, Cardio, Custom
- [ ] When "Custom" selected, show UI to add custom parameters:
  - "Add Parameter" button
  - For each parameter: key input, label input, type dropdown (number/string), unit input, required checkbox
- [ ] Update exercise page template to include `exercise_type` in frontmatter
- [ ] Update exercise page template to include `parameters` in frontmatter (for custom type)
- [ ] Default selection: "Strength" (maintains backward compatibility)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-007: Update CreateLogModal for Dynamic Fields
**Description:** As a user, I want the log entry form to show fields relevant to the selected exercise's type.

**Acceptance Criteria:**
- [ ] When exercise is selected (via autocomplete), fetch its ExerciseDefinition
- [ ] Dynamically render input fields based on exercise type parameters:
  - Number fields with ± adjustment buttons (like current weight/reps)
  - String fields as text input
  - Show unit labels next to inputs
- [ ] Remove hardcoded reps/weight fields; generate from parameter definitions
- [ ] For exercises without definition (legacy), default to strength type (reps/weight)
- [ ] Validate required fields before submission
- [ ] Store parameter values in `customFields` for non-standard parameters
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-008: Update EditLogModal for Dynamic Fields
**Description:** As a user, I want to edit log entries and see the correct fields for that exercise's type.

**Acceptance Criteria:**
- [ ] Load exercise definition when modal opens
- [ ] Populate form fields from both standard fields and `customFields`
- [ ] Same dynamic field rendering as CreateLogModal (US-007)
- [ ] Preserve all field values on save (including customFields)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-009: Update TableRenderer for Dynamic Columns
**Description:** As a user, I want tables to show columns relevant to each exercise type automatically.

**Acceptance Criteria:**
- [ ] TableRenderer reads exercise definition for filtered exercise
- [ ] If single exercise: show only that exercise's parameter columns
- [ ] If multiple exercises: show union of all parameter columns (with empty cells for exercises missing that param)
- [ ] Column headers use parameter labels (not keys)
- [ ] Column headers show units in parentheses, e.g., "Duration (sec)"
- [ ] Support explicit `columns` config to override automatic detection
- [ ] Default columns for no filter: Date, Exercise, Reps, Weight, Volume (backward compatible)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-010: Update ChartRenderer for Dynamic Data Types
**Description:** As a user, I want charts to visualize the appropriate metric for each exercise type.

**Acceptance Criteria:**
- [ ] ChartRenderer reads exercise definition for filtered exercise
- [ ] Determine available chart data types from exercise parameters:
  - Strength: volume, weight, reps
  - Timed: duration
  - Distance: distance, duration, pace (calculated)
  - Custom: all numeric parameters
- [ ] Update `type` parameter to accept any numeric parameter key (not just volume/weight/reps)
- [ ] Default `type` based on exercise type: strength→volume, timed→duration, distance→distance
- [ ] Show error message if requested type not available for exercise
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-011: Update InsertChartModal for Dynamic Types
**Description:** As a user, I want the chart insert modal to show valid data type options based on the selected exercise.

**Acceptance Criteria:**
- [ ] When exercise is selected, fetch its definition
- [ ] Update "Data Type" dropdown to show only valid options for that exercise type
- [ ] Update preview to reflect selected exercise's available chart types
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### US-012: Add Exercise Type Migration Utility
**Description:** As a user with existing data, I want my current exercises to work without modification.

**Acceptance Criteria:**
- [ ] Exercises without `exercise_type` frontmatter default to "strength"
- [ ] CSV entries without customFields work with standard reps/weight parsing
- [ ] Add optional command "Migrate Exercise Types" that:
  - Scans exercise folder
  - Adds `exercise_type: strength` to files missing it
  - Reports count of updated files
- [ ] Typecheck passes

---

## Functional Requirements

- **FR-1:** The system must support defining exercise types with custom parameter schemas
- **FR-2:** Built-in exercise types must include: Strength (reps×weight), Timed (duration), Distance (distance+optional duration), Cardio (duration+optional distance/heartRate), Custom (user-defined)
- **FR-3:** Exercise definitions must be stored in exercise file frontmatter as `exercise_type` and optional `parameters` fields
- **FR-4:** The CSV must dynamically add new columns when exercises with new parameters are logged
- **FR-5:** Empty/unused parameter cells in CSV must be stored as empty strings (nullable columns)
- **FR-6:** CreateLogModal must dynamically generate form fields based on selected exercise's type definition
- **FR-7:** Tables must automatically display columns relevant to the filtered exercise type
- **FR-8:** Charts must support visualizing any numeric parameter, not just volume/weight/reps
- **FR-9:** Existing data without exercise type definitions must default to "strength" type for backward compatibility

## Non-Goals (Out of Scope)

- No automatic exercise type detection based on exercise name
- No exercise type inheritance or templates
- No bulk parameter editing across multiple exercises
- No CSV file migration tool (structure auto-adapts)
- No dashboard analytics for custom parameters (future enhancement)
- No muscle heatmap integration with custom exercise types
- No protocol system integration with custom parameters
- No import/export of exercise type definitions

## Design Considerations

### UI Components to Reuse
- `FormField` molecule for dynamic parameter inputs
- `Button` atom for add/remove parameter actions
- `Select` component for dropdowns (exercise type, parameter type)
- Existing number input with ± buttons pattern from BaseLogModal

### Modal Layout
- CreateExercisePageModal: Add exercise type dropdown after name, custom params section below
- CreateLogModal: Replace hardcoded reps/weight with dynamic fields section
- Keep visual consistency with existing modal styling

### Frontmatter Format
```yaml
---
nome_esercizio: Plank
exercise_type: timed
tags:
  - core
  - abs
parameters:
  - key: sets
    label: Sets
    type: number
    required: true
---
```

## Technical Considerations

### CSV Column Order
1. Fixed columns always first: date, exercise, timestamp, notes, protocol, workout, origine
2. Standard parameter columns next: reps, weight, volume (for backward compat)
3. Custom parameter columns alphabetically after

### Type Safety
- Use discriminated unions for parameter types
- Strict typing for customFields: `Record<string, string | number | boolean>`
- Runtime validation of parameter values against definitions

### Performance
- Cache exercise definitions (10s TTL like DataService)
- Lazy-load definitions only when needed (modal open, chart/table render)
- Avoid re-reading CSV header on every operation

### Backward Compatibility
- Existing exercises without type = strength
- Existing CSVs with standard columns continue working
- Existing code blocks without new params render with defaults

## Success Metrics

- Users can create and log time-based exercises (planks, stretches) with duration tracking
- Users can create and log distance-based exercises (running, cycling) with distance/time
- Users can create custom exercise types (stairs with floors) and see data in charts/tables
- Existing workout data continues to display correctly without migration
- Charts/tables adapt automatically when filtering to specific exercise types

## Open Questions

1. Should custom parameters support calculated fields (like volume = reps × weight)?
2. Should there be a global "Exercise Types" settings page to manage built-in type customization?
3. How should combined charts (multiple exercises) handle different parameter types?
4. Should the dashboard's analytics (PR tracking, volume trends) extend to custom parameters?
