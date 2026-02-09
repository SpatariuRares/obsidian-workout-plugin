# Contributing Guide

## Development Setup

```bash
npm install          # Install dependencies
npm run dev          # Dev build with CSS + esbuild watch mode
npm run build        # Production: tsc check + CSS + minified bundle
npm test             # Jest test suite
npm run lint         # ESLint
```

## Architecture Overview

```
main.ts (WorkoutChartsPlugin)
├── CodeBlockProcessorService    # Routes workout-* code blocks to views
├── CommandHandlerService        # Registers Obsidian commands
└── DataService                  # CSV operations with 5-second cache

app/
├── components/                  # Atomic design: atoms, molecules, organism
├── constants/                   # Organized by concern (ui, defaults, muscles, validation)
├── features/                    # Feature modules (charts, tables, timer, dashboard, modals)
├── services/                    # Core services, data, editor, exercise
├── types/                       # Shared TypeScript types
├── utils/                       # Shared utilities
└── views/                       # (legacy) - views now live in features/
```

## How to Add a New Embedded View

### 1. Create the view class

Extend `BaseView` from `@app/features/common/views/BaseView`:

```typescript
import { BaseView } from "@app/features/common/views/BaseView";
import type { WorkoutChartsPlugin } from "@app/types";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

interface MyViewParams {
  exercise?: string;
  limit?: number;
}

export class EmbeddedMyView extends BaseView {
  constructor(plugin: WorkoutChartsPlugin) {
    super(plugin);
  }

  async createView(
    container: HTMLElement,
    logData: WorkoutLogData[],
    params: MyViewParams,
  ): Promise<void> {
    try {
      // 1. Show loading
      const loading = this.showLoadingIndicator(container);

      // 2. Handle empty data
      if (this.handleEmptyData(container, logData, params.exercise)) {
        loading.remove();
        return;
      }

      // 3. Filter data
      const { filteredData } = this.filterData(logData, params);

      loading.remove();

      // 4. Render content
      this.renderContent(container, filteredData, params);
    } catch (error) {
      this.handleError(
        container,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  cleanup(): void {
    // Clean up resources on unload
  }
}
```

### 2. Register the code block processor

In `CodeBlockProcessorService.registerProcessors()`:

```typescript
this.plugin.registerMarkdownCodeBlockProcessor(
  "workout-myview",
  (source, el, ctx) => this.handleMyView(source, el, ctx),
);
```

### 3. Add the handler

```typescript
private async handleMyView(
  source: string,
  el: HTMLElement,
  ctx: MarkdownPostProcessorContext,
) {
  try {
    const params = this.parseCodeBlockParams(source);
    const logData = await this.dataService.getWorkoutLogData();
    await this.embeddedMyView.createView(el, logData || [], params);
  } catch (error) {
    Feedback.renderError(el, `Error: ${error}`);
  }
}
```

Users can then use:
````yaml
```workout-myview
exercise: Bench Press
limit: 10
```
````

## How to Add a New Modal

### Insert Modal (generates code blocks)

Extend `BaseInsertModal`:

```typescript
import { BaseInsertModal } from "@app/features/modals/base/BaseInsertModal";

export class InsertMyModal extends BaseInsertModal {
  getModalTitle(): string {
    return "Insert my view";
  }

  getButtonText(): string {
    return "Insert";
  }

  getSuccessMessage(): string {
    return "Code block inserted";
  }

  createConfigurationSections(contentEl: HTMLElement): void {
    // Use ModalBase form helpers:
    this.createTextField(contentEl, "Exercise", "exercise-input");
    this.createNumberField(contentEl, "Limit", "limit-input", { value: 10 });
  }

  generateCode(): string {
    const exercise = (this.contentEl.querySelector("#exercise-input") as HTMLInputElement)?.value;
    return CodeGenerator.generateCodeBlock("workout-myview", { exercise });
  }
}
```

### Log Modal (creates/edits workout entries)

Extend `BaseLogModal`:

```typescript
import { BaseLogModal } from "@app/features/modals/base/BaseLogModal";

export class MyLogModal extends BaseLogModal {
  getModalTitle(): string { return "Log workout"; }
  getButtonText(): string { return "Save"; }
  getSuccessMessage(): string { return "Workout saved"; }

  getInitialWorkoutToggleState(): boolean { return false; }
  shouldPreFillForm(): boolean { return false; }
  getPreFillData(): Partial<WorkoutLogData> | null { return null; }

  async handleSubmit(formData: Record<string, unknown>): Promise<void> {
    // Save logic
  }
}
```

