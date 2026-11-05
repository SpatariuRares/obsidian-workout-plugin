# Workout Planner - Plugin Context Document

> **Plugin**: Workout Planner (`workout-planner`), version in `manifest.json` (3.3.0 at the time of writing)
> **Author**: Rares Spatariu
> **License**: MIT
> **Min Obsidian**: 1.6.6
> **Desktop Only**: No (full mobile support)
> **Dependency**: Chart.js 4

This file is the domain language: what the plugin does and what its words mean. How the code is organized is in `CLAUDE.md` (rules, deep modules, patterns) and `docs/ARCHITECTURE.md` (overview); the visual rules are in `DESIGN.md`.

## Target User & Primary Use Case

**90% of usage happens on mobile, in the gym, mid-workout.**

### The Real Flow (What Actually Happens)

The user has one **workout note** per training day (e.g. "Lower Body A"). It is the plan: a level-2 section per exercise, each with a `workout-sets` block (planned sets, targets, rest), and usually a `workout-session` block near the top. During a session:

1. User opens today's workout note on their phone
2. The `workout-session` card shows the current exercise, its target and "last time"; or the user simply scrolls to the exercise
3. In the exercise's `workout-sets` block, each set is a row to fill in, with last time's values as hints
4. Ticking a row logs the set at once (an empty field logs its hint, so "same as last time" is one tap)
5. The rest timer at the top of the block starts by itself; the session card shows the same countdown
6. Timer finishes with sound (and vibration, if set) - next set
7. Repeats until the plan is done; the session moves to the next exercise as its sets are logged

**The user does NOT open a separate modal from a ribbon icon. They stay in their workout note the entire time.** The note IS the workout. The older layout (a `workout-log` table with its Add log button plus a `workout-timer` per exercise) still works and is still read by the session, but new notes, the examples and "Add exercise block" use `workout-sets`.

### Post-Workout (Desktop or Mobile, Less Frequent)

- Review performance in **workout-dashboard** (stats, heatmap, trends, training calendar)
- Check progression charts for specific exercises (volume, heaviest set, estimated 1RM, ...)
- Compare protocols (drop sets vs standard, etc.)
- Compare session durations with the estimate

---

## What This Plugin Does

