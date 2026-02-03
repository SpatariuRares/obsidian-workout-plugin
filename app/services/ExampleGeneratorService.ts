import { App, normalizePath, Notice, TFolder } from "obsidian";

export class ExampleGeneratorService {
  constructor(private app: App) {}

  public async generateExampleFolder(
    overwrite: boolean = false,
  ): Promise<void> {
    const baseFolderName = "The gym examples";
    const basePath = normalizePath(baseFolderName);
    const exercisesPath = normalizePath(`${baseFolderName}/Exercises`);
    const workoutsPath = normalizePath(`${baseFolderName}/Workouts`);
    const logPath = normalizePath(`${baseFolderName}/Log`);

    try {
      // Create directories
      await this.createFolderIfNotExists(basePath);
      await this.createFolderIfNotExists(exercisesPath);
      await this.createFolderIfNotExists(workoutsPath);
      await this.createFolderIfNotExists(logPath);

      // Create Getting Started File
      await this.createGettingStartedFile(basePath, overwrite);

      // Create Exercises
      await this.createExerciseFile(
        exercisesPath,
        "Bench Press",
        "strength",
        ["chest", "triceps", "shoulders"],
        overwrite,
      );
      await this.createExerciseFile(exercisesPath, "Squat", "strength", [
        "legs",
        "quads",
        "glutes",
      ]);
      await this.createExerciseFile(exercisesPath, "Running", "cardio", [
        "cardio",
        "legs",
      ]);
      await this.createExerciseFile(exercisesPath, "Plank", "timed", [
        "core",
        "abs",
      ]);
      await this.createExerciseFile(exercisesPath, "Cycling", "distance", [
        "cardio",
        "legs",
      ]);

      // New exercises for the specific workout
      await this.createExerciseFile(
        exercisesPath,
        "Squat multi power",
        "strength",
        ["legs", "quads"],
      );
      await this.createExerciseFile(exercisesPath, "RDL", "strength", [
        "legs",
        "hamstrings",
        "glutes",
      ]);
      await this.createExerciseFile(exercisesPath, "Leg press 45", "strength", [
        "legs",
        "quads",
      ]);
      await this.createExerciseFile(
        exercisesPath,
        "Leg Curl seduto",
        "strength",
        ["legs", "hamstrings"],
      );
      await this.createExerciseFile(exercisesPath, "Calf Machine", "strength", [
        "legs",
        "calves",
      ]);

      // Create Workout
      await this.createWorkoutFile(workoutsPath, overwrite);

      // Create Log File
      await this.createLogFile(logPath, overwrite);

      // Create Dashboard File
      await this.createDashboardFile(basePath, overwrite);

      // Create Feature Showcase File (demonstrates all code block types)
      await this.createFeatureShowcaseFile(basePath, overwrite);

      // Create HIIT Workout (demonstrates interval timer)
      await this.createHIITWorkoutFile(workoutsPath, overwrite);

      new Notice(`Example folder '${baseFolderName}' created successfully!`);
    } catch {
      new Notice("Failed to create example folder.");
    }
  }

  private async createFolderIfNotExists(path: string): Promise<void> {
    const folder = this.app.vault.getAbstractFileByPath(path);
    if (!folder) {
      await this.app.vault.createFolder(path);
    } else if (!(folder instanceof TFolder)) {
      throw new Error(`Path '${path}' exists but is not a folder.`);
    }
  }

  /**
   * Helper to create or update a file with content.
   * Handles the common pattern: check exists, overwrite logic, create/modify.
   */
  private async createOrUpdateFile(
    folderPath: string,
    fileName: string,
    content: string,
    overwrite: boolean,
  ): Promise<void> {
    const filePath = normalizePath(`${folderPath}/${fileName}`);
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile && !overwrite) {
      return;
    }

