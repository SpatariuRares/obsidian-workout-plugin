# Refactor Large View File

## Objective
Split a bloated view file (>400 lines) into modular, single-responsibility components following the codebase's layered architecture pattern.

## Inputs
- Target view file path (e.g., `app/views/EmbeddedTableView.ts`)
- Ideal view size: 200-300 lines (orchestration only)

## Steps

### 1. Analyze Current Structure
- Count total lines and identify distinct responsibilities
- List all private methods and categorize them:
  - **Business logic**: calculations, validations, data transformations
  - **UI rendering**: DOM creation, element styling, event binding
  - **External interactions**: editor manipulation, file navigation, API calls

### 2. Identify Extraction Targets
For each responsibility category:
- **Business logic** → `app/features/{feature}/business/`
- **UI components** → `app/features/{feature}/ui/`
- **Cross-cutting services** → `app/services/`

### 3. Design New Components
For each extracted component, define:
- File path following existing patterns
- Props interface (inputs)
- Result interface (outputs, if returning elements for event binding)
- Static methods (following codebase convention)

### 4. Implementation Order
1. Create business logic classes first (no UI dependencies)
2. Create UI components (may depend on business logic)
3. Create services for cross-cutting concerns
4. Update barrel exports (`index.ts` files)
5. Refactor original view to use new components
6. Remove extracted code from original file

### 5. Verify
- `npm run build` - no TypeScript errors
- `npm test` - existing tests pass
- Manual testing of all affected functionality

## Tools Required
- Grep/Glob for finding similar patterns in codebase
- Read for analyzing existing components
- Write/Edit for creating new files

## Expected Output
- View file reduced to 200-300 lines
- 3-6 new component files in appropriate directories
- Updated barrel exports
- All functionality preserved

## Pattern Reference

### Business Layer Pattern
```typescript
export class ComponentName {
  static methodName(input: Type): ReturnType {
    // Pure logic, no DOM
  }
}
```

### UI Layer Pattern
```typescript
export interface ComponentNameProps {
  // Required inputs
}

export interface ComponentNameResult {
  container: HTMLElement;
  // Interactive elements for event binding
}

export class ComponentName {
  static render(parent: HTMLElement, props: Props, signal?: AbortSignal): Result {
    // DOM creation, uses atoms/molecules
  }
}
```

### Service Layer Pattern
```typescript
export class ServiceName {
  static async methodName(app: App, ...params): Promise<Result> {
    // External interactions (editor, vault, API)
  }
}
```

## Example: EmbeddedTableView Refactoring

### Before (669 lines)
Mixed concerns in single file:
- `renderTargetHeader()` - UI
- `renderProgressBar()` - UI
- `renderAchievementBadge()` - UI
- `renderWeightSuggestion()` - UI
- `renderGotoExerciseButton()` - UI
- `calculateBestRepsAtWeight()` - Business
- `checkTargetAchieved()` - Business
- `updateTargetWeight()` - Service
- `navigateToExercise()` - Service

### After (~250 lines)
```
app/features/tables/
├── business/
│   └── TargetCalculator.ts      # Business logic
├── ui/
│   ├── TargetHeader.ts          # Target + progress bar
│   ├── AchievementBadge.ts      # Badge + weight suggestion
│   └── GoToExerciseButton.ts    # Navigation button

app/services/
└── CodeBlockEditorService.ts    # Editor manipulation

app/views/
└── EmbeddedTableView.ts         # Orchestration only
```

View becomes pure orchestrator:
```typescript
private renderTableContentOptimized() {
  // Delegate to extracted components
  GoToExerciseButton.render(container, props, signal);
  TargetHeader.render(container, props);
  AchievementBadge.render(container, props, callbacks);
  TableRenderer.renderTable(...);
}
```
