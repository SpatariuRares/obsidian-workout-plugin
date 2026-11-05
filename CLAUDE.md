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
npm run lint         # ESLint + scripts/check-readme.mjs (README.md and README.<lang>.md in the root: images, unused assets, #anchors; a translation must keep the same headings, code blocks and images as README.md)
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
- **Embedded Views**: Code blocks (`workout-chart`, `workout-log`, `workout-sets`, `workout-timer`, `workout-dashboard`, `workout-duration`, `workout-session`) render inside notes
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
│   ├── EmbeddedSetsView          # workout-sets (today's sets as rows to fill in, for the phone)
│   ├── EmbeddedDashboardView     # workout-dashboard (stats, analytics, heat maps)
│   └── EmbeddedSessionView       # workout-session (guided session through the note's plan)
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
- **Imports** (`app/features/import/`): `readWorkoutExport` turns a Strong/Hevy CSV into `TimedLogEntryInput`s (kept unit, spread timestamps), `planImport` drops sets already logged, then `importSets` writes them in one rewrite (backup first, one `log:bulk-changed` `import`, no record notices)

```typescript
// Callers go through the plugin's WorkoutDataPort, which forwards to WorkoutLogFile
const data = await plugin.getWorkoutLogData(); // all rows; views filter via DataFilter.filterData
await plugin.addWorkoutLogEntry({ date, exercise, reps, weight, ... }); // LogEntryInput: no timestamp, no volume
await plugin.updateWorkoutLogEntry(log, toLogEntryInput(log)); // toLogEntryInput keeps the entered weight and unit
```

#### ProtocolCatalog (`app/services/protocols/ProtocolCatalog.ts`)

The only place that knows what a protocol looks like: `new ProtocolCatalog(settings.customProtocols).resolve(id)` gives its name, badge text/class and chart color; `.all()` lists standard, then the settings list in order. The built-ins (warm-up, drop set, myo reps, rest-pause, superset, 21s) are ordinary entries of `customProtocols`: `withDefaultProtocols` adds them once on load, after the user's own and skipping any whose id or name the user already has (`protocolDefaultsAdded`, in the vault's language), so users see, edit and delete them in Settings → Protocols; a deleted built-in still resolves to its translated name for sets already logged, and the edit form adds an option for a set's protocol that is no longer in the list (otherwise saving would turn it into standard). Standard is never in the list. The id keeps its meaning whatever the entry says (warm-up and drop sets are not PRs). Use `protocolId(raw)` to normalize an id (lower case, empty = standard). `protocolHelp(id)` is a built-in's explanation (settings list, example notes). Custom ids are kept in the CSV, so never map an unknown id to standard.

#### TrainingHistory (`app/services/history/TrainingHistory.ts`)

The only place that reads logged sets back as training (see "Training History" in `CONTEXT.md`). Pure: `new TrainingHistory(rows)`, no vault, no mocks in tests. `trainingDay(date)` is the one day rule (local day, never `date.split("T")[0]`); `sessions({ workout? })` groups sets by training day + workout name (case, spacing, quotes ignored; sets without a workout form their own unnamed session) and gives each session's plausible `duration`. Sets are ordered by training day, then timestamp ("Set order": a date edited in the CSV keeps its old timestamp). `personalRecord(exercise)` and `newRecordSets()` are the one PR definition. `trendOf(values)` is the one trend (regression line, stable within 5% of the mean); the chart label (`TrendCalculator`), `TrendHeader`, the chart trend line and the API all read it, and the API's series is `heaviestPerDay(exercise)`. `streak(today?, weeklyGoal?)` and `bestStreak(weeklyGoal?)` (calendar weeks from Monday, `weekStart`, with at least `settings.weeklyGoal` training days), `totalVolume()`, `volumeByDay()` and `topExercisesByVolume(n)` feed the dashboard. Never group sets by day or session, compute a PR or a trend anywhere else.

#### ExerciseLibrary (`app/services/exercise/ExerciseLibrary.ts`)

The only place that finds an exercise's page (see "Exercise Pages" in `CONTEXT.md`): notes in the exercise folder and its subfolders, found by file name, `exercise_name` or `nome_esercizio`, ignoring case and spacing, never partially. `find(name)` gives an `ExercisePage` (file, names, type, tags as a list); `pages()` lists them; `pagesSharingAName(page)` finds duplicates. It reads frontmatter from `metadataCache` and stays current through `watch()` (vault/metadata events, registered in `main.ts`) and the folder setting, so there is no cache to clear. Get it with `plugin.getExerciseLibrary()` (`ExerciseLibraryPort`). Tests use the shared `FakeVault` (`app/services/exercise/__tests__/FakeVault.ts`), not hand-made vault mocks.

