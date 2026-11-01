# Workout Planner - Plugin Context Document

> **Plugin**: Workout Planner v1.1.4
> **Author**: Rares Spatariu
> **License**: MIT
> **Min Obsidian**: 0.15.0
> **Desktop Only**: No (full mobile support)
> **Dependency**: Chart.js 4.4.0

## Target User & Primary Use Case

**90% of usage happens on mobile, in the gym, mid-workout.**

### The Real Flow (What Actually Happens)

The user has pre-built workout files (e.g. "Giorno 1 LOWER BODY A 3.0.md") containing their exercises already laid out with `workout-log` tables and `workout-timer` blocks inline. During a gym session:

1. User opens their **workout file** for today's session on their phone
2. Scrolls to the current exercise - sees the `workout-log` table with past performance
3. Taps **"Add Log"** button directly on the table to log the set just completed
4. Starts the **`workout-timer`** (embedded right next to the exercise) for rest period
5. While resting, glances at past data in the table (weight, reps, volume trends)
6. Timer finishes with audio notification - time for the next set
7. Repeats until workout is done

**The user does NOT open a separate modal from a ribbon icon. They stay in their workout note the entire time.** The note IS the workout - it has the exercises, the tables, and the timers all in one place. The flow is: scroll, log, timer, rest, repeat.

### Post-Workout (Desktop or Mobile, Less Frequent)

- Review performance in **workout-dashboard** (stats, heatmap, trends)
- Check progression charts for specific exercises
- Compare protocols (drop sets vs standard, etc.)
- Plan next session based on volume analytics

---

## What This Plugin Does

Workout Planner turns Obsidian into a gym tracking system. It reads/writes workout data from a CSV file and renders it through 5 embedded code block types, plus modals for data entry and a public API for Dataview integration.

---

## The 5 Code Blocks

**Code block parameters**: the `key: value` lines inside a block. Each block type has one **schema** (`app/features/<feature>/<name>Block.ts`, built with `CodeBlockSchema`) listing its parameters with type, default and allowed values. Rendering, the insert/edit modals and validation all read that schema. Editing a block **patches** it: only the lines of parameters the user changed are rewritten, so comments, order and parameters the form doesn't show are kept as typed.

### 1. `workout-log` - The Main Interaction Point

This is what the user interacts with most. It's a table embedded in the workout note showing past sets for a specific exercise, with an "Add Log" button to record new data.

```yaml
exercise: Bench Press
limit: 10
exactMatch: true
dateRange: 30
workout: Upper Body A
protocol: drop_set
columns: date,exercise,reps,weight,volume,notes
```

Features: protocol badges (color-coded), progressive overload suggestions, target weight/reps tracking with achievement badges, action buttons (Edit, Delete, Go to Exercise). Mobile layout with abbreviated headers (Rep, Wgt, Vol) and compact spacing.

**Mobile experience**: abbreviated column headers, compact layout, touch-friendly action buttons, "Add Log" button always visible.

### 2. `workout-timer` - Rest Period Between Sets

Embedded directly in the workout note next to each exercise. User taps play, rests, gets notified when done.

```yaml
preset: rest # use a saved preset
# or manual:
duration: 90
type: countdown # countdown | interval
rounds: 3 # for interval type
autoStart: true
sound: true
showControls: true
```

Timer types: Countdown (single), Interval (rounds of work then rest, the last rest included; `work`/`rest`, or `duration` as the work), Stopwatch. Presets are saved in settings and reusable across notes; Tabata (20/10 × 8) and EMOM (60 × 10) are built in and added to the saved presets once, on install or on the first update that has them, so users see and edit them like their own; a deleted one stays deleted from the list but blocks that name it keep working. Distinct sounds for work start, rest start and completion.

### 3. `workout-chart` - Exercise Progression Charts

```yaml
exercise: Squat
type: volume # volume | weight | reps | duration | distance | pace | heartRate
dateRange: 30
showTrendLine: true
showTrend: true # header with % variation
showStats: true # avg/max/min box
chartType: exercise # exercise | workout | combined | all
height: 300px
limit: 50
exactMatch: false
```

**7 data types**: Volume (reps x weight), Weight, Reps, Duration, Distance, Pace (inverted - lower = better), Heart Rate.

Features: linear regression trend lines, trend headers with % change, statistics box, mobile fallback table when Chart.js can't render.

