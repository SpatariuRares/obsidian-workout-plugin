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

    const content = `
# Dataview Examples

## List of Exercises

\`\`\`workout-dashboard
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
    const fileName = "workout_log.csv";
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

      // 1. Squat multi power: 4 sets
      for (let set = 1; set <= 4; set++) {
        const reps = 8 + Math.floor(Math.random() * 3); // 8-10
        const weight = 80 + set * 5; // Progressive weight
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Squat multi power",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
          notes: set === 4 ? "Hard set" : "",
        });
      }

      // 2. RDL: 4 sets
      for (let set = 1; set <= 4; set++) {
        const reps = 10;
        const weight = 60 + set * 2.5;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "RDL",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
        });
      }

      // 3. Leg press 45: 4 sets
      for (let set = 1; set <= 4; set++) {
        const reps = 12;
        const weight = 120 + set * 10;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg press 45",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
        });
      }

      // 4. Leg Curl seduto: 3 sets
      for (let set = 1; set <= 3; set++) {
        const reps = 12;
        const weight = 35 + set * 2.5;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Leg Curl seduto",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
        });
      }

      // 5. Calf Machine: 4 sets
      for (let set = 1; set <= 4; set++) {
        const reps = 15;
        const weight = 40;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: "Calf Machine",
          reps,
          weight,
          volume: reps * weight,
          workout: workoutName,
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
    for (const daysAgo of upperBodyOffsets) {
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString().split("T")[0];
      const workoutName = "Upper Body Power"; // Virtual workout name

      // Bench Press
      for (let set = 1; set <= 4; set++) {
        const reps = 5;
        const weight = 80 + set * 2.5;
        const timestamp = new Date(dateStr).getTime() + 36000000 + set * 300000;
        // Last set is a dropset
        const protocol = set === 4 ? "dropset" : "standard";
        rows.push(
          `${dateStr},Bench Press,${reps},${weight},${reps * weight},,${workoutName},${timestamp},,${protocol},,,`,
        );
      }

      // Squat (Standard)
      for (let set = 1; set <= 4; set++) {
        const reps = 5;
        const weight = 100 + set * 5;
        const timestamp = new Date(dateStr).getTime() + 37200000 + set * 300000;
        rows.push(
          `${dateStr},Squat,${reps},${weight},${reps * weight},,${workoutName},${timestamp},,standard,,,`,
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

    const content = `
# Dashboard

\`\`\`workout-dashboard
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
    },
  ): void {
    const timestamp =
      new Date(data.date).getTime() +
      Math.floor(Math.random() * 3600000) +
      36000000; // Add random time + 10h to be daytime
    // date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate
    // 0    1        2    3      4      5       6       7         8     9        10       11       12
    const row = `${data.date},${data.exercise},${data.reps},${data.weight},${data.volume},,${data.workout},${timestamp},${data.notes || ""},standard,,,`;
    rows.push(row);
  }

  private generateExerciseContent(
    name: string,
    type: string,
    tags: string[],
  ): string {
    const tagsYaml =
      tags.length > 0 ? `tags:\n${tags.map((t) => `  - ${t}`).join("\n")}` : "";

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
\`\`\`

## Chart

\`\`\`workout-chart
exercise: ${name}
\`\`\`
`;
  }
}