#### ExerciseFields (`app/services/exercise/ExerciseFields.ts`)

The rules for a field (see "Field" in `CONTEXT.md`): `fieldKey(name)` gives the canonical key however it is written ("Rep", "Wgt (kg)", "HR", "heart rate"), `fieldFor(param)` adds whether it takes whole numbers, its step and quick increment, `readField(field, raw)` reads and checks a typed value (limits apply to every filled-in field), `formatFieldNumber` and `durationSeconds(unit, value)`. The log form and the table use it; never switch on `param.key === "reps"` or compare header strings elsewhere.

#### WorkoutNote (`app/services/notes/WorkoutNote.ts`)

`readWorkoutNote(content)` is the only place that finds the plugin's code blocks in a note's text: each block's type, body and line range (to rewrite it in place), and the note's level-2 sections with their prose. It reads blocks inside callouts/blockquotes (`block.quote` is the `> ` to put back on every line written into the block), skips blocks shown inside a longer fence (a ````markdown example) and copes with CRLF. Parse a block's body with its schema (`tableBlock.parse(block.body)`), never with a regex. Used by the duration estimate, canvas export, the block editor and the block-id migration. The timer a `workout-timer` block runs (preset, default preset, defaults) comes from `resolveTimer` (`app/features/timer/business/resolveTimer.ts`); the presets a block can name (built-in Tabata/EMOM plus saved ones) from `timerPresets(settings)`, and a built-in's explanation from `timerPresetHelp(name)`. Tabata and EMOM are also ordinary entries of `settings.timerPresets`: `withDefaultTimerPresets` adds them once on load (`timerPresetDefaultsAdded`), so they show in Settings → Timer presets, the default-preset dropdown and the insert modal chips, which all read the settings list; a deleted built-in still resolves for blocks that name it. Interval phases, rounds and total length come only from `intervalSchedule.ts` (`intervalPlan`, `intervalAt`, `intervalSeconds`), used by the timer, its display and the duration estimate.

#### ExampleGeneratorService (`app/services/examples/ExampleGeneratorService.ts`)

Entry points for commands, modals and callouts are `createExampleNotes(plugin)` and `openGettingStartedGuide(plugin)` in `GettingStartedGuide.ts` (`examplesCreated(result)` is the one success check); don't call `new ExampleGeneratorService(plugin).createExamples()` or `generateExampleFolder()` from UI code. Creation only adds missing files and never overwrites one (so running it again is safe, even on an example log the user logs to), and there is no overwrite prompt. With no log at `csvLogFilePath` it points `csvLogFilePath`/`exerciseFolderPath` at the example files so the views show them; with a real log it changes no setting. Example notes build every block through the feature generators (`app/features/*/example*Generator.ts`, all via `schema.serialize`), and `exampleShowcase.test.ts` parses every block of them, so a new feature or block parameter belongs in those generators and in the Feature Showcase. Getting-started pages are only appended (`10 …`, `11 …`): renumbering would leave the old files in vaults that already have the examples. Example vault paths come from `examplePaths` (`ExamplePaths.ts`); "is there a log at `csvLogFilePath`" is `logFileExists(plugin)` (`app/services/data/logFileExists.ts`).

The welcome flow: `Welcome.ts` (`shouldShowWelcome`, `markWelcomeShown`) and `WelcomeModal`, shown once on a fresh install. The window has two choices plus Later, and both end in the guided tour: "Try with example data" creates the examples, then `startGuidedTour(plugin, { source: "welcome-examples" })`; "Start from scratch" calls it with `"welcome-scratch"` (the tour's first step logs the first set). The "Show welcome" button in Settings → Getting started opens `WelcomeModal` directly, without the fresh-install check and without touching `welcomeShown`.

What's new: when the installed version differs from `settings.lastSeenVersion` (a fresh install or an update) the plugin shows the notes of every version since then once, in `WhatsNewModal` (`app/features/modals/common/`); `unseenReleaseNotes` (`app/services/onboarding/WhatsNew.ts`) decides and records the version, so later loads of that version show nothing (with no version recorded, only the current version's notes). The notes are en.json strings, `whatsNew.releases.vX_Y_Z` (markdown), translated like any key; the `release` skill writes them before translating. At most the latest 7 (`MAX_RELEASES`) are kept, with a link to the GitHub releases for older ones; the `release` skill deletes the oldest key from every locale. The `show-whats-new` command and Settings → Getting started → Show changelog show them all.

