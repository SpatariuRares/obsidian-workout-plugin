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
npm run lint         # ESLint + scripts/check-readme.mjs (README images, unused assets, #anchors)
npm run lint:fix     # ESLint with auto-fix
npm run typecheck    # tsc only, no emit
npm run doe:validate # Import-convention check (@app aliases, barrels, circular deps)
node scripts/find-hardcoded-strings.mjs  # Strict scan for literals that should use t()
```

**Release**: use `/release`. It bumps `manifest.json`, `package.json` and `package-lock.json` to `X.Y.Z` in a `chore: release X.Y.Z` commit on `main`, pushes `main`, then tags that commit and pushes the tag. The release workflow (`main.yml`) never commits: it fails unless the tag equals `manifest.json` `version` and every locale has every `en.json` key (translations must already be on `main`, see "Internationalization"), then builds from the tag, attests the assets' build provenance and publishes, so the release matches the tagged source exactly. `npm run version` / `versions.json` are not part of the flow. The plugin browser's list and search show the `description` from `community-plugins.json`, not from `manifest.json`. That file in `obsidianmd/obsidian-releases` is an hourly mirror of `https://community.obsidian.md/assets/community-plugins.json` (workflow `mirror-community-json.yml`), so a PR to it gets overwritten: change the description on community.obsidian.md (signed in), with the same text as the manifest.

**Husky pre-push** runs a lockfile check (`npm ci --dry-run`, fails if `package-lock.json` is out of sync with `package.json`) → typecheck → lint → `test:coverage` → build, so a failing check (including a coverage drop) blocks `git push`. CI runs the same lint and coverage checks. Tests run with `TZ=Europe/Rome` (set in `jest.config.js`; setting `process.env.TZ` inside a test file has no effect).

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

The only place that reads logged sets back as training (see "Training History" in `CONTEXT.md`). Pure: `new TrainingHistory(rows)`, no vault, no mocks in tests. `trainingDay(date)` is the one day rule (local day, never `date.split("T")[0]`); `sessions({ workout? })` groups sets by training day + workout name (case, spacing, quotes ignored; sets without a workout form their own unnamed session) and gives each session's plausible `duration`. `personalRecord(exercise)` and `newRecordSets()` are the one PR definition. `trendOf(values)` is the one trend (regression line, stable within 5% of the mean); the chart label (`TrendCalculator`), `TrendHeader`, the chart trend line and the API all read it, and the API's series is `heaviestPerDay(exercise)`. `streak(today?)` (calendar weeks from Monday), `totalVolume()`, `volumeByDay()` and `topExercisesByVolume(n)` feed the dashboard. Never group sets by day or session, compute a PR or a trend anywhere else.

#### ExerciseLibrary (`app/services/exercise/ExerciseLibrary.ts`)

The only place that finds an exercise's page (see "Exercise Pages" in `CONTEXT.md`): notes in the exercise folder and its subfolders, found by file name, `exercise_name` or `nome_esercizio`, ignoring case and spacing, never partially. `find(name)` gives an `ExercisePage` (file, names, type, tags as a list); `pages()` lists them; `pagesSharingAName(page)` finds duplicates. It reads frontmatter from `metadataCache` and stays current through `watch()` (vault/metadata events, registered in `main.ts`) and the folder setting, so there is no cache to clear. Get it with `plugin.getExerciseLibrary()` (`ExerciseLibraryPort`). Tests use the shared `FakeVault` (`app/services/exercise/__tests__/FakeVault.ts`), not hand-made vault mocks.

#### ExerciseFields (`app/services/exercise/ExerciseFields.ts`)

The rules for a field (see "Field" in `CONTEXT.md`): `fieldKey(name)` gives the canonical key however it is written ("Rep", "Wgt (kg)", "HR", "heart rate"), `fieldFor(param)` adds whether it takes whole numbers, its step and quick increment, `readField(field, raw)` reads and checks a typed value (limits apply to every filled-in field), `formatFieldNumber` and `durationSeconds(unit, value)`. The log form and the table use it; never switch on `param.key === "reps"` or compare header strings elsewhere.

#### WorkoutNote (`app/services/notes/WorkoutNote.ts`)

