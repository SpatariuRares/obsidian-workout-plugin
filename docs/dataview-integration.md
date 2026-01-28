# Dataview Integration

The Workout Planner plugin exposes a global API (`window.WorkoutPlannerAPI`) that allows you to query your workout logs using Dataview.

## Prerequisites

1. [Dataview plugin](https://github.com/blacksmithgu/obsidian-dataview) installed and enabled
2. Workout Planner plugin installed and enabled
3. Some workout logs in your CSV file

## API Reference

### `getWorkoutLogs(filter?)`

Retrieves workout log entries with optional filtering.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter.exercise` | `string` | Filter by exercise name (partial match, case-insensitive) |
| `filter.workout` | `string` | Filter by workout/origin name (partial match, case-insensitive) |
| `filter.dateRange.start` | `string` | Start date in YYYY-MM-DD format |
| `filter.dateRange.end` | `string` | End date in YYYY-MM-DD format |
| `filter.protocol` | `string` | Filter by protocol (e.g., "drop_set", "myo_reps", "standard") |
| `filter.exactMatch` | `boolean` | Use exact matching instead of partial matching |

**Returns:** `Promise<DataviewWorkoutLog[]>`

Each log entry contains:
- `date`: ISO date string
- `exercise`: Exercise name
- `reps`: Number of reps
- `weight`: Weight used
- `volume`: Total volume (reps × weight)
- `workout`: Workout/origin name
- `notes`: Any notes for the entry
- `timestamp`: Unix timestamp
- `protocol`: Workout protocol used

## Example Queries

### Basic: Display All Workout Logs

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs();
  dv.table(
    ["Date", "Exercise", "Reps", "Weight", "Volume"],
    logs.map(log => [
      log.date.split("T")[0],
      log.exercise,
      log.reps,
      log.weight,
      log.volume
    ])
  );
} else {
  dv.paragraph("Workout Planner plugin not loaded");
}
```

### Filter by Exercise

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs({ exercise: "Squat" });
  dv.table(
    ["Date", "Reps", "Weight", "Volume"],
    logs.map(log => [
      log.date.split("T")[0],
      log.reps,
      log.weight,
      log.volume
    ])
  );
}
```

### Filter by Date Range (Last 30 Days)

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await api.getWorkoutLogs({
    dateRange: {
      start: thirtyDaysAgo.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0]
    }
  });

  dv.table(
    ["Date", "Exercise", "Reps", "Weight", "Volume"],
    logs.map(log => [
      log.date.split("T")[0],
      log.exercise,
      log.reps,
      log.weight,
      log.volume
    ])
  );
}
```

### Filter by Workout/Origin

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs({ workout: "Push Day" });
  dv.table(
    ["Date", "Exercise", "Reps", "Weight", "Volume"],
    logs.map(log => [
      log.date.split("T")[0],
      log.exercise,
      log.reps,
      log.weight,
      log.volume
    ])
  );
}
```

### Filter by Protocol (Drop Sets)

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs({ protocol: "drop_set" });
  dv.table(
    ["Date", "Exercise", "Reps", "Weight", "Notes"],
    logs.map(log => [
      log.date.split("T")[0],
      log.exercise,
      log.reps,
      log.weight,
      log.notes
    ])
  );
}
```

### Combined Filters

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const today = new Date();
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const logs = await api.getWorkoutLogs({
    exercise: "Bench Press",
    dateRange: {
      start: ninetyDaysAgo.toISOString().split("T")[0],
      end: today.toISOString().split("T")[0]
    }
  });

  dv.table(
    ["Date", "Reps", "Weight", "Volume"],
    logs.map(log => [
      log.date.split("T")[0],
      log.reps,
      log.weight,
      log.volume
    ])
  );
}
```

### Calculate Total Volume for an Exercise

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs({ exercise: "Squat" });
  const totalVolume = logs.reduce((sum, log) => sum + log.volume, 0);
  const totalSets = logs.length;
  const maxWeight = Math.max(...logs.map(log => log.weight));

  dv.paragraph(`**Squat Statistics**`);
  dv.paragraph(`Total Sets: ${totalSets}`);
  dv.paragraph(`Total Volume: ${totalVolume.toLocaleString()} kg`);
  dv.paragraph(`Max Weight: ${maxWeight} kg`);
}
```

