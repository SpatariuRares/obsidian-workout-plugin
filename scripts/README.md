# Templater User Scripts

This folder contains user script functions for use with the [Templater](https://github.com/SilentVoid13/Templater) plugin in Obsidian.

## Setup

### 1. Install Templater

If you haven't already, install the Templater plugin from the Obsidian Community Plugins.

### 2. Configure user scripts folder

1. Open Obsidian Settings
2. Go to **Templater** settings (under Community Plugins)
3. Find **Script files folder location**
4. Set it to the folder where you want to store your user scripts (e.g., `scripts` or `Templates/scripts`)

### 3. Copy the script file

Copy `templater-functions.js` to your configured user scripts folder. You can either:

- Copy it directly to your vault's scripts folder
- Create a symbolic link to keep it in sync with plugin updates

## Available Functions

### workoutExerciseBlock(name, duration, workout)

Generates a formatted exercise block with an embedded workout-timer code block.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | The name of the exercise (e.g., "Bench Press") |
| `duration` | number | No | 60 | Timer duration in seconds for rest period |
| `workout` | string | No | - | The workout name for logging purposes |

#### Returns

A formatted markdown string containing:
- An H2 header with the exercise name
- A `workout-timer` code block with the specified duration and exercise details

#### Example Usage

In your Templater template:

```markdown
<% tp.user.workoutExerciseBlock("Bench Press", 90, "Push Day") %>
```

This generates:

```markdown
## Bench Press

```workout-timer
duration: 90
exercise: Bench Press
workout: Push Day
showControls: true
```
```

#### Building a Full Workout Template

You can use this function to create complete workout templates:

```markdown
# <% tp.date.now("YYYY-MM-DD") %> - Push Day

<% tp.user.workoutExerciseBlock("Bench Press", 90, "Push Day") %>

<% tp.user.workoutExerciseBlock("Overhead Press", 90, "Push Day") %>

<% tp.user.workoutExerciseBlock("Incline Dumbbell Press", 60, "Push Day") %>

<% tp.user.workoutExerciseBlock("Tricep Pushdowns", 60, "Push Day") %>
```

#### Interactive Prompts

Combine with Templater's prompt function for dynamic exercise selection:

```markdown
<%*
const exercise = await tp.system.prompt("Exercise name:");
const duration = await tp.system.prompt("Rest duration (seconds):", "90");
const workout = await tp.system.prompt("Workout name:", "Workout");
tR += tp.user.workoutExerciseBlock(exercise, parseInt(duration), workout);
%>
```

### workoutExercises(tp, filter)

Gets exercise names from the configured exercises folder. Optionally filters exercises by frontmatter tag.

**Important:** This function requires the Templater `tp` object to be passed as the first argument.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tp` | object | Yes | - | The Templater object (for Obsidian API access) |
| `filter` | object | No | - | Filter options |
| `filter.tag` | string | No | - | Filter exercises by frontmatter tag |

#### Returns

A Promise that resolves to an array of exercise names (file basenames without the .md extension), sorted alphabetically.

#### Example Usage

**Get all exercises:**

```markdown
<% tp.user.workoutExercises(tp) %>
```

**Filter exercises by tag:**

```markdown
<% tp.user.workoutExercises(tp, {tag: "glutes"}) %>
```

**List exercises as bullets:**

```markdown
<%*
const exercises = await tp.user.workoutExercises(tp);
for (const exercise of exercises) {
  tR += `- [[${exercise}]]\n`;
}
%>
```

**Filter and display chest exercises:**

```markdown
# Chest Exercises

<%*
const chestExercises = await tp.user.workoutExercises(tp, {tag: "chest"});
for (const exercise of chestExercises) {
  tR += `- [[${exercise}]]\n`;
}
%>
```

**Build a workout from filtered exercises:**

```markdown
# <% tp.date.now("YYYY-MM-DD") %> - Glute Day

<%*
const gluteExercises = await tp.user.workoutExercises(tp, {tag: "glutes"});
for (const exercise of gluteExercises) {
  tR += tp.user.workoutExerciseBlock(exercise, 90, "Glute Day") + "\n\n";
}
%>
```

**Interactive exercise selection from filtered list:**

```markdown
<%*
const exercises = await tp.user.workoutExercises(tp, {tag: "compound"});
const selected = await tp.system.suggester(exercises, exercises, false, "Select exercise:");
if (selected) {
  tR += tp.user.workoutExerciseBlock(selected, 90, "Workout");
}
%>
```

#### Exercise File Frontmatter

For tag filtering to work, your exercise files should have tags in their frontmatter:

```yaml
---
tags:
  - glutes
  - compound
  - lower-body
---
```

Or using inline array format:

```yaml
---
tags: [glutes, compound, lower-body]
---
```

## Troubleshooting

### Function not found

If you get an error that the function is not found:

1. Verify the script file is in the correct folder
2. Check that the folder path in Templater settings is correct
3. Restart Obsidian after changing the scripts folder location
4. Ensure the file has a `.js` extension

### Script not updating

If changes to the script aren't reflected:

1. Restart Obsidian to reload user scripts
2. Check that you're editing the file in the correct location

## Notes

- These scripts are plain JavaScript and run in Obsidian's context
- The functions are accessed via `tp.user.functionName()` in templates
- See [Templater documentation](https://silentvoid13.github.io/Templater/user-functions/script-user-functions.html) for more details on user scripts

---

# DOE Framework - E Layer (Execution)

This directory also contains deterministic scripts for the **DOE Framework's Execution Layer**. These scripts perform complex, repeatable operations for development and maintenance.

## DOE Framework Overview

- **D (Directive)**: `directives/` - What needs to be done (SOPs)
- **O (Orchestration)**: Claude Code - Reads directives, coordinates execution
- **E (Execution)**: `scripts/` - Performs deterministic operations (you are here)

## DOE Scripts Directory Structure

```
scripts/
├── automation/          # Code generation and automation
│   └── generate-component.mjs    # Generate atomic component boilerplate
├── validation/          # Code quality validation
│   └── check-imports.mjs         # Validate import paths
├── learning/            # DOE learning system
│   ├── error-logger.mjs          # Log errors for pattern analysis
│   ├── error-analyzer.mjs        # Analyze error patterns
│   └── error-log.json            # Error database
└── data/                # Data operations (future)
```

## Available DOE Scripts

### Automation

#### Generate Component
```bash
npm run doe:generate-component -- --name=MyComponent --type=atom
```
Generates component file, test file, and updates barrel exports.

### Validation

#### Check Imports
```bash
npm run doe:validate
```
Validates import paths follow project conventions (@app/* aliases, no bad barrel imports).

### Learning System

#### Initialize Error Log
```bash
npm run doe:init-errors
```

#### Analyze Errors
```bash
npm run doe:analyze-errors
```
Analyzes error patterns and generates recommendations for directive updates.

#### Error Statistics
```bash
npm run doe:error-stats
```

#### Prune Old Errors
```bash
npm run doe:prune-errors
```
Removes resolved errors older than 30 days.

## How DOE Scripts Work

1. **Directives reference scripts** - SOPs specify which scripts to run
2. **Claude Code executes scripts** - Orchestrator follows directives
3. **Scripts log errors** - Errors feed into learning system
4. **Analysis improves directives** - Error patterns update SOPs
5. **System becomes more reliable** - Repeated errors prevented

## See Also

- `directives/README.md` - Directive system overview
- `CLAUDE.md` - DOE Framework documentation
- `app/orchestration/` - Orchestration layer code
