# Directive: Add New Embedded View

## 1. Objective

Create a new code block processor that renders custom content inside Obsidian notes (e.g., `workout-chart`, `workout-log`, `workout-timer`, `workout-dashboard`).

## 2. Prerequisites

- Understanding of Obsidian's `registerMarkdownCodeBlockProcessor` API
- Familiarity with `BaseView` class pattern
- Knowledge of code block YAML parameter parsing
- Understanding of view lifecycle and cleanup

## 3. Input Requirements

### Required Information
- **View name**: Identifier for code block (e.g., `workout-heatmap`)
- **Feature domain**: Which feature directory (e.g., `charts`, `tables`, `dashboard`)
- **Data source**: Where the view gets data (DataService, custom service)
- **Parameters**: YAML parameters the code block accepts
- **Rendering logic**: What the view displays (chart, table, interactive component)

### Decision Points
- Does this view need cleanup? (charts, timers, event listeners)
- Does this view need real-time updates? (data polling, file watching)
- Does this view need user interaction? (click handlers, forms)
- Should this view be accessible via API? (WorkoutPlannerAPI exposure)

## 4. Execution Scripts

### Automation Scripts
```bash
# Generate view boilerplate (future enhancement)
npm run doe:generate-view -- --name=heatmap --feature=charts

# Validate imports after creation
npm run doe:validate
```

### Manual Validation
```bash
# Run tests
npm test -- features/[feature]/views/__tests__/[ViewName].test.ts

# Type check
npm run build
```

## 5. Step-by-Step Procedure

### Step 1: Create View Class

**Location**: `app/features/[feature]/views/[ViewName].ts`

```typescript
import { BaseView } from "@app/features/common/views/BaseView";
import { WorkoutChartsPlugin } from "main";
import { CONSTANTS } from "@app/constants";

/**
 * Embedded view for [description]
 *
 * Code block syntax:
 * ```[view-name]
 * parameter1: value1
 * parameter2: value2
 * ```
 */
export class EmbeddedViewName extends BaseView {
  constructor(private plugin: WorkoutChartsPlugin) {
    super();
  }

  /**
   * Render the view inside the container
   *
   * @param container - HTML element to render into
   * @param source - Raw code block content (YAML parameters)
   * @param ctx - Markdown post processor context
   */
  async render(
    container: HTMLElement,
    source: string,
    ctx: any
  ): Promise<void> {
    try {
      // 1. Show loading spinner
      const spinner = this.renderLoadingSpinner(container);

      // 2. Parse parameters
      const params = this.parseParameters(source);

      // 3. Fetch data
      const data = await this.fetchData(params);

      // 4. Remove spinner
      spinner.remove();

      // 5. Handle empty data
      if (this.handleEmptyData(container, data)) {
        return;
      }

      // 6. Render content
      this.renderContent(container, data, params);
    } catch (error) {
      // BaseView.handleError logs to ErrorCollector automatically
      this.handleError(container, error as Error);
    }
  }

  /**
   * Parse YAML parameters from code block source
   */
  private parseParameters(source: string): ViewParams {
    // Parse YAML or use defaults
    const lines = source.split("\n");
    const params: Partial<ViewParams> = {};

    lines.forEach((line) => {
      const [key, value] = line.split(":").map((s) => s.trim());
      if (key && value) {
        params[key] = this.parseValue(value);
      }
    });

    return this.applyDefaults(params);
  }

  /**
   * Fetch data from appropriate service
   */
  private async fetchData(params: ViewParams): Promise<ViewData> {
    // Use DataService or custom service
    return await this.plugin.dataService.getWorkoutLogData({
      exercise: params.exercise,
      dateRange: params.dateRange,
    });
  }

  /**
   * Render the main content
   */
  private renderContent(
    container: HTMLElement,
    data: ViewData,
    params: ViewParams
  ): void {
    // Create container structure
    const wrapper = container.createDiv({ cls: "view-wrapper" });

    // Render title if needed
    if (params.showTitle) {
      wrapper.createEl("h3", { text: params.title });
    }

    // Render main content
    const contentEl = wrapper.createDiv({ cls: "view-content" });
    // ... rendering logic ...

    // Store references for cleanup if needed
    this.storeReference(contentEl);
  }

  /**
   * Cleanup resources (called by plugin.onunload)
   */
  cleanup(): void {
    // Destroy charts, clear timers, remove event listeners
    // Clean up any resources created in render()
  }

  /**
   * Apply default values to parameters
   */
  private applyDefaults(params: Partial<ViewParams>): ViewParams {
    return {
      exercise: params.exercise || "",
      dateRange: params.dateRange || 30,
      showTitle: params.showTitle !== false,
      ...params,
    };
  }

  /**
   * Parse string value to appropriate type
   */
  private parseValue(value: string): any {
    if (value === "true") return true;
    if (value === "false") return false;
    if (!isNaN(Number(value))) return Number(value);
    return value;
  }
}

// Type definitions
interface ViewParams {
  exercise?: string;
  dateRange?: number;
  showTitle?: boolean;
  // ... other parameters
}

interface ViewData {
  // Define data structure
}
```

