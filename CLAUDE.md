# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development build**: `npm run dev` - Builds CSS then runs esbuild in watch mode for live development
- **Production build**: `npm run build` - TypeScript compilation check + CSS build + production build with minification
- **Version bump**: `npm run version` - Updates manifest.json and versions.json, then stages the changes
- **Linting**: `npm run lint` - Runs ESLint on the codebase
- **Linting with fixes**: `npm run lint:fix` - Runs ESLint and auto-fixes issues
- **Testing**: `npm test` - Runs Jest test suite
- **Testing with watch**: `npm run test:watch` - Runs Jest in watch mode
- **Testing with coverage**: `npm run test:coverage` - Runs Jest with coverage report

## Build Process

1. **CSS Build** (`node build-css.mjs`): Uses PostCSS to bundle modular CSS files from `styles/` directory into a single `styles.css` file
2. **TypeScript Compilation**: `tsc -noEmit -skipLibCheck` validates TypeScript without emitting files
3. **esbuild Bundling**: Bundles `main.ts` into `main.js` with Obsidian-specific externals, minification in production mode

## Testing

- **Test framework**: Jest with ts-jest for TypeScript support
- **Test files**: Located in `__tests__` directories alongside source files or with `.test.ts` suffix
- **Coverage thresholds**: 70% minimum for statements, branches, functions, and lines (currently exceeding 80%)
- **Coverage scope**: Utilities, constants (MuscleTags), data components, dashboard calculations, DataService, ChartRenderer
- **Excluded from coverage**: Constants.ts (config data), FrontmatterParser.ts (Obsidian API mocking issues)

## Project Architecture

This is an Obsidian plugin that visualizes workout data through interactive charts, tables, and timers. The plugin follows a modular architecture with clear separation of concerns.

### TypeScript Configuration

- **Path aliases**: `@app/*` maps to `app/*` (configured in tsconfig.json and jest.config.js)
- **Import example**: `import { WorkoutLogData } from "@app/types/WorkoutLogData"`
- **Target**: ES2018 with ESNext modules
- **Strict mode**: ENABLED (strict: true, strictNullChecks: true, noImplicitAny: true)
  - All strict TypeScript checks are enforced at compile time
  - Catches potential null/undefined errors before runtime
  - Prevents implicit any types for better type safety

### Core Architecture

- **[main.ts](main.ts)**: Central plugin class (WorkoutChartsPlugin) that handles initialization, command registration, and code block processing
- **Service-based architecture**: Modular services for data handling (DataService), command handling (CommandHandlerService), and code block processing (CodeBlockProcessorService)
- **CSV-based data storage**: Uses a single CSV file (`theGYM/Log/workout_logs.csv`) for workout data with 5-second caching for performance
- **Embedded views**: Chart, Table, Timer, and Dashboard views that can be embedded in notes via code blocks
- **Modal system**: Comprehensive modal system for creating logs, inserting code blocks, and managing exercises
- **BaseView pattern**: All embedded views inherit from [BaseView](app/views/BaseView.ts) class for common functionality and error handling

### Key Directories

