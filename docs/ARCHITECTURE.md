# Architecture Overview

> Last updated: 2026-11-06 (version 3.3.0)

A map of the code, for orientation. The rules and every module's contract are in [`CLAUDE.md`](../CLAUDE.md); the domain words (set, training day, session, PR, ...) in [`CONTEXT.md`](../CONTEXT.md); the visual system in [`DESIGN.md`](../DESIGN.md). When this file and `CLAUDE.md` disagree, `CLAUDE.md` wins.

About 40k lines of TypeScript under `app/` (tests excluded), 195 test files.

## The shape in one picture

```text
Workout note (markdown)                        workout_logs.csv
  workout-sets / -log / -session /                ▲      │
  -chart / -timer / -dashboard / -duration        │      ▼
            │                              WorkoutLogFile (format, column order,
            ▼                                │   volume, 5 s cache, log:* events)
CodeBlockProcessorService                    │      on LogStorage (vault | in-memory)
  schema.parse(source) ──► Embedded*View ────┤
  edit action (⋮)            │  reads        ▼
  refreshOnLogChange ◄───────┼──── WorkoutEventBus ◄── every mutation
  (EventAwareRenderChild)    ▼
                     TrainingHistory · ExerciseLibrary · ExerciseFields
                     ExerciseTypeCatalog · ProtocolCatalog · MuscleTagService
                     WorkoutNote (blocks of a note) · DataFilter
```

A block is parsed with its schema, its view loads the rows and draws, and the processor redraws it on every `log:*` / `settings:changed` / `muscle-tags:changed` event that concerns it. Views never pass refresh callbacks around.

## Directory structure

```text
main.ts                     # WorkoutChartsPlugin: wires services, implements the ports
app/
├── api/                    # WorkoutPlannerAPI (window.WorkoutPlannerAPI, public contract)
├── compatibility/migration # Old exercise type formats → current
├── components/             # Atomic design UI kit (barrels allowed here)
│   ├── atoms/              # Button, CheckToggle, DisclosureToggle, DeleteButton, ProgressMeter,
│   │                       # LiveRegion, ProtocolBadge, Chip, Feedback, Icon, Input, Text, ...
│   └── molecules/          # BlockCard, CardTable, StatCard, NumberField, AdjustField, ChipGroup,
│                           # ProtocolPicker, NotesField, UndoNotice, SearchBox, TrendIndicator, ...
├── constants/              # Defaults, muscles, exercise types, validation, UI groups backed by t()
├── features/               # One folder per domain, no barrels
│   ├── tables/             # workout-log and workout-sets (set sheet), target section
│   ├── session/            # workout-session: plan from the note, progress from the log
│   ├── charts/             # workout-chart (Chart.js through ChartRenderer)
│   ├── timer/              # workout-timer, RestTimer, presets, interval schedule
│   ├── dashboard/          # workout-dashboard: widget registry, grid layout, 12 widgets
│   ├── duration/           # workout-duration estimate
│   ├── import/             # Strong / Hevy import
│   ├── canvas/             # Export a workout to Obsidian Canvas
│   ├── exercise-conversion/# Convert an exercise's sets to another type
│   ├── modals/             # Cross-feature modals: base, log (create/edit), exercise, muscle, common
│   ├── settings/           # Declarative settings tab and its sections
│   └── common/             # BaseView, suggests, shared UI
├── services/               # Deep modules, imported directly (no barrels)
│   ├── data/               # WorkoutLogFile, WorkoutLogCodec, LogStorage, DataFilter, TrendCalculator
│   ├── history/            # TrainingHistory
│   ├── exercise/           # ExerciseLibrary, ExercisePageContent, ExerciseFields,
│   │                       # ExerciseTypeCatalog, ExerciseDefinitionService, MuscleTagService
│   ├── protocols/          # ProtocolCatalog
│   ├── notes/              # WorkoutNote (blocks and sections of a note's text)
│   ├── codeblocks/         # CodeBlockSchema (defineCodeBlock)
│   ├── editor/             # CodeBlockEditorService (patch a block in place)
│   ├── core/               # CodeBlockProcessorService, CommandHandlerService, EventAwareRenderChild
│   ├── events/             # WorkoutEventBus and its event types
│   ├── examples/           # Example notes and the getting-started guide
│   ├── onboarding/         # Fresh-install check, what's new
│   ├── features/           # Beta features
│   └── templates/          # Template generation
├── i18n/                   # t(), en.json + 23 locales (packed into the bundle)
├── styles/                 # Sass partials → styles.css
├── types/                  # Shared types, PluginPorts.ts
└── utils/                  # DateUtils, FormatUtils, StringUtils, CsvCodec, WeightUnitUtils, round2, ...
```

## Architectural patterns

### Deep modules, one owner per concept

Each domain concept has one module, and the rest of the code asks it instead of re-deriving the answer. The full contracts are in `CLAUDE.md` → "Service Layer Architecture".

| Concept                                        | Owner                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------- |
| The log CSV (format, column order, volume)     | `WorkoutLogFile` (+ internal `WorkoutLogCodec`)                     |
| Training day, session, PR, trend, streak, e1RM | `TrainingHistory` (pure)                                            |
| Exercise pages and exercise names              | `ExerciseLibrary`, page text in `ExercisePageContent`               |
| Fields of a set and their values               | `ExerciseFields`                                                    |
| Exercise types (built-in and your own)         | `ExerciseTypeCatalog`                                               |
| Protocols                                      | `ProtocolCatalog`                                                   |
| Muscle tags → muscles                          | `MuscleTagService`                                                  |
| Blocks and sections in a note's text           | `WorkoutNote`                                                       |
| A block's parameters                           | its schema (`<feature>/<name>Block.ts`)                             |
| Timer runs, phases, lengths                    | `resolveTimer`, `intervalSchedule`, `timerPoint`, `timerRunSeconds` |
| Any other CSV                                  | `CsvCodec` (RFC 4180)                                               |

The `architecture-guardian` agent checks a diff against this table.

### Ports instead of the plugin class

Code under `app/` depends on the small interfaces in `app/types/PluginPorts.ts` (`WorkoutDataPort`, `ExerciseLibraryPort`, `MuscleTagPort`, `EventBusPort`, ...), never on `main.ts`. `main.ts` implements them and wires the services in `onload()`; `onunload()` cleans up timers → views → cache → Chart.js → services → ribbon → API.

### Seams for tests

The log sits on `LogStorage`: `VaultLogStorage` in production, `InMemoryLogStorage` in tests, which assert on the CSV text. Vault behaviour in tests goes through the shared `FakeVault`; logged sets are built with `logRow()`.

### Code block schemas

Every block is declared once with `defineCodeBlock`: parameters, types, defaults, limits. `parse` reads a block (invalid values show an error in its place), `serialize` writes one (insert modals, examples), and edit modals patch only the changed lines through `CodeBlockEditorService`. Blocks carry an `id`; one without is found by its body.

### Event-driven refresh

```text
WorkoutLogFile.add / update / delete / renameExercise / importSets ...
  → rewrite the CSV in one vault.process(), clear the cache
  → WorkoutEventBus.emit(log:added | log:updated | log:deleted | log:bulk-changed)
  → EventAwareRenderChild filters by exercise / workout → the view redraws

plugin.triggerMuscleTagRefresh() → muscle-tags:changed → dashboards redraw
settings change                  → settings:changed     → every block redraws
plugin.batchOperation(fn)        → events held during fn, one log:bulk-changed at the end
```

### UI kit and design system

Every block is a `BlockCard` with its ⋮ menu last in the top row; logging controls come from the kit (`NumberField`, `CheckToggle`, `ChipGroup`, `ProtocolPicker`, `UndoNotice`, ...). `workout-sets` is the reference use of every piece. Tokens, color roles and component rules are in `DESIGN.md`.

### Declarative settings

The settings tab is a list of definitions (`getSettingDefinitions()`), so Obsidian 1.13+ can search it; older versions draw the same definitions through `display()`. Lists the user edits (timer presets, protocols, exercise types) go through `settingsListEditor`.

### Opt-in features

New user-facing features ship behind Settings → Beta features (`BetaFeatures.ts`), off after an update and on for a new install. None is in beta right now.

## Onboarding

- **Fresh install** (nothing saved, no log CSV): `openOnboarding` creates the example notes (never overwriting a file) and opens the getting-started guide, a folder of native notes (`GettingStartedPages.ts`: `01 Tables` … `11 Workout sets`).
- **Every new version**: `WhatsNewModal` shows the release notes since `settings.lastSeenVersion` (en.json `whatsNew.releases.*`, latest 7).

## Build, checks and release

- `npm run build`: `tsc` check → Sass (`styles.source.scss` → `styles.css`) → esbuild (`main.ts` → `main.js`, locales packed).
- Husky pre-push: lockfile check → typecheck → lint (zero warnings, README checks) → Jest with coverage floor (~80%) → build. CI runs the same lint and coverage.
- Translations: only `en.json` is edited; the other 23 locales come from the Translate workflow (Ollama) or the `translate` skill (Haiku).
- Release: the `/release` skill bumps the version on `main` and pushes the tag; the release workflow builds from the tag, checks locales, attests provenance and publishes.

## Security

- CSV formula injection: `sanitizeCSVValue()` in `WorkoutLogCodec.ts` prefixes values starting with `=`, `+`, `-`, `@`.
- No `innerHTML`: DOM is built with Obsidian's `createEl` helpers.
- No Node/Electron APIs, so the plugin runs on mobile.
