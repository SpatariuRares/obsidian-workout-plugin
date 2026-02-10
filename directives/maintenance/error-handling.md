# Directive: Error Handling

## 1. Objective

Implement consistent, user-friendly error handling across the plugin while logging errors for the DOE learning system.

## 2. Prerequisites

- Understanding of JavaScript Error objects and try-catch blocks
- Familiarity with `BaseView.handleError()` pattern
- Knowledge of Obsidian's Notice API for user notifications
- Understanding of ErrorCollector service (O-layer orchestration)

## 3. Input Requirements

### Required Information
- **Error context**: Where the error occurred (service, view, modal, etc.)
- **Error type**: What kind of error (validation, data fetch, rendering, etc.)
- **User impact**: How does this error affect the user?
- **Recovery strategy**: Can the user retry? Should they be notified?

### Decision Points
- Should this error be shown to the user? (UI errors: yes, background errors: maybe)
- Should this error be logged for learning? (All errors: yes)
- Is this error recoverable? (Provide retry mechanism if yes)
- Should this error block execution? (Critical errors: yes, non-critical: no)

## 4. Execution Scripts

### Error Analysis
```bash
# Analyze error patterns
npm run doe:analyze-errors

# View error log
cat scripts/learning/error-log.json

# Check error handling coverage
npm run doe:validate
```

## 5. Step-by-Step Procedure

### Step 1: Use BaseView Error Handling (Views)

For embedded views extending `BaseView`:

```typescript
export class MyView extends BaseView {
  async render(container: HTMLElement, source: string, ctx: any): Promise<void> {
    try {
      // 1. Show loading state
      const spinner = this.renderLoadingSpinner(container);

      // 2. Perform operations
      const data = await this.fetchData();

      // 3. Remove loading state
      spinner.remove();

      // 4. Validate data
      if (this.handleEmptyData(container, data)) {
        return; // BaseView handles empty state
      }

      // 5. Render content
      this.renderContent(container, data);
    } catch (error) {
      // BaseView.handleError automatically:
      // - Renders user-friendly error message
      // - Logs error to ErrorCollector
      // - Provides error context
      this.handleError(container, error as Error);
    }
  }
}
```

**BaseView.handleError() does:**
- Renders error UI using `Feedback.renderError()`
- Logs error to `ErrorCollector` with context
- Provides consistent error experience

### Step 2: Service Error Handling

For services (DataService, ExerciseDefinitionService, etc.):

```typescript
export class MyService {
  /**
   * Fetch data with error handling
   *
   * @throws {Error} When data fetch fails
   */
  async fetchData(): Promise<Data[]> {
    try {
      const result = await this.performOperation();
      return result;
    } catch (error) {
      // Log error for learning system
      ErrorCollector.logError({
        type: "service_error",
        service: this.constructor.name,
        method: "fetchData",
        error: error as Error,
        context: { timestamp: Date.now() },
      });

      // Re-throw with user-friendly message
      throw new Error(
        `Failed to fetch data: ${(error as Error).message}`
      );
    }
  }

  /**
   * Non-critical operation with graceful degradation
   */
  async enrichData(data: Data[]): Promise<Data[]> {
    try {
      return await this.performEnrichment(data);
    } catch (error) {
      // Log error but don't throw
      ErrorCollector.logError({
        type: "service_error_non_critical",
        service: this.constructor.name,
        method: "enrichData",
        error: error as Error,
        context: { fallback: "using original data" },
      });

      // Graceful degradation: return original data
      return data;
    }
  }
}
```

**Service error patterns:**
- **Critical errors**: Throw and let caller handle
- **Non-critical errors**: Log and continue with fallback
- **Always log**: Use ErrorCollector for learning

### Step 3: Modal Error Handling

For modals (CreateLogModal, InsertChartModal, etc.):

```typescript
export class MyModal extends Modal {
  async onSubmit() {
    try {
      // 1. Validate input
      const validation = this.validateForm();
      if (!validation.valid) {
        // Show validation error (no ErrorCollector needed)
        this.showValidationError(validation.error);
        return;
      }

      // 2. Perform operation
      await this.performOperation();

      // 3. Show success
      new Notice("Operation successful!");
      this.close();
    } catch (error) {
      // Log error
      ErrorCollector.logError({
        type: "modal_error",
        modal: this.constructor.name,
        error: error as Error,
        context: { operation: "onSubmit" },
      });

      // Show user-friendly error
      new Notice(`Error: ${(error as Error).message}`);
      // Don't close modal - allow user to retry
    }
  }

  private showValidationError(message: string): void {
    // Highlight invalid field
    // Show inline error message
    // NO ErrorCollector - validation errors are expected
  }
}
```

