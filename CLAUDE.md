# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development build**: `npm run dev` - Runs esbuild in watch mode for live development
- **Production build**: `npm run build` - TypeScript compilation check + production build with minification
- **Version bump**: `npm run version` - Updates manifest.json and versions.json, then stages the changes

## Key Commands for Development

- **Install dependencies**: `npm install`
- **Type checking**: The build command includes TypeScript compilation with `tsc -noEmit -skipLibCheck`
- **No test suite**: This project does not have automated tests configured

## Project Architecture

This is an Obsidian plugin that visualizes workout data through interactive charts, tables, and timers. The plugin follows a modular architecture with clear separation of concerns.

### Core Architecture

- **main.ts**: Central plugin class (WorkoutChartsPlugin) that handles initialization, command registration, and code block processing
- **Service-based architecture**: Modular services for data handling (DataService), command handling (CommandHandlerService), and code block processing (CodeBlockProcessorService)
- **CSV-based data storage**: Uses a single CSV file (`theGYM/Log/workout_logs.csv`) for workout data with 5-second caching for performance
- **Embedded views**: Chart, Table, and Timer views that can be embedded in notes via code blocks
- **Modal system**: Comprehensive modal system for creating logs, inserting code blocks, and managing exercises
- **BaseView pattern**: All embedded views inherit from BaseView class for common functionality and error handling

### Key Directories

- **app/types/**: Type definitions and data models (`WorkoutLogData.ts` contains core interfaces: WorkoutLogData, CSVWorkoutLogEntry, WorkoutChartsSettings)
- **app/views/**: Embedded view classes (BaseView provides common functionality, EmbeddedChartView, EmbeddedTableView, EmbeddedTimerView)
- **app/services/**: Service layer (DataService for CSV operations, CommandHandlerService for Obsidian commands, CodeBlockProcessorService for code block rendering)
- **app/modals/**: Modal implementations with base classes (ModalBase) for consistency
- **app/components/**: UI components, data filtering (DataFilter), chart rendering (ChartRenderer), table processing (TableRenderer, TableDataProcessor), and utility functions
- **app/settings/**: Plugin settings management (WorkoutChartsSettingTab)

### Data Flow

1. **Data Source**: CSV file with columns: date, exercise, reps, weight, volume, origine, workout, timestamp
2. **Caching**: 5-second cache for workout data to improve performance (DataService handles caching)
3. **Code Block Processing**: Three types of code blocks (`workout-chart`, `workout-log`, `workout-timer`) processed by CodeBlockProcessorService
4. **Filtering**: Advanced filtering system with exact/fuzzy matching and early filtering optimization in DataFilter component
5. **View Rendering**: Views use BaseView patterns for consistent error handling and data processing

### Code Block Integration

The plugin processes three code block types:
- `workout-chart`: Interactive Chart.js visualizations
- `workout-log`: Data tables with sorting and filtering
- `workout-timer`: Embedded workout timers

Parameters are parsed from YAML-like syntax within code blocks.

### Dependencies

- **Chart.js v4.4.0**: For interactive chart rendering
- **Obsidian API**: Core plugin functionality
- **esbuild**: Build system with external module handling for Obsidian environment

### Development Notes

- Uses TypeScript with strict null checks and ES6+ features
- esbuild handles bundling with Obsidian-specific externals (see esbuild.config.mjs)
- Plugin follows Obsidian's plugin architecture patterns
- Includes comprehensive error handling and debug mode functionality
- No automated testing suite - manual testing required
- Uses semantic versioning with GitHub Actions for releases

### Important Implementation Details

- **CSV Parsing**: Custom CSV parser in `WorkoutLogData.ts` handles quoted values and escaping
- **Cache Management**: DataService implements 5-second cache with manual cache clearing on data changes
- **Error Handling**: BaseView provides consistent error handling patterns across all embedded views
- **Service Layer**: Main plugin delegates to specialized services for separation of concerns
- **Modal System**: ModalBase provides consistent modal behavior with proper cleanup
- **Early Filtering**: DataService applies filtering at data retrieval level to optimize performance