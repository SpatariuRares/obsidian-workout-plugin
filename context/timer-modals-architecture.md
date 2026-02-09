# Timer & Modals Feature Architecture

## Timer Feature

### Overview

The timer feature provides countdown, stopwatch, and interval timers with configurable presets, audio notifications, and embedded view integration.

**Total**: 1,411 lines across 10 files

### File Structure

```
app/features/timer/
├── index.ts                          (30)   Barrel export
├── types.ts                          (49)   TIMER_TYPE, TimerPresetConfig, EmbeddedTimerParams, TimerState
│
├── views/
│   └── EmbeddedTimerView.ts          (305)  Main view (extends BaseView) + preset resolution
│
├── business/
│   └── TimerCore.ts                  (161)  State management: start, stop, reset, tick updates
│
├── components/
│   ├── TimerControls.ts              (75)   Start/stop + reset buttons
│   ├── TimerDisplay.ts               (66)   Time formatting + display rendering
│   └── TimerAudio.ts                 (48)   Web Audio API notification sounds
│
├── modals/
│   ├── InsertTimerModal.ts           (142)  Code block generation (extends BaseInsertModal)
│   └── components/
│       └── TimerConfigurationSection.ts (176) Reusable form section factory
│
└── settings/
    └── TimerPresetsSettings.ts       (359)  Settings tab UI for preset CRUD
```

### Component Architecture

**Static Components** (no instantiation):
- `TimerDisplay` - Pure presentation: `formatTime()` (ms --> MM:SS), type-aware display
- `TimerControls` - Button creation + event listener attachment
- `TimerAudio` - Web Audio synthesis: C5-E5-G5-C6 rising + G5-E5-C5 resolution

**Instance-Based**:
- `TimerCore` - Interval timer (100ms tick), state transitions, callback delegation
- `EmbeddedTimerView` - Lifecycle, preset resolution, rendering orchestration

### Preset Cascade Resolution

`EmbeddedTimerView.resolveTimerParams()` resolves parameters with this priority (first non-undefined wins):

1. **Explicit params** from code block (e.g., `duration: 60`)
2. **Specified preset** if `preset: presetName` provided
3. **Default preset** from `settings.defaultTimerPreset`
4. **Hardcoded defaults** (30s countdown, no rounds, controls shown)

Implementation details:
- `filterUndefined()` removes undefined values before object spread
- `presetToParams()` converts `TimerPresetConfig` --> `EmbeddedTimerParams`
- Returns `{ error: string }` if specified preset not found

### TimerCore Responsibilities

| Method | Purpose |
|--------|---------|
| `start()` | Begins interval, records startTime |
| `stop()` | Clears interval, preserves elapsed |
| `reset()` | Restores initial state |
| `destroy()` | Cleans up all references |
| `updateTimer()` | 100ms tick: checks completion, updates display |

Callbacks: `onTimerComplete`, `onSoundPlay`, `onStateChange`

---

## Modals Feature

### Overview

The modals feature provides a multi-layer modal system with shared form helpers, exercise autocomplete, code generation, and specialized modals for logging, exercise creation, and muscle tag management.

**Total**: 4,664 lines across 35+ files

### File Structure

```
app/features/modals/
├── index.ts                          (5)    Barrel export
│
├── base/
│   ├── ModalBase.ts                  (277)  Abstract base: form input factories
│   ├── BaseInsertModal.ts            (81)   Template Method for insert modals
│   ├── BaseLogModal.ts               (280)  Template Method for log modals
│   ├── components/
│   │   ├── LogFormRenderer.ts        (341)  Form orchestrator for dynamic exercise params
│   │   └── DynamicFieldsRenderer.ts  (185)  Parameter-driven field factory + quick-adjust buttons
│   ├── logic/
│   │   ├── LogSubmissionHandler.ts   (101)  Form extraction, validation, entry creation
│   │   └── LogFormValidator.ts       (57)   Dynamic field validation
│   └── services/
│       ├── LogDataService.ts         (45)   CSV loading with caching
│       └── RecentExercisesService.ts (44)   Recent exercise tracking for UI chips
│
├── common/
│   ├── ConfirmModal.ts               (75)   Simple yes/no confirmation dialog
│   └── index.ts                      (1)
│
├── components/
│   ├── ExerciseAutocomplete.ts       (197)  Exercise input + suggestions + create-page button
│   ├── CodeGenerator.ts              (156)  Static utility for code block generation
│   ├── AdvancedOptionsSection.ts     (106)  Reusable advanced options component
│   └── TargetSectionWithAutocomplete.ts (154) Exercise/workout target selector
│
├── log/
│   ├── CreateLogModal.ts             (66)   Create modal (no date, auto-fill last entry)
│   ├── EditLogModal.ts               (101)  Edit modal (shows date, pre-fills original)
│   └── index.ts                      (5)
│
├── exercise/
│   ├── CreateExercisePageModal.ts    (421)  Exercise definition page creation
│   ├── CreateExerciseSectionModal.ts (257)  Exercise section in existing pages
│   ├── AuditExerciseNamesModal.ts    (322)  Bulk rename/consolidate exercises
│   ├── AddExerciseBlockModal.ts      (113)  Insert exercise data table block
│   └── index.ts                      (3)
│
└── muscle/
    ├── MuscleTagManagerModal.ts      (382)  Full CRUD for muscle tag mappings
    ├── types.ts                      (18)   TypeScript interfaces
    ├── index.ts                      (2)
    ├── components/
    │   ├── MuscleTagFormRenderer.ts   (201)  Add/edit form with suggestions
    │   ├── MuscleTagTableRenderer.ts  (69)   Tag table with edit/delete
    │   ├── MuscleTagLayoutRenderer.ts (136)  Layout orchestrator
    │   └── MuscleTagImportPreviewRenderer.ts (132) CSV import preview
    ├── logic/
    │   ├── MuscleTagImportLogic.ts    (114)  CSV parsing and validation
    │   ├── MuscleTagImportMergeLogic.ts (42) Merge vs replace strategy
    │   ├── MuscleTagFilterLogic.ts    (53)   Search/filter tags by name
    │   ├── MuscleTagSuggestionLogic.ts (53)  Levenshtein distance matching
    │   └── MuscleTagSaveValidationLogic.ts (42) Uniqueness/format validation
    └── services/
        ├── MuscleTagStorageService.ts (35)   Vault file I/O
        ├── MuscleTagFileService.ts    (35)   CSV download
        └── MuscleTagCsvExportService.ts (27) CSV content generation
```