The guided tour (`app/features/tour/`): `TourEngine` runs a `Tour` (`TourStep[]`) and ends on Esc, skip, unload, or when its note's leaf is closed / another file becomes active (`TourStartOptions.notePath`). It offers a "Show me" button when a target exists but is off-screen, and it reads `Platform.isMobile`. Callers (`TourPort`) only see the `TourRunner` interface (`start`, `stop`). A step's `completion` (`completions.ts`: `completeOnLogAdded`, `completeOnInsertCommand`, `completeOnTargetClick`) waits for a real action on the `WorkoutEventBus` or a click, so steps advance when the user does the thing. Steps point at elements by `data-tour` attributes named in `tourTargets.ts` (`TOUR_TARGETS`); a step without a target is a centred card, and `mobileText` replaces the text on phones. `buildTour` (`tourSteps.ts`) lists the steps, and `tourNote.ts` writes the note they run on (blocks via `schema.serialize`). A `Guided tour.md` without any tour block (`readWorkoutNote`) is not ours: `ensureTourNote` takes "Guided tour 1", ... and never opens or overwrites the foreign note. Mark targets only with `markTourTarget` (never `setAttribute("data-tour")`); add a `TOUR_TARGETS` entry only for a target a step uses. `startGuidedTour(plugin, { source })` is the single entry point (welcome, settings button, `start-tour` command): it picks examples or own-data mode (and says so in a notice when "Try with example data" runs on a real log), ensures the note, opens it and starts the engine. Don't build a tour or call the engine from UI code.

#### ExerciseDefinitionService

Turns an exercise page (from `ExerciseLibrary`) into a definition: type (`exercise_type`, then `type`, aliases resolved, default strength), muscle tags and declared parameters, and the fields to log (`getParametersForExercise`). `saveExerciseDefinition` writes into the page the library finds and creates `folder/name.md` only when there is none. No cache of its own.

#### MuscleTagService

Manages custom muscle tag mappings (e.g., `petto` → `chest`) from CSV file, and is the only place that turns tags into muscles: `await tagMap()`, `musclesForTags(tags)`, `musclesForExercise(name)` (tags from the exercise note's frontmatter via `metadataCache`). Everything is async so nobody sees the default tags before the user's CSV has loaded. Cache is invalidated via `triggerMuscleTagRefresh()`. Call `destroy()` to clean up.

### Embedded Views (BaseView Pattern)

All embedded views extend `BaseView` (`app/features/common/views/BaseView.ts`) for consistent error handling, loading states, and empty data handling:

```typescript
abstract class BaseView {
  protected handleError(container, error: unknown): void;
  protected handleEmptyData(container, logData, exerciseName?, sourcePath?, editAction?): boolean;
  protected filteredOrExplain(container, logData, params, viewType, { sourcePath?, title? }): WorkoutLogData[] | null; // empty log / no match, explained
  protected handleNoFilteredData(container, params, titlePrefix, viewType): void;
  protected showLoadingIndicator(container): HTMLElement;
  protected filterData(logData, params);
  protected track(child): child; // render children unloaded by cleanup()
  cleanup(): void;
}
```

**Rendering and menus (CodeBlockProcessorService):** a view loads its own data and draws in one call (`EmbeddedChartView.render`, `EmbeddedDashboardView.render`, `EmbeddedTableView.refreshTable`, `SetSheet.render`); the processor awaits it once, then calls it again from `refreshOnLogChange` (an `EventAwareRenderChild`) on every log change, also when the log was empty, so a block fills in with the first set. `renderBlock` builds each block's edit action (`BlockMenuAction`, with the block's note, how to find it without an id and its invalid keys) and hands it to `draw`: a view with its own ⋮ menu puts it there (`ExerciseActionSelect`'s `edit`, the timer's controls, the dashboard header); otherwise the frame shows it in a row above the block. Never build an edit modal for the block menu inside a view. Insert modals add the block `id` in `generateCode` (`schema.serialize({ id: generateCodeBlockId(), ...this.collectParams() })`); `collectParams` never returns one, so an edit doesn't see it as a change.

**Views:**