- **app/types/**: Type definitions and data models (`WorkoutLogData.ts` contains core interfaces: WorkoutLogData, CSVWorkoutLogEntry, WorkoutChartsSettings)
- **app/views/**: Embedded view classes (all inherit from BaseView for common functionality):
  - BaseView: Abstract base class with shared error handling and debug logging
  - EmbeddedChartView, EmbeddedTableView, EmbeddedTimerView, EmbeddedDashboardView
- **app/services/**: Service layer (DataService for CSV operations, CommandHandlerService for Obsidian commands, CodeBlockProcessorService for code block rendering)
- **app/modals/**: Modal implementations with base classes (ModalBase) and reusable components (TargetSection, ExerciseAutocomplete, CodeGenerator)
- **app/components/**: Organized by feature area:
  - **chart/**: ChartRenderer for Chart.js integration
  - **table/**: TableRenderer, TableDataProcessor, and mobile-responsive table components
  - **timer/**: TimerCore, TimerControls, TimerDisplay, TimerAudio
  - **dashboard/**: QuickStatsCards, VolumeAnalytics, MuscleHeatMap, RecentWorkouts, SummaryWidget
  - **data/**: DataFilter (intelligent exercise matching), TrendCalculator
  - **ui/**: Reusable UI components (StatsBox, TrendHeader, UIComponents)
- **app/settings/**: Plugin settings management (WorkoutChartsSettingTab)
- **app/utils/**: Utility functions for exercise matching and filtering

### Data Flow

1. **Data Source**: CSV file with columns: date, exercise, reps, weight, volume, origine, workout, timestamp
2. **Caching**: 5-second cache for workout data to improve performance (DataService handles caching)
3. **Code Block Processing**: Four types of code blocks (`workout-chart`, `workout-log`, `workout-timer`, `workout-dashboard`) processed by CodeBlockProcessorService
4. **Filtering**: Advanced filtering system with exact/fuzzy matching and early filtering optimization in DataFilter component
   - Early filtering applies at data retrieval level in DataService before processing
   - DataFilter supports intelligent exercise matching with multiple search strategies (filename, exercise field, fuzzy matching)
   - AND logic when both exercise and workout filters are provided
5. **View Rendering**: Views use BaseView patterns for consistent error handling and data processing

### Code Block Integration

The plugin processes four code block types:

- `workout-chart`: Interactive Chart.js visualizations
- `workout-log`: Data tables with sorting and filtering
- `workout-timer`: Embedded workout timers
- `workout-dashboard`: Comprehensive dashboard with stats, charts, and quick actions

Parameters are parsed from YAML-like syntax within code blocks.

### CSS Organization

- **Source file**: [styles.source.css](styles.source.css) - Entry point that imports modular CSS files
- **Modular CSS**: Individual CSS files organized in `styles/` directory by feature
- **Build output**: Bundled into single [styles.css](styles.css) file via PostCSS
- **CSS variables**: Uses Obsidian's CSS variables for theme consistency (see [OBSIDIAN_GUIDELINES.md](OBSIDIAN_GUIDELINES.md))

### Dependencies

- **Chart.js v4.4.0**: For interactive chart rendering
- **Obsidian API**: Core plugin functionality
- **esbuild**: Build system with external module handling for Obsidian environment
- **PostCSS**: CSS bundling with postcss-import plugin

### Development Notes

- Plugin follows Obsidian's plugin architecture patterns (see [OBSIDIAN_GUIDELINES.md](OBSIDIAN_GUIDELINES.md))
- esbuild externalizes Obsidian API, Electron, and CodeMirror modules (see [esbuild.config.mjs](esbuild.config.mjs))
- Uses semantic versioning with GitHub Actions for releases
- Includes comprehensive error handling and debug mode functionality
- Source maps enabled in development mode, disabled in production

### Important Implementation Details

- **CSV Parsing**: Custom CSV parser in `WorkoutLogData.ts` handles quoted values and escaping
- **Cache Management**: DataService implements 5-second cache with manual cache clearing on data changes
- **Error Handling**: BaseView provides consistent error handling patterns across all embedded views
- **Service Layer**: Main plugin delegates to specialized services for separation of concerns
- **Modal System**: ModalBase provides consistent modal behavior with proper cleanup
- **Early Filtering**: DataService applies filtering at data retrieval level to optimize performance
- **Exercise Matching**: Multi-strategy search system (exact match, fuzzy match, filename match, exercise field match) with score-based filtering and confidence thresholds
- **Dashboard Integration**: Comprehensive dashboard view with quick stats, volume analytics, muscle heat maps, recent workouts, and quick actions
- **Debug Mode**: Extensive debug logging available (see [DEBUG_GUIDE.md](DEBUG_GUIDE.md) for details on troubleshooting search and filtering issues)

## Key Development Practices

### When Adding New Features

1. **Use path aliases**: Import with `@app/*` instead of relative paths
2. **Follow BaseView pattern**: Extend BaseView for new embedded views
3. **Use ModalBase**: Extend ModalBase for new modal implementations
4. **Add tests**: Write unit tests for utilities and data processing logic in `__tests__` directories
5. **Update CSS modularly**: Add feature-specific CSS in `styles/` directory, import in `styles.source.css`
6. **Use Obsidian CSS variables**: Avoid hardcoded colors, use theme-compatible CSS variables
7. **Handle errors consistently**: Use UIComponents.renderErrorMessage() for error display

### Code Style

- Use async/await over Promise chains
- Prefer const/let over var
- Use sentence case for UI text (not Title Case)
- Avoid `innerHTML` - use Obsidian's `createEl()`, `createDiv()`, `createSpan()` helpers
- Clean up resources in `onunload()` using `registerEvent()` and `addCommand()`

### Testing Changes

1. Run `npm run build` to validate TypeScript and build
2. Reload the plugin in Obsidian (Ctrl/Cmd + R)
3. Test in both light and dark themes for CSS changes
4. Test on mobile if making UI changes
5. Run `npm test` if modifying utilities or data processing logic