### Register the command

In `CommandHandlerService`:

```typescript
this.plugin.addCommand({
  id: "insert-my-view",
  name: "Insert my view",
  editorCallback: (editor) => {
    new InsertMyModal(this.plugin.app, this.plugin, editor).open();
  },
});
```

## How to Add a Component

### Atomic Design Levels

- **Atoms** (`app/components/atoms/`): Indivisible primitives - Button, Input, Text, Icon, Container, Canvas
- **Molecules** (`app/components/molecules/`): Composites of atoms - StatCard, FormField, Badge, SearchBox
- **Organisms** (`app/components/organism/`): Complex compositions of molecules

### Creating a Component

All components use a static class pattern with a `create()` method:

```typescript
// app/components/atoms/MyComponent.ts

export interface MyComponentProps {
  text: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export class MyComponent {
  static create(parent: HTMLElement, props: MyComponentProps): HTMLElement {
    const el = parent.createEl("div", {
      cls: `my-component my-component--${props.variant || "primary"} ${props.className || ""}`.trim(),
    });

    el.createEl("span", { text: props.text });

    return el;
  }
}
```

### Export from barrel file

Add to `app/components/atoms/index.ts`:

```typescript
export { MyComponent, type MyComponentProps } from "./MyComponent";
```

### Import pattern

```typescript
import { MyComponent } from "@app/components/atoms";
```

## How to Add a Dashboard Widget

### Widget Pattern

Each widget is a static class with a `render()` method:

```typescript
// app/features/dashboard/widgets/my-widget/MyWidget.ts

import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import type { EmbeddedDashboardParams } from "@app/features/dashboard/types";

export class MyWidget {
  static render(
    container: HTMLElement,
    data: WorkoutLogData[],
    params: EmbeddedDashboardParams,
  ): void {
    const widget = container.createDiv({
      cls: "workout-widget workout-my-widget",
    });

    widget.createEl("h3", { text: "My Widget" });

    // Render widget content using data
    const stats = this.calculateStats(data);
    // ... render stats
  }

  private static calculateStats(data: WorkoutLogData[]) {
    // Business logic - consider extracting to business/ subdirectory
  }
}
```

### Widget Structure (for larger widgets)

```
widgets/my-widget/
├── MyWidget.ts           # Render orchestrator
├── index.ts              # Barrel export
└── business/
    ├── myWidgetData.ts   # Data processing
    └── index.ts
```

### Register in EmbeddedDashboardView

Add to `renderDashboard()` in `EmbeddedDashboardView.ts`:

```typescript
MyWidget.render(gridEl, displayData, params);
```

### CSS Grid Sizing

Use CSS classes for grid sizing:
- `.workout-summary-widget` - full-width (`grid-column: 1/-1`)
- `.widget-wide` - span 2 columns (`grid-column: span 2`)
- Default - auto column sizing

## Conventions

### Naming

