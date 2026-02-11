import { App, normalizePath, Notice, TFolder } from "obsidian";
import { t } from "@app/i18n";

export class ExampleGeneratorService {
  constructor(private app: App) {}

  public async generateExampleFolder(
    overwrite: boolean = false,
  ): Promise<void> {
    const baseFolderName = t("examples.folderNames.base");
    const basePath = normalizePath(baseFolderName);
    const exercisesPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.exercises")}`,
    );
    const workoutsPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.workouts")}`,
    );
    const logPath = normalizePath(
      `${baseFolderName}/${t("examples.folderNames.log")}`,
    );

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
        t("examples.exercises.benchPress.name"),
        "strength",
        ["chest", "triceps", "shoulders"],
        overwrite,
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.squat.name"),
        "strength",
        ["legs", "quads", "glutes"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.running.name"),
        "cardio",
        ["cardio", "legs"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.plank.name"),
        "timed",
        ["core", "abs"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.cycling.name"),
        "distance",
        ["cardio", "legs"],
      );

      // New exercises for the specific workout
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.squatMultiPower.name"),
        "strength",
        ["legs", "quads"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.rdl.name"),
        "strength",
        ["legs", "hamstrings", "glutes"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.legPress45.name"),
        "strength",
        ["legs", "quads"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.legCurlSeated.name"),
        "strength",
        ["legs", "hamstrings"],
      );
      await this.createExerciseFile(
        exercisesPath,
        t("examples.exercises.calfMachine.name"),
        "strength",
        ["legs", "calves"],
      );

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

      new Notice(
        t("examples.folderCreatedSuccess", { folder: baseFolderName }),
      );
    } catch {
      new Notice(t("examples.folderCreatedError"));
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
    const content = `# ${t("examples.gettingStarted.title")}

${t("examples.gettingStarted.welcome")}

## ${t("examples.gettingStarted.folderStructureTitle")}

| ${t("examples.gettingStarted.tableHeaderFileFolder")} | ${t("examples.gettingStarted.tableHeaderDescription")} |
|-------------|-------------|
| [[Dashboard]] | ${t("examples.gettingStarted.dashboardDesc")} |
| [[Feature Showcase]] | ${t("examples.gettingStarted.featureShowcaseDesc")} |
| ${t("examples.gettingStarted.exercisesFolder", { folder: t("examples.folderNames.exercises") })} | ${t("examples.gettingStarted.exercisesDesc")} |
| ${t("examples.gettingStarted.workoutsFolder", { folder: t("examples.folderNames.workouts") })} | ${t("examples.gettingStarted.workoutsDesc")} |
| ${t("examples.gettingStarted.logFolder", { folder: t("examples.folderNames.log") })} | ${t("examples.gettingStarted.logDesc")} |

## ${t("examples.gettingStarted.quickActionsTitle")}

${t("examples.gettingStarted.quickActionsIntro")}
- **${t("examples.gettingStarted.commandCreateLog")}** - ${t("examples.gettingStarted.commandCreateLogDesc")}
- **${t("examples.gettingStarted.commandInsertChart")}** - ${t("examples.gettingStarted.commandInsertChartDesc")}
- **${t("examples.gettingStarted.commandInsertTimer")}** - ${t("examples.gettingStarted.commandInsertTimerDesc")}
- **${t("examples.gettingStarted.commandCreateExercise")}** - ${t("examples.gettingStarted.commandCreateExerciseDesc")}

## ${t("examples.gettingStarted.nextStepsTitle")}

1. ${t("examples.gettingStarted.step1")}
2. ${t("examples.gettingStarted.step2")}
3. ${t("examples.gettingStarted.step3", { workouts: t("examples.folderNames.workouts") })}
4. ${t("examples.gettingStarted.step4", { exercises: t("examples.folderNames.exercises") })}

`;
    await this.createOrUpdateFile(
      folderPath,
      "Getting Started.md",
      content,
      overwrite,
    );
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
    const workoutName = t("examples.workouts.lowerBodyA.name");
    const content = `## ${t("examples.workout.duration")}
\`\`\`workout-duration
\`\`\`
    ### ${t("examples.workout.chart")}

\`\`\`workout-chart
chartType: workout
type: volume
workout: ${workoutName}
dateRange: 89
limit: 50
showTrendLine: true
showTrend: true
showStats: true
\`\`\`

## ${t("examples.exercises.squatMultiPower.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-10" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

**${t("examples.workout.note")}**

\`\`\`workout-timer
duration: 180
type: countdown
title: Hip Thrust
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: ${t("examples.exercises.squatMultiPower.name")}
workout: ${workoutName}
limit: 12
exactMatch: true
\`\`\`

## ${t("examples.exercises.rdl.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-12" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

\`\`\`workout-timer
duration: 180
type: countdown
title: RDL
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: ${t("examples.exercises.rdl.name")}
workout: ${workoutName}
limit: 12
exactMatch: true
\`\`\`

## ${t("examples.exercises.legPress45.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "120" })}

\`\`\`workout-timer
duration: 120
type: countdown
title: Hack squat
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: ${t("examples.exercises.legPress45.name")}
workout: ${workoutName}
limit: 12
exactMatch: true
\`\`\`

## ${t("examples.exercises.legCurlSeated.name")}:

### ${t("examples.workout.setsReps", { sets: "3", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "90" })}

\`\`\`workout-timer
duration: 90
type: countdown
title: Leg Curl Sdraiato
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: ${t("examples.exercises.legCurlSeated.name")}
workout: ${workoutName}
limit: 12
exactMatch: true
\`\`\`

## ${t("examples.exercises.calfMachine.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "15-20" })} ${t("examples.workout.recoverySuffix", { seconds: "60" })}

\`\`\`workout-timer
duration: 60
type: countdown
title: Calf Machine
showControls: true
autoStart: false
sound: true
\`\`\`

\`\`\`workout-log
exercise: ${t("examples.exercises.calfMachine.name")}
workout: ${workoutName}
limit: 12
exactMatch: true
\`\`\`
`;
    await this.createOrUpdateFile(
      folderPath,
      `${workoutName}.md`,
      content,
      overwrite,
    );
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

    const workoutName = t("examples.workouts.lowerBodyA.name");

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

    for (
      let sessionIdx = 0;
      sessionIdx < lowerBodyOffsets.length;
      sessionIdx++
    ) {
      const daysAgo = lowerBodyOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      // Use full ISO string to match the requested format
      const dateStr = date.toISOString();

      // Calculate weeks of training (0-5)
      const weeksTraining = Math.floor((42 - daysAgo) / 7);

      // Simulate "good" and "bad" days (every 3rd session is slightly harder)
      const isToughDay = sessionIdx % 4 === 2;
      const dayModifier = isToughDay ? 0.95 : 1;

      // Base timestamp for the session (morning workout between 7-10 AM)
      const sessionStartHour = 7 + Math.floor(Math.random() * 3);
      let exerciseTime = new Date(date);
      exerciseTime.setHours(
        sessionStartHour,
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      // 1. Squat multi power: 4 sets, same weight, decreasing reps due to fatigue
      const squatWeight =
        Math.round(
          ((baseWeights.squatMultiPower +
            weeksTraining * weeklyProgression.squatMultiPower) *
            dayModifier) /
            2.5,
        ) * 2.5;
      const squatBaseReps = [10, 9, 8, 8]; // Realistic fatigue pattern
      for (let set = 1; set <= 4; set++) {
        const reps =
          squatBaseReps[set - 1] +
          (isToughDay ? -1 : 0) +
          (Math.random() > 0.7 ? 1 : 0);
        const protocol =
          set === 4 && sessionIdx % 3 === 0 ? "myo-reps" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: t("examples.exercises.squatMultiPower.name"),
          reps,
          weight: squatWeight,
          volume: reps * squatWeight,
          workout: workoutName,
          notes: protocol === "myo-reps" ? `Myo: ${reps}+3+3+2` : "",
          protocol,
          timestamp: exerciseTime.getTime(),
          origine: `[[${workoutName}]]`,
        });
        exerciseTime = new Date(
          exerciseTime.getTime() + 180000 + Math.random() * 60000,
        ); // 3-4 min rest
      }

      // 2. RDL: 4 sets, consistent weight
      const rdlWeight =
        Math.round(
          ((baseWeights.rdl + weeksTraining * weeklyProgression.rdl) *
            dayModifier) /
            2.5,
        ) * 2.5;
      const rdlBaseReps = [12, 11, 10, 10];
      for (let set = 1; set <= 4; set++) {
        const reps = rdlBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol =
          set === 4 && sessionIdx % 4 === 1 ? "rest-pause" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: t("examples.exercises.rdl.name"),
          reps,
          weight: rdlWeight,
          volume: reps * rdlWeight,
          workout: workoutName,
          notes: protocol === "rest-pause" ? `RP: ${reps}+4+3` : "",
          protocol,
          timestamp: exerciseTime.getTime(),
          origine: `[[${workoutName}]]`,
        });
        exerciseTime = new Date(
          exerciseTime.getTime() + 150000 + Math.random() * 60000,
        );
      }

      // 3. Leg press 45: 4 sets
      const legPressWeight =
        Math.round(
          ((baseWeights.legPress + weeksTraining * weeklyProgression.legPress) *
            dayModifier) /
            5,
        ) * 5;
      const legPressBaseReps = [15, 14, 12, 12];
      for (let set = 1; set <= 4; set++) {
        const reps = legPressBaseReps[set - 1] + (isToughDay ? -2 : 0);
        const protocol =
          set === 4 && sessionIdx % 5 === 0 ? "dropset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: t("examples.exercises.legPress45.name"),
          reps,
          weight: legPressWeight,
          volume: reps * legPressWeight,
          workout: workoutName,
          notes:
            protocol === "dropset"
              ? `Drop: ${legPressWeight}->${legPressWeight - 20}->${legPressWeight - 40}`
              : "",
          protocol,
          timestamp: exerciseTime.getTime(),
          origine: `[[${workoutName}]]`,
        });
        exerciseTime = new Date(
          exerciseTime.getTime() + 120000 + Math.random() * 30000,
        );
      }

      // 4. Leg Curl seduto: 3 sets
      const legCurlWeight =
        Math.round(
          ((baseWeights.legCurl + weeksTraining * weeklyProgression.legCurl) *
            dayModifier) /
            1.25,
        ) * 1.25;
      const legCurlBaseReps = [14, 12, 11];
      for (let set = 1; set <= 3; set++) {
        const reps = legCurlBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol = set === 3 && sessionIdx % 6 === 0 ? "21s" : "standard";
        const actualReps = protocol === "21s" ? 21 : reps;
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: t("examples.exercises.legCurlSeated.name"),
          reps: actualReps,
          weight: legCurlWeight,
          volume: actualReps * legCurlWeight,
          workout: workoutName,
          notes: protocol === "21s" ? "21s: 7+7+7" : "",
          protocol,
          timestamp: exerciseTime.getTime(),
          origine: `[[${workoutName}]]`,
        });
        exerciseTime = new Date(
          exerciseTime.getTime() + 90000 + Math.random() * 30000,
        );
      }

      // 5. Calf Machine: 4 sets
      const calfWeight =
        Math.round(
          ((baseWeights.calfMachine +
            weeksTraining * weeklyProgression.calfMachine) *
            dayModifier) /
            2.5,
        ) * 2.5;
      const calfBaseReps = [18, 16, 15, 14];
      for (let set = 1; set <= 4; set++) {
        const reps =
          calfBaseReps[set - 1] +
          (isToughDay ? -2 : 0) +
          (Math.random() > 0.8 ? 2 : 0);
        const protocol =
          set % 2 === 0 && sessionIdx > 6 ? "superset" : "standard";
        this.addLogEntry(rows, {
          date: dateStr,
          exercise: t("examples.exercises.calfMachine.name"),
          reps,
          weight: calfWeight,
          volume: reps * calfWeight,
          workout: workoutName,
          notes: protocol === "superset" ? "SS con calf BW" : "",
          protocol,
          timestamp: exerciseTime.getTime(),
          origine: `[[${workoutName}]]`,
        });
        exerciseTime = new Date(
          exerciseTime.getTime() + 60000 + Math.random() * 30000,
        );
      }

      // 6. Plank: 3 sets (Timed) - duration improves over time
      const basePlankDuration = 45 + weeksTraining * 5;
      for (let set = 1; set <= 3; set++) {
        const duration =
          basePlankDuration + (3 - set) * 10 - (isToughDay ? 10 : 0);
        rows.push(
          `${dateStr},${t("examples.exercises.plank.name")},0,0,0,[[${workoutName}]],${workoutName},${exerciseTime.getTime()},,standard,${duration},,`,
        );
        exerciseTime = new Date(exerciseTime.getTime() + 90000);
      }
    }

    // Upper Body sessions: ~2x per week for 6 weeks
    const upperBodyOffsets = [39, 36, 32, 29, 25, 22, 18, 15, 11, 8, 4, 1];
    const upperWorkoutName = t("examples.workouts.upperBodyPower.name");

    const upperBaseWeights = {
      benchPress: 60,
      squat: 80,
    };

    for (
      let sessionIdx = 0;
      sessionIdx < upperBodyOffsets.length;
      sessionIdx++
    ) {
      const daysAgo = upperBodyOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString();

      const weeksTraining = Math.floor((42 - daysAgo) / 7);
      const isToughDay = sessionIdx % 5 === 3;
      const dayModifier = isToughDay ? 0.95 : 1;

      const sessionStartHour = 17 + Math.floor(Math.random() * 2); // Evening workouts
      let exerciseTime = new Date(date);
      exerciseTime.setHours(
        sessionStartHour,
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      // Bench Press: progressive overload
      const benchWeight =
        Math.round(
          ((upperBaseWeights.benchPress + weeksTraining * 2.5) * dayModifier) /
            2.5,
        ) * 2.5;
      const benchBaseReps = [8, 7, 6, 6];
      for (let set = 1; set <= 4; set++) {
        const reps = benchBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocols = ["standard", "rest-pause", "myo-reps", "dropset"];
        const protocol =
          set === 4 && sessionIdx % 4 === set - 1
            ? protocols[sessionIdx % 4]
            : "standard";
        const notes = protocol !== "standard" ? `${protocol}` : "";
        rows.push(
          `${dateStr},${t("examples.exercises.benchPress.name")},${reps},${benchWeight},${reps * benchWeight},[[${upperWorkoutName}]],${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
        );
        exerciseTime = new Date(
          exerciseTime.getTime() + 180000 + Math.random() * 60000,
        );
      }

      // Squat: progressive overload
      const squatWeight =
        Math.round(
          ((upperBaseWeights.squat + weeksTraining * 5) * dayModifier) / 5,
        ) * 5;
      const squatBaseReps = [6, 5, 5, 5];
      for (let set = 1; set <= 4; set++) {
        const reps = squatBaseReps[set - 1] + (isToughDay ? -1 : 0);
        const protocol =
          sessionIdx % 3 === 0 && set === 4 ? "superset" : "standard";
        const notes = protocol === "superset" ? "SS con lunges" : "";
        rows.push(
          `${dateStr},Squat,${reps},${squatWeight},${reps * squatWeight},[[${upperWorkoutName}]],${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
        );
        exerciseTime = new Date(
          exerciseTime.getTime() + 180000 + Math.random() * 60000,
        );
      }
    }

    // Cardio sessions: ~2x per week for 6 weeks - with progressive improvement
    const cardioOffsets = [38, 34, 31, 27, 24, 20, 17, 13, 10, 6, 3];
    const cardioWorkoutName = t("examples.workouts.cardioDay.name");

    for (let sessionIdx = 0; sessionIdx < cardioOffsets.length; sessionIdx++) {
      const daysAgo = cardioOffsets[sessionIdx];
      const date = new Date(now.getTime() - daysAgo * oneDay);
      const dateStr = date.toISOString();

      const weeksTraining = Math.floor((42 - daysAgo) / 7);

      // Morning cardio
      let exerciseTime = new Date(date);
      exerciseTime.setHours(
        6 + Math.floor(Math.random() * 2),
        Math.floor(Math.random() * 60),
        0,
        0,
      );

      // Running: distance and pace improve over time
      const baseRunDistance = 4;
      const runDistance =
        Math.round((baseRunDistance + weeksTraining * 0.3) * 10) / 10;
      const baseRunDuration = 28; // minutes
      const runDuration = Math.round(
        baseRunDuration + runDistance * 5.5 - weeksTraining * 0.5,
      );
      const runHeartRate =
        150 - weeksTraining * 2 + Math.floor(Math.random() * 10);
      rows.push(
        `${dateStr},${t("examples.exercises.running.name")},0,0,0,[[${cardioWorkoutName}]],${cardioWorkoutName},${exerciseTime.getTime()},,standard,${runDuration},${runDistance},${runHeartRate}`,
      );

      exerciseTime = new Date(
        exerciseTime.getTime() + runDuration * 60000 + 600000,
      );

      // Cycling: distance and duration improve
      const baseCycleDistance = 15;
      const cycleDistance =
        Math.round((baseCycleDistance + weeksTraining * 1.5) * 10) / 10;
      const baseCycleDuration = 40;
      const cycleDuration = Math.round(
        baseCycleDuration + cycleDistance * 1.8 - weeksTraining,
      );
      const cycleHeartRate =
        135 - weeksTraining + Math.floor(Math.random() * 8);
      rows.push(
        `${dateStr},Cycling,0,0,0,[[${cardioWorkoutName}]],${cardioWorkoutName},${exerciseTime.getTime()},,standard,${cycleDuration},${cycleDistance},${cycleHeartRate}`,
      );
    }

    const content = [header, ...rows].join("\n");
    await this.createOrUpdateFile(
      folderPath,
      "workout_logs.csv",
      content,
      overwrite,
    );
  }

  private async createDashboardFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# ${t("examples.dashboard.title")}

${t("examples.dashboard.description")}

\`\`\`workout-dashboard
\`\`\`
`;
    await this.createOrUpdateFile(
      folderPath,
      "Dashboard.md",
      content,
      overwrite,
    );
  }

  private async createFeatureShowcaseFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# ${t("examples.featureShowcase.title")}