### 4. `workout-dashboard` - Analytics Hub

```yaml
title: My Dashboard
dateRange: 30
showSummary: true
showQuickStats: true
showVolumeAnalytics: true
showRecentWorkouts: true
showQuickActions: true
recentWorkoutsLimit: 5
volumeTrendDays: 30
```

**11 widgets**: Summary (total workouts, streak, volume, PRs), Quick Stats (week/month/year), Recent Workouts, Volume Analytics (daily trend chart + top exercises), Muscle Heat Map (SVG body front/back with color-coded activation), Protocol Distribution (pie chart), Protocol Effectiveness (volume change per protocol), Duration Comparison (actual vs estimated), Quick Actions (log button), Muscle Tags, File Errors.

### 5. `workout-duration` - Session Time Estimator

Estimates total workout duration based on exercises, sets, and configurable set duration (default 45s).

---

## Data Model

### CSV File (Single Source of Truth)

Standard columns:

```
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
```

Custom columns added dynamically per exercise type (duration, distance, heartRate, pace, etc.). Stored in `customFields`.

**Workout log file** (`WorkoutLogFile`): the module that owns this CSV. It is the only place that knows the header, the column order, the row ⇄ entry conversion (both directions, including the entered weight unit) and volume. Everything else reads entries from it or asks it to add/update/delete/rename.

**Column order rule**: standard columns in fixed order, then custom columns in the order the existing header has them, new custom columns appended, `weightUnit` always last. A column already in the header is never dropped, even when every row leaves it empty.

### Exercise Types

| Type     | Primary Fields | Optional Fields     |
| -------- | -------------- | ------------------- |
| Strength | reps, weight   | -                   |
| Timed    | duration       | -                   |
| Distance | distance       | duration            |
| Cardio   | duration       | distance, heartRate |
| Custom   | user-defined   | user-defined        |

### Workout Protocols (Built-in)

| Protocol   | Abbreviation |
| ---------- | ------------ |
| Standard   | (no badge)   |
| Warm-up    | WU           |
| Drop Set   | DS           |
| Myo-Reps   | MYO          |
| Rest-Pause | RP           |
| Superset   | SS           |
| 21s        | 21           |

Every protocol except Standard is an entry of the protocol list in the settings, with name, abbreviation (max 3 chars) and color. The built-in ones are added to that list once, on install or on the first update that has them, so users see how protocols work and can edit or delete them like their own. A protocol's id keeps its meaning whatever its entry says (warm-up and drop sets never count as PRs), and a deleted built-in keeps its name on sets already logged.

### Exercise Pages

**Exercise page**:
A note in the exercise folder (or any of its subfolders) that describes one exercise: its type, fields and muscle tags.
_Avoid_: exercise file, exercise note

**Exercise name**:
What a set's `exercise` column says. It finds the exercise page whose file name, `exercise_name` or `nome_esercizio` is the same, ignoring case and spacing. Names are never matched partially: an exercise whose name matches no page simply has no page. When two pages answer to the same name, a page whose file name matches wins over one whose frontmatter does; otherwise the first by path. With no exercise folder set there are no exercise pages.
_Avoid_: exercise id

**Field**:
One value a set records: reps, weight, duration, distance, heart rate, or a parameter the exercise page declares. The exercise's type decides which fields it has and their unit (a `duration` is seconds for a timed exercise, minutes for cardio and distance). Reps, heart rate and durations in seconds are whole numbers; any filled-in field must respect its minimum and maximum.
_Avoid_: parameter (for the value itself), column

### Exercise page frontmatter

```yaml
nome_esercizio: Exercise Name
tags:
  - glutes
  - quadriceps
exerciseType: strength
```

Tags map to canonical muscle groups via the MuscleTagService (supports Italian/English and custom mappings). It is the one place that turns tags into muscles: the heat map, canvas export and the file errors widget all ask it. A tag that names a muscle group directly (`upper_chest`, "Upper chest") always counts. An exercise with no muscle tags trains nothing; muscles are never guessed from the exercise name.

---

## Training History

How logged sets are read back as training. Every view (dashboard, charts, tables, public API, duration) uses these meanings.

**Set**:
One row of the workout log: one exercise performed once, with its reps/weight or other fields and the moment it was logged.
_Avoid_: entry, log (for a single row)

**Training day**:
The calendar day, in the device's local time, on which a set was logged.
_Avoid_: date (ambiguous with the stored UTC timestamp)