`readWorkoutNote(content)` is the only place that finds the plugin's code blocks in a note's text: each block's type, body and line range (to rewrite it in place), and the note's level-2 sections with their prose. It skips blocks shown inside a longer fence (a ````markdown example) and copes with CRLF. Parse a block's body with its schema (`tableBlock.parse(block.body)`), never with a regex. Used by the duration estimate, canvas export, the block editor and the block-id migration. The timer a `workout-timer` block runs (preset, default preset, defaults) comes from `resolveTimer` (`app/features/timer/business/resolveTimer.ts`); the presets a block can name (built-in Tabata/EMOM plus saved ones) from `timerPresets(settings)`. Interval phases, rounds and total length come only from `intervalSchedule.ts` (`intervalPlan`, `intervalAt`, `intervalSeconds`), used by the timer, its display and the duration estimate.

#### ExampleGeneratorService (`app/services/examples/ExampleGeneratorService.ts`)

Entry points for commands, modals and callouts are `createExampleNotes(plugin)` and `openGettingStartedGuide(plugin)` in `GettingStartedGuide.ts` (`examplesCreated(result)` is the one success check); don't call `new ExampleGeneratorService(plugin).createExamples()` or `generateExampleFolder()` from UI code. Creation only adds missing files and never overwrites one (so running it again is safe, even on an example log the user logs to), and there is no overwrite prompt. With no log at `csvLogFilePath` it points `csvLogFilePath`/`exerciseFolderPath` at the example files so the views show them; with a real log it changes no setting. Example vault paths come from `examplePaths` (`ExamplePaths.ts`); "is there a log at `csvLogFilePath`" is `logFileExists(plugin)` (`app/services/data/logFileExists.ts`).