Workout Planner turns Obsidian into a gym tracking system. It reads/writes workout data from one CSV file and renders it through 7 embedded code block types, plus modals for data entry and editing, an onboarding (example notes and a getting-started guide opened on a fresh install, what's new after each update), an importer for Strong/Hevy exports and a public API for Dataview integration.

---

## The Code Blocks

**Code block parameters**: the `key: value` lines inside a block. Each block type has one **schema** (`app/features/<feature>/<name>Block.ts`, built with `CodeBlockSchema`) listing its parameters with type, default and allowed values. Rendering, the insert/edit modals and validation all read that schema. Editing a block **patches** it: only the lines of parameters the user changed are rewritten, so comments, order and parameters the form doesn't show are kept as typed. Blocks written by the plugin carry an `id`, used to find them when edited; a block without one is found by its body and gets an `id` when saved.

Every block is drawn as a card with the same layout, controls and ⋮ menu (see `DESIGN.md`).

### 1. `workout-sets` - Set Sheet (Logging on the Phone)

The main interaction point. One exercise, today's sets as rows with one input per field of the exercise type (kg + reps for strength, duration/distance for cardio, the fields of a type of your own). It shares the `workout-log` table's pieces (columns, values as entered, protocol badges, target with progress and achievement badge, menu):

```yaml
exercise: Bench Press
sets: 4 # rows to fill in; unset: as many as last time
targetReps: 8
targetWeight: 80
workout: Push Day # unset: the note's name
rest: 90 # seconds of rest after each set; 0 = none; unset (and no timer.*) = the section's workout-timer
timer.type: countdown # the rest timer's other options: timer.preset, timer.type, timer.rest, timer.rounds, timer.sound, timer.showControls
```

**Set sheet** rules:

- **Rows**: today's sets of the exercise in this workout come first, ticked; then rows to fill in up to `sets`. "Add set" adds one more row for this view only.
- **Hints** (input placeholders): the same set number on the last earlier day the exercise was done (any workout), the last set of that day past its end, else the targets. Ticking a row with an empty field logs its hint, so "same as last time" is one tap.
- **Protocol and notes**: the arrow opens a row's protocol chips (the settings list) and notes. A row starts with the protocol of the same set last time when that was not standard (a warm-up stays a warm-up). On a logged row they change the set in the log.
- **Rest**: a rest timer at the top starts by itself when a set is ticked (not after the last row to fill in). The block can carry every option of that timer (`rest` is its length; `timer.*` the rest), so a day's note needs no `workout-timer`: ⋮ → "Edit rest timer" opens the timer form and writes them into the block. Without them it runs on the section's `workout-timer`, so both show one countdown.
- **Ticking** logs the set at once (in the settings unit, origin = the note). Unticking a logged set deletes it and puts its values back in the first row to fill in; Undo (8 seconds) puts the very set back. What is typed in rows not ticked yet is kept while the note is open, never stored.
- On a phone, exercises with more than two fields show two per line, each with its label.

### 2. `workout-log` - Exercise History Table

A table of past sets for one exercise (or a workout), with an "Add log" button to record a set through the log form.

```yaml
exercise: Bench Press
workout: Upper Body A
exactMatch: true
dateRange: 30
limit: 10 # unset: sets × 2 (the last two workouts) when sets is given, else 50
sortBy: date # date | exercise | weight | reps | volume
sortOrder: desc
columns: [date, reps, weight, volume, notes] # unset: follows the exercise type
showAddButton: true
showProtocol: true
sets: 4 # planned sets, read by workout-session
targetWeight: 100 # with targetReps: progressive overload target
targetReps: 8
```

Features: protocol badges (color-coded), target weight/reps with progress and an achievement badge that writes the next weight into the block, an edit action per row (delete is in the edit form), ⋮ with "go to exercise" and edit. Each training day is shaded as one group. On phones each set is one grid row under one row of column labels.

### 3. `workout-session` - Guided Session

No parameters. Turns the note into a **guided session**: the note's `workout-log` and `workout-sets` blocks are the **plan** (one step per exercise, in note order; a section's table and sets of the same exercise are one step), shown one exercise at a time with its target and last time. `sets` and targets come from the block; the rest from its `workout-sets` block's own timer, else the section's `workout-timer` (`rest: 0` = no rest); the card's ⋮ edits it where it is written. Progress is today's sets of this workout in the log, never stored elsewhere. There is no weekly schedule: the user opens the note they want to train.

### 4. `workout-timer` - Timer

```yaml
preset: rest # use a saved preset as base
# or manual:
type: countdown # countdown | interval | stopwatch
duration: 90 # seconds (interval: work per round)
work: 20 # interval only, wins over duration
rest: 10 # interval only, after each round's work
rounds: 8 # interval only
autoStart: false
sound: true
showControls: true
exercise: Squat
workout: Leg Day
```

Timer types: Countdown (single), Interval (rounds of work then rest, the last rest included), Stopwatch. Presets are saved in settings and reusable across notes; Tabata (20/10 × 8) and EMOM (60 × 10) are built in and added to the saved presets once, on install or on the first update that has them, so users see and edit them like their own; a deleted one stays deleted from the list but blocks that name it keep working. Distinct sounds for work start, rest start and completion; the device can stay awake while a timer runs and vibrate when it ends (Settings → Timer device cues).

### 5. `workout-chart` - Progression Charts

