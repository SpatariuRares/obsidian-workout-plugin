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

    // Generate data for the last 6 weeks (42 days) for better trend visualization
    const now = new Date();
    const oneDay = 24 * 60 * 60 * 1000;

    const workoutName = "Giorno 1 LOWER BODY A 2.0";

    // Lower body sessions: ~2x per week for 6 weeks (oldest first for proper progression)
    const lowerBodyOffsets = [40, 37, 33, 30, 26, 23, 19, 16, 12, 9, 5, 2];

    // Base weights for each exercise (starting point 6 weeks ago)
    const baseWeights = {
      squatMultiPower: 70,
      rdl: 50,
      legPress: 100,
      legCurl: 30,
      calfMachine: 35,
    };

    // Weekly progression rate (kg per week)
    const weeklyProgression = {
      squatMultiPower: 2.5,
      rdl: 2.5,
      legPress: 5,
      legCurl: 1.25,
      calfMachine: 2.5,
    };

    for (let sessionIdx = 0; sessionIdx < lowerBodyOffsets.length; sessionIdx++) {
      const daysAgo = lowerBodyOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];

      // Calculate weeks of training (0-5)
      const weeksTraining = Math.floor((42 - daysAgo) / 7);

      // Simulate "good" and "bad" days (every 3rd session is slightly harder)
      const isToughDay = sessionIdx % 4 === 2;
      const dayModifier = isToughDay ? 0.95 : 1;

      // Base timestamp for the session (morning workout between 7-10 AM)
      const sessionStartHour = 7 + Math.floor(Math.random() * 3);
      let exerciseTime = new Date(date);
      exerciseTime.setHours(sessionStartHour, Math.floor(Math.random() * 60), 0, 0);

      // 1. Squat multi power: 4 sets, same weight, decreasing reps due to fatigue
      const squatWeight = Math.round(
        (baseWeights.squatMultiPower + weeksTraining * weeklyProgression.squatMultiPower) * dayModifier / 2.5
      ) * 2.5;
      const squatBaseReps = [10, 9, 8, 8]; // Realistic fatigue pattern
      for (let set = 1; set <= 4; set++) {
        const reps = squatBaseReps[set - 1] + (isToughDay ? -1 : 0) + (Math.random() > 0.7 ? 1 : 0);
        const protocol = set === 4 && sessionIdx % 3 === 0 ? "myo-reps" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Squat multi power",
          reps,
          weight: squatWeight,
          volume: reps * squatWeight,
          workout: workoutName,
          notes: protocol === "myo-reps" ? `Myo: ${reps}+3+3+2` : "",
          protocol,
          timestamp: exerciseTime.getTime(),
        });
        exerciseTime = new Date(exerciseTime.getTime() + 180000 + Math.random() * 60000); // 3-4 min rest
      }

      // 2. RDL: 4 sets, consistent weight
      const rdlWeight = Math.round(
        (baseWeights.rdl + weeksTraining * weeklyProgression.rdl) * dayModifier / 2.5
      ) * 2.5;
      const rdlBaseReps = [12, 11, 10, 10];
      for (let set = 1; set <= 4; set++) {
        const reps = rdlBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol = set === 4 && sessionIdx % 4 === 1 ? "rest-pause" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "RDL",
          reps,
          weight: rdlWeight,
          volume: reps * rdlWeight,
          workout: workoutName,
          notes: protocol === "rest-pause" ? `RP: ${reps}+4+3` : "",
          protocol,
          timestamp: exerciseTime.getTime(),
        });
        exerciseTime = new Date(exerciseTime.getTime() + 150000 + Math.random() * 60000);
      }

      // 3. Leg press 45: 4 sets
      const legPressWeight = Math.round(
        (baseWeights.legPress + weeksTraining * weeklyProgression.legPress) * dayModifier / 5
      ) * 5;
      const legPressBaseReps = [15, 14, 12, 12];
      for (let set = 1; set <= 4; set++) {
        const reps = legPressBaseReps[set - 1] + (isToughDay ? -2 : 0);
        const protocol = set === 4 && sessionIdx % 5 === 0 ? "dropset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg press 45",
          reps,
          weight: legPressWeight,
          volume: reps * legPressWeight,
          workout: workoutName,
          notes: protocol === "dropset" ? `Drop: ${legPressWeight}->${legPressWeight - 20}->${legPressWeight - 40}` : "",
          protocol,
          timestamp: exerciseTime.getTime(),
        });
        exerciseTime = new Date(exerciseTime.getTime() + 120000 + Math.random() * 30000);
      }

      // 4. Leg Curl seduto: 3 sets
      const legCurlWeight = Math.round(
        (baseWeights.legCurl + weeksTraining * weeklyProgression.legCurl) * dayModifier / 1.25
      ) * 1.25;
      const legCurlBaseReps = [14, 12, 11];
      for (let set = 1; set <= 3; set++) {
        const reps = legCurlBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol = set === 3 && sessionIdx % 6 === 0 ? "21s" : "standard";
        const actualReps = protocol === "21s" ? 21 : reps;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg Curl seduto",
          reps: actualReps,
          weight: legCurlWeight,
          volume: actualReps * legCurlWeight,
          workout: workoutName,
          notes: protocol === "21s" ? "21s: 7+7+7" : "",
          protocol,
          timestamp: exerciseTime.getTime(),
        });
        exerciseTime = new Date(exerciseTime.getTime() + 90000 + Math.random() * 30000);
      }

      // 5. Calf Machine: 4 sets
      const calfWeight = Math.round(
        (baseWeights.calfMachine + weeksTraining * weeklyProgression.calfMachine) * dayModifier / 2.5
      ) * 2.5;
      const calfBaseReps = [18, 16, 15, 14];
      for (let set = 1; set <= 4; set++) {
        const reps = calfBaseReps[set - 1] + (isToughDay ? -2 : 0) + (Math.random() > 0.8 ? 2 : 0);
        const protocol = set % 2 === 0 && sessionIdx > 6 ? "superset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Calf Machine",
          reps,
          weight: calfWeight,
          volume: reps * calfWeight,
          workout: workoutName,
          notes: protocol === "superset" ? "SS con calf BW" : "",
          protocol,
          timestamp: exerciseTime.getTime(),
        });
        exerciseTime = new Date(exerciseTime.getTime() + 60000 + Math.random() * 30000);
      }

      // 6. Plank: 3 sets (Timed) - duration improves over time
      const basePlankDuration = 45 + weeksTraining * 5;
      for (let set = 1; set <= 3; set++) {
        const duration = basePlankDuration + (3 - set) * 10 - (isToughDay ? 10 : 0);
        rows.push(
          `${dateStr},Plank,0,0,0,,${workoutName},${exerciseTime.getTime()},,standard,${duration},,`,
        );
        exerciseTime = new Date(exerciseTime.getTime() + 90000);
      }
    }

    // Upper Body sessions: ~2x per week for 6 weeks
    const upperBodyOffsets = [39, 36, 32, 29, 25, 22, 18, 15, 11, 8, 4, 1];
    const upperWorkoutName = "Upper Body Power";

    const upperBaseWeights = {
      benchPress: 60,
      squat: 80,
    };

    for (let sessionIdx = 0; sessionIdx < upperBodyOffsets.length; sessionIdx++) {
      const daysAgo = upperBodyOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];

      const weeksTraining = Math.floor((42 - daysAgo) / 7);
      const isToughDay = sessionIdx % 5 === 3;
      const dayModifier = isToughDay ? 0.95 : 1;

      const sessionStartHour = 17 + Math.floor(Math.random() * 2); // Evening workouts
      let exerciseTime = new Date(date);
      exerciseTime.setHours(sessionStartHour, Math.floor(Math.random() * 60), 0, 0);

      // Bench Press: progressive overload
      const benchWeight = Math.round(
        (upperBaseWeights.benchPress + weeksTraining * 2.5) * dayModifier / 2.5
      ) * 2.5;
      const benchBaseReps = [8, 7, 6, 6];
      for (let set = 1; set <= 4; set++) {
        const reps = benchBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocols = ["standard", "rest-pause", "myo-reps", "dropset"];
        const protocol = set === 4 && sessionIdx % 4 === set - 1 ? protocols[sessionIdx % 4] : "standard";
        const notes = protocol !== "standard" ? `${protocol}` : "";
        rows.push(
          `${dateStr},Bench Press,${reps},${benchWeight},${reps * benchWeight},,${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
        );
        exerciseTime = new Date(exerciseTime.getTime() + 180000 + Math.random() * 60000);
      }

      // Squat: progressive overload
      const squatWeight = Math.round(
        (upperBaseWeights.squat + weeksTraining * 5) * dayModifier / 5
      ) * 5;
      const squatBaseReps = [6, 5, 5, 5];
      for (let set = 1; set <= 4; set++) {
        const reps = squatBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol = sessionIdx % 3 === 0 && set === 4 ? "superset" : "standard";
        const notes = protocol === "superset" ? "SS con lunges" : "";
        rows.push(
          `${dateStr},Squat,${reps},${squatWeight},${reps * squatWeight},,${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
        );
        exerciseTime = new Date(exerciseTime.getTime() + 180000 + Math.random() * 60000);
      }
    }

    // Cardio sessions: ~2x per week for 6 weeks - with progressive improvement
    const cardioOffsets = [38, 34, 31, 27, 24, 20, 17, 13, 10, 6, 3];
    const cardioWorkoutName = "Cardio Day";

    for (let sessionIdx = 0; sessionIdx < cardioOffsets.length; sessionIdx++) {
      const daysAgo = cardioOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];

      const weeksTraining = Math.floor((42 - daysAgo) / 7);

      // Morning cardio
      let exerciseTime = new Date(date);
      exerciseTime.setHours(6 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);

      // Running: distance and pace improve over time
      const baseRunDistance = 4;
      const runDistance = Math.round((baseRunDistance + weeksTraining * 0.3) * 10) / 10;
      const baseRunDuration = 28; // minutes
      const runDuration = Math.round(baseRunDuration + runDistance * 5.5 - weeksTraining * 0.5);
      const runHeartRate = 150 - weeksTraining * 2 + Math.floor(Math.random() * 10);
      rows.push(
        `${dateStr},Running,0,0,0,,${cardioWorkoutName},${exerciseTime.getTime()},,standard,${runDuration},${runDistance},${runHeartRate}`,
      );

      exerciseTime = new Date(exerciseTime.getTime() + runDuration * 60000 + 600000);

      // Cycling: distance and duration improve
      const baseCycleDistance = 15;
      const cycleDistance = Math.round((baseCycleDistance + weeksTraining * 1.5) * 10) / 10;
      const baseCycleDuration = 40;
      const cycleDuration = Math.round(baseCycleDuration + cycleDistance * 1.8 - weeksTraining);
      const cycleHeartRate = 135 - weeksTraining + Math.floor(Math.random() * 8);
      rows.push(
        `${dateStr},Cycling,0,0,0,,${cardioWorkoutName},${exerciseTime.getTime()},,standard,${cycleDuration},${cycleDistance},${cycleHeartRate}`,
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
      timestamp?: number;
    },
  ): void {
    // Use provided timestamp or generate one
    const timestamp =
      data.timestamp ??
      new Date(data.date).getTime() +
        Math.floor(Math.random() * 3600000) +
        36000000;
    // date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate
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