### Step 2: Register Code Block Processor

**Location**: `app/services/plugin-lifecycle/CodeBlockProcessorService.ts`

```typescript
registerProcessors(): void {
  // ... existing processors ...

  // NEW: Register your view
  this.plugin.registerMarkdownCodeBlockProcessor(
    "[view-name]",
    async (source, el, ctx) => {
      const view = new EmbeddedViewName(this.plugin);
      await view.render(el, source, ctx);
    }
  );
}
```

### Step 3: Add Cleanup Logic

**Location**: `main.ts` in `onunload()` method

```typescript
async onunload() {
  console.log("Unloading Workout Charts plugin...");

  // ... existing cleanup ...

  // NEW: Cleanup your view
  if (this.viewNameInstance) {
    this.viewNameInstance.cleanup();
    this.viewNameInstance = null;
  }

  // ... rest of cleanup ...
}
```

**Note**: Store view instance in plugin class if cleanup is needed:
```typescript
export class WorkoutChartsPlugin extends Plugin {
  // ... existing properties ...
  viewNameInstance: EmbeddedViewName | null = null;

  async onload() {
    // ... initialization ...
    this.viewNameInstance = new EmbeddedViewName(this);
  }
}
```

### Step 4: Add Insert Command (Optional)

If users should be able to insert this code block via command palette:

**Location**: `app/services/plugin-lifecycle/CommandHandlerService.ts`

```typescript
registerCommands(): void {
  // ... existing commands ...

  // NEW: Add insert command
  this.plugin.addCommand({
    id: "insert-[view-name]",
    name: "Insert [view name]",
    editorCallback: (editor) => {
      const modal = new InsertViewNameModal(this.plugin.app, this.plugin);
      modal.open();
    },
  });
}
```

Create corresponding modal in `app/features/modals/insert/`:
```typescript
export class InsertViewNameModal extends BaseInsertModal {
  getModalTitle(): string {
    return "Insert [View Name]";
  }

  createFormElements(contentEl: HTMLElement): void {
    // Form fields for parameters
  }

  generateCode(): string {
    return `\`\`\`[view-name]\n${this.getParameters()}\n\`\`\``;
  }
}
```

### Step 5: Add Tests

**Location**: `app/features/[feature]/views/__tests__/[ViewName].test.ts`

```typescript
import { EmbeddedViewName } from "../EmbeddedViewName";
import { WorkoutChartsPlugin } from "main";
import { mockPlugin, mockContainer } from "@app/__tests__/obsidianDomMocks";