The welcome flow: `Welcome.ts` (`shouldShowWelcome`, `markWelcomeShown`) and `WelcomeModal`, shown once on a fresh install. The window has two choices plus Later, and both end in the guided tour: "Try with example data" creates the examples, then `startGuidedTour(plugin, { source: "welcome-examples" })`; "Start from scratch" calls it with `"welcome-scratch"` (the tour's first step logs the first set). The "Show welcome" button in Settings → Getting started opens `WelcomeModal` directly, without the fresh-install check and without touching `welcomeShown`.

The guided tour (`app/features/tour/`): `TourEngine` runs a `Tour` (`TourStep[]`) and ends on Esc, skip, unload, or when its note's leaf is closed / another file becomes active (`TourStartOptions.notePath`). It offers a "Show me" button when a target exists but is off-screen, and it reads `Platform.isMobile`. Callers (`TourPort`) only see the `TourRunner` interface (`start`, `stop`). A step's `completion` (`completions.ts`: `completeOnLogAdded`, `completeOnInsertCommand`, `completeOnTargetClick`) waits for a real action on the `WorkoutEventBus` or a click, so steps advance when the user does the thing. Steps point at elements by `data-tour` attributes named in `tourTargets.ts` (`TOUR_TARGETS`); a step without a target is a centred card, and `mobileText` replaces the text on phones. `buildTour` (`tourSteps.ts`) lists the steps, and `tourNote.ts` writes the note they run on (blocks via `schema.serialize`). A `Guided tour.md` without any tour block (`readWorkoutNote`) is not ours: `ensureTourNote` takes "Guided tour 1", ... and never opens or overwrites the foreign note. Mark targets only with `markTourTarget` (never `setAttribute("data-tour")`); add a `TOUR_TARGETS` entry only for a target a step uses. `startGuidedTour(plugin, { source })` is the single entry point (welcome, settings button, `start-tour` command): it picks examples or own-data mode (and says so in a notice when "Try with example data" runs on a real log), ensures the note, opens it and starts the engine. Don't build a tour or call the engine from UI code.

#### ExerciseDefinitionService

Turns an exercise page (from `ExerciseLibrary`) into a definition: type (`exercise_type`, then `type`, aliases resolved, default strength), muscle tags and declared parameters, and the fields to log (`getParametersForExercise`). `saveExerciseDefinition` writes into the page the library finds and creates `folder/name.md` only when there is none. No cache of its own.

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
- `EmbeddedTableView` - Sortable tables with an edit action per row (on phones the whole card opens it; delete is in `EditLogModal`), protocol badges, target calculations
- `EmbeddedTimerView` - Countdown/interval timers with presets and audio notifications
- `EmbeddedDashboardView` - Aggregated stats, muscle heat map, recent workouts, volume analytics

Each view has a `cleanup()` method called during plugin unload.

### Component Architecture (Atomic Design)

```
app/components/
├── atoms/        # Primitives: Button, Input, Text, Icon, Container, Canvas, Chip, ProtocolBadge, SpacerStat
├── molecules/    # Composites: StatCard, FormField, SearchBox, Badge, TrendIndicator, LoadingSpinner,
│                 #            FilterIndicator, CopyableBadge, ListItem
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
├── tables/ui/ActionButtons.ts         # Table row action (edit)
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
- **Only edit `en.json`.** The other 23 locales are filled by `.github/workflows/translate.yml` (Ollama translategemma, `AI translate/`, one runner per locale): it runs when `en.json` changes on `main`, when the pre-push hook asks for a branch, and commits the locales to that branch (a release only checks that none is missing). `AI translate/missing_locales.py` lists the locales still missing keys.
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
type: volume # volume, weight, reps, e1rm, duration, distance, pace, heartRate
chartType: exercise # exercise = daily average; workout/combined/all = daily total (all ignores filters)
dateRange: 30
limit: 50
exactMatch: false
showTrendLine: false # default false
showStats: true # default true
title: Squat volume
height: "400px"
```

For daily best estimated 1RM:

```yaml
exercise: Squat
type: e1rm
dateRange: 180
```

`TrainingHistory` owns Epley estimates (`weight × (1 + reps / 30)`) for
integer reps 1–12 and positive weight, excluding warm-up and drop sets like PRs.
Days without eligible sets are omitted; kg/lb follows settings. Strength charts
still default to volume. API `getExerciseStats` adds
`estimatedOneRepMax` (`number | null`); CSV and existing PR fields stay unchanged.

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
duration: 90 # seconds (interval: work per round)
work: 20 # interval only, wins over duration
rest: 10 # interval only, after each round's work (last round included)
rounds: 8 # interval only
showControls: true
sound: true # default true
autoStart: false # start as soon as the block renders (once per timer)
preset: rest # saved preset used as base config; Tabata and EMOM are built in (timerPresets.ts)
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

### Adding or changing a setting

The settings tab is declarative (Obsidian 1.13+ settings search). Every row comes from `getSettingDefinitions()` in `WorkoutChartsSettings.ts`, built from each section's `definitions()`; if that returns a non-empty array Obsidian never calls `display()`, so **no row may exist outside the definitions**. Older Obsidian (minAppVersion is 1.6.6) calls `display()`, which draws the same definitions through `renderSettingDefinitions`.

- Add a row as `{ name, desc, render: (setting) => setting.addToggle(...) }` in a section's `definitions()`. Build definitions with the local types in `settingDefinitionTypes.ts`, not Obsidian's `SettingDefinition*` types (naming their 1.13-only members fails `obsidianmd/no-unsupported-api`), and never extend a 1.13-only class (`SettingPage`) at module level.
- Entries the user adds/edits/deletes (timer presets, protocols) are `type: "list"` with `addItem`, `onDelete` and an `action` per item; their editor is a `Modal`. After changing the list call the section's `refresh` (tab `update()` on 1.13+, `display()` before).
- Test a section by drawing its definitions with `renderSettingDefinitions` in a jsdom test and driving the shared `Setting` mock (`mockSettingNamed`, in `__mocks__/obsidian.ts`).

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

Feature folders have no barrels at any depth (`app/__tests__/structure.test.ts` fails on an `index.ts` under `app/features/`). Import the file instead (e.g. `@app/features/timer/views/EmbeddedTimerView`). Code under `app/` depends on the ports in `app/types/PluginPorts.ts`, never on `main.ts`.

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
6. **Service Dependencies**: Services initialized in order - ExerciseLibrary must exist before ExerciseDefinitionService and MuscleTagService
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

### Claude Code automations (`.claude/`)

- **Hooks** (`.claude/settings.json`, scripts in `.claude/hooks/`): editing `main.js`, `styles.css` or any `.csv` is blocked (build outputs and user data); every edited `.ts` file is linted with `--max-warnings 0` right away.
- **`architecture-guardian` agent**: run it on a branch or diff before merging; it reports code that re-derives what a deep module owns (training days, exercise pages, fields, note blocks, the log CSV, protocols, muscles).
- **`obsidian-verify` skill**: live check in the running Obsidian without writing notes or the log (rebuild, reload, detached renders, modals closed unsaved, console).
- **`release` skill**: also pushes `main` first when it is ahead, reruns failed translation jobs, and puts the release notes on the GitHub release.

### Issue tracker

Issues live in the repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), applied as GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
