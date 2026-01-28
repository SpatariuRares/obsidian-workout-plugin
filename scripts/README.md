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
