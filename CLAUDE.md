# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Principles

- **Follow established patterns** — use "Key Development Patterns" section before implementing features
- **Delegate to tools** — use build system, Jest, ESLint; don't manually validate what tools can check
- **Use services, not ad-hoc logic** — e.g., read and change the workout log only through `WorkoutLogFile` (via the plugin's `WorkoutDataPort` methods), never by parsing the CSV yourself. Any other CSV reading/writing goes through `app/utils/data/CsvCodec.ts` (RFC 4180: quoted commas, quotes, newlines, CRLF); never `split("\n")`/`split(",")` CSV content
- **Update this file** — when discovering new patterns or solving complex problems, document them here

## Development Commands

```bash
npm run dev          # Development build with watch mode (CSS + esbuild)
npm run build        # Production build (tsc check + CSS + minified bundle)
npm test             # Run Jest test suite
npm run test:watch   # Jest in watch mode
npm run test:coverage # Jest with coverage report
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # tsc only, no emit
npm run doe:validate # Import-convention check (@app aliases, barrels, circular deps)
node scripts/find-hardcoded-strings.mjs  # Strict scan for literals that should use t()
```

**Release**: push a `X.Y.Z` tag (use `/release`). CI runs the Translate workflow for anything still untranslated (usually nothing: see "Internationalization"), syncs `manifest.json` to the tag, commits it to `main`, then builds and publishes. Don't bump `manifest.json` by hand; `npm run version` / `versions.json` are not part of the flow.

**Husky pre-push** runs typecheck → lint → `test:coverage` → build, so a failing check (including a coverage drop) blocks `git push`. CI runs the same lint and coverage checks. Tests run with `TZ=Europe/Rome` (set in `jest.config.js`; setting `process.env.TZ` inside a test file has no effect).

**Translation hooks**: **pre-commit** translates new `en.json` strings locally when Ollama runs here (`brew install ollama`, `ollama serve`, `ollama pull translategemma`) and adds the locales to the commit; without Ollama it does nothing. **pre-push** then starts the Translate workflow on GitHub for a pushed branch that still misses translations (needs `gh`; `git pull` afterwards to get the commit).

**Run single test**: `npm test -- app/utils/__tests__/DateUtils.test.ts`

## Build System

1. **CSS**: `node build-css.mjs` - Sass compiles `styles.source.scss` (which `@use`s partials in `app/styles/`) → `styles.css`
2. **TypeScript**: `tsc -noEmit -skipLibCheck` - Type checking only (no emit)
3. **Bundle**: esbuild bundles `main.ts` → `main.js` with Obsidian externals

The build process is sequential and must complete in order. Development mode (`npm run dev`) watches for changes and rebuilds automatically.

## Project Architecture

**Plugin Type**: Obsidian plugin for workout tracking with CSV data storage, visualizations (charts, tables, dashboards), timers, and exercise management.

**Core Principles:**

- **Service Layer Pattern**: Main plugin delegates to specialized services
- **Facade Pattern**: Services expose clean APIs while delegating to internal components
- **Atomic Design**: UI components organized by complexity (atoms → molecules → features)
- **Domain-Driven Features**: Features organized by domain (charts, tables, dashboard, modals, etc.)
- **Embedded Views**: Code blocks (`workout-chart`, `workout-log`, `workout-timer`, `workout-dashboard`) render inside notes
- **Type Safety**: Strict TypeScript with path aliases (`@app/*`)

### TypeScript Configuration

```json
{
  "baseUrl": ".",
  "noImplicitAny": true,
  "paths": { "@app/*": ["app/*"] },
  "strict": true,
  "strictNullChecks": true
}
```

**Always use `@app/*` imports instead of relative paths** (e.g., `@app/components/atoms` not `../../components/atoms`)

### Main Plugin (main.ts)

```
WorkoutChartsPlugin
├── Services
│   ├── WorkoutLogFile           # The workout log CSV: format, column order, cache, mutations
│   ├── ExerciseDefinitionService # Exercise type definitions and field management
│   ├── MuscleTagService          # Custom muscle tag mappings (CSV-backed, cached)
│   ├── CommandHandlerService     # Registers Obsidian commands
│   └── CodeBlockProcessorService # Registers code block processors
│
├── Embedded Views
│   ├── EmbeddedChartView         # workout-chart (Chart.js visualizations)
│   ├── EmbeddedTableView         # workout-log (sortable data tables)
│   ├── EmbeddedTimerView         # workout-timer (countdown/interval)
│   └── EmbeddedDashboardView     # workout-dashboard (stats, analytics, heat maps)
│
└── Public API
    └── WorkoutPlannerAPI         # window.WorkoutPlannerAPI for Dataview integration
```

**Key Lifecycle:**

1. `onload()`: Initialize services, register processors, expose API, add ribbon icon
2. `onunload()`: Clean up timers, views, charts, services, clear caches, nullify references
3. Service cleanup order: timers → views → cache → Chart.js → service references → ribbon → API

### Service Layer Architecture

#### WorkoutLogFile (`app/services/data/WorkoutLogFile.ts`)

The only module that knows the workout log CSV (see "Workout log file" in `CONTEXT.md`). It owns the header, the column order rule, row ⇄ entry conversion in both directions (`WorkoutLogCodec.ts`, internal), volume (`reps × weight`, computed on every add/update), the 5-second cache, and the `log:*` events. Every mutation goes through one private `rewrite()` that keeps the file's column order.

- **LogStorage** (`LogStorage.ts`): the seam under it. `VaultLogStorage` in production; tests use `InMemoryLogStorage` (`__tests__/InMemoryLogStorage.ts`) and assert on the CSV text, so test through `WorkoutLogFile`, not by mocking the vault
- **DataFilter**: multi-strategy filtering (exact, fuzzy, exercise field); views apply it to `read()`'s rows

```typescript
// Callers go through the plugin's WorkoutDataPort, which forwards to WorkoutLogFile
const data = await plugin.getWorkoutLogData(); // all rows; views filter via DataFilter.filterData
await plugin.addWorkoutLogEntry({ date, exercise, reps, weight, ... }); // LogEntryInput: no timestamp, no volume
await plugin.updateWorkoutLogEntry(log, toLogEntryInput(log)); // toLogEntryInput keeps the entered weight and unit
```

#### ProtocolCatalog (`app/services/protocols/ProtocolCatalog.ts`)

The only place that knows what a protocol looks like: `new ProtocolCatalog(settings.customProtocols).resolve(id)` gives its translated name, badge text/class and chart color; `.all()` lists built-ins then custom ones. Use `protocolId(raw)` to normalize an id (lower case, empty = standard). Custom ids are kept in the CSV, so never map an unknown id to standard.

#### TrainingHistory (`app/services/history/TrainingHistory.ts`)

The only place that reads logged sets back as training (see "Training History" in `CONTEXT.md`). Pure: `new TrainingHistory(rows)`, no vault, no mocks in tests. `trainingDay(date)` is the one day rule (local day, never `date.split("T")[0]`); `sessions({ workout? })` groups sets by training day + workout name (case, spacing, quotes ignored; sets without a workout form their own unnamed session) and gives each session's plausible `duration`. `personalRecord(exercise)` and `newRecordSets()` are the one PR definition. Never group sets by day or session, or compute a PR, anywhere else.

#### ExerciseDefinitionService

Manages exercise type definitions (Strength, Cardio, Flexibility, custom types) with field definitions. Cached with `clearCache()` method.

#### MuscleTagService

Manages custom muscle tag mappings (e.g., `petto` → `chest`) from CSV file, and is the only place that turns tags into muscles: `await tagMap()`, `musclesForTags(tags)`, `musclesForExercise(name)` (tags from the exercise note's frontmatter via `metadataCache`). Everything is async so nobody sees the default tags before the user's CSV has loaded. Cache is invalidated via `triggerMuscleTagRefresh()`. Call `destroy()` to clean up.

### Embedded Views (BaseView Pattern)

All embedded views extend `BaseView` (`app/features/common/views/BaseView.ts`) for consistent error handling, loading states, and empty data handling:

```typescript
abstract class BaseView {
  protected handleError(container, error): void;
  protected handleEmptyData(container, logData, exerciseName?, currentPageLink?, codeBlockId?): boolean;
  protected handleNoFilteredData(container, params, titlePrefix, viewType): void;
  protected showLoadingIndicator(container): HTMLElement;
  protected filterData(...); validateAndHandleErrors(...); showSuccessMessage(...);
}
```

**Views:**

- `EmbeddedChartView` - Chart.js visualizations (volume, weight, reps, pace, distance, duration, heart rate)
- `EmbeddedTableView` - Sortable tables with edit/delete actions, protocol badges, target calculations
- `EmbeddedTimerView` - Countdown/interval timers with presets and audio notifications
- `EmbeddedDashboardView` - Aggregated stats, muscle heat map, recent workouts, volume analytics

Each view has a `cleanup()` method called during plugin unload.

### Component Architecture (Atomic Design)

```
app/components/
├── atoms/        # Primitives: Button, Input, Text, Icon, Container, Canvas, Chip, ProtocolBadge, SpacerStat
├── molecules/    # Composites: StatCard, FormField, SearchBox, Badge, TrendIndicator, LoadingSpinner,
│                 #            ActionButtonGroup, FilterIndicator, CopyableBadge, ListItem
└── index.ts      # Barrel export (DO use for components)
```

**Import patterns:**

```typescript
// Preferred: barrel import
import { Button, Icon, Text } from "@app/components/atoms";
import { StatCard, TrendIndicator } from "@app/components/molecules";

// Alternative: direct import (better tree-shaking)
import { Button } from "@app/components/atoms/Button";
```

**Component Principles:**

- **Atoms**: No dependencies on other UI components, single responsibility
- **Molecules**: Composed from atoms, reusable across features
- **Organism**: Minimal use - prefer feature-specific UI components instead

**Feature-Specific UI Components** (NOT in shared components):

```
app/features/
├── dashboard/ui/DashboardCard.ts      # Dashboard-specific card component
├── tables/ui/ActionButtons.ts         # Table action buttons (edit, delete)
├── tables/ui/TargetHeader.ts          # Table target calculation header
├── charts/components/TrendHeader.ts   # Chart trend indicator header
└── dashboard/ui/StatsBox.ts           # Dashboard stats box
```

These stay in feature directories because they're domain-specific, not general-purpose.

### Feature Modules (Domain-Driven)

```
app/features/
├── common/
│   ├── views/           # BaseView (parent of all embedded views)
│   └── suggest/         # FileSuggest, FolderSuggest
│
├── charts/
│   ├── components/      # ChartRenderer, TrendHeader
│   ├── config/          # Chart.js configuration
│   ├── business/        # ChartDataUtils (data transformation)
│   ├── modals/          # InsertChartModal
│   ├── ui/              # Chart-specific UI helpers
│   └── views/           # EmbeddedChartView
│
├── tables/
│   ├── components/      # TableActions, TableDataProcessor
│   ├── business/        # TargetCalculator (progressive overload)
│   ├── modals/          # InsertTableModal, EditTableModal
│   ├── ui/              # ActionButtons, TargetHeader, TableErrorMessage
│   └── views/           # EmbeddedTableView
│
├── dashboard/
│   ├── ui/              # DashboardCard, StatsBox
│   ├── widgets/         # one folder per widget (quick-stats, volume-analytics, muscle-heat-map,
│   │                    # protocol-*, recent-workouts, summary, duration-comparison, ...)
│   ├── business/        # Dashboard calculation utilities
│   ├── modals/          # InsertDashboardModal
│   └── views/           # EmbeddedDashboardView
│
├── timer/
│   ├── business/        # TimerCore
│   ├── components/      # TimerControls, TimerDisplay, TimerAudio
│   ├── modals/          # InsertTimerModal, EditTimerModal, components/TimerConfigurationSection
│   └── views/           # EmbeddedTimerView
│
├── modals/              # Cross-feature modals (feature insert/edit modals live in their feature)
│   ├── base/            # ModalBase, BaseInsertModal
│   │   ├── logic/       # LogEntryDraft (log form as data: prefill, validate, set to save)
│   │   └── services/    # RecentExercisesService
│   ├── components/      # ExerciseAutocomplete
│   ├── log/             # CreateLogModal, EditLogModal
│   ├── exercise/        # AddExerciseBlockModal, CreateExercisePageModal,
│   │                    # CreateExerciseSectionModal, AuditExerciseNamesModal
│   └── muscle/          # MuscleTagManagerModal, components, logic
│
├── settings/
│   ├── WorkoutChartsSettings.ts              # Main settings tab
│   └── components/                           # General, QuickLog, CustomProtocols,
│                                             # ProgressiveOverload, Templates, Maintenance
│
├── canvas/              # Canvas export functionality
├── duration/            # Workout duration estimation
└── exercise-conversion/ # Convert exercises between types
```

**Feature Organization Rules:**

- `components/` - Core feature components
- `business/` - Business logic, calculations (no UI)
- `ui/` - Feature-specific UI components (not in shared components)
- `views/` - Embedded views (extend BaseView)
- `modals/` - Feature-specific modals

### Constants (Modular Organization)

```
app/constants/
├── index.ts                    # Barrel export + backward-compatible CONSTANTS object
├── ui.constants.ts             # UI label groups (MODAL_UI, SETTINGS_UI, …) backed by t(), icons, emoji, unit maps
├── defaults.constants.ts       # Default configs (DEFAULT_SETTINGS, DEFAULT_CHART_CONFIG, etc.)
├── muscles.constants.ts        # CANONICAL_MUSCLE_GROUPS, MUSCLE_PARENT_GROUPS, MUSCLE_TAG_ENTRIES (single source; MUSCLE_TAGS/MUSCLE_TAG_MAP are derived)
├── validation.constants.ts     # Error messages, validation rules
└── exerciseTypes.constants.ts  # Exercise type definitions (STRENGTH, CARDIO, FLEXIBILITY)
```

**Import patterns:**

```typescript
// Barrel import (convenient)
import {
  ICONS,
  DEFAULT_SETTINGS,
  MUSCLE_TAGS,
  ERROR_MESSAGES,
} from "@app/constants";

// Direct import (better tree-shaking for production)
import { ICONS, MODAL_UI } from "@app/constants/ui.constants";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
```

**When adding constants:**

- User-facing strings → a key in `app/i18n/locales/en.json`, read with `t()` (not a literal in `ui.constants.ts`)
- Default configurations → `defaults.constants.ts`
- Validation/errors → `validation.constants.ts`
- Muscle/exercise data → `muscles.constants.ts` or `exerciseTypes.constants.ts`

**NEVER hardcode user-facing strings in components!**

### Internationalization

- `import { t } from "@app/i18n";` then `t("common.clear")`. Keys are nested JSON paths in `app/i18n/locales/en.json`.
- **Only edit `en.json`.** The other 23 locales are filled by `.github/workflows/translate.yml` (Ollama translategemma, `AI translate/`, one runner per locale): it runs when `en.json` changes on `main`, when the pre-push hook asks for a branch, and as part of every release, and commits the locales to that branch. `AI translate/missing_locales.py` lists the locales still missing keys.
- The translator repairs or rejects placeholder changes (`AI translate/placeholders.py`, e.g. the model turning `{count}` into `{{count}}`), and `AI translate/check_locales.py` fails the job before the locales are committed if any locale still breaks a placeholder, code span or `**bold**` of en.json. Python tests: `cd "AI translate" && venv/bin/python -m unittest test_placeholders`.
- The job only translates **missing** keys. When you change the English text of an existing key (or remove a key), delete that key from every other locale too, otherwise the old translation stays. Untranslated keys fall back to English at runtime.
- Write real UI text, never the key name spelled out ("Delete this log entry?", not "Delete Confirm"), in sentence case.
- `app/i18n/__tests__/locales.consistency.test.ts` fails if a locale has keys en.json doesn't, or changes a `{placeholder}`, `{{template}}`, `**bold**` marker or a `` `code` `` identifier. Some values need their leading space (e.g. `charts.labels.variationFromTo`, `dashboard.durationComparison.minutesSuffix`) because the code appends them to a number or text.
- ESLint (`i18next/no-literal-string`) warns on literals. `node scripts/find-hardcoded-strings.mjs` is the stricter scan. Use the `i18n` skill for audits (missing/unused keys, param mismatches).
- In tests, assert against `t("key")`, not English text.

### Refresh Architecture (Event-Driven)

All data mutations emit typed events on `WorkoutEventBus`. Views subscribe via `EventAwareRenderChild` and selectively re-render based on event type and exercise/workout filter.

**Workout log mutation flow:**

```
WorkoutLogFile.add/update/delete/renameExercise/stampMissingWeightUnits
  → rewrites the CSV (column order kept), clears its cache
  → eventBus.emit(log:added | log:updated | log:deleted | log:bulk-changed)
  → EventAwareRenderChild receives event → filters by exercise/workout → calls renderFn()
```

**Muscle tag mutation flow:**

```
plugin.triggerMuscleTagRefresh()
  → muscleTagService.clearCache()
  → eventBus.emit(muscle-tags:changed)
  → EventAwareRenderChild with muscleTagsAware=true re-renders (dashboards)
```

**Display settings (e.g. weight unit):**

```
eventBus.emit(settings:changed { key, previousValue, newValue })
  → every EventAwareRenderChild re-renders (cache is not cleared)
```

**Bulk operations (e.g. exercise conversion, import):**

```
plugin.batchOperation('import', async () => { ... N mutations ... })
  → All log:* events suppressed during fn()
  → One log:bulk-changed emitted at end
  → All EventAwareRenderChild instances re-render once
```

**Key components:**

- `WorkoutEventBus` (`app/services/events/WorkoutEventBus.ts`) — Typed internal event bus; `batch()` coalesces N events into one `log:bulk-changed`
- `EventAwareRenderChild` (`app/services/core/EventAwareRenderChild.ts`) — Replaces the old `DataAwareRenderChild`; filters by `exercise`, `workout`, `exactMatch`, `muscleTagsAware`
- `WorkoutEventTypes.ts` — Discriminated union `WorkoutEvent`, `normalizeExercise()` for case/whitespace-insensitive comparison
- `triggerWorkoutLogRefresh()` in `main.ts` — **Deprecated** public method kept only for external callers (Dataview scripts); not part of any port and not used internally

**Important:** Do NOT pass `onRefresh` callbacks through modal or table components. The event bus handles all refresh logic automatically after every log mutation.

### Data Flow

```
CSV File (workout_logs.csv)
    ↓
WorkoutLogFile (format + 5-second cache)
    ↓
DataFilter (multi-strategy matching)
    ↓
Views (Chart, Table, Dashboard) or Public API
```

**CSV Columns (standard):**

- `date`, `exercise`, `reps`, `weight`, `volume`, `origine`, `workout`, `timestamp`, `notes`, `protocol`
- Custom fields for exercise type-specific parameters (duration, distance, pace, etc.)
- `weightUnit` (`kg`/`lb`, last column, read by header name): unit of that row's `weight`/`volume`, empty = settings unit. `toWorkoutLogData` (in `WorkoutLogCodec`) converts `weight`/`volume` to `settings.weightUnit` on load and keeps the raw value in `enteredWeight`/`enteredUnit`; everything that does maths reads `weight`, only the table cell and the edit/autofill prefill show `enteredWeight`. Conversions go through `app/utils/WeightUnitUtils.ts` (2 decimals, 1.25 plates)

**Filtering strategies** (exercise field only; every row comes from the same CSV, so file names are not used):

1. `exactMatch: true` → case/whitespace-insensitive equality on the exercise field
2. Fuzzy (default) → pick the best-scoring exercise name (`StringUtils.getMatchScore`, threshold 70), then keep logs scoring ≥70 against it
3. `dateRange` is applied once, in `DataFilter.filterData`, and counts the whole boundary day (today and the previous N days). `TableDataProcessor` only sorts and limits

### Code Block Syntax

Source of truth: one schema per block, built with `defineCodeBlock` (`app/services/codeblocks/CodeBlockSchema.ts`): `app/features/charts/chartBlock.ts`, `tables/tableBlock.ts`, `timer/timerBlock.ts`, `dashboard/dashboardBlock.ts`, `duration/durationBlock.ts`. Each lists every parameter with its type, default and allowed values; the `Embedded*Params` types are derived from it (`BlockParams<typeof tableBlock>`). All params are optional.

- **Reading**: `CodeBlockProcessorService` calls `schema.parse(source)`. Invalid values show an error in place of the block; views get the params with `schema.defaults` applied (the timer applies them itself, under the preset).
- **Writing**: insert modals and example generators call `schema.serialize(params)`. Never build a block with string concatenation.
- **Editing**: edit modals snapshot the form when it opens (`collectParams()`), then `CodeBlockEditorService.patchCodeBlock(app, schema, { id }, changedParams(before, after))`. Only changed lines are rewritten; comments, order and parameters the form doesn't show stay as typed.
- **Adding a parameter**: add it to the schema (with default and limits), read it in the view, and if a modal sets it, return it from `collectParams()`. Then update the examples below.

#### workout-chart

```yaml
exercise: Squat
workout: Push Day
type: volume # volume, weight, reps, duration, distance, pace, heartRate
chartType: exercise # exercise = daily average; workout/combined/all = daily total (all ignores filters)
dateRange: 30
limit: 50
exactMatch: false
showTrendLine: false # default false
showStats: true # default true
title: Squat volume
height: "400px"
```

#### workout-log

```yaml
exercise: Bench Press
workout: Push Day
exactMatch: false
dateRange: 14
limit: 50
sortBy: date # date, exercise, weight, reps, volume
sortOrder: desc # asc, desc
columns: ["date", "reps", "weight", "volume"]
showAddButton: true
showProtocol: true
targetWeight: 100 # with targetReps: progressive overload header
targetReps: 8
```

#### workout-timer

```yaml
type: countdown # countdown, interval, stopwatch
duration: 90 # seconds
rounds: 8 # interval only
showControls: true
sound: true # default true
autoStart: false # start as soon as the block renders (once per timer)
preset: rest # saved preset used as base config
exercise: Squat
workout: Leg Day
```

#### workout-dashboard

```yaml
title: Training overview
dateRange: 30
showSummary: true # also showQuickStats, showVolumeAnalytics,
showRecentWorkouts: true #      showQuickActions
recentWorkoutsLimit: 5
volumeTrendDays: 7
```

Code blocks written by the insert modals also carry an `id`, used to find the block when it is edited.

## Key Development Patterns

### Adding New Embedded Views

1. Create view class extending `BaseView` in `app/features/[feature]/views/`
2. Implement `render(container, source, ctx)` method
3. Add cleanup logic in `cleanup()` method
4. Register processor in `CodeBlockProcessorService.registerProcessors()`
5. Update plugin initialization in `main.ts` if needed

### Adding New Modals

1. Extend `BaseInsertModal` (for code insertion) or `ModalBase` (for other actions)
2. Implement abstract methods: `getModalTitle()`, `createFormElements()`, etc.
3. For insert modals: implement `generateCode()` to return code block string
4. Register command in `CommandHandlerService.registerCommands()`
5. Add modal UI strings as keys in `app/i18n/locales/en.json` and read them with `t()` (see "Internationalization")

### Adding New Components

1. Create component in appropriate atomic level (`atoms/`, `molecules/`, or feature-specific `ui/`)
2. Export from barrel file: `atoms/index.ts` or `molecules/index.ts`
3. Add test file in `__tests__/` directory (co-located with source)
4. Follow naming pattern: `ComponentName.ts`, `ComponentName.test.ts`
5. Export types alongside component: `export { Component, type ComponentProps }`

### Adding New Services

1. Create service in `app/services/[category]/`
2. Initialize in `main.ts` constructor or `onload()`
3. Add cleanup in `onunload()` if service manages resources
4. Expose service methods through plugin instance if needed by external code
5. DO NOT create barrel file (`index.ts`) - import services directly

### Adding New Dashboard Widgets

1. Create widget in `app/features/dashboard/widgets/[widget-name]/`
2. Create business logic in `business/` subdirectory
3. Use `DashboardCard` component from `app/features/dashboard/ui/`
4. Register widget in `EmbeddedDashboardView.render()`
5. Add widget UI strings as keys in `app/i18n/locales/en.json` and read them with `t()` (see "Internationalization")

### Modifying Constants

1. Locate appropriate constant file (`ui`, `defaults`, `muscles`, `validation`, `exerciseTypes`)
2. Add constant to specific section
3. If adding to composed `CONSTANTS` object, update `constants/index.ts`
4. Ensure backward compatibility for existing `CONSTANTS.WORKOUT.*` usage

## Testing

**Framework**: Jest with ts-jest
**Coverage**: measured over all of `app/`; `jest.config.js` thresholds are a floor at the current real level (~55%). Raise them when you add tests, never lower them. Prioritize logic that writes or transforms user data.

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
npm test -- path/to/file.test.ts  # Single file
```

**Test Organization:**

- Tests in `__tests__/` directories co-located with source files
- Use `obsidianDomMocks.ts` for DOM API mocks (`createEl`, `createDiv`, etc.)
- Mock Obsidian API: `__mocks__/obsidian.ts`

- Default env is `node`; DOM tests need `/** @jest-environment jsdom */` as the first line

**Lint**: `npm run lint` must stay at zero warnings. For a string that is not UI text (YAML, SVG/HTML markup, CSS units), use `// eslint-disable-next-line i18next/no-literal-string -- <reason>`; user-visible text goes in `en.json`.

**Test Patterns:**

- Group tests by feature/behavior using `describe()`
- Use descriptive test names: `it("should render error message when data is invalid")`
- Test both rendering and interaction (click handlers, state changes)
- Mock plugin instance and app instance for component tests

## Barrel Files Strategy

**✅ DO use barrel files for:**

- Components: `components/atoms/index.ts`, `components/molecules/index.ts`
- Constants: `constants/index.ts`

**❌ DO NOT use barrel files for:**

- Services (import directly from `@app/services/data/WorkoutLogFile`)
- Features (import directly from specific files)
- Utils (import directly from `@app/utils/DateUtils`)
- Types (import directly from specific files)

**Rationale**: Barrel files add indirection and can cause circular dependency issues. Only use where they provide genuine organizational value (component APIs, constants re-exports).

Feature folders have no top-level barrel. ESLint (`no-restricted-imports`) rejects `from "@app/features/<feature>"`; import the file instead (e.g. `@app/features/timer/views/EmbeddedTimerView`). Code under `app/` depends on the ports in `app/types/PluginPorts.ts`, never on `main.ts`.

## Obsidian Plugin Best Practices

### Critical Rules

- **Use `this.app`** - Never use global `app` or `window.app`
- **Sentence case in UI** - "Create workout log" not "Create Workout Log"
- **Use `setHeading()`** - Not `<h1>` or `<h2>` in settings

### DOM Security

- **Never use `innerHTML`** - Use `createEl()`, `createDiv()`, `createSpan()` helpers
- **Use `el.empty()`** - To clear HTML element contents safely

### Resource Management

- **Clean up on unload** - Use `registerEvent()`, `addCommand()` for auto-cleanup
- **Don't detach leaves** - In `onunload()` to preserve user's layout
- **Destroy Chart.js instances** - Call `ChartRenderer.destroyAllCharts()` in unload
- **Clear caches** - Call service cleanup methods (e.g., `clearLogDataCache()`)

### Commands

- **No default hotkeys** - Let users configure their own
- **Use appropriate callback**:
  - `callback` - Unconditional command
  - `checkCallback` - Conditional command (return false to hide)
  - `editorCallback` - Requires active editor

### Workspace

- **Use `getActiveViewOfType(MarkdownView)`** - Not `workspace.activeLeaf` directly
- **Use `app.workspace.iterateRootLeaves()`** - To iterate through all leaves

### Vault Operations

- **Use Vault API** - Not Adapter API (better caching and safety)
- **Use `normalizePath()`** - For user-defined paths
- **Use `Vault.process()`** - For atomic file modifications
- **Use `FileManager.processFrontMatter()`** - For frontmatter modifications

### Styling

- **Use Obsidian CSS variables**:
  - `--background-primary`, `--background-secondary`
  - `--text-normal`, `--text-muted`, `--text-faint`
  - `--interactive-accent`, `--interactive-hover`
- **Never hardcode colors** - Use CSS classes and variables

### Mobile Compatibility

- **Avoid Node/Electron APIs** - Not available on mobile
- **Avoid regex lookbehind** - Only supported iOS 16.4+
- **Test touch interactions** - Use `touchstart`/`touchend` alongside click events

## Public API (Dataview Integration)

`window.WorkoutPlannerAPI` (`app/api/WorkoutPlannerAPI.ts`) exposes `getWorkoutLogs(filter)`, `getExerciseStats(exercise)`, `getExercises(filter)`. It is a public contract for users' Dataview scripts, so don't change signatures or return shapes without a deprecation path. User-facing examples are in `README.md`.

## Common Gotchas

1. **Cache Invalidation**: Workout log mutations through `WorkoutLogFile` emit events that clear the cache and re-render views automatically. Don't call `triggerWorkoutLogRefresh()` (deprecated, kept for external callers) or `clearLogDataCache()`. After modifying muscle tags, call `plugin.triggerMuscleTagRefresh()`.
2. **Double Refresh**: Never pass local `onRefresh` callbacks through table components. The global event system handles refresh. Adding local callbacks causes double-rendering.
3. **Chart.js Memory Leaks**: Always create charts via `ChartRenderer.renderChart()`, which destroys any tracked chart with the same ID first. Never call `new Chart()` directly, because untracked instances escape `destroyAllCharts()` on unload.
4. **Modal Cleanup**: Always call `modal.close()` after success, avoid leaving modals open
5. **Timer Cleanup**: Active timers stored in `plugin.activeTimers` Map must be destroyed in `onunload()`
6. **Service Dependencies**: Services initialized in order - WorkoutLogFile must exist before ExerciseDefinitionService
7. **Barrel Import Circular Dependencies**: If circular dependency error, import directly instead of using barrel file
8. **Constants Backward Compatibility**: When refactoring constants, maintain `CONSTANTS.WORKOUT.*` structure for legacy code
9. **Grid tracks on mobile**: use `minmax(0, 1fr)`, never a bare `1fr`. A `1fr` track grows to its widest child's min-content (e.g. a widget table), pushing the whole dashboard off-screen
10. **Mobile layouts**: on phones `workout-log` rows become cards (CSS reads each cell's `data-label`, set by `TableRenderer`), and `workout-chart` deliberately shows a table instead of the chart. Use `@media (hover: hover)` for hover effects that move or resize elements, since touch keeps `:hover` after a tap. Check changes live with `app.emulateMobile(true)` plus a 390px viewport (see "Live Debugging")

## CSS Organization

```
styles.source.scss      # Entry point: @use's every partial below
app/styles/
├── _variables.scss     # Shared variables
├── utilities/          # Utility classes (index partial)
├── components/         # Shared component styles (index partial)
├── dashboard/          # Dashboard + widget styles (index partial)
└── _chart.scss, _table.scss, _timer.scss, _modal.scss, _settings.scss, _duration.scss
```

**Build**: `node build-css.mjs` compiles with Sass → outputs `styles.css`

**Never edit `styles.css` or `main.js` directly.** They are build outputs and get overwritten. `styles.css` is committed because releases ship it.

**Usage**: Import Obsidian CSS variables, never hardcode values

**Color contrast (WCAG AA)**: for text use `--workout-text-accent`, `--workout-text-success`, `--workout-text-error`, `--workout-text-warning`, never the raw `--text-accent` / `--text-success` / `--color-*` (2–3.4:1 on white). Fills behind `--text-on-accent` use `--workout-accent-fill`. These tokens live on `body`, not `:root`: Obsidian defines its theme variables on `body.theme-*`, and a custom property that references them resolves where it is declared (on `:root` it becomes invalid and fills turn transparent). Surfaces that must stand out from the page use `--background-secondary`, never `--background-primary` (that is the page color).

## Live Debugging in Obsidian

`.mcp.json` defines an `obsidian-devtools` MCP server (chrome-devtools-mcp attached to `127.0.0.1:9222`). To use it, quit Obsidian and relaunch it with remote debugging:

```bash
open -a Obsidian --args --remote-debugging-port=9222
```

Claude can then read console errors, screenshot rendered code blocks, run JS in the app (e.g. `app.plugins.disablePlugin("workout-planner").then(() => app.plugins.enablePlugin("workout-planner"))` to reload after `npm run build`), and take heap snapshots to check for Chart.js leaks.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
