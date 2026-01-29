# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Development build with CSS + esbuild watch mode
npm run build        # Production build: tsc check + CSS + minified bundle
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm test             # Jest test suite
npm run test:watch   # Jest watch mode
npm run test:coverage # Jest with coverage report
npm run version      # Bump version in manifest.json and versions.json
```

**Run single test file**: `npm test -- app/utils/__tests__/DateUtils.test.ts`

## Build Process

1. **CSS**: `node build-css.mjs` - PostCSS bundles `styles/` → `styles.css`
2. **TypeScript**: `tsc -noEmit -skipLibCheck` - validation only
3. **Bundle**: esbuild bundles `main.ts` → `main.js` with Obsidian externals

## Project Architecture

Obsidian plugin for workout data visualization with charts, tables, timers, and dashboards.

### TypeScript Configuration

- **Path alias**: `@app/*` → `app/*` (use instead of relative paths)
- **Strict mode enabled**: strictNullChecks, noImplicitAny

### Service Layer Pattern

```text
main.ts (WorkoutChartsPlugin)
├── CommandHandlerService     # Registers Obsidian commands
├── CodeBlockProcessorService # Processes workout-* code blocks
└── DataService               # CSV operations with 5-second cache
```

### Embedded Views (BaseView Pattern)

All views extend `BaseView` for consistent error handling and debug logging:

- `EmbeddedChartView` - Chart.js visualizations
- `EmbeddedTableView` - Sortable data tables
- `EmbeddedTimerView` - Countdown/interval timers with presets
- `EmbeddedDashboardView` - Stats, analytics, heat maps

### Modal System (ModalBase Pattern)

Modals extend `ModalBase` or `BaseInsertModal`:

- `app/features/modals/base/` - Base classes (ModalBase, BaseInsertModal)
- `app/features/modals/components/` - Reusable components (ExerciseAutocomplete, TimerConfigurationSection, CodeGenerator)

### Atomic Design Components

```text
app/components/
├── atoms/      # Primitives: Button, Input, Text, Icon, Container, Canvas, ErrorMessage
├── molecules/  # Composites: StatCard, FormField, SearchBox, Badge, TrendIndicator
└── organism/   # Complex: larger composed components
```

Import from barrel exports: `import { Button, StatCard } from "@app/components/atoms"`

### Feature Modules

```text
app/features/
├── charts/     # ChartRenderer, chart config
├── tables/     # TableRenderer, TableDataProcessor
├── timer/      # TimerCore, TimerControls, TimerDisplay, TimerAudio
├── dashboard/  # QuickStatsCards, VolumeAnalytics, MuscleHeatMap
├── modals/     # All modal implementations
└── settings/   # WorkoutChartsSettingTab
```

### Data Flow

1. **Source**: CSV file (columns: date, exercise, reps, weight, volume, origin, workout, timestamp, notes)
2. **Caching**: DataService caches for 5 seconds, clears on data changes
3. **Filtering**: DataFilter uses multi-strategy matching (exact, fuzzy, filename, exercise field)
4. **Processing**: Code blocks parsed from YAML-like syntax → Views render data

### Code Blocks

```yaml
# workout-chart
exercise: Squat
type: volume
dateRange: 30
showTrendLine: true
```

```yaml
# workout-log
exercise: Bench Press
limit: 10
```

```yaml
# workout-timer
preset: rest
duration: 90
```

```yaml
# workout-dashboard
```

### Timer Presets

Timers support saved presets via settings:

- `preset: presetName` - Use preset configuration
- Presets stored in `settings.timerPresets`
- Default preset configurable in settings

### CSS Organization

- **Entry**: `styles.source.css` imports modular files from `styles/`
- **Output**: PostCSS bundles to `styles.css`
- **Variables**: Use Obsidian CSS variables (e.g., `--background-primary`, `--text-normal`)

## Key Patterns

### Adding New Embedded Views

1. Extend `BaseView` class
2. Implement `render()` method
3. Register code block processor in `CodeBlockProcessorService`

### Adding New Modals

1. Extend `BaseInsertModal` for insert modals or `ModalBase` for others
2. Implement abstract methods: `getModalTitle()`, `generateCode()`, etc.
3. Register command in `CommandHandlerService`

### Adding New Components

1. Create in appropriate atomic level (atoms/molecules/organism)
2. Export from barrel file (e.g., `atoms/index.ts`)
3. Add tests in `__tests__/` directory

### Constants

Constants are organized into focused single-responsibility modules in `app/constants/`:

```text
app/constants/
├── index.ts              # Barrel export + composed CONSTANTS object
├── ui.constants.ts       # UI labels, icons, emoji, modal/settings/table/chart strings
├── defaults.constants.ts # Default configurations (settings, chart, table, timer)
├── muscles.constants.ts  # Muscle tags, groups, positions, heatmap data
├── validation.constants.ts # Error messages, validation limits, patterns
└── MuscleTags.ts         # Legacy muscle tag mappings (backward compatibility)
```

**Module purposes:**

- **ui.constants.ts**: All user-facing strings (modal titles/buttons/labels, settings labels/descriptions, table columns, chart labels, timer types, icons, emoji)
- **defaults.constants.ts**: Default values for plugin settings, chart config, table config, timer config
- **muscles.constants.ts**: Muscle names, positions, groups, body parts, tag mappings for heatmaps
- **validation.constants.ts**: Error messages, error types, form validation, numeric limits

**Import patterns:**

```typescript
// Barrel import (convenient, works everywhere)
import { CONSTANTS, ICONS, DEFAULT_SETTINGS } from "@app/constants";

// Direct import (better tree-shaking for production builds)
import { ICONS, MODAL_UI } from "@app/constants/ui.constants";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { MUSCLE_TAGS } from "@app/constants/muscles.constants";
import { ERROR_MESSAGES } from "@app/constants/validation.constants";
```

**Backward compatibility:** The `CONSTANTS` object in `index.ts` maintains the legacy `CONSTANTS.WORKOUT.*` structure by composing values from the modular files. Existing code using `CONSTANTS.WORKOUT.MODAL`, `CONSTANTS.WORKOUT.SETTINGS`, etc. continues to work.

## Testing

- **Location**: `__tests__/` directories alongside source files
- **Coverage**: 70% threshold (statements, branches, functions, lines)
- **Excluded**: FrontmatterParser.ts (Obsidian API mocking), constant files (static data)

## Obsidian Plugin Guidelines

### Critical Rules

- **Use `this.app`** - Never use global `app` or `window.app`
- **No unnecessary logging** - Only log errors, not debug messages (unless debug mode enabled)
- **Sentence case in UI** - "Template folder" not "Template Folder"
- **Use `setHeading()`** - Not `<h1>` or `<h2>` for settings headings

### Security (DOM)

- **Never use `innerHTML`** - Use `createEl()`, `createDiv()`, `createSpan()` helpers
- **Use `el.empty()`** - To clean up HTML element contents

### Resource Management

- **Clean up on unload** - Use `registerEvent()`, `addCommand()` for auto-cleanup
- **Don't detach leaves** - In `onunload()` to preserve user's layout

### Commands

- **No default hotkeys** - Let users configure their own
- **Use appropriate callback** - `callback` (unconditional), `checkCallback` (conditional), `editorCallback` (requires editor)

### Workspace

- **Use `getActiveViewOfType()`** - Not `workspace.activeLeaf` directly
- **Don't manage view references** - Use `getActiveLeavesOfType()` to access views

### Vault Operations

- **Use Vault API** - Not Adapter API (better caching and safety)
- **Use `getFileByPath()`** - Not `getFiles().find()` for lookups
- **Use `normalizePath()`** - For user-defined paths
- **Use `Vault.process()`** - For background file modifications (atomic)
- **Use `FileManager.processFrontMatter()`** - For frontmatter modifications

### Styling

- **No hardcoded colors** - Use CSS classes and Obsidian CSS variables
- **Use CSS variables** - `var(--text-normal)`, `var(--background-primary)`, etc.

### Mobile Compatibility

- **Avoid Node/Electron APIs** - Not available on mobile
- **Avoid regex lookbehind** - Only supported iOS 16.4+

## Debug Mode

Enable via settings or per-block with `debug: true`. See `DEBUG_GUIDE.md` for detailed troubleshooting.

---

## Agent Workflow (SOP System)

This project uses a 3-tier architecture for AI-assisted development to maximize reliability.

### 1. Directive Level (What to do)

- **Location**: `directives/` (Markdown files)
- **Content**: SOPs (Standard Operating Procedures) in natural language
- **Purpose**: Define objectives, inputs, required tools, and expected outputs
- **Rule**: Before starting a complex task, search for or create a directive

### 2. Orchestration Level (AI reasoning)

- **Who**: The AI Agent (Claude)
- **What**: Intelligent routing. Read directives → Call execution scripts → Handle errors
- **Rule**: Don't do everything manually. If a task is repeatable, it should become a script

### 3. Execution Level (Deterministic arm)

- **Location**: `execution/` (Scripts)
- **Content**: Atomic, robust, deterministic scripts
- **Rule**: Use `execution/` for file operations, bulk API calls, or complex logic
- **Storage**: Use `.tmp/` for intermediate files. Never commit `.tmp/`

### Operational Rules

1. **Safety First**: Never commit tokens or API keys. Use `.env`
2. **Config Over Code**: If logic can reside in config/constants, put it there, don't hardcode
3. **Determinism**: For repetitive maintenance tasks, create scripts in `execution/`
