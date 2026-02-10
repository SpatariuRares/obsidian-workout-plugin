# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Development build with watch mode (CSS + esbuild)
npm run build        # Production build (tsc check + CSS + minified bundle)
npm test             # Run Jest test suite
npm run test:watch   # Jest in watch mode
npm run test:coverage # Jest with coverage report
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run version      # Bump version in manifest.json and versions.json
```

**Run single test**: `npm test -- app/utils/__tests__/DateUtils.test.ts`

## Build System

1. **CSS**: `node build-css.mjs` - PostCSS bundles `styles/` → `styles.css`
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
  "paths": { "@app/*": ["app/*"] },
  "strict": true,
  "strictNullChecks": true,
  "noImplicitAny": true
}
```

**Always use `@app/*` imports instead of relative paths** (e.g., `@app/components/atoms` not `../../components/atoms`)

### Main Plugin (main.ts)

```
WorkoutChartsPlugin
├── Services
│   ├── DataService              # Facade for CSV operations (cache, columns, repository)
│   ├── ExerciseDefinitionService # Exercise type definitions and field management
│   ├── MuscleTagService          # Custom muscle tag mappings (with file watcher)
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

#### DataService (Facade)

Facade over specialized data services:
- **CSVCacheService**: 5-second cache for raw CSV data
- **CSVColumnService**: CSV header management (read, ensure columns exist)
- **WorkoutLogRepository**: CRUD operations on CSV file
- **DataFilter**: Multi-strategy filtering (exact, fuzzy, filename, exercise field)

```typescript
// Usage
const data = await plugin.dataService.getWorkoutLogData({ exercise: "Squat" });
await plugin.addWorkoutLogEntry({ date, exercise, reps, weight, ... });
plugin.clearLogDataCache(); // Force refresh
```

#### ExerciseDefinitionService

Manages exercise type definitions (Strength, Cardio, Flexibility, custom types) with field definitions. Cached with `clearCache()` method.

#### MuscleTagService

Manages custom muscle tag mappings (e.g., `petto` → `chest`) from CSV file. File watcher auto-reloads on changes. Call `destroy()` to unregister watcher.

### Embedded Views (BaseView Pattern)

All embedded views extend `BaseView` for consistent error handling, loading states, and empty data handling:

```typescript
abstract class BaseView {
  protected handleError(container, error): void
  protected handleEmptyData(container, data, exercise?, onRefresh?, pageLink?): boolean
  protected renderLoadingSpinner(container): HTMLElement
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
├── charts/
│   ├── components/      # ChartRenderer, TrendHeader
│   ├── config/          # Chart.js configuration
│   ├── business/        # ChartDataUtils (data transformation)
│   ├── ui/              # Chart-specific UI helpers
│   └── views/           # EmbeddedChartView
│
├── tables/
│   ├── components/      # TableActions, TableDataProcessor
│   ├── business/        # TargetCalculator (progressive overload)
│   ├── ui/              # ActionButtons, TargetHeader, TableErrorMessage
│   └── views/           # EmbeddedTableView
│
├── dashboard/
│   ├── ui/              # DashboardCard, StatsBox
│   ├── widgets/         # QuickStatsCards, VolumeAnalytics, MuscleHeatMap,
│   │                    # ProtocolDistribution, ProtocolEffectiveness, RecentWorkouts, SummaryWidget
│   ├── business/        # Dashboard calculation utilities
│   └── views/           # EmbeddedDashboardView
│
├── timer/
│   ├── components/      # TimerCore, TimerControls, TimerDisplay, TimerAudio
│   └── views/           # EmbeddedTimerView
│
├── modals/
│   ├── base/            # ModalBase, BaseInsertModal
│   │   ├── logic/       # LogFormValidator
│   │   └── services/    # RecentExercisesService
│   ├── components/      # ExerciseAutocomplete, TimerConfigurationSection, CodeGenerator
│   ├── log/             # CreateLogModal, QuickLogModal, EditLogModal
│   ├── exercise/        # CreateExerciseModal, AddExerciseBlockModal
│   ├── muscle/          # MuscleTagManagerModal, components, logic
│   └── ...              # InsertChartModal, InsertTableModal, InsertTimerModal, etc.
│
├── settings/
│   ├── WorkoutChartsSettings.ts              # Main settings tab
│   └── components/                           # Settings sections (QuickLogSettings,
│                                             # CustomProtocolsSettings, ProgressiveOverloadSettings, etc.)
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
├── ui.constants.ts             # All user-facing strings (MODAL_UI, SETTINGS_UI, TABLE_UI, CHARTS_UI, etc.)
├── defaults.constants.ts       # Default configs (DEFAULT_SETTINGS, DEFAULT_CHART_CONFIG, etc.)
├── muscles.constants.ts        # Muscle definitions (MUSCLE_TAGS, MUSCLE_GROUPS, MUSCLE_POSITIONS)
├── validation.constants.ts     # Error messages, validation rules
└── exerciseTypes.constants.ts  # Exercise type definitions (STRENGTH, CARDIO, FLEXIBILITY)
```

**Import patterns:**
```typescript
// Barrel import (convenient)
import { ICONS, DEFAULT_SETTINGS, MUSCLE_TAGS, ERROR_MESSAGES } from "@app/constants";

// Direct import (better tree-shaking for production)
import { ICONS, MODAL_UI } from "@app/constants/ui.constants";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
```

**When adding constants:**
- User-facing strings → `ui.constants.ts`
- Default configurations → `defaults.constants.ts`
- Validation/errors → `validation.constants.ts`
- Muscle/exercise data → `muscles.constants.ts` or `exerciseTypes.constants.ts`

**NEVER hardcode user-facing strings in components!**

### Data Flow

```
CSV File (workout_logs.csv)
    ↓
DataService (Facade)
    ↓
CSVCacheService (5-second cache)
    ↓
DataFilter (multi-strategy matching)
    ↓
Views (Chart, Table, Dashboard) or Public API
```

**CSV Columns (standard):**
- `date`, `exercise`, `reps`, `weight`, `volume`, `origine`, `workout`, `timestamp`, `notes`, `protocol`
- Custom fields for exercise type-specific parameters (duration, distance, pace, etc.)

**Filtering strategies:**
1. Filename matching
2. Exercise field matching (exact, fuzzy, partial)
3. Automatic strategy selection based on confidence scores

### Code Block Syntax

#### workout-chart
```yaml
exercise: Squat
type: volume              # volume, weight, reps, duration, distance, pace, heartRate
dateRange: 30
showTrendLine: true
showStats: true
height: 400
```

#### workout-log
```yaml
exercise: Bench Press
exactMatch: false
dateRange: 14
sortBy: date             # date, exercise, weight, reps, volume
sortOrder: desc          # asc, desc
limit: 50
columns: ["date", "reps", "weight", "volume"]
```

#### workout-timer
```yaml
duration: 90
label: Rest Period
autoStart: false
sound: true
preset: rest             # Use saved preset
```

#### workout-dashboard
```yaml
# No parameters - shows full dashboard with all widgets
```

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
5. Add modal UI strings to `ui.constants.ts` → `MODAL_UI`

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
5. Add widget UI strings to `ui.constants.ts` → `DASHBOARD_UI`

### Modifying Constants

1. Locate appropriate constant file (`ui`, `defaults`, `muscles`, `validation`, `exerciseTypes`)
2. Add constant to specific section
3. If adding to composed `CONSTANTS` object, update `constants/index.ts`
4. Ensure backward compatibility for existing `CONSTANTS.WORKOUT.*` usage

## Testing

**Framework**: Jest with ts-jest
**Coverage Target**: 90% (statements, branches, functions, lines)

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

**Coverage Configuration:**
```javascript
collectCoverageFrom: [
  "app/utils/**/*.ts",
  "app/api/**/*.ts",
  "app/constants/**/*.ts",
  "app/components/**/*.ts",
  "app/services/**/*.ts",
  "app/features/charts/**/*.ts",
  "app/features/tables/**/*.ts",
  "!app/**/__tests__/**",
  "!app/**/index.ts",  // Barrel files excluded
]
```

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
- Services (import directly from `@app/services/data/DataService`)
- Features (import directly from specific files)
- Utils (import directly from `@app/utils/DateUtils`)
- Types (import directly from specific files)

**Rationale**: Barrel files add indirection and can cause circular dependency issues. Only use where they provide genuine organizational value (component APIs, constants re-exports).

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

The plugin exposes `window.WorkoutPlannerAPI` for Dataview and other plugins:

```typescript
// Get workout logs with optional filtering
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",          // Partial match, case-insensitive
  workout: "Push Day",
  dateRange: { start: "2025-01-01", end: "2025-01-31" },
  protocol: "drop_set",
  exactMatch: false
});

// Get exercise statistics
const stats = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
// Returns: { totalVolume, maxWeight, prWeight, prReps, prDate, totalSets,
//            averageWeight, averageReps, lastWorkoutDate, trend }

// Get list of exercises
const exercises = await WorkoutPlannerAPI.getExercises({ tag: "chest" });
```

**Example Dataview Query:**
```dataviewjs
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",
  dateRange: { start: "2025-01-01" }
});

dv.table(
  ["Date", "Reps", "Weight", "Volume"],
  logs.map(l => [l.date.split("T")[0], l.reps, l.weight + " kg", l.volume])
);
```

## Common Gotchas

1. **Cache Invalidation**: Always call `plugin.clearLogDataCache()` after modifying CSV data
2. **Chart.js Memory Leaks**: Ensure `ChartRenderer.destroyChart(chartId)` is called before creating new chart with same ID
3. **Modal Cleanup**: Always call `modal.close()` after success, avoid leaving modals open
4. **Timer Cleanup**: Active timers stored in `plugin.activeTimers` Map must be destroyed in `onunload()`
5. **Service Dependencies**: Services initialized in order - DataService must exist before ExerciseDefinitionService
6. **Barrel Import Circular Dependencies**: If circular dependency error, import directly instead of using barrel file
7. **Constants Backward Compatibility**: When refactoring constants, maintain `CONSTANTS.WORKOUT.*` structure for legacy code

## CSS Organization

```
styles/
├── source.css          # Entry point (imports all modules)
├── base.css            # Base styles, CSS variables
├── components/         # Component-specific styles
├── features/           # Feature-specific styles (charts, tables, dashboard, etc.)
└── themes/             # Theme overrides
```

**Build**: `node build-css.mjs` processes with PostCSS → outputs `styles.css`

**Usage**: Import Obsidian CSS variables, never hardcode values