```yaml
exercise: Squat
type: volume # volume | weight | reps | e1rm | duration | distance | pace | heartRate
chartType: exercise # exercise = daily average; workout | combined | all = daily total (all ignores filters)
dateRange: 30
limit: 50
showTrendLine: false
showTrend: true # header with the trend
showStats: true # stats row: average, min, max, recent change, sessions
exactMatch: false
title: Squat volume
height: 300px
```

**8 data types**: Volume (reps x weight), Weight (heaviest set per day), Reps, Estimated 1RM (Epley, best per day, warm-up and drop sets excluded), Duration, Distance, Pace (lower = better), Heart Rate. Points are one per training day. On phones the block deliberately shows a table instead of the chart.

### 6. `workout-dashboard` - Analytics Hub

```yaml
title: My Dashboard
dateRange: 30
widgets: [summary, heatMap, volume, recentWorkouts] # order shown; unset = all
# or layout: grid, columns: 3, grid.summary: 1 1 3 1 (column row width height), one line per widget
recentWorkoutsLimit: 5
volumeTrendDays: 30
```

**12 widgets**: Summary (total workouts, streak, volume, PRs), Quick Stats (week/month/year), Recent Workouts, Volume Analytics (daily trend chart + top exercises), Muscle Heat Map (SVG body front/back with color-coded activation), Protocol Distribution (pie chart), Protocol Effectiveness (volume change per protocol), Duration Comparison (actual vs estimated), Quick Actions (log button), Muscle Tags, File Errors, Training Calendar (a year of training days shaded by volume, current and best streak, this week against the weekly goal). Each widget has its own settings in its ⋮ menu, written into the block as parameters (e.g. `heatMapMetric`, `calendarWeeks`).

### 7. `workout-duration` - Session Time Estimator

```yaml
workout: Lower Body A # unset = this note
```

Estimates how long the note's workout takes from its plan, section by section: each step's `sets`, `targetReps` and rest, with headings like `### 3 sets x 10 reps` only filling in what the blocks leave out, and timer-only sections (a warm-up) counted as they run. Falls back to the set duration in the settings (default 45s).

---

### Beta features

New features ship as **beta features**: each has a toggle in Settings → Beta features, off after an update, so updating the plugin never changes how someone trains until they choose to try something. A new install (nothing saved by the plugin yet) starts with every beta feature on, since there is no habit to keep. A beta feature that is off shows nothing new (a block of it explains where to turn it on). When a feature is ready for everyone, its toggle goes away and it is simply on. There is none in beta right now (`workout-sets` was released in 3.1.0), so the section is not shown.

---

## Data Model

### CSV File (Single Source of Truth)

Standard columns:

```text
date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
```

Custom columns added dynamically per exercise type (duration, distance, heartRate, pace, the fields of a type of your own). Stored in `customFields`. `weightUnit` (`kg`/`lb`, empty = the settings unit) is always the last column: a set keeps the unit it was entered in and is converted to the settings unit when read.

**Workout log file** (`WorkoutLogFile`): the module that owns this CSV. It is the only place that knows the header, the column order, the row ⇄ entry conversion (both directions, including the entered weight unit) and volume. Everything else reads entries from it or asks it to add/update/delete/rename.

**Column order rule**: standard columns in fixed order, then custom columns in the order the existing header has them, new custom columns appended, `weightUnit` always last. A column already in the header is never dropped, even when every row leaves it empty.

**Import**: a Strong or Hevy CSV export is read into sets (unit kept, timestamps spread over the session), sets already in the log are dropped, and the rest is written in one rewrite after a backup of the log.

### Exercise Types

| Type        | Fields                        |
| ----------- | ----------------------------- |
| Strength    | reps, weight                  |
| Timed       | duration                      |
| Distance    | distance, duration            |
| Cardio      | duration, distance, heartRate |
| Of your own | the fields you choose         |