- `EmbeddedChartView` - Chart.js visualizations (volume, weight, reps, pace, distance, duration, heart rate)
- `EmbeddedTableView` - Sortable tables with an edit action per row (on phones the whole card opens it; delete is in `EditLogModal`), protocol badges, target calculations
- `EmbeddedTimerView` - Countdown/interval timers with presets and audio notifications
- `EmbeddedDashboardView` - Aggregated stats, muscle heat map, recent workouts, volume analytics

Each view has a `cleanup()` method called during plugin unload.

### Component Architecture (Atomic Design)

```
app/components/
├── atoms/        # Primitives: Button, Input, Text, Icon, Container, Canvas, Chip, ProtocolBadge, SpacerStat,
│                 #             DeleteButton (red trash icon: use it for every delete/remove),
│                 #             CheckToggle, DisclosureToggle, LiveRegion, ProgressMeter (UI kit, see below)
├── molecules/    # Composites: StatCard, FormField, SearchBox, Badge, TrendIndicator, LoadingSpinner,
│                 #            FilterIndicator, CopyableBadge, ListItem,
│                 #            NumberField, ChipGroup, ProtocolPicker, NotesField, UndoNotice, BlockCard (UI kit, see below)
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
├── dashboard/ui/WidgetContainer.ts    # A widget's BlockCard (title, subtitle; ⋮ via WidgetActionSelect)
├── tables/ui/ActionButtons.ts         # Table row action (edit)
├── tables/ui/TargetHeader.ts          # Table target calculation header
├── charts/components/TrendHeader.ts   # Chart card's trend row
└── charts/ui/StatsBox.ts              # Chart card's stats row (StatCards)
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
│   ├── ui/              # StatsBox (stats row), ChartLegendItem
│   └── views/           # EmbeddedChartView
│
├── tables/              # workout-log and its phone version workout-sets (see "workout-sets")
│   ├── components/      # TableActions, TableDataProcessor
│   ├── business/        # TargetCalculator (progressive overload), setSheet (workout-sets rows)
│   ├── modals/          # Insert/EditTableModal, Insert/EditSetsModal, components/PlanFields
│   ├── ui/              # ActionButtons, TargetHeader, TargetSection, ExerciseActionSelect (⋮: go to exercise + edit)
│   └── views/           # EmbeddedTableView, EmbeddedSetsView
│
├── dashboard/
│   ├── ui/              # WidgetContainer, WidgetActionSelect, GridEditor
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
- The bundle ships every locale but `en.json` packed (`scripts/esbuild-packed-locales.mjs`): values in en.json's key order, deflated, base64; `unpackLocale` (`app/i18n/packedLocale.ts`, runtime) and `packLocale` (`app/i18n/packLocale.ts`, build and tests only, so the deflate code stays out of `main.js`) are the format. Jest loads the JSON files directly. Images are imported as `.webp` (inlined as data URLs).
- **Only edit `en.json`.** The other 23 locales are filled by `.github/workflows/translate.yml` (Ollama translategemma, `AI translate/`, one runner per locale): it runs when `en.json` changes on `main`, when the pre-push hook asks for a branch, and commits the locales to that branch (a release only checks that none is missing). `AI translate/missing_locales.py` lists the locales still missing keys.
- Before a release, the `translate` skill does it on this PC instead: one Haiku subagent per language adds the missing keys and creates or updates every `README.<CODE>.md` (code in upper case, e.g. `README.PT-BR.md`) from `README.md`, then commits only those files. `node scripts/translations-status.mjs` says what is out of date (a README is stale when `README.md` changed after the translation's last commit); the release skill runs it, and a hook blocks the release commit and version-tag pushes until it passes.
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
WorkoutLogFile.add/update/delete/renameExercise/stampMissingWeightUnits/importSets
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

Source of truth: one schema per block, built with `defineCodeBlock` (`app/services/codeblocks/CodeBlockSchema.ts`): `app/features/charts/chartBlock.ts`, `tables/tableBlock.ts`, `tables/setsBlock.ts`, `timer/timerBlock.ts`, `dashboard/dashboardBlock.ts`, `duration/durationBlock.ts`. Each lists every parameter with its type, default and allowed values; the `Embedded*Params` types are derived from it (`BlockParams<typeof tableBlock>`). All params are optional.

- **Reading**: `CodeBlockProcessorService` calls `schema.parse(source)`. Invalid values show an error in place of the block; views get the params with `schema.defaults` applied (the timer applies them itself, under the preset).
- **Writing**: insert modals and example generators call `schema.serialize(params)`. Never build a block with string concatenation.
- **Editing**: edit modals draw their buttons with `createEditButtons(modal, container, { schema, match, collectParams, ... })` (`app/features/modals/base/components/createEditButtons.ts`): it snapshots the form when the buttons are drawn (after the prefill), and Update calls `CodeBlockEditorService.patchCodeBlock(app, schema, path, match, changedParams(before, after))`, where `path` is the note the block is written in (`ctx.sourcePath`, passed from the processor through the view and its menu; never the active note, which differs for an embedded `![[note]]`). Only changed lines are rewritten; comments, order and parameters the form doesn't show stay as typed. A block found by its body gets an `id` on save.
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
limit: 50 # unset: sets × 2 (the last two workouts) when sets is given, else 50
sortBy: date # date, exercise, weight, reps, volume
sortOrder: desc # asc, desc
columns: ["date", "reps", "weight", "volume"]
showAddButton: true
showProtocol: true
targetWeight: 100 # with targetReps: progressive overload header
targetReps: 8
sets: 4 # planned sets, counted by workout-session; without limit the table shows sets × 2 rows
```