**Modal error patterns:**
- **Validation errors**: Show inline, no logging (expected user behavior)
- **Operation errors**: Log and show notice, keep modal open for retry
- **Success**: Show notice and close modal

### Step 4: Build Script Error Handling

For build scripts (build-css.mjs, esbuild.config.mjs):

```javascript
// build-css.mjs
import { logBuildError } from "./scripts/learning/error-logger.mjs";

try {
  // Build CSS
  const result = await buildCSS();
  console.log("✓ CSS build successful");
} catch (error) {
  console.error("✗ CSS build failed:", error.message);

  // Log for learning system
  await logBuildError({
    type: "build_error",
    script: "build-css.mjs",
    error: error,
    context: { cwd: process.cwd() },
  });

  process.exit(1); // Fail build
}
```

**Build script patterns:**
- **Always log errors**: Use error-logger.mjs
- **Fail fast**: Exit with code 1 on error
- **Clear output**: Use console.log for success, console.error for errors

### Step 5: Repository Error Handling (CSV Operations)

For WorkoutLogRepository with retry logic:

```typescript
export class WorkoutLogRepository {
  /**
   * Add entry with retry logic
   */
  async addEntry(entry: WorkoutLog): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.performWrite(entry);
        return; // Success
      } catch (error) {
        lastError = error as Error;

        // Log each attempt
        ErrorCollector.logError({
          type: "repository_error",
          repository: this.constructor.name,
          method: "addEntry",
          error: error as Error,
          context: { attempt, maxRetries },
        });

        if (attempt < maxRetries) {
          // Wait before retry (exponential backoff)
          await this.delay(Math.pow(2, attempt) * 100);
        }
      }
    }

    // All retries failed
    throw new Error(
      `Failed to add entry after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

**Repository patterns:**
- **Retry logic**: For transient errors (file locks, etc.)
- **Exponential backoff**: Increase delay between retries
- **Log all attempts**: Track retry patterns for optimization
- **User notification**: Show Notice on final failure

## 6. Edge Cases

### File System Errors
- **ENOENT**: File doesn't exist
- **EACCES**: Permission denied
- **EBUSY**: File is locked by another process

**Handling:**
```typescript
try {
  await this.vault.adapter.read(path);
} catch (error) {
  if ((error as any).code === "ENOENT") {
    // File doesn't exist - create it
    await this.vault.adapter.write(path, defaultContent);
  } else if ((error as any).code === "EACCES") {
    throw new Error("Permission denied. Check file permissions.");
  } else if ((error as any).code === "EBUSY") {
    // Retry after delay
    await this.delay(500);
    return await this.vault.adapter.read(path);
  } else {
    throw error;
  }
}
```

### Network Errors (if using external APIs)
- **Timeout**: Request took too long
- **Connection refused**: Service unavailable
- **404**: Resource not found

**Handling:**
```typescript
try {
  const response = await fetch(url, { timeout: 5000 });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  if (error.name === "AbortError") {
    throw new Error("Request timed out");
  } else if (error.message.includes("Failed to fetch")) {
    throw new Error("Network error. Check internet connection.");
  } else {
    throw error;
  }
}
```

### Data Validation Errors
- **Invalid format**: Data doesn't match expected structure
- **Missing required fields**: Required properties are undefined
- **Type mismatch**: Wrong data type

**Handling:**
```typescript
function validateData(data: unknown): Data {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid data format");
  }

  const obj = data as any;

  if (!obj.requiredField) {
    throw new Error("Missing required field: requiredField");
  }

  if (typeof obj.requiredField !== "string") {
    throw new Error("Field 'requiredField' must be a string");
  }

  return obj as Data;
}
```

### Chart.js Errors
- **Canvas not found**: DOM element doesn't exist
- **Invalid data**: Data format not compatible with chart type
- **Memory leak**: Charts not destroyed properly

**Handling:**
```typescript
try {
  const canvas = container.querySelector("canvas");
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  // Destroy existing chart with same ID
  ChartRenderer.destroyChart(chartId);

  // Create new chart
  const chart = new Chart(canvas, config);

  // Store for cleanup
  ChartRenderer.registerChart(chartId, chart);
} catch (error) {
  ErrorCollector.logError({
    type: "chart_error",
    error: error as Error,
    context: { chartId, config },
  });

  throw new Error(`Failed to create chart: ${(error as Error).message}`);
}
```

### Async Errors in Event Handlers
```typescript
// ❌ Wrong - errors swallowed
button.addEventListener("click", async () => {
  await this.performAsync(); // If this throws, user won't see it
});

// ✅ Correct - errors handled
button.addEventListener("click", async () => {
  try {
    await this.performAsync();
  } catch (error) {
    ErrorCollector.logError({
      type: "event_handler_error",
      error: error as Error,
    });
    new Notice(`Error: ${(error as Error).message}`);
  }
});
```