**Exercise type of your own**: a named group of fields made in Settings → Exercise types (e.g. Climbing: grade, attempts, sent), stored in `settings.exerciseTypes`, picked when an exercise page is made and named by its `exercise_type` (id or name). Its fields are built-in ones (reps, weight, duration, distance, heart rate, keeping their key) or new ones (number, text or yes/no), whose key (the log column) comes from the field's name when it is made and never changes. The built-in types above are read only (Duplicate starts a type from one). Deleting a type only stops offering it: the pages that name it keep its fields and their logged sets (it stays in the list as `retired`). Removing a field from a type leaves its values in the log; new sets don't ask for it. A page's own `parameters:` still add to its type's fields (pages written with the old `exercise_type: custom` + `parameters:` keep working).

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
One value a set records: reps, weight, duration, distance, heart rate, or a field of the exercise's type or page. The exercise's type decides which fields it has and their unit (a `duration` is seconds for a timed exercise, minutes for cardio and distance). Reps, heart rate and durations in seconds are whole numbers; any filled-in field must respect its minimum and maximum. A field's column is found however it is written (`HR`, `Duration (s)`).
_Avoid_: parameter (for the value itself), column

### Exercise page frontmatter

```yaml
exercise_name: Hip Thrust
exercise_type: strength # built-in id, alias, or a type of your own (id or name)
tags:
  - glutes
  - hamstrings
```

Pages written by older versions use `nome_esercizio` and `type`; they are still read. Tags map to canonical muscle groups via the MuscleTagService (supports Italian/English and custom mappings, kept in `muscle-tags.csv` next to the workout log). It is the one place that turns tags into muscles: the heat map, canvas export and the file errors widget all ask it. A tag that names a muscle group directly (`upper_chest`, "Upper chest") always counts. An exercise with no muscle tags trains nothing; muscles are never guessed from the exercise name.

---

## Training History

How logged sets are read back as training. Every view (dashboard, charts, tables, public API, duration) uses these meanings.

**Set**:
One row of the workout log: one exercise performed once, with its reps/weight or other fields and the moment it was logged.
_Avoid_: entry, log (for a single row)

**Training day**:
The calendar day, in the device's local time, on which a set was logged.
_Avoid_: date (ambiguous with the stored UTC timestamp)

**Last N days**:
Today and the N days before it, cut at local midnight by training day (the boundary day counts whole). Charts, filters and dashboard periods all use it.

**Set order**:
Which set came first: the earlier training day, then, within a day, the earlier timestamp. The day wins because a set whose date was changed in the CSV may keep its old timestamp. "Earlier", "latest" and "last time" always mean this order.

**Same workout**:
Two workout names are the same workout when they match after dropping `[[ ]]`, surrounding quotes, case and extra spaces (`workoutKey` / `sameWorkout` in `TrainingHistory`). Sessions and the timer's auto-start use it. A block's `workout:` filter is looser on purpose: it shows every set whose workout contains the filter (`workoutMatches`: "Push" shows "Push Day A"), and `DataFilter` and the block redraws (`EventAwareRenderChild`) both use that one rule.
_Avoid_: comparing workout names by hand

**Session**:
All sets with the same training day and the same workout name (see Same workout). Sets with no workout name on a training day form one unnamed session of their own, distinct from any named workout.
_Avoid_: workout (that is the name/note), day

**Session duration**:
Time from a session's first set to its last. Only plausible when the session has at least two sets and lasts between 5 minutes and 5 hours.
_Avoid_: workout time

**Personal record (PR)**:
An exercise's heaviest eligible weight ever lifted. Warm-up (`warmup`) and drop sets (`drop_set`) are excluded from PRs and new-record counts; other built-in and custom protocols remain eligible. Warm-up and drop sets still contribute to volume and trends. The first eligible weighted set establishes the PR without counting as a new record. A set "sets a new PR" when it is strictly heavier than every earlier set of that exercise. Exercise names are compared ignoring case and spacing. Of several sets at the PR weight, the one with most reps (then the earliest) is the PR. Exercises logged without weight have no PR.
_Avoid_: best, max (as separate concepts)

