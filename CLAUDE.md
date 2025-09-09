# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development build**: `npm run dev` - Runs esbuild in watch mode for live development
- **Production build**: `npm run build` - TypeScript compilation check + production build with minification
- **Version bump**: `npm run version` - Updates manifest.json and versions.json, then stages the changes

## Project Architecture

This is an Obsidian plugin that visualizes workout data through interactive charts, tables, and timers. The plugin follows a modular architecture with clear separation of concerns.

### Core Architecture

- **main.ts**: Central plugin class that handles initialization, command registration, and code block processing
- **CSV-based data storage**: Uses a single CSV file (`theGYM/Log/workout_logs.csv`) for workout data with caching for performance
- **Embedded views**: Chart, Table, and Timer views that can be embedded in notes via code blocks
- **Modal system**: Comprehensive modal system for creating logs, inserting code blocks, and managing exercises

### Key Directories

- **app/types/**: Type definitions and data models (`WorkoutLogData.ts` contains core interfaces)
- **app/views/**: Embedded view classes (BaseView provides common functionality)
- **app/modals/**: Modal implementations with base classes for consistency
- **app/components/**: UI components, data filtering, chart rendering, and utility functions
- **app/settings/**: Plugin settings management
- **app/services/**: Core business logic (DataService, CommandHandlerService, CodeBlockProcessorService)

### Data Flow

1. **Data Source**: CSV file with columns: date, exercise, reps, weight, volume, origine, workout, timestamp
2. **Caching**: 5-second cache for workout data to improve performance
3. **Code Block Processing**: Three types of code blocks (`workout-chart`, `workout-log`, `workout-timer`)
4. **Filtering**: Advanced filtering system with exact/fuzzy matching and early filtering optimization

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
- esbuild handles bundling with Obsidian-specific externals
- Plugin follows Obsidian's plugin architecture patterns
- Includes comprehensive error handling and debug mode functionality