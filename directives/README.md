# Directives System Overview

## What are Directives?

Directives are **Standard Operating Procedures (SOPs)** that define the **D (Directive) layer** of the DOE Framework. They are structured documentation files that tell Claude Code and developers **what** needs to be done without prescribing implementation details.

## Purpose

Directives serve as:

1. **Knowledge Repository**: Capture tribal knowledge and best practices
2. **Consistency Engine**: Ensure tasks are performed the same way every time
3. **Training Material**: Help new developers understand project conventions
4. **Learning Foundation**: Provide basis for self-improvement through error analysis

## Directory Structure

```
directives/
├── README.md (this file)
├── development/        # SOPs for adding new features/components
├── maintenance/        # SOPs for refactoring, updates, error handling
├── data/              # SOPs for data operations (CSV, migrations, backups)
└── testing/           # SOPs for testing strategies
```

## Directive Format

Each directive follows a standardized structure:

### 1. Objective
Clear statement of what needs to be accomplished.

### 2. Prerequisites
Required knowledge, tools, or setup before starting.

### 3. Input Requirements
Information needed to complete the task (parameters, context, decisions).

### 4. Execution Scripts
Which E-layer scripts to use (references to `scripts/` directory).

### 5. Step-by-Step Procedure
Detailed instructions with code examples and decision points.

### 6. Edge Cases
Known issues, special scenarios, and how to handle them.

### 7. Validation
How to verify the task was completed successfully.

### 8. Common Mistakes
Anti-patterns and things to avoid.

### 9. Related Directives
Links to related SOPs for context.

## How to Use Directives

### For Claude Code (Orchestrator)

1. **Read the directive** for the task at hand
2. **Extract requirements** from the Input Requirements section
3. **Execute E-layer scripts** as specified in Execution Scripts section
4. **Follow procedures** step-by-step without improvising
5. **Validate results** using the Validation section
6. **Log errors** if any step fails (for learning system)

### For Developers

1. **Consult directives** before starting unfamiliar tasks
2. **Follow procedures** to maintain consistency
3. **Update directives** when discovering better approaches
4. **Create new directives** when establishing new patterns

## Available Directives

### Development

- **[add-new-feature.md](development/add-new-feature.md)** - Adding new features to the plugin
- **[add-new-embedded-view.md](development/add-new-embedded-view.md)** - Creating code block processors (workout-chart, etc.)
- **[add-new-modal.md](development/add-new-modal.md)** - Creating modal dialogs for user input
- **[add-new-component.md](development/add-new-component.md)** - Creating atomic design components
- **[add-new-service.md](development/add-new-service.md)** - Creating service classes
- **[add-new-dashboard-widget.md](development/add-new-dashboard-widget.md)** - Creating dashboard widgets

### Maintenance

- **[refactoring.md](maintenance/refactoring.md)** - Safe refactoring procedures
- **[dependency-update.md](maintenance/dependency-update.md)** - Updating dependencies
- **[error-handling.md](maintenance/error-handling.md)** - Implementing error handling patterns
- **[cache-management.md](maintenance/cache-management.md)** - Managing cache invalidation

### Data

- **[csv-operations.md](data/csv-operations.md)** - Working with CSV workout logs
- **[data-migration.md](data/data-migration.md)** - Migrating data structures
- **[backup-restore.md](data/backup-restore.md)** - Backing up and restoring data

### Testing

- **[unit-testing.md](testing/unit-testing.md)** - Writing unit tests
- **[integration-testing.md](testing/integration-testing.md)** - Writing integration tests
- **[test-coverage.md](testing/test-coverage.md)** - Maintaining test coverage

## Writing New Directives

When creating a new directive:

1. **Use the standard format** (9 sections as described above)
2. **Be specific**: Include code examples and concrete steps
3. **Reference E-layer scripts**: Link to automation scripts where applicable
4. **Document edge cases**: Include all known special scenarios
5. **Link related directives**: Help users discover related procedures
6. **Test the directive**: Follow it yourself to ensure it works

## DOE Framework Integration

Directives are the **D (Directive)** layer in the DOE Framework:

- **D (Directive)**: You are here → Standard Operating Procedures
- **O (Orchestration)**: Claude Code reads directives and coordinates execution
- **E (Execution)**: Scripts in `scripts/` directory perform deterministic operations

Together, these layers create a **self-improving system** where:

1. Errors are logged by the O layer
2. Error patterns are analyzed by E-layer scripts
3. Directives are updated to prevent future errors
4. The system becomes more reliable over time

## Learning Mechanism

When errors occur:

1. **ErrorCollector** (O layer) logs the error with context
2. **error-analyzer.mjs** (E layer) analyzes error patterns
3. **directive-updater.mjs** (E layer) suggests improvements
4. Directives are updated with new edge cases or procedures
5. Future occurrences of the same error are prevented

This creates a feedback loop that moves the system from **probabilistic** (AI guessing) to **deterministic** (following proven procedures).

## Maintenance

Directives should be reviewed and updated:

- **Weekly**: Check for new error patterns in error-log.json
- **Monthly**: Review directives for accuracy and completeness
- **Per feature**: Update directives when implementing new features
- **Per error**: Add edge cases when new error types are discovered

## Examples

### Example: Adding a New Component

1. Read `directives/development/add-new-component.md`
2. Run `npm run doe:generate-component` (E-layer script)
3. Follow step-by-step procedure in directive
4. Run validation script: `npm run doe:validate`
5. If error occurs, it's logged for future directive improvements

### Example: CSV Operation Error

1. Error occurs in CSV parsing
2. ErrorCollector logs error with context
3. Run `npm run doe:analyze-errors`
4. Error analysis suggests updating `directives/data/csv-operations.md`
5. Update directive with new edge case
6. Next time, directive prevents the error

## Questions?

For questions about the directives system:

- Check `CLAUDE.md` for DOE Framework overview
- Review existing directives for examples
- Check `scripts/README.md` for E-layer script documentation
- Examine `app/orchestration/` for O-layer implementation