**Estimated 1RM**:
Epley's estimate, `weight × (1 + reps / 30)`, for sets of 1 to 12 reps with a positive weight, excluding warm-up and drop sets like PRs. A day's value is its best set.

**Last time**:
The latest earlier training day on which the exercise was done (in any workout), with all of that day's sets of it in set order. It is what today's sets and the target are compared against.
_Avoid_: last set (for the whole day)

**Trend**:
The direction of a series of training-day values (for weight: the heaviest set of each training day), read from its linear regression line: up, down or stable (within 5% of the mean). For pace, lower is better.
_Avoid_: progress, variation (for the direction itself)

**Streak**:
Consecutive calendar weeks (Monday to Sunday) that met the **weekly goal**: at least that many training days (setting `weeklyGoal`, 1 by default, so any session counts). The current week only breaks the streak once it has ended short of the goal. The **best streak** is the longest such run ever.

---

## Data Flow

```text
User ticks a row in workout-sets (or saves the log form)
  -> WorkoutLogFile rewrites the CSV (column order kept), clears its 5s cache
    -> log:added event on the WorkoutEventBus
      -> every block showing that exercise/workout redraws
         (set sheet, table, chart, dashboard, session card)
      -> the rest timer starts
```

**WorkoutLogFile**: All workout log reads and writes. 5-second cache. Clears on writes.

**DataFilter**: Exercise matching on the exercise field - exact or fuzzy (score-based), plus `dateRange` (last N days). The set sheet matches the exercise name exactly: logging must never match a similar exercise.

---

## Mobile-Specific Design

### What Works on Mobile

Everything. `isDesktopOnly: false`. No Node.js/Electron APIs. No regex lookbehind.

### Mobile-Optimized Features

- **workout-sets**: big tick targets, number fields with ↑/↓ steps, hints as placeholders, one-tap undo
- **Log form** (CreateLogModal): large tap targets, +/- weight buttons with configurable increment (default 2.5kg), recent exercises as quick-select chips, last set and PR shown
- **Tables**: one grid row per set under one row of column labels, edit by tapping the card
- **Charts**: a table instead of the chart
- **Timer**: one-line strip inside blocks, screen kept awake, optional vibration
- **Ribbon icon** (dumbbell) as secondary access point

---

## Settings Overview

| Section                 | Key Settings                                                          |
| ----------------------- | --------------------------------------------------------------------- |
| **Setup & data**        | CSV file path, exercise folder path, weight unit (kg/lb), weekly goal |
| **CSV file management** | Create the log and muscle tag files                                   |
| **Getting started**     | Open the getting started guide, show what's new                       |
| **Mobile logging**      | Ribbon icon, quick weight increment, default exact match              |
| **Timer presets**       | Presets (Tabata and EMOM built in), default preset                    |
| **Timer device cues**   | Keep screen awake, vibrate on completion                              |
| **Protocols**           | Protocol list (name, abbreviation, color), built-ins included         |
| **Exercise types**      | Types of your own (fields), Duplicate from a built-in                 |
| **Training parameters** | Progressive overload increment, set/rep duration for estimates        |
| **Templates**           | Generate the default templates                                        |
| **Maintenance**         | Run all maintenance (block ids, weight units, ...)                    |
| **Beta features**       | One toggle per feature in beta (hidden when there is none)            |

Muscle tags are managed with the "Manage muscle tags" command.

---

## Commands