### Multi-Layer Inheritance

```
ModalBase (Abstract - 277 lines)
  |  Form helpers: createTextInput, createNumberInput, createSelect,
  |  createCheckbox, createTextarea, createFormGroup, createSection
  |  Editor: insertIntoEditor, getCurrentFileName
  |
  |-- BaseInsertModal (81 lines)
  |     Abstract: getModalTitle, getButtonText, getSuccessMessage,
  |               createConfigurationSections, generateCode
  |     Template: onOpen() --> createConfigurationSections() --> createButtons()
  |     Used by: InsertChartModal, InsertTableModal, InsertTimerModal
  |
  |-- BaseLogModal (280 lines)
  |     Abstract: getModalTitle, getButtonText, getSuccessMessage,
  |               getInitialWorkoutToggleState, handleSubmit,
  |               shouldPreFillForm, getPreFillData
  |     Composition: LogFormRenderer, DynamicFieldsRenderer, LogDataService
  |     Template: onOpen() --> form --> pre-fill --> buttons
  |     Used by: CreateLogModal, EditLogModal
  |
  |-- Direct extensions (no intermediate base)
        ConfirmModal, MuscleTagManagerModal, CreateExercisePageModal,
        AuditExerciseNamesModal, etc.
```

### Design Patterns

**Template Method**:
- `BaseInsertModal.onOpen()` defines skeleton: sections --> buttons
- `BaseLogModal.onOpen()` defines skeleton: form elements --> pre-fill --> buttons
- Concrete classes override `getModalTitle()`, `generateCode()`, `handleSubmit()`

**Strategy**:
- `ExerciseAutocomplete`: strategies for loading, filtering, status display
- `MuscleTagImportMergeLogic`: "merge" vs "replace" import strategies
- `DynamicFieldsRenderer`: different rendering per parameter type (numeric/text/checkbox)

**Component/Renderer**:
- `LogFormRenderer` orchestrates `ExerciseAutocomplete`, `DynamicFieldsRenderer`, protocol/notes fields
- `MuscleTagLayoutRenderer` orchestrates form, import preview, search, table
- `TimerConfigurationSection` is a stateless form factory

### Dead Code

**`TimerConfigurationHandlers` interface** (`TimerConfigurationSection.ts:15-17`):
```typescript
export interface TimerConfigurationHandlers {
  updateVisibility: () => void;
}
```
Exported but never imported. Handler object returned from `.create()` but not consumed by `InsertTimerModal`. Internal closure works correctly without it.

**`ExerciseAutocompleteHandlers` interface** (`ExerciseAutocomplete.ts:17-20`):
```typescript
export interface ExerciseAutocompleteHandlers {
  showAutocomplete: (_query: string) => void;
  hideAutocomplete: () => void;
}
```
Exported but never imported. Same pattern - returned but not consumed.

**Recommendation**: Remove both interfaces.

### Large File Candidates for Splitting

**CreateExercisePageModal.ts (421 lines)**:
- Custom parameter row management (~100 lines of complex tracking)
- Suggested split: `CustomParameterEditor.ts`, `ExercisePageCreator.ts`

**MuscleTagManagerModal.ts (382 lines)**:
- Import flow is 150+ lines
- Suggested split: `MuscleTagEditor.ts`, `MuscleTagImportHandler.ts`

**TimerPresetsSettings.ts (359 lines)**:
- Inline modal-style editor within settings is 130 lines
- Suggested split: `TimerPresetsDisplay.ts`, `TimerPresetEditor.ts`

**LogFormRenderer.ts (341 lines)**:
- Mixes data service calls, rendering, and callback setup
- Suggested split: `LogFormFieldsFactory.ts`, `LogFormAutoFillLogic.ts`

**AuditExerciseNamesModal.ts (322 lines)**:
- Data loading + table rendering + bulk operations
- Suggested split: `ExerciseConsolidationLogic.ts`, `AuditTableRenderer.ts`

### Muscle Tag Module - Good Architecture Example

The muscle tag module demonstrates ideal separation:

```
muscle/
├── MuscleTagManagerModal.ts     Modal: orchestration + state
├── components/                  Pure rendering, no business logic
├── logic/                       Pure functions, no I/O or DOM
└── services/                    I/O and file operations only
```

Key implementation details:
- Debounce (150ms) for tag input suggestions
- Levenshtein distance for typo matching
- Import preview validates all tags before merge/replace
- Validation checks: uniqueness, format, canonical muscle group membership