**Session**:
All sets with the same training day and the same workout name (case, spaces and stray quotes ignored). Sets with no workout name on a training day form one unnamed session of their own, distinct from any named workout.
_Avoid_: workout (that is the name/note), day

**Session duration**:
Time from a session's first set to its last. Only plausible when the session has at least two sets and lasts between 5 minutes and 5 hours.
_Avoid_: workout time

**Personal record (PR)**:
An exercise's heaviest eligible weight ever lifted. Warm-up (`warmup`) and drop sets (`drop_set`) are excluded from PRs and new-record counts; other built-in and custom protocols remain eligible. Warm-up and drop sets still contribute to volume and trends. The first eligible weighted set establishes the PR without counting as a new record. A set "sets a new PR" when it is strictly heavier than every earlier set of that exercise. Exercise names are compared ignoring case and spacing. Of several sets at the PR weight, the one with most reps (then the earliest) is the PR. Exercises logged without weight have no PR.
_Avoid_: best, max (as separate concepts)

**Trend**:
The direction of a series of training-day values (for weight: the heaviest set of each training day), read from its linear regression line: up, down or stable (within 5% of the mean). For pace, lower is better.
_Avoid_: progress, variation (for the direction itself)

**Streak**:
Consecutive calendar weeks (Monday to Sunday) with at least one session. The current week only breaks the streak once it has ended without a session.

---

## Data Flow

```
User taps "Add Log" on workout-log table
  -> CreateLogModal opens (pre-filled with exercise name)
    -> User enters reps/weight, taps save
      -> WorkoutLogFile rewrites the CSV, clears its 5s cache
        -> log:added event
          -> Table re-renders with new entry
```

**WorkoutLogFile**: All workout log reads and writes. 5-second cache. Clears on writes.

**DataFilter**: Exercise matching on the exercise field - exact or fuzzy (score-based), plus `dateRange`.

---

## Mobile-Specific Design

### What Works on Mobile

Everything. `isDesktopOnly: false`. No Node.js/Electron APIs. No regex lookbehind.

### Mobile-Optimized Features

- **Ribbon icon** (dumbbell) as secondary access point
- **CreateLogModal**: large tap targets, +/- weight buttons with configurable increment (default 2.5kg), recent exercises as quick-select chips
- **Tables**: abbreviated column headers (Rep, Wgt, Vol), compact layout, touch-friendly action buttons, "Add Log" button always prominent
- **MobileTable**: fallback component for charts that can't render on mobile
- **Timer**: large display, minimal controls, audio notification

### Settings That Affect Mobile

- `showRibbonIcon`: toggle the quick-access dumbbell
- `quickWeightIncrement`: step size for +/- buttons (default 2.5)
- `defaultExactMatch`: controls whether exercise search is exact or fuzzy

---

## Settings Overview

| Category                 | Key Settings                                          |
| ------------------------ | ----------------------------------------------------- |
| **General**              | CSV file path, exercise folder path, exact match mode |
| **Timer**                | Presets (create/save/delete), default preset          |
| **Protocols**            | Custom protocol definitions (name, abbrev, color)     |
| **Templates**            | Exercise block template with placeholders             |
| **Progressive Overload** | Weight increment for suggestions (default 2.5kg)      |
| **Duration**             | Default set duration (45s) for estimation             |
| **Mobile**               | Ribbon icon toggle, quick weight increment            |
| **Muscle Tags**          | Custom tag CSV, import/export                         |

---

## Commands (17 Total)

| Command                     | What It Does                                 |
| --------------------------- | -------------------------------------------- |
| Create workout log          | Opens CreateLogModal                         |
| Create CSV log file         | Creates the CSV file if missing              |
| Insert workout chart        | Opens InsertChartModal                       |
| Insert workout table        | Opens InsertTableModal                       |
| Insert workout timer        | Opens InsertTimerModal                       |
| Insert workout dashboard    | Opens InsertDashboardModal                   |
| Insert workout duration     | Opens InsertDurationModal                    |
| Create exercise page        | Creates a new exercise file                  |
| Create exercise section     | Adds exercise section to current note        |
| Audit exercise names        | Finds mismatches between files and CSV       |
| Add exercise block          | Inserts templated exercise block             |
| Export workout to canvas    | Exports workout structure to Obsidian Canvas |
| Migrate exercise types      | Converts between exercise type formats       |
| Convert exercise data       | Converts exercise data formats               |
| Manage muscle tags          | Opens MuscleTagManagerModal                  |
| Generate tag reference note | Creates a reference note for all tags        |
| Import from Strong or Hevy  | Imports a Strong/Hevy CSV export (preview)   |