| Command                     | What It Does                                          |
| --------------------------- | ----------------------------------------------------- |
| Create workout log          | Opens the log form (CreateLogModal)                   |
| Create CSV log file         | Creates the CSV file if missing                       |
| Create example notes        | Adds the example notes and data (never overwrites)    |
| Start guided tour           | Opens the getting started guide (kept for hotkeys)    |
| Show what's new             | Shows the release notes                               |
| Open getting started guide  | Opens the getting started pages                       |
| Insert workout chart        | Opens InsertChartModal                                |
| Insert workout table        | Opens InsertTableModal                                |
| Insert workout sets         | Opens InsertSetsModal                                 |
| Insert workout timer        | Opens InsertTimerModal                                |
| Insert workout dashboard    | Opens InsertDashboardModal                            |
| Insert workout duration     | Opens InsertDurationModal                             |
| Insert workout session      | Writes an empty `workout-session` block at the cursor |
| Create exercise page        | Creates a new exercise page                           |
| Audit exercise names        | Finds mismatches between pages and the log            |
| Add exercise block          | Adds a `## exercise` section with its `workout-sets`  |
| Export workout to canvas    | Exports the workout structure to Obsidian Canvas      |
| Migrate exercise types      | Converts old exercise type formats                    |
| Import from Strong or Hevy  | Imports a Strong/Hevy CSV export (preview first)      |
| Convert exercise data       | Converts an exercise's sets to another type           |
| Manage muscle tags          | Opens MuscleTagManagerModal                           |
| Add missing block ids       | Gives an `id` to blocks that have none                |
| Generate tag reference note | Creates a reference note for all tags                 |

---

## Public API

Exposed as `window.WorkoutPlannerAPI` for Dataview integration. It is a public contract: signatures and return shapes don't change without a deprecation path.

```javascript
// Get logs, optionally filtered
const logs = await WorkoutPlannerAPI.getWorkoutLogs({
  exercise: "Squat",
  workout: "Leg Day",
  dateRange: { start: "2026-01-01", end: "2026-01-31" },
  protocol: "drop_set",
  exactMatch: true,
});

// Stats for an exercise
const stats = await WorkoutPlannerAPI.getExerciseStats("Bench Press");
// -> { totalVolume, maxWeight, totalSets, trend, averageWeight, averageReps,
//      lastWorkoutDate, prWeight, prReps, prDate, estimatedOneRepMax }

// List exercises, optionally by tag
const exercises = await WorkoutPlannerAPI.getExercises({
  tag: "glutes",
});
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
3. **Workout notes as the UI**: The user's workout note IS the interface and the plan. Blocks are embedded inline next to each exercise - no separate app screen, no stored schedule or session state.
4. **Multi-strategy matching**: Fuzzy search for reading views because exercise names vary; exact names wherever a set is logged.
5. **Preset system for timers**: Gym users want "tap and go", not configure every time.
6. **Protocol tracking**: Advanced lifters use varied techniques; tracking enables effectiveness analysis.
7. **SVG heatmap**: Visual muscle activation - motivating and informative at a glance.
8. **No Node.js APIs**: Full mobile compatibility is non-negotiable for a gym-use plugin.
9. **One owner per concept**: training history, exercise pages, fields, note blocks, protocols, the log CSV each live in one module (see `CLAUDE.md`).
10. **Opt-in releases**: new features ship as beta features, so an update never changes how someone trains.
11. **Public API**: Dataview integration means power users can build custom dashboards.
12. **Every language**: the UI is in 24 languages; the tag system accommodates bilingual exercise naming.

---

## Typical Workout Note Structure

A workout note looks like this (the example "Lower Body A" note, simplified) - the user scrolls through it during a session:

````markdown
## Duration

```workout-duration

```

## Session

```workout-session

```

## Squat:

### 4 sets x 8-10 reps, 180 s rest

```workout-sets
exercise: Squat
workout: Lower Body A
sets: 4
rest: 180
```

## Leg Press:

### 4 sets x 10-15 reps, 120 s rest

```workout-sets
exercise: Leg Press
workout: Lower Body A
sets: 4
rest: 120
```
````

Each exercise is a section with its set sheet, which carries its own rest. Older notes with a `workout-log` and a `workout-timer` per section keep working, and the session reads them the same way.