- **Files**: PascalCase for classes (`ChartRenderer.ts`), camelCase for utilities (`calculateStats.ts`)
- **Classes**: PascalCase, descriptive (`TableColumnResolver`, not `ColResolver`)
- **Interfaces**: PascalCase, no `I` prefix (`ButtonProps`, not `IButtonProps`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_SETTINGS`, `CHART_DATA_TYPE`)
- **UI text**: Sentence case ("Template folder", not "Template Folder")

### Path Aliases

Always use `@app/*` instead of relative paths:

```typescript
// Good
import { Button } from "@app/components/atoms";
import { CONSTANTS } from "@app/constants";

// Bad
import { Button } from "../../../components/atoms";
```

### Barrel Exports

Every module directory has an `index.ts` barrel export:

```typescript
// app/features/charts/components/index.ts
export { ChartRenderer } from "./ChartRenderer";
export { ChartContainer } from "./ChartContainer";
export { TrendHeader } from "./TrendHeader";
```

### Constants Organization

| Module | Purpose |
|--------|---------|
| `ui.constants.ts` | User-facing strings: modal titles, settings labels, table columns, icons |
| `defaults.constants.ts` | Default values for settings, chart config, table config, timer |
| `muscles.constants.ts` | Muscle names, positions, groups, body parts, tag mappings |
| `validation.constants.ts` | Error messages, validation limits, patterns |

Import patterns:

```typescript
// Barrel import (convenient)
import { CONSTANTS, ICONS, DEFAULT_SETTINGS } from "@app/constants";

// Direct import (better tree-shaking)
import { ICONS, MODAL_UI } from "@app/constants/ui.constants";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
```

## Testing

### Location

Tests live in `__tests__/` directories alongside source files:

```
app/features/charts/business/
├── ChartDataUtils.ts
└── __tests__/
    └── ChartDataUtils.test.ts
```

### Coverage Threshold

70% minimum for statements, branches, functions, and lines.

### Test Structure

```typescript
/** @jest-environment jsdom */

// Mock Obsidian first (before any imports that use it)
jest.mock("obsidian", () => ({
  Notice: jest.fn(),
  Modal: class { constructor(public app: any) {} open() {} close() {} },
  MarkdownRenderChild: class { constructor(public containerEl: HTMLElement) {} },
}));

import { MyClass } from "../MyClass";

describe("MyClass", () => {
  let instance: MyClass;

  beforeEach(() => {
    instance = new MyClass(/* mocks */);
    jest.clearAllMocks();
  });

  it("should handle expected input", () => {
    const result = instance.process(validInput);
    expect(result).toEqual(expectedOutput);
  });

  it("should handle empty data", () => {
    const result = instance.process([]);
    expect(result).toEqual([]);
  });

  it("should handle errors", () => {
    expect(() => instance.process(invalidInput)).toThrow();
  });
});
```

### Mocking Obsidian DOM

Use the shared mock utilities for DOM tests:

```typescript
import {
  createObsidianContainer,
  attachObsidianHelpers,
} from "@app/components/__tests__/obsidianDomMocks";

it("renders component", () => {
  const parent = createObsidianContainer();
  MyComponent.create(parent, { text: "Hello" });
  expect(parent.querySelector(".my-component")).toBeTruthy();
});
```

### Running Tests

```bash
npm test                                           # All tests
npm test -- app/utils/__tests__/DateUtils.test.ts  # Single file
npm run test:watch                                 # Watch mode
npm run test:coverage                              # Coverage report
```

## CSS Guidelines

### Use Obsidian Variables

```css
/* Good - uses Obsidian theme variables */
.my-component {
  background: var(--background-primary);
  color: var(--text-normal);
  border: 1px solid var(--background-modifier-border);
  border-radius: var(--radius-s);
}

/* Bad - hardcoded colors */
.my-component {
  background: #ffffff;
  color: #333333;
}
```

### Plugin Variables

The plugin defines its own spacing/sizing system:

```css
--workout-space-xs: 4px;
--workout-space-sm: 8px;
--workout-space-md: 12px;
--workout-space-lg: 16px;
--workout-space-xl: 20px;
```

### CSS Organization

- Entry point: `styles.source.css` (imports modular files from `styles/`)
- Output: `styles.css` (PostCSS bundled)
- Build: `node build-css.mjs`

## DOM Security

- **Never use `innerHTML`** - use `createEl()`, `createDiv()`, `createSpan()` helpers
- **Use `el.empty()`** to clean up HTML element contents
- **Use Obsidian's DOM helpers** for all element creation

```typescript
// Good
const div = container.createDiv({ cls: "my-class" });
div.createEl("span", { text: userInput });

// Bad - XSS vulnerability
container.innerHTML = `<div class="my-class"><span>${userInput}</span></div>`;
```

## Obsidian Plugin Rules

- Use `this.app` - never global `app` or `window.app`
- No unnecessary console logging (only errors, unless debug mode)
- Use `setHeading()` for settings headings, not HTML headings
- No default hotkeys - let users configure their own
- Use `registerEvent()` and `addCommand()` for auto-cleanup
- Don't detach leaves in `onunload()`
- Use Vault API (not Adapter API) for file operations
- Use `normalizePath()` for user-defined paths
- Avoid Node/Electron APIs (mobile compatibility)
- Avoid regex lookbehind (iOS 16.4+ only)
