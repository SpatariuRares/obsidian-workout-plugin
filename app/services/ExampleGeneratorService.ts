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

      // Create Dataview Examples File
      await this.createDataviewExampleFile(basePath, overwrite);

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

  private async createDataviewExampleFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "Dataview Examples.md";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = `# Getting Started with The Gym Plugin

Welcome! This folder contains example files to help you learn all the features.

## Quick Start

1. **Dashboard** - See your workout stats at a glance
2. **Feature Showcase** - Learn all available code blocks
3. **Exercises folder** - Example exercise pages with logs and charts
4. **Workouts folder** - Example workout templates
5. **Log folder** - Your CSV workout data

## Your Dashboard

\`\`\`workout-dashboard
\`\`\`

## Quick Actions

Use these commands (Ctrl/Cmd + P):
- **Create Workout Log** - Add a new workout entry
- **Insert Workout Chart** - Add a chart to any note
- **Insert Workout Timer** - Add a rest timer
- **Create Exercise Page** - Create a new exercise file

## Sample Workout Table

\`\`\`workout-log
limit: 20
\`\`\`

## Volume Trend (All Exercises)

\`\`\`workout-chart
chartType: all
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

`;
    if (existingFile && overwrite) {
      const file = existingFile as any; // Cast to TFile, essentially
      await this.app.vault.modify(file, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createExerciseFile(
    folderPath: string,
    name: string,
    type: string,
    tags: string[] = [],
    overwrite: boolean = false,
  ): Promise<void> {
    const fileName = `${name}.md`;
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = this.generateExerciseContent(name, type, tags);

    if (existingFile && overwrite) {
      // Safe cast as we checked existence
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createWorkoutFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "Giorno 1 LOWER BODY A 2.0.md";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = `### Durata
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
    if (existingFile && overwrite) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createLogFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "workout_logs.csv";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

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
    if (existingFile && overwrite) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createDashboardFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "Dashboard.md";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = `# Dashboard

The dashboard provides a comprehensive overview of your workout data with multiple widgets.

\`\`\`workout-dashboard
\`\`\`
`;
    if (existingFile && overwrite) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createFeatureShowcaseFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "Feature Showcase.md";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = `# Feature Showcase

This file demonstrates all the code block types available in the Workout Plugin.

---

## 1. Workout Dashboard

The dashboard shows quick stats, recent workouts, volume analytics, protocol distribution, and more.

\`\`\`workout-dashboard
\`\`\`

---

## 2. Workout Charts

### 2.1 Exercise Chart - Volume

Track volume progression for a specific exercise:

\`\`\`workout-chart
chartType: exercise
exercise: Bench Press
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### 2.2 Exercise Chart - Weight

Track weight progression:

\`\`\`workout-chart
chartType: exercise
exercise: Squat
type: weight
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### 2.3 Exercise Chart - Reps

Track rep progression:

\`\`\`workout-chart
chartType: exercise
exercise: Bench Press
type: reps
dateRange: 30
\`\`\`

### 2.4 Cardio Chart - Distance

Track distance for cardio exercises:

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: distance
dateRange: 30
showTrendLine: true
\`\`\`

### 2.5 Cardio Chart - Duration

Track duration for timed exercises:

\`\`\`workout-chart
chartType: exercise
exercise: Plank
type: duration
dateRange: 30
\`\`\`

### 2.6 Cardio Chart - Heart Rate

Track heart rate during cardio:

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: heartRate
dateRange: 30
\`\`\`

### 2.7 Workout Chart

Track total volume for an entire workout:

\`\`\`workout-chart
chartType: workout
workout: Giorno 1 LOWER BODY A 2.0
type: volume
dateRange: 60
showTrendLine: true
showStats: true
\`\`\`

### 2.8 Combined Chart

Filter by BOTH exercise AND workout (intersection):

\`\`\`workout-chart
chartType: combined
exercise: Squat
workout: Upper Body Power
type: volume
dateRange: 30
\`\`\`

### 2.9 All Data Chart

Show all workout data without any filtering:

\`\`\`workout-chart
chartType: all
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

---

## 3. Workout Tables

### 3.1 Exercise Table

View logs for a specific exercise in table format:

\`\`\`workout-log
exercise: Bench Press
limit: 10
\`\`\`

### 3.2 Workout Table

View all exercises from a workout session:

\`\`\`workout-log
workout: Giorno 1 LOWER BODY A 2.0
limit: 20
\`\`\`

### 3.3 Combined Table with Exact Match

\`\`\`workout-log
exercise: Squat multi power
workout: Giorno 1 LOWER BODY A 2.0
exactMatch: true
limit: 15
\`\`\`

---

## 4. Timers

### 4.1 Countdown Timer

Simple rest timer between sets:

\`\`\`workout-timer
type: countdown
duration: 90
title: Rest Timer
showControls: true
autoStart: false
sound: true
\`\`\`

### 4.2 Interval Timer

For HIIT or circuit training:

\`\`\`workout-timer
type: interval
duration: 30
rounds: 5
title: HIIT Intervals
showControls: true
autoStart: false
sound: true
\`\`\`

### 4.3 Long Rest Timer

For heavy compound movements:

\`\`\`workout-timer
type: countdown
duration: 180
title: Heavy Set Recovery
showControls: true
sound: true
\`\`\`

---

## 5. Workout Duration Estimator

Estimates workout duration based on exercises and rest times:

\`\`\`workout-duration
\`\`\`

---

## 6. Protocol Examples

The plugin supports various training protocols. Here's what each badge means:

- **standard** - Normal sets
- **dropset** - Drop sets (reduce weight, continue reps)
- **myo-reps** - Myo-rep sets (activation + mini sets)
- **rest-pause** - Rest-pause sets (brief rest, continue)
- **superset** - Superset (paired exercises)
- **21s** - 21s protocol (7+7+7 partial reps)

Check your exercise logs to see protocol badges in action!

---

## Tips

1. Use the **Insert** commands (Ctrl/Cmd + P) to easily add code blocks
2. Timer presets can be saved in settings for quick access
3. Charts support trend lines and statistics
4. Tables are sortable and editable
5. The dashboard updates automatically when you log workouts
`;
    if (existingFile && overwrite) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
  }

  private async createHIITWorkoutFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const fileName = "HIIT Cardio Session.md";
    const filePath = normalizePath(`${folderPath}/${fileName}`);

    const existingFile = this.app.vault.getAbstractFileByPath(filePath);
    if (existingFile && !overwrite) {
      return;
    }

    const content = `# HIIT Cardio Session

High-Intensity Interval Training workout demonstrating interval timers and cardio tracking.

## Workout Duration

\`\`\`workout-duration
\`\`\`

---

## Warm-up: Light Jog

5 minutes easy pace

\`\`\`workout-timer
type: countdown
duration: 300
title: Warm-up
showControls: true
autoStart: false
sound: true
\`\`\`

---

## Main Workout: Intervals

30 seconds per round × 8 rounds

\`\`\`workout-timer
type: interval
duration: 30
rounds: 8
title: Sprint Intervals
showControls: true
autoStart: false
sound: true
\`\`\`

---

## Running Log

\`\`\`workout-log
exercise: Running
limit: 10
\`\`\`

## Running Progress - Distance

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: distance
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## Running Progress - Heart Rate

\`\`\`workout-chart
chartType: exercise
exercise: Running
type: heartRate
dateRange: 30
showTrendLine: true
\`\`\`

---

## Cool-down: Cycling

15-20 minutes moderate pace

\`\`\`workout-timer
type: countdown
duration: 60
title: Rest before cycling
showControls: true
sound: true
\`\`\`

\`\`\`workout-log
exercise: Cycling
limit: 10
\`\`\`

## Cycling Progress

\`\`\`workout-chart
chartType: exercise
exercise: Cycling
type: distance
dateRange: 30
showTrendLine: true
\`\`\`
`;
    if (existingFile && overwrite) {
      await this.app.vault.modify(existingFile as any, content);
    } else {
      await this.app.vault.create(filePath, content);
    }
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
\`\`\`

## Heart Rate

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: heartRate
dateRange: 30
showTrendLine: true
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
\`\`\`

## Pace Tracking

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: pace
dateRange: 30
showTrendLine: true
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