describe("EmbeddedViewName", () => {
  let view: EmbeddedViewName;
  let plugin: WorkoutChartsPlugin;
  let container: HTMLElement;

  beforeEach(() => {
    plugin = mockPlugin();
    view = new EmbeddedViewName(plugin);
    container = mockContainer();
  });

  afterEach(() => {
    view.cleanup();
  });

  describe("render", () => {
    it("should render loading spinner initially", async () => {
      const source = "exercise: Squat";
      const renderPromise = view.render(container, source, {});

      expect(container.querySelector(".loading-spinner")).toBeTruthy();

      await renderPromise;
    });

    it("should render content after data loads", async () => {
      const source = "exercise: Squat";
      plugin.dataService.getWorkoutLogData = jest.fn().resolves([
        { date: "2025-01-01", exercise: "Squat", weight: 100 },
      ]);

      await view.render(container, source, {});

      expect(container.querySelector(".view-content")).toBeTruthy();
    });

    it("should handle empty data gracefully", async () => {
      const source = "exercise: NonExistent";
      plugin.dataService.getWorkoutLogData = jest.fn().resolves([]);

      await view.render(container, source, {});

      expect(container.querySelector(".feedback-empty")).toBeTruthy();
    });

    it("should handle errors gracefully", async () => {
      const source = "exercise: Squat";
      plugin.dataService.getWorkoutLogData = jest
        .fn()
        .rejects(new Error("Test error"));

      await view.render(container, source, {});

      expect(container.querySelector(".feedback-error")).toBeTruthy();
    });
  });

  describe("parseParameters", () => {
    it("should parse YAML parameters correctly", () => {
      // Test parameter parsing
    });

    it("should apply default values", () => {
      // Test defaults
    });
  });

  describe("cleanup", () => {
    it("should cleanup resources", () => {
      // Test cleanup
    });
  });
});
```

### Step 6: Add Documentation

**Update**: `CLAUDE.md` in "Code Block Syntax" section:

```markdown
#### [view-name]
```yaml
parameter1: value1   # Description
parameter2: value2   # Description
```
```

**Add**: JSDoc comments to view class explaining:
- Purpose and use case
- All parameters and their types
- Example usage
- Cleanup requirements

## 6. Edge Cases

### Empty Data
- **Scenario**: Data source returns empty array
- **Handling**: Use `BaseView.handleEmptyData()` to show user-friendly message
- **Example**: No workouts logged for selected exercise

### Invalid Parameters
- **Scenario**: User provides invalid YAML or parameter values
- **Handling**: Use defaults or show validation error
- **Example**: `dateRange: abc` should default to 30 days

### Large Datasets
- **Scenario**: Rendering thousands of data points
- **Handling**: Implement pagination or data aggregation
- **Example**: Show last 100 entries by default, add "Load more" button

### Real-Time Updates
- **Scenario**: Data changes while view is rendered
- **Handling**: Add refresh button or auto-refresh mechanism
- **Example**: Dashboard widgets refresh every 5 minutes

### Memory Leaks
- **Scenario**: View creates resources not cleaned up
- **Handling**: Implement `cleanup()` method, call in `plugin.onunload()`
- **Example**: Chart.js instances must be destroyed

### Multiple Instances
- **Scenario**: Same view rendered multiple times in one note
- **Handling**: Use unique IDs for DOM elements, separate state
- **Example**: Multiple `workout-chart` blocks with different exercises

## 7. Validation

### Manual Testing
1. Create test note with code block
2. Verify view renders correctly
3. Test all parameters work as expected
4. Test error scenarios (invalid params, no data)
5. Test cleanup (reload plugin, check memory)

### Automated Testing
```bash
# Run view tests
npm test -- features/[feature]/views/__tests__/[ViewName].test.ts

# Check coverage
npm run test:coverage

# Type check
npm run build

# Validate imports
npm run doe:validate
```

### Success Criteria
- [ ] View renders in test note
- [ ] All parameters work correctly
- [ ] Empty data shows user-friendly message
- [ ] Errors show user-friendly message
- [ ] Cleanup prevents memory leaks
- [ ] Tests pass with >90% coverage
- [ ] No TypeScript errors
- [ ] Documentation is complete

## 8. Common Mistakes

### ❌ Not Extending BaseView
```typescript
// Wrong
export class MyView {
  async render(container, source, ctx) { ... }
}
```

```typescript
// Correct
export class MyView extends BaseView {
  async render(container, source, ctx) { ... }
}
```

**Why**: BaseView provides standardized error handling, loading states, empty data handling.

### ❌ Not Implementing Cleanup
```typescript
// Wrong - creates memory leak
export class ChartView extends BaseView {
  async render(container, source, ctx) {
    const chart = new Chart(ctx, config); // Never destroyed
  }
}
```

```typescript
// Correct
export class ChartView extends BaseView {
  private charts: Chart[] = [];