## 7. Validation

### Manual Testing
1. Trigger each error scenario deliberately
2. Verify user sees appropriate error message
3. Check error appears in error-log.json
4. Verify user can recover (retry, close modal, etc.)

### Error Scenarios to Test
- [ ] File doesn't exist
- [ ] File is locked (open in another app)
- [ ] Invalid CSV format
- [ ] Network timeout (if applicable)
- [ ] Invalid user input (modal validation)
- [ ] Empty data set
- [ ] Chart rendering with invalid data
- [ ] Service method throws error
- [ ] Build script fails

### Automated Testing
```typescript
describe("Error handling", () => {
  it("should log errors to ErrorCollector", async () => {
    const logSpy = jest.spyOn(ErrorCollector, "logError");

    try {
      await service.methodThatThrows();
    } catch (error) {
      // Expected
    }

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "service_error",
        error: expect.any(Error),
      })
    );
  });

  it("should show user-friendly error message", async () => {
    const container = document.createElement("div");
    await view.render(container, "invalid: params", {});

    expect(container.textContent).toContain("An error occurred");
    expect(container.querySelector(".feedback-error")).toBeTruthy();
  });
});
```

### Success Criteria
- [ ] All errors show user-friendly messages
- [ ] All errors logged to ErrorCollector
- [ ] Critical errors block execution
- [ ] Non-critical errors allow continuation
- [ ] Users can retry failed operations
- [ ] Error log contains sufficient context
- [ ] Tests cover error scenarios

## 8. Common Mistakes

### ❌ Swallowing Errors
```typescript
// Wrong
try {
  await operation();
} catch (error) {
  // Silently ignores error - user has no idea what happened
}
```

```typescript
// Correct
try {
  await operation();
} catch (error) {
  ErrorCollector.logError({ type: "error", error: error as Error });
  new Notice(`Operation failed: ${(error as Error).message}`);
}
```

### ❌ Generic Error Messages
```typescript
// Wrong
throw new Error("Something went wrong");
```

```typescript
// Correct
throw new Error(`Failed to load exercise data: ${error.message}`);
```

### ❌ Not Logging Context
```typescript
// Wrong
ErrorCollector.logError({ type: "error", error });
```

```typescript
// Correct
ErrorCollector.logError({
  type: "error",
  error,
  context: { service: "DataService", method: "fetchData", params },
});
```

### ❌ Logging Validation Errors
```typescript
// Wrong - validation errors are expected user behavior
if (!isValid(input)) {
  ErrorCollector.logError({ type: "validation_error", ... });
}
```

```typescript
// Correct - only log unexpected errors
if (!isValid(input)) {
  this.showValidationMessage("Please enter a valid value");
  return; // No logging needed
}
```

### ❌ Blocking on Non-Critical Errors
```typescript
// Wrong - fails entire operation if enrichment fails
async render(container, source, ctx) {
  const data = await this.fetchData();
  const enrichedData = await this.enrichData(data); // If this fails, nothing renders
  this.renderContent(container, enrichedData);
}
```

```typescript
// Correct - gracefully degrade on non-critical errors
async render(container, source, ctx) {
  const data = await this.fetchData();

  try {
    const enrichedData = await this.enrichData(data);
    this.renderContent(container, enrichedData);
  } catch (error) {
    ErrorCollector.logError({ type: "enrichment_error", error });
    // Fallback: render without enrichment
    this.renderContent(container, data);
  }
}
```

## 9. Related Directives

- **[add-new-embedded-view.md](../development/add-new-embedded-view.md)** - View error handling
- **[add-new-service.md](../development/add-new-service.md)** - Service error handling
- **[csv-operations.md](../data/csv-operations.md)** - CSV error handling
- **[unit-testing.md](../testing/unit-testing.md)** - Testing error scenarios

## Error Types Reference

Standard error types for ErrorCollector:

| Type | When to Use | Example |
|------|-------------|---------|
| `view_error` | Error rendering embedded view | Chart fails to render |
| `service_error` | Error in service method | Data fetch fails |
| `modal_error` | Error in modal operation | Form submission fails |
| `repository_error` | Error in data repository | CSV write fails |
| `build_error` | Error in build script | CSS compilation fails |
| `validation_error` | **Don't use** - validation is expected behavior | - |
| `chart_error` | Chart.js specific errors | Canvas not found |
| `event_handler_error` | Error in async event handler | Button click handler fails |
| `cache_error` | Error in cache operations | Cache invalidation fails |

## Version History

- **v1.0** (2025-02-10): Initial directive created
- Document error patterns and improvements here as they're discovered