${t("examples.featureShowcase.intro")}

> ${t("examples.featureShowcase.tip")}

---

## ${t("examples.featureShowcase.chartsTitle")}

${t("examples.featureShowcase.chartsIntro")}

### ${t("examples.featureShowcase.strengthExerciseTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.benchPress.name")}
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.squat.name")}
type: weight
dateRange: 30
showTrendLine: true
\`\`\`

### ${t("examples.featureShowcase.cardioExerciseTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.running.name")}
type: distance
dateRange: 30
showTrendLine: true
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.running.name")}
type: pace
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### ${t("examples.featureShowcase.timedExerciseTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.plank.name")}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

### ${t("examples.featureShowcase.workoutChartTitle")}

\`\`\`workout-chart
chartType: workout
workout: ${t("examples.workouts.lowerBodyA.name")}
type: volume
dateRange: 60
showTrendLine: true
showStats: true
\`\`\`

### ${t("examples.featureShowcase.allDataChartTitle")}

\`\`\`workout-chart
chartType: all
type: volume
dateRange: 30
showTrendLine: true
\`\`\`

---

## ${t("examples.featureShowcase.tablesTitle")}

${t("examples.featureShowcase.tablesIntro")}

### ${t("examples.featureShowcase.byExerciseTitle")}

\`\`\`workout-log
exercise: ${t("examples.exercises.benchPress.name")}
limit: 10
\`\`\`

### ${t("examples.featureShowcase.byWorkoutTitle")}

\`\`\`workout-log
workout: ${t("examples.workouts.lowerBodyA.name")}
limit: 15
\`\`\`

### ${t("examples.featureShowcase.combinedTitle")}

\`\`\`workout-log
exercise: ${t("examples.exercises.squat.name")} multi power
workout: ${t("examples.workouts.lowerBodyA.name")}
exactMatch: true
limit: 10
\`\`\`

---

## ${t("examples.featureShowcase.timersTitle")}

### ${t("examples.featureShowcase.countdownTimerTitle")}

\`\`\`workout-timer
type: countdown
duration: 90
title: Rest Timer
showControls: true
sound: true
\`\`\`

### ${t("examples.featureShowcase.intervalTimerTitle")}

\`\`\`workout-timer
type: interval
duration: 30
rounds: 5
title: HIIT Intervals
showControls: true
sound: true
\`\`\`

---

## ${t("examples.featureShowcase.durationEstimatorTitle")}

${t("examples.featureShowcase.durationEstimatorIntro")}

\`\`\`workout-duration
\`\`\`

---

## ${t("examples.featureShowcase.trainingProtocolsTitle")}

${t("examples.featureShowcase.trainingProtocolsIntro")}

| Protocol | Description |
|----------|-------------|
| standard | ${t("examples.featureShowcase.protocolStandard")} |
| dropset | ${t("examples.featureShowcase.protocolDropset")} |
| myo-reps | ${t("examples.featureShowcase.protocolMyoReps")} |
| rest-pause | ${t("examples.featureShowcase.protocolRestPause")} |
| superset | ${t("examples.featureShowcase.protocolSuperset")} |
| 21s | ${t("examples.featureShowcase.protocol21s")} |

---

## ${t("examples.featureShowcase.quickReferenceTitle")}

| Code Block | Purpose |
|------------|---------|
| \`workout-chart\` | ${t("examples.featureShowcase.codeBlockWorkoutChart")} |
| \`workout-log\` | ${t("examples.featureShowcase.codeBlockWorkoutLog")} |
| \`workout-timer\` | ${t("examples.featureShowcase.codeBlockWorkoutTimer")} |
| \`workout-duration\` | ${t("examples.featureShowcase.codeBlockWorkoutDuration")} |
| \`workout-dashboard\` | ${t("examples.featureShowcase.codeBlockWorkoutDashboard")} |

${t("examples.featureShowcase.commandsNote")}
`;
    await this.createOrUpdateFile(
      folderPath,
      "Feature Showcase.md",
      content,
      overwrite,
    );
  }

  private async createHIITWorkoutFile(
    folderPath: string,
    overwrite: boolean,
  ): Promise<void> {
    const content = `# ${t("examples.hiit.title")}

${t("examples.hiit.intro")}

\`\`\`workout-duration
\`\`\`

---

## ${t("examples.hiit.warmupTitle")}

\`\`\`workout-timer
type: countdown
duration: 300
title: Warm-up
showControls: true
sound: true
\`\`\`

---

## ${t("examples.hiit.sprintIntervalsTitle")}

\`\`\`workout-timer
type: interval
duration: 30
rounds: 8
title: Sprint Intervals
showControls: true
sound: true
\`\`\`

---

## ${t("examples.hiit.runningProgressTitle")}

\`\`\`workout-log
exercise: ${t("examples.exercises.running.name")}
limit: 8
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.running.name")}
type: distance
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

---

## ${t("examples.hiit.cyclingCooldownTitle")}

\`\`\`workout-log
exercise: ${t("examples.exercises.cycling.name")}
limit: 8
\`\`\`

\`\`\`workout-chart
chartType: exercise
exercise: ${t("examples.exercises.cycling.name")}
type: distance
dateRange: 30
showTrendLine: true
\`\`\`
`;
    await this.createOrUpdateFile(
      folderPath,
      "HIIT Cardio Session.md",
      content,
      overwrite,
    );
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
      origine?: string;
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
    const origine = data.origine || "";
    const row = `${data.date},${data.exercise},${data.reps},${data.weight},${data.volume},${origine},${data.workout},${timestamp},${data.notes || ""},${protocol},,,`;
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
exercise_name: ${name}
exercise_type: ${type}
${tagsYaml}
---

# ${name}

## ${t("examples.exercise.descriptionTitle")}

${t("examples.exercise.descriptionTemplate", { name })}

## ${t("examples.exercise.logTitle")}

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
        return `## ${t("examples.exercise.volumeChartTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: volume
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## ${t("examples.exercise.weightProgressionTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: weight
dateRange: 30
showTrendLine: true
\`\`\`

## ${t("examples.exercise.repTrackingTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: reps
dateRange: 30
\`\`\``;

      case "timed":
        return `## ${t("examples.exercise.durationChartTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      case "cardio":
        return `## ${t("examples.exercise.durationChartTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## ${t("examples.exercise.heartRateTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: heartRate
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      case "distance":
        return `## ${t("examples.exercise.distanceChartTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: distance
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## ${t("examples.exercise.durationTitle")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: duration
dateRange: 30
showTrendLine: true
showStats: true
\`\`\`

## ${t("examples.exercise.paceTrackingTitle")}

${t("examples.exercise.paceTrackingNote")}

\`\`\`workout-chart
chartType: exercise
exercise: ${name}
type: pace
dateRange: 30
showTrendLine: true
showStats: true
\`\`\``;

      default:
        return `## ${t("examples.exercise.chartTitle")}

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