#### workout-sets

```yaml
exercise: Bench Press
workout: Push Day # unset: the note's name
sets: 4 # rows to fill in; unset: as many as last time (at least one)
targetReps: 8 # hint when the exercise was never done
targetWeight: 80
rest: 90 # seconds after each set (interval: work per round); 0 = no timer; unset with no timer.* = the section's workout-timer (else the default preset)
timer.type: interval # the rest timer's other options, no defaults: timer.preset, timer.type, timer.rest, timer.rounds, timer.showControls, timer.sound
```

The "Set sheet" in `CONTEXT.md`: the V2 of `workout-log`, made for logging on the phone. It lives in `app/features/tables/` and shares the table's pieces, so add a behavior to both blocks by changing the shared piece, not by copying it:

- **Parameters**: `EXERCISE_FIELDS` and `PLAN_FIELDS` (`tables/exerciseBlockFields.ts`) are spread into both `tableBlock` and `setsBlock`; the forms read and fill the plan with `PlanFields` (`tables/modals/components/PlanFields.ts`).
- **Columns and values**: headers from `TableColumnResolver.formatParameterHeader` + `mapColumnIdentifiersToLabels`; a logged set's cells from `TableRowProcessor.displayRow` (weight as entered, N/A).
- **Protocol badge**: `ProtocolBadge.forProtocol(parent, catalog.resolve(id))`.
- **Targets**: `renderTargetSection` (`tables/ui/TargetSection.ts`): target, progress bar, achievement badge that writes the next weight into the block with its own schema.
- **Menu**: the ⋮ of `workout-log`, always in the top right corner of the block's first row: `ExerciseActionSelect` (go to exercise + the processor's edit action), only edit when the block names no exercise, so the frame adds no second menu. The processor redraws the sheet like a table (`await sheet.render()`, then `refreshOnLogChange(… () => sheet.render().finally(syncMenu))`).
- **Exercise fields**: `parametersOrNone(plugin, exercise)` (`ExerciseDefinitionService.ts`), the fields or none, as the session and the log modal's history read them.
- **Rest**: `RestTimer` (`timer/views/RestTimer.ts`), the same as `workout-session`: a rest that names a `workout-timer` id runs on that block's timer (shared through `activeTimers`), else on the block's own. `restOf(params, plan)` (setSheet) picks it: `rest` seconds, else the exercise's section rest from `readNotePlan`/`stepOf` (sessionPlan), none with `rest: 0`. `blockRest(params)` / `restParams(timer)` (`setsBlock.ts`) turn `rest` + `timer.*` into the block's own timer and back; it wins over the section's. ⋮ → "Edit rest timer" (`EditRestTimerModal`, the timer form writing into the sets block; when the block had no timer of its own it writes every option, so it keeps resting the same way). It is drawn at the top and restarts on each tick, except after the last row to fill in.
- **Logging**: a new set goes through `LogEntryDraft` (`readSetFields`, `validate`, `toEntry`) like the log form. A logged row has the same chevron and tick, no modal: its details change the set's protocol and notes in the log (`updateWorkoutLogEntry`), and its tick deletes the set, whose values (`draftFromSet`) become the first row to fill in; a notice offers Undo, which puts the very set back (`addWorkoutLogEntry(entry, { timestamp })`, same place in the set order, no record notice). Taking back the last set also stops the rest it started (`RestTimer.cancel`).