  async render(container, source, ctx) {
    const chart = new Chart(ctx, config);
    this.charts.push(chart);
  }

  cleanup(): void {
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];
  }
}
```

### ❌ Using innerHTML
```typescript
// Wrong - security risk
container.innerHTML = `<h3>${params.title}</h3>`;
```

```typescript
// Correct - use Obsidian DOM helpers
container.createEl("h3", { text: params.title });
```

### ❌ Hardcoding Strings
```typescript
// Wrong
container.createDiv({ text: "No data found" });
```

```typescript
// Correct - use constants
import { CONSTANTS } from "@app/constants";
container.createDiv({ text: CONSTANTS.WORKOUT.MESSAGES.NO_DATA });
```

### ❌ Not Handling Errors
```typescript
// Wrong
async render(container, source, ctx) {
  const data = await this.fetchData(); // Can throw
  this.renderContent(container, data);
}
```

```typescript
// Correct
async render(container, source, ctx) {
  try {
    const data = await this.fetchData();
    this.renderContent(container, data);
  } catch (error) {
    this.handleError(container, error as Error);
  }
}
```

### ❌ Not Using TypeScript Paths
```typescript
// Wrong
import { DataService } from "../../../services/data/DataService";
```

```typescript
// Correct
import { DataService } from "@app/services/data/DataService";
```

## 9. Related Directives

- **[add-new-feature.md](add-new-feature.md)** - General feature development
- **[add-new-modal.md](add-new-modal.md)** - Creating insert modals for views
- **[add-new-component.md](add-new-component.md)** - Creating UI components for views
- **[error-handling.md](../maintenance/error-handling.md)** - Error handling patterns
- **[unit-testing.md](../testing/unit-testing.md)** - Testing views
- **[csv-operations.md](../data/csv-operations.md)** - Working with data sources

## Examples

### Example 1: Simple View (No Cleanup)
```typescript
// View that just displays text (no resources to clean up)
export class SimpleView extends BaseView {
  async render(container: HTMLElement, source: string, ctx: any) {
    try {
      const data = await this.plugin.dataService.getWorkoutLogData({});
      const count = data.length;
      container.createDiv({ text: `Total workouts: ${count}` });
    } catch (error) {
      this.handleError(container, error as Error);
    }
  }

  cleanup(): void {
    // No resources to clean up
  }
}
```

### Example 2: Complex View (With Cleanup)
```typescript
// View with chart, timer, event listeners (requires cleanup)
export class ComplexView extends BaseView {
  private charts: Chart[] = [];
  private timers: NodeJS.Timeout[] = [];
  private eventListeners: Array<{ el: HTMLElement; event: string; handler: () => void }> = [];

  async render(container: HTMLElement, source: string, ctx: any) {
    try {
      // Create chart
      const canvas = container.createEl("canvas");
      const chart = new Chart(canvas, { /* config */ });
      this.charts.push(chart);

      // Create timer
      const timer = setInterval(() => this.refresh(), 5000);
      this.timers.push(timer);

      // Add event listener
      const button = container.createEl("button", { text: "Refresh" });
      const handler = () => this.refresh();
      button.addEventListener("click", handler);
      this.eventListeners.push({ el: button, event: "click", handler });
    } catch (error) {
      this.handleError(container, error as Error);
    }
  }

  cleanup(): void {
    // Destroy charts
    this.charts.forEach((chart) => chart.destroy());
    this.charts = [];

    // Clear timers
    this.timers.forEach((timer) => clearInterval(timer));
    this.timers = [];

    // Remove event listeners
    this.eventListeners.forEach(({ el, event, handler }) => {
      el.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }
}
```

## Version History

- **v1.0** (2025-02-10): Initial directive created
- Document errors and improvements here as they're discovered