### Weekly Volume Summary

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs();

  // Group by week
  const weeklyVolume = {};
  logs.forEach(log => {
    const date = new Date(log.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split("T")[0];

    if (!weeklyVolume[weekKey]) {
      weeklyVolume[weekKey] = 0;
    }
    weeklyVolume[weekKey] += log.volume;
  });

  // Sort by week and display
  const sortedWeeks = Object.entries(weeklyVolume)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 10);

  dv.table(
    ["Week Starting", "Total Volume"],
    sortedWeeks.map(([week, volume]) => [week, volume.toLocaleString()])
  );
}
```

### Personal Records per Exercise

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs();

  // Find max weight per exercise
  const prs = {};
  logs.forEach(log => {
    if (!prs[log.exercise] || log.weight > prs[log.exercise].weight) {
      prs[log.exercise] = {
        weight: log.weight,
        reps: log.reps,
        date: log.date.split("T")[0]
      };
    }
  });

  dv.table(
    ["Exercise", "Max Weight", "Reps", "Date"],
    Object.entries(prs)
      .sort((a, b) => b[1].weight - a[1].weight)
      .map(([exercise, pr]) => [exercise, pr.weight, pr.reps, pr.date])
  );
}
```

## Inline Queries

You can use inline Dataview queries with `dv.span()` to embed workout stats in your notes:

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const logs = await api.getWorkoutLogs({ exercise: "Deadlift" });
  const maxWeight = logs.length > 0 ? Math.max(...logs.map(l => l.weight)) : 0;
  dv.span(`Deadlift PR: **${maxWeight} kg**`);
}
```

## Available Protocols

The `protocol` filter supports these values:
- `standard` - Normal sets
- `drop_set` - Drop sets
- `myo_reps` - Myo-reps technique
- `rest_pause` - Rest-pause sets
- `superset` - Superset exercises
- `twentyone` - 21s technique

## Troubleshooting

### API not available

If `window.WorkoutPlannerAPI` is undefined:
1. Ensure the Workout Planner plugin is enabled
2. Reload Obsidian (Ctrl/Cmd + R)
3. Check the console for errors

### No data returned

If queries return empty arrays:
1. Verify your CSV log file path in plugin settings
2. Check that the CSV file exists and has data
3. Verify your filter parameters match existing data

### Performance considerations

For large datasets (1000+ entries):
- Use specific filters to reduce data volume
- Consider caching results in your Dataview queries
- Avoid running multiple unfiltered queries on the same page

---

## Exercise Stats API

### `getExerciseStats(exercise)`

Retrieves statistics for a specific exercise.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `exercise` | `string` | Exercise name (exact match) |

**Returns:** `Promise<ExerciseStats>`

The stats object contains:
- `totalVolume`: Total volume (sum of reps × weight)
- `maxWeight`: Maximum weight ever used
- `totalSets`: Total number of sets logged
- `trend`: Performance trend (`"up"`, `"down"`, or `"stable"`)
- `averageWeight`: Average weight per set
- `averageReps`: Average reps per set
- `lastWorkoutDate`: Date of most recent log (YYYY-MM-DD)
- `prWeight`: Personal record weight
- `prReps`: Reps achieved at PR weight
- `prDate`: Date when PR was achieved (YYYY-MM-DD)

### `getExercises(filter?)`

Retrieves list of available exercises.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter.tag` | `string` | Filter by frontmatter tag (optional) |

**Returns:** `Promise<string[]>`

## Exercise Stats Examples