What only the sets block has: `setRows` (`tables/business/setSheet.ts`, pure) gives the rows: today's sets of the exercise in this workout (`TrainingHistory.setsOn`) ticked, then rows to fill in, each with placeholders from the same set of `TrainingHistory.previousDay` (else the targets) and that set's protocol as suggestion; `rowToFormData` turns a row into the set to log (typed value, else placeholder). `EmbeddedSetsView` keeps the drafts of unticked rows in its `SetSheet` render child across the `log:*` redraws (a row is removed from the drafts before the add, so the `log:added` redraw already shows it logged). It finds sets with `TrainingHistory` (exact exercise name), not `DataFilter`: logging must never match a similar exercise. Insert: `InsertSetsModal` (`insert-workout-sets`), edit: `EditSetsModal`.

#### workout-session

No parameters. `readSessionPlan` (`app/features/session/business/sessionPlan.ts`) reads the note's plan with `readWorkoutNote`: one step per `workout-log` or `workout-sets` block with an `exercise`, in note order (a section's table and sets of one exercise are one step), with its `sets`/`targetReps`/`targetWeight`, and the rest from its `workout-sets` block's own timer, else the `workout-timer` in the same `##` section (`step.restBlock` says where it is written: the card's ⋮ "Edit rest timer" opens `EditRestTimerModal` or `EditTimerModal` on it). `sessionProgress` hands today's sets of this workout (`TrainingHistory.sessions({ workout: note name })`) to the steps; nothing is stored, so progress comes back from the log. `EmbeddedSessionView` shows the current step, logs through `CreateLogModal` (prefill: today's last set, else the last set with the targets on top) and starts the rest on `log:added` (not after the plan's last set). The rest runs on the section timer's own `EmbeddedTimerView` when that block has an `id` (shared through `activeTimers`, so the block and the card show one countdown), otherwise on the session's own timer. There is no weekly schedule: the user opens the note they want to train. The `insert-workout-session` command writes the empty block at the cursor; the example "Lower Body A" note has one right after its chart, before the exercises, and each exercise is one `workout-sets` block with `sets` and its own `rest`, without a `workout-timer` (the Yoga Flow keeps a timer per pose).

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
widgets: [summary, heatMap, volume, recentWorkouts] # order shown; unset = all (DASHBOARD_WIDGET_IDS)
recentWorkoutsLimit: 5
volumeTrendDays: 7
```

Grid ("inventory") layout, one line per widget (`column row width height`, 1-based; `widgets` is ignored):

```yaml
layout: grid
columns: 3 # the columns the grid was made for
grid.summary: 1 1 3 1
grid.heatMap: 1 2 2 2
```

The grid rules (no overlap, inside the columns, at least the widget's `minColumns`, first-fit packing, reading order) are only in `app/features/dashboard/layout/gridLayout.ts` (pure); `dashboardGrid.ts` turns a block's `grid.<id>` lines into placements and back and its problems into messages. The view draws the placed widgets in reading order and sets `--workout-grid-columns` / `--workout-cell-column` / `--workout-cell-row`; the columns follow the dashboard's width (`columnsForWidth`, one `ResizeObserver` per dashboard): as saved when they fit, packed again (`fitColumns`) when narrower. `GridEditor` (`dashboard/ui/`) is the modal's grid: tiles, stash, pointer drag (listeners on the document) and keyboard; it calls only `gridLayout`.

The widgets live in one registry, `app/features/dashboard/widgets/dashboardWidgets.ts` (`DASHBOARD_WIDGETS` with label, `minColumns`, render and `settings`; `resolveWidgets(params)`); the view loops over it. A widget's `settings` are what its ⋮ → `EditWidgetModal` shows; a number setting carries the schema's `min`, a `max` for the form only (not in `dashboardBlock`, so blocks already holding more keep rendering), a `step` and an optional `unit`. Widgets read their defaults from `dashboardBlock.defaults` (typed: a parameter with a default is never undefined there), never a literal. `InsertDashboardModal` is the form (checkboxes + ↑/↓ order) and writes `widgets` only when it differs from the default, so untouched dashboards get later widgets; `EditDashboardModal` (the processor's edit action, in the ⋮ of every dashboard's header) patches the change. The old `showSummary`/`showQuickStats`/... flags were removed: the schema skips them, so such blocks show every widget. A block without an `id` is found by its body (`CodeBlockMatch { body, lines? }`: the processor's `source`, within `ctx.getSectionInfo`'s lines when Obsidian gives them, which it doesn't inside a callout in Live Preview; it must be the only match) and gets an `id` when saved. `EmbeddedDashboardParams` holds only block parameters; what the view knows besides them (its note and how to find it without an id, for the widget menus; its edit action; the protocol picked in the pie chart) is `DashboardViewState`, passed to `render`/`createDashboard` separately.

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
6. Build fields from the kit (`DESIGN.md` "Modal forms"): `AdjustField` / `NumberField` for numbers (`AdjustField.createField` gives `setError`; pass `validate` to `createEditButtons` so an invalid value blocks Update instead of being dropped), `ChipGroup` for a labelled choice, `ProtocolPicker`, `NotesField`. The log form's protocol is a `ProtocolChoice` (`LogFormElements.protocol`: `value`, `set(id)` keeps a protocol no longer in the settings)
7. Put the main buttons (save/update, cancel) in `Button.createModalActions(parent)` (a `Setting` row: `.setClass("workout-modal-actions")`): the row stays at the bottom of the modal, always visible, while the form scrolls

### Adding New Components

1. Create component in appropriate atomic level (`atoms/`, `molecules/`, or feature-specific `ui/`)
2. Export from barrel file: `atoms/index.ts` or `molecules/index.ts`
3. Add test file in `__tests__/` directory (co-located with source)
4. Follow naming pattern: `ComponentName.ts`, `ComponentName.test.ts`
5. Export types alongside component: `export { Component, type ComponentProps }`

### UI kit (logging controls)

`DESIGN.md` (root) is the design system: tokens, color roles, the rules and every kit component; `.impeccable/design.json` is its sidecar for the Impeccable panel. Read it before building UI, and update both when a token or kit component changes. `workout-sets` (`EmbeddedSetsView`) is the reference use of every piece. A block where the user logs or edits sets builds its controls from the kit, never by hand:

- **Fields**: `NumberField` (suggestion = last time's value, logged when empty; `integer`, `unit`, `step` with ↑/↓, `onEnter`, `setError`); `NotesField` (`saveOn: "input"` for a draft, `"change"` for a value written to the log).
- **Row controls**: `CheckToggle` (to do / done; its label names the action of the current state), `DisclosureToggle` (`aria-expanded`, `marked` dot), `ChipGroup` (a labelled group of chips, one picked; it presses the pick itself; `createMulti` for several) and `ProtocolPicker` (its protocol version; pass `ProtocolCatalog.all()`), `DeleteButton`.
- **One-tap removal**: `UndoNotice` (Undo at the right end, 8s) instead of a confirm; make undo exact (a set comes back with `addWorkoutLogEntry(entry, { timestamp })`).
- **Redraws**: a block redrawn on every `log:*` event loses focus. Give controls a `focusKey` and after drawing call `DomUtils.focusByKey(root, key)`; say silent changes with a `LiveRegion` created once outside the redrawn element (see `SetSheet.body()`).
- **Progress**: `ProgressMeter` (value, max, label) for how far something is from done; the target (`TargetSection`) uses it. Neutral fill, accent only once done, the number also in words. The target is its own inset panel in the card (it is the block's goal), the achievement row inside it.
- **Figures**: `StatCard` (label, figure, optional detail; `is-up`/`is-neutral` tones a change) in a `StatCard.row` for a summary row; `workout-chart`'s stats row (`StatsBox`) is the reference.
- **Rest**: `RestTimer.draw` draws the one-line `.workout-timer-strip`; never the standalone timer's phone layout inside a block.
- **Card**: a block is a `BlockCard` (`workout-log`, `workout-sets`, `workout-session`, `workout-chart`, `workout-duration`, and every dashboard widget through `WidgetContainer`): `create(parent, { title, meta, className })` gives the card and its top row, where the ⋮ menu goes last; `BlockCard.footer(card)` is a row of actions at the end. `workout-log` keeps Add log under the title (a new set is the table's first row) and shades each day as one group (`workout-table-day-even/odd`, never row by row).
- **Styles** live in `app/styles/components/` (`_fields`, `_toggles`, `_chip-group`, `_notice`); a block's own stylesheet only places them (grid columns, alignment). Field selectors are two classes deep to outrank Obsidian's `input[type="text"]`.

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

### Beta features (opt-in releases)

A new user-facing feature ships off, behind a toggle in Settings → Beta features, so an update never changes how someone trains until they opt in. Bug fixes and refactors are not gated.

- The list is `BETA_FEATURES` in `app/services/features/BetaFeatures.ts`; `settings.betaFeatures` (`Record<id, boolean>`, missing = off) holds the user's choice; a new install (`loadData()` null) starts with all on (`newInstallBetaFeatures`, in `loadSettings`), updates keep them off; `betaEnabled(settings, id)` is the only check.
- To add one: its id in `BETA_FEATURES`, `settings.beta.<id>.name`/`.desc` in `en.json` (the settings section draws a toggle per id), then gate where it shows up: its block draws `settings.beta.disabledBlock` (with its ⋮ menu) instead of its content, its commands use `checkCallback` returning false. The toggle emits `settings:changed` (`betaFeatures`), so blocks redraw at once through `EventAwareRenderChild`.
- To release it for everyone: remove the id, its checks and its `settings.beta.<id>` keys (from every locale too).
- Current: none (`workout-sets` was released in 3.1.0). With no feature in beta the settings section is not drawn.

### Adding New Dashboard Widgets

1. Create widget in `app/features/dashboard/widgets/[widget-name]/`
2. Create business logic in `business/` subdirectory
3. Draw it in a `WidgetContainer` (`app/features/dashboard/ui/`, a BlockCard) and build its content from the kit (`StatCard.row` for figures, `ChipGroup` for a choice; DESIGN.md "Dashboard")
4. Add its id to `DASHBOARD_WIDGET_IDS` (`dashboard/types.ts`) and an entry to `DASHBOARD_WIDGETS` (`widgets/dashboardWidgets.ts`); the view and the modals read the registry
5. Add widget UI strings as keys in `app/i18n/locales/en.json` and read them with `t()` (see "Internationalization")

### Modifying Constants

1. Locate appropriate constant file (`ui`, `defaults`, `muscles`, `validation`, `exerciseTypes`)
2. Add constant to specific section
3. If adding to composed `CONSTANTS` object, update `constants/index.ts`
4. Ensure backward compatibility for existing `CONSTANTS.WORKOUT.*` usage

## Testing

**Framework**: Jest with ts-jest
**Coverage**: measured over all of `app/`; `jest.config.js` thresholds are a floor at the current real level (~80%: statements 78, branches 75, functions 77, lines 78). Raise them when you add tests, never lower them. Prioritize logic that writes or transforms user data.

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
9. **Grid tracks on mobile**: use `minmax(0, 1fr)`, never a bare `1fr` (exception: the `workout-log` phone row's number tracks are `minmax(min-content, 1fr)`, since only short nowrap figures set them and Obsidian's table cells would cut a figure with an ellipsis). A `1fr` track grows to its widest child's min-content (e.g. a widget table), pushing the whole dashboard off-screen
10. **Mobile layouts**: on phones each `workout-log` set is one grid row under one row of column labels (`TableRenderer` gives `th` and `td` the same column class and sets `--workout-log-fields`; exercise goes above the numbers, protocol and notes under them), and `workout-chart` deliberately shows a table instead of the chart. Use `@media (hover: hover)` for hover effects that move or resize elements, since touch keeps `:hover` after a tap. Check changes live with `app.emulateMobile(true)` plus a 390px viewport (see "Live Debugging")

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

**Never use `:has()`**: it forces broad style invalidation on every DOM change under the matched elements. Add a class from the TypeScript that builds the element instead (e.g. `Button.create` adds `workout-btn-with-icon` when it draws an icon).

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

- **Hooks** (`.claude/settings.json`, scripts in `.claude/hooks/`): editing `main.js`, `styles.css` or any `.csv` is blocked (build outputs and user data); every edited `.ts` file is linted with `--max-warnings 0` right away; the release commit (`chore: release X.Y.Z`) and version-tag pushes are blocked while `scripts/translations-status.mjs` reports missing translations.
- **`translate` skill**: translates locales and READMEs with Haiku subagents, one per language (`commit` to commit the result, `review` to also review existing values).
- **`architecture-guardian` agent**: run it on a branch or diff before merging; it reports code that re-derives what a deep module owns (training days, exercise pages, fields, note blocks, the log CSV, protocols, muscles).
- **`obsidian-verify` skill**: live check in the running Obsidian without writing notes or the log (rebuild, reload, detached renders, modals closed unsaved, console).
- **`release` skill**: also pushes `main` first when it is ahead, reruns failed translation jobs, and puts the release notes on the GitHub release.

### Issue tracker

Issues live in the repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), applied as GitHub labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