---

## Public API

Exposed as `window.WorkoutPlannerAPI` for Dataview integration.

```javascript
// Get all logs, optionally filtered
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",
  dateRange: 30,
  protocol: "drop_set",
  exactMatch: true,
});

// Get stats for an exercise (PR, volume, trend)
const stats = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
// -> { totalVolume, maxWeight, totalSets, trend, averages, prWeight, prReps }

// List all exercises, optionally by tag
const exercises = await WorkoutPlannerAPI.getExercises({
  tag: "glutes",
});
```

---

## Architecture Summary

```
main.ts (WorkoutChartsPlugin)
├── CommandHandlerService      # 16 commands
├── CodeBlockProcessorService  # 5 code block types
├── WorkoutLogFile             # Workout log CSV read/write + 5s cache
├── ExerciseDefinitionService  # Exercise types & parameters
└── MuscleTagService           # Custom tag mappings

Views (extend BaseView):
├── EmbeddedChartView          # Chart.js visualizations
├── EmbeddedTableView          # Sortable data tables
├── EmbeddedTimerView          # Countdown/interval timers
├── EmbeddedDashboardView      # 11-widget analytics hub
└── EmbeddedDurationView       # Duration estimator

Modals (extend ModalBase / BaseInsertModal):
├── CreateLogModal             # Quick workout logging (mobile-first)
├── EditLogModal               # Edit existing entries
├── Insert*Modal               # Configure code blocks before inserting
├── CreateExercisePageModal    # New exercise files
├── AuditExerciseNamesModal    # Name mismatch detection
├── MuscleTagManagerModal      # Tag management
├── CanvasExportModal          # Canvas export
└── ConvertExerciseDataModal   # Data conversion

Components (Atomic Design):
├── atoms/     # Button, Input, Text, Icon, Container, Canvas, ErrorMessage
├── molecules/ # StatCard, FormField, SearchBox, Badge, TrendIndicator
└── organism/  # LogCallouts, complex compositions
```

---

## Muscle Groups (Canonical)

Used for heatmap and tag mapping:

**Front**: Chest, Anterior Deltoid, Lateral Deltoid, Biceps, Forearms, Quadriceps, Abs, Obliques

**Back**: Traps, Posterior Deltoid, Lats, Triceps, Lower Back, Glutes, Hamstrings, Calves

Custom tags (any language) map to these canonical groups via `MuscleTagService` and a CSV file.

---

## Key Design Decisions

1. **CSV over database**: Simple, portable, human-readable. One file = entire history.
2. **5-second cache**: Balances freshness with performance. Clears on writes.
3. **Workout notes as the UI**: The user's workout file IS the interface. Tables and timers are embedded inline next to each exercise - no separate app screen needed.
4. **Multi-strategy matching**: Fuzzy search because exercise names vary (abbreviations, typos, translations).
5. **Preset system for timers**: Gym users want "tap and go", not configure every time.
6. **Protocol tracking**: Advanced lifters use varied techniques; tracking enables effectiveness analysis.
7. **SVG heatmap**: Visual muscle activation - motivating and informative at a glance.
8. **No Node.js APIs**: Full mobile compatibility is non-negotiable for a gym-use plugin.
9. **Atomic components**: Consistent UI, easy to extend, testable in isolation.
10. **Public API**: Dataview integration means power users can build custom dashboards.
11. **Italian/English support**: Tag system and UI accommodate bilingual exercise naming.

---

## Typical Workout Note Structure

A workout note looks something like this - the user scrolls through it during a session:

````markdown
# Lower Body A

## Squat

```workout-log
exercise: Squat
limit: 5
```

```workout-timer
preset: rest
```

## Leg Press

```workout-log
exercise: Leg Press
limit: 5
```

```workout-timer
preset: rest
```

## Hip Thrust

```workout-log
exercise: Hip Thrust
limit: 5
```

```workout-timer
preset: rest
```
````

Each exercise has its table (showing recent sets) and its timer (for rest). The user scrolls down as they move through the workout. This is the primary interface.