### Display Stats for an Exercise

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const stats = await api.getExerciseStats("Squat");
  dv.paragraph(`**Squat Statistics**`);
  dv.paragraph(`Total Sets: ${stats.totalSets}`);
  dv.paragraph(`Total Volume: ${stats.totalVolume.toLocaleString()} kg`);
  dv.paragraph(`Max Weight (PR): ${stats.prWeight} kg`);
  dv.paragraph(`Average Weight: ${stats.averageWeight} kg`);
  dv.paragraph(`Trend: ${stats.trend}`);
  dv.paragraph(`Last Workout: ${stats.lastWorkoutDate || "Never"}`);
}
```

### Exercise Stats Dashboard

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const exercises = ["Squat", "Bench Press", "Deadlift"];
  const rows = [];

  for (const exercise of exercises) {
    const stats = await api.getExerciseStats(exercise);
    if (stats.totalSets > 0) {
      const trendIcon = stats.trend === "up" ? "📈" : stats.trend === "down" ? "📉" : "➡️";
      rows.push([
        exercise,
        stats.prWeight,
        stats.totalSets,
        stats.totalVolume.toLocaleString(),
        trendIcon + " " + stats.trend
      ]);
    }
  }

  dv.table(
    ["Exercise", "PR (kg)", "Total Sets", "Volume", "Trend"],
    rows
  );
}
```

### Compare Exercise Progress

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const exercises = await api.getExercises();

  // Get stats for all exercises and find ones with improvement
  const improving = [];
  for (const exercise of exercises.slice(0, 10)) { // Limit to first 10
    const stats = await api.getExerciseStats(exercise);
    if (stats.trend === "up" && stats.totalSets > 5) {
      improving.push({
        name: exercise,
        pr: stats.prWeight,
        trend: stats.trend
      });
    }
  }

  if (improving.length > 0) {
    dv.paragraph("**Exercises with Upward Trend:**");
    dv.list(improving.map(e => `${e.name}: PR ${e.pr} kg`));
  } else {
    dv.paragraph("No exercises showing improvement trend.");
  }
}
```

### List Exercises by Tag

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  // Get all compound exercises (requires exercises folder with tagged files)
  const compoundExercises = await api.getExercises({ tag: "compound" });

  dv.paragraph("**Compound Exercises:**");
  dv.list(compoundExercises);
}
```

### All Exercises with Recent Activity

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const exercises = await api.getExercises();
  const rows = [];

  for (const exercise of exercises) {
    const stats = await api.getExerciseStats(exercise);
    if (stats.lastWorkoutDate) {
      rows.push([exercise, stats.lastWorkoutDate, stats.totalSets]);
    }
  }

  // Sort by last workout date (most recent first)
  rows.sort((a, b) => b[1].localeCompare(a[1]));

  dv.table(
    ["Exercise", "Last Workout", "Total Sets"],
    rows.slice(0, 20) // Show top 20
  );
}
```

## Inline Queries with Stats

Use `dv.span()` to embed exercise stats directly in your notes:

### Single Stat Inline

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const stats = await api.getExerciseStats("Deadlift");
  dv.span(`Deadlift PR: **${stats.prWeight} kg** (${stats.prDate || "N/A"})`);
}
```

### Quick Stats Line

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const stats = await api.getExerciseStats("Bench Press");
  const trendEmoji = stats.trend === "up" ? "📈" : stats.trend === "down" ? "📉" : "➡️";
  dv.span(`Bench: ${stats.prWeight}kg PR | ${stats.totalSets} sets | ${trendEmoji}`);
}
```

### Trend Indicator

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const exercises = ["Squat", "Bench Press", "Deadlift"];
  const trends = [];

  for (const ex of exercises) {
    const stats = await api.getExerciseStats(ex);
    const icon = stats.trend === "up" ? "🟢" : stats.trend === "down" ? "🔴" : "🟡";
    trends.push(`${icon} ${ex}`);
  }

  dv.span(trends.join(" | "));
}
```

### Personal Records Summary

```dataviewjs
const api = window.WorkoutPlannerAPI;
if (api) {
  const bigThree = ["Squat", "Bench Press", "Deadlift"];
  let total = 0;

  for (const ex of bigThree) {
    const stats = await api.getExerciseStats(ex);
    total += stats.prWeight;
  }

  dv.span(`**Big Three Total: ${total} kg**`);
}
```