    if (existingFile) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createGettingStartedFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# Getting Started with The Gym Plugin

Welcome! This folder contains example files to help you learn all the features.

## Folder Structure

| File/Folder | Description |
|-------------|-------------|
| [[Dashboard]] | Your workout stats at a glance |
| [[Feature Showcase]] | Complete reference of all code blocks |
| **Exercises/** | Example exercise pages with logs and charts |
| **Workouts/** | Example workout templates |
| **Log/** | Your CSV workout data |

## Quick Actions

Use these commands (Ctrl/Cmd + P):
- **Create Workout Log** - Add a new workout entry
- **Insert Workout Chart** - Add a chart to any note
- **Insert Workout Timer** - Add a rest timer
- **Create Exercise Page** - Create a new exercise file

## Next Steps

1. Open [[Dashboard]] to see your stats
2. Check [[Feature Showcase]] to learn all available features
3. Try a workout from the **Workouts** folder
4. Create your own exercises in **Exercises**

`;
    await this.createOrUpdateFile(folderPath, "Getting Started.md", content, overwrite);
  }

  private async createExerciseFile(
    folderPath: string,
    name: string,
    type: string,
    tags: string[] = [],
    overwrite: boolean = false,
  ): Promise<void> {
    const content = this.generateExerciseContent(name, type, tags);
    await this.createOrUpdateFile(folderPath, `${name}.md`, content, overwrite);
  }

  private async createWorkoutFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `## Durata
\`\`\`workout-duration
\`\`\`
    ### grafico

\`\`\`workout-chart
chartType: workout
type: volume
workout: Giorno 1 LOWER BODY A 2.0
dateRange: 89
limit: 50
showTrendLine: true
showTrend: true
showStats: true
\`\`\`

## Squat multi power:

### 4 serie x 8-10 ripetizioni (Recupero: 180s)

**Nota: spingi forte**

\`\`\`workout-timer
duration: 180
type: countdown
title: Hip Thrust
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: Squat multi power
workout: Giorno 1 LOWER BODY A 2.0
limit: 12
exactMatch: true
\`\`\`

## RDL:

### 4 serie x 8-12 ripetizioni (Recupero: 180s)

\`\`\`workout-timer
duration: 180
type: countdown
title: RDL
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: RDL
workout: Giorno 1 LOWER BODY A 2.0
limit: 12
exactMatch: true
\`\`\`

## pressa 45 Technogym 

### 4 serie x 10-15 ripetizioni (Recupero: 120s)

\`\`\`workout-timer
duration: 120
type: countdown
title: Hack squat
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: Leg press 45
workout: Giorno 1 LOWER BODY A 2.0
limit: 12
exactMatch: true
\`\`\`

## Leg Curl Seduto:

### 3 serie x 10-15 ripetizioni (Recupero: 90s)

\`\`\`workout-timer
duration: 90
type: countdown
title: Leg Curl Sdraiato
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: Leg Curl seduto
workout: Giorno 1 LOWER BODY A 2.0
limit: 12
exactMatch: true
\`\`\`

## Calf Machine:

### 4 serie x 15-20 ripetizioni (Recupero: 60s)

\`\`\`workout-timer
duration: 60
type: countdown
title: Calf Machine
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: Calf Machine
workout: Giorno 1 LOWER BODY A 2.0
limit: 12
exactMatch: true
\`\`\`
`;
    await this.createOrUpdateFile(folderPath, "Giorno 1 LOWER BODY A 2.0.md", content, overwrite);
  }

  private async createLogFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    // Standard headers matching STANDARD_CSV_COLUMNS + common custom fields
    const header =
      "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate";
    const rows: string[] = [];

    // Generate data for the last 2 weeks (14 days)
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    // Define workouts to cycle through
    // We will simulate 3 workouts a week
    const workoutName = "Giorno 1 LOWER BODY A 2.0";

    // Generate a few sessions
    const sessionOffsets = [2, 5, 9, 12]; // Days ago

    for (const daysAgo of sessionOffsets) {
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      // Exercises for Lower Body A
      // Schema: Power Squat, RDL, Leg Press, Leg Curl, Calf Machine

      // 1. Squat multi power: 4 sets (with myo-reps on last set)
      for (let set = 1; set <= 4; set++) {
        const reps = 8 + Math.floor(Math.random() * 3); // 8-10
        const weight = 80 + set * 5; // Progressive weight
        // Demonstrate myo-reps protocol on last set
        const protocol = set === 4 ? "myo-reps" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Squat multi power",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set === 4 ? "Myo-rep set: 10+3+3+3" : "",
          protocol,
        });
      }

      // 2. RDL: 4 sets (with rest-pause on final set)
      for (let set = 1; set <= 4; set++) {
        const reps = 10;
        const weight = 60 + set * 2.5;
        const protocol = set === 4 ? "rest-pause" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "RDL",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set === 4 ? "Rest-pause: 10+5+3" : "",
          protocol,
        });
      }

      // 3. Leg press 45: 4 sets (with dropset on last set)
      for (let set = 1; set <= 4; set++) {
        const reps = 12;
        const weight = 120 + set * 10;
        const protocol = set === 4 ? "dropset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg press 45",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set === 4 ? "Drop: 160->120->80" : "",
          protocol,
        });
      }

      // 4. Leg Curl seduto: 3 sets (with 21s on last set)
      for (let set = 1; set <= 3; set++) {
        const reps = set === 3 ? 21 : 12;
        const weight = 35 + set * 2.5;
        const protocol = set === 3 ? "21s" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg Curl seduto",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set === 3 ? "21s: 7+7+7" : "",
          protocol,
        });
      }

      // 5. Calf Machine: 4 sets (superset with bodyweight calf raises)
      for (let set = 1; set <= 4; set++) {
        const reps = 15;
        const weight = 40;
        // Alternate superset protocol
        const protocol = set % 2 === 0 ? "superset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Calf Machine",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set % 2 === 0 ? "Superset with BW raises" : "",
          protocol,
        });
      }
      // 6. Plank: 3 sets (Timed)
      for (let set = 1; set <= 3; set++) {
        const duration = 60 + set * 15; // 60s, 75s, 90s
        const timestamp =
          new Date(dateStr).getTime() +
          Math.floor(Math.random() * 3600000) +
          36000000;
        // date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate
        rows.push(
          `${dateStr},Plank,0,0,0,,${workoutName},${timestamp},,standard,${duration},,`,
        );
      }
    }

    // Generate Upper Body sessions (Bench Press, Squat - just to have logs)
    const upperBodyOffsets = [3, 6, 10, 13];
    const upperBodyProtocols = [
      "standard",
      "rest-pause",
      "myo-reps",
      "dropset",
    ];
    for (let i = 0; i < upperBodyOffsets.length; i++) {
      const daysAgo = upperBodyOffsets[i];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];
      const workoutName = "Upper Body Power"; // Virtual workout name

      // Bench Press - with varied protocols on final set
      for (let set = 1; set <= 4; set++) {
        const reps = 5;
        const weight = 80 + set * 2.5;
        const timestamp = new Date(dateStr).getTime() + 36000000 + set * 300000;
        // Use different protocol on last set based on session
        const protocol =
          set === 4
            ? upperBodyProtocols[i % upperBodyProtocols.length]
            : "standard";
        const notes =
          set === 4 && protocol !== "standard" ? `${protocol} set` : "";
        rows.push(
          `${dateStr},Bench Press,${reps},${weight},${reps * weight},,${workoutName},${timestamp},${notes},${protocol},,,`,
        );
      }

      // Squat - with superset on some sessions
      for (let set = 1; set <= 4; set++) {
        const reps = 5;
        const weight = 100 + set * 5;
        const timestamp = new Date(dateStr).getTime() + 37200000 + set * 300000;
        // Superset on even sessions
        const protocol = i % 2 === 0 && set === 4 ? "superset" : "standard";
        const notes = protocol === "superset" ? "Superset with lunges" : "";
        rows.push(
          `${dateStr},Squat,${reps},${weight},${reps * weight},,${workoutName},${timestamp},${notes},${protocol},,,`,
        );
      }
    }

    // Generate Cardio sessions (Running, Cycling)
    const cardioOffsets = [4, 7, 11];
    for (const daysAgo of cardioOffsets) {
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];
      const workoutName = "Cardio Day";

      // Running
      const runDuration = 30;
      const runDistance = 5;
      const runTimestamp = new Date(dateStr).getTime() + 36000000;
      rows.push(
        `${dateStr},Running,0,0,0,,${workoutName},${runTimestamp},,standard,${runDuration},${runDistance},145`,
      );

      // Cycling
      const cycleDuration = 45;
      const cycleDistance = 20;
      const cycleTimestamp = new Date(dateStr).getTime() + 38000000;
      rows.push(
        `${dateStr},Cycling,0,0,0,,${workoutName},${cycleTimestamp},,standard,${cycleDuration},${cycleDistance},130`,
      );
    }

    const content = [header, ...rows].join("\n");
    await this.createOrUpdateFile(folderPath, "workout_logs.csv", content, overwrite);
  }

  private async createDashboardFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# Dashboard

Your workout stats at a glance. See [[Feature Showcase]] for all available components.

\`\`\`workout-dashboard
\`\`\`
`;
    await this.createOrUpdateFile(folderPath, "Dashboard.md", content, overwrite);
  }

  private async createFeatureShowcaseFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# Feature Showcase

Complete reference of all code block types available in the Workout Plugin.

> **Tip**: For your personal dashboard, see [[Dashboard]]

---

## 1. Charts

Charts visualize your progress over time. Available types: \`volume\`, \`weight\`, \`reps\`, \`duration\`, \`distance\`, \`heartRate\`, \`pace\`.

### Strength Exercise (Volume + Weight)

\`\`\`workout-chart
chartType: exercise
exercise: Bench Press
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: Squat
type: weight
dateRange: 30
showTrendLine: true
\`\`\`

### Cardio Exercise (Distance + Pace)

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: distance
dateRange: 30
showTrendLine: true
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: pace
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### Timed Exercise (Duration)

\`\`\`workout-chart
chartType: exercise
exercise: Plank
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### Workout Chart (All Exercises Combined)

\`\`\`workout-chart
chartType: workout
workout: Giorno 1 LOWER BODY A 2.0
type: volume
dateRange: 60
showTrendLine: true
showStats: true
\`\`\`

### All Data Chart

\`\`\`workout-chart
chartType: all
type: volume
dateRange: 30
showTrendLine: true
\`\`\`

---

## 2. Tables

Tables display your workout logs with sorting and editing capabilities.

### By Exercise

\`\`\`workout-log
exercise: Bench Press
limit: 10
\`\`\`

### By Workout

\`\`\`workout-log
workout: Giorno 1 LOWER BODY A 2.0
limit: 15
\`\`\`

### Combined (Exercise + Workout)

\`\`\`workout-log
exercise: Squat multi power
workout: Giorno 1 LOWER BODY A 2.0
exactMatch: true
limit: 10
\`\`\`

---

## 3. Timers

### Countdown Timer

\`\`\`workout-timer
type: countdown
duration: 90
title: Rest Timer
showControls: true
sound: true
\`\`\`

### Interval Timer

\`\`\`workout-timer
type: interval
duration: 30
rounds: 5
title: HIIT Intervals
showControls: true
sound: true
\`\`\`

---

## 4. Duration Estimator

Estimates total workout duration based on the current note's exercises.

\`\`\`workout-duration
\`\`\`

---

## 5. Training Protocols

The plugin supports these protocol badges in your logs:

| Protocol | Description |
|----------|-------------|
| standard | Normal sets |
| dropset | Reduce weight, continue reps |
| myo-reps | Activation set + mini sets |
| rest-pause | Brief rest, continue to failure |
| superset | Paired exercises |
| 21s | 7+7+7 partial reps |

---

## Quick Reference

| Code Block | Purpose |
|------------|---------|
| \`workout-chart\` | Visualize progress over time |
| \`workout-log\` | Display workout data table |
| \`workout-timer\` | Countdown or interval timer |
| \`workout-duration\` | Estimate workout length |
| \`workout-dashboard\` | Full stats overview |

**Commands** (Ctrl/Cmd + P): Create Workout Log, Insert Chart, Insert Timer, Create Exercise Page
`;
    await this.createOrUpdateFile(folderPath, "Feature Showcase.md", content, overwrite);
  }

  private async createHIITWorkoutFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# HIIT Cardio Session

High-Intensity Interval Training workout with interval timers and cardio tracking.

\`\`\`workout-duration
\`\`\`

---

## Warm-up (5 min)

\`\`\`workout-timer
type: countdown
duration: 300
title: Warm-up
showControls: true
sound: true
\`\`\`

---

## Sprint Intervals (30s × 8 rounds)

\`\`\`workout-timer
type: interval
duration: 30
rounds: 8
title: Sprint Intervals
showControls: true
sound: true
\`\`\`

---

## Running Progress

\`\`\`workout-log
exercise: Running
limit: 8
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: distance
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

---

## Cycling Cool-down

\`\`\`workout-log
exercise: Cycling
limit: 8
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: Cycling
type: distance
dateRange: 30
showTrendLine: true
\`\`\`
`;
    await this.createOrUpdateFile(folderPath, "HIIT Cardio Session.md", content, overwrite);
  }

  private addLogEntry(
    rows: string[],
    data: {
      date: string;
      exercise: string;
      reps: number;
      weight: number;
      volume: number;
      workout: string;
      notes?: string;
      protocol?: string;
    },
  ): void {
    const timestamp =
      new Date(data.date).getTime() +
      Math.floor(Math.random() * 3600000) +
      36000000; // Add random time + 10h to be daytime
    // date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate
    // 0    1        2    3      4      5       6       7         8     9        10       11       12
    const protocol = data.protocol || "standard";
    const row = `${data.date},${data.exercise},${data.reps},${data.weight},${data.volume},,${data.workout},${timestamp},${data.notes || ""},${protocol},,,`;
    rows.push(row);
  }

  private generateExerciseContent(
    name: string,
    type: string,
    tags: string[],
  ): string {
    const tagsYaml =
      tags.length > 0 ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}` : "";

    // Generate appropriate chart sections based on exercise type
    const chartSections = this.getChartSectionsForType(name, type);

    return `---
nome_esercizio: ${name}
exercise_type: ${type}
${tagsYaml}
---

# ${name}

## Description

Example description for ${name}.

## Log

\`\`\`workout-log
exercise: ${name}
limit: 15
\`\`\`

${chartSections}
`;
  }

  private getChartSectionsForType(name: string, type: string): string {
    switch (type) {
      case "strength":
        return `## Volume Chart

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## Weight Progression

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: weight
dateRange: 30
showTrendLine: true
\`\`\`

## Rep Tracking

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: reps
dateRange: 30
\`\`\``;

      case "timed":
        return `## Duration Chart

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      case "cardio":
        return `## Duration Chart

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## Heart Rate

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: heartRate
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      case "distance":
        return `## Distance Chart

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: distance
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## Duration

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## Pace Tracking

Track your pace improvement (lower = faster):

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: pace
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      default:
        return `## Chart

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: volume
dateRange: 30
showTrendLine: true
\`\`\``;
    }
  }
}
