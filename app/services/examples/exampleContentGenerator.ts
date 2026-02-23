import { t } from "@app/i18n";
import {
  getChartSectionsForExerciseType,
  generateWorkoutChartBlock,
  generateExerciseChartBlock,
  generateAllDataChartBlock,
} from "@app/features/charts/exampleChartGenerator";
import {
  generateCountdownTimerBlock,
  generateIntervalTimerBlock,
} from "@app/features/timer/exampleTimerGenerator";
import {
  generateExerciseLogBlock,
  generateExerciseOnlyLogBlock,
  generateWorkoutLogBlock,
  generateCombinedLogBlock,
} from "@app/features/tables/exampleTableGenerator";
import { generateDashboardBlock } from "@app/features/dashboard/exampleDashboardGenerator";
import { generateDurationBlock } from "@app/features/duration/exampleDurationGenerator";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

export function generateGettingStartedContent(): string {
  return `# ${t("examples.gettingStarted.title")}

${t("examples.gettingStarted.welcome")}

## ${t("examples.gettingStarted.folderStructureTitle")}

| ${t("examples.gettingStarted.tableHeaderFileFolder")} | ${t("examples.gettingStarted.tableHeaderDescription")} |
|-------------|-------------|
| [[${t("examples.fileNames.dashboard")}]] | ${t("examples.gettingStarted.dashboardDesc")} |
| [[${t("examples.fileNames.featureShowcase")}]] | ${t("examples.gettingStarted.featureShowcaseDesc")} |
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

1. ${t("examples.gettingStarted.step1", { dashboard: t("examples.fileNames.dashboard") })}
2. ${t("examples.gettingStarted.step2", { featureShowcase: t("examples.fileNames.featureShowcase") })}
3. ${t("examples.gettingStarted.step3", { workouts: t("examples.folderNames.workouts") })}
4. ${t("examples.gettingStarted.step4", { exercises: t("examples.folderNames.exercises") })}

`;
}

export function generateExerciseContent(
  name: string,
  type: string,
  tags: string[],
): string {
  const tagsYaml =
    tags.length > 0
      ? `tags:\n${tags.map((tag) => `  - ${tag}`).join("\n")}`
      : "";

  const chartSections = getChartSectionsForExerciseType(name, type);

  return `---
exercise_name: ${name}
exercise_type: ${type}
${tagsYaml}
---

# ${name}

## ${t("examples.exercise.descriptionTitle")}

${t("examples.exercise.descriptionTemplate", { name })}

## ${t("examples.exercise.logTitle")}

${generateExerciseOnlyLogBlock(name, 15)}

${chartSections}
`;
}

export function generateWorkoutContent(): string {
  const workoutName = t("examples.workouts.lowerBodyA.name");

  return `## ${t("examples.workout.duration")}
${generateDurationBlock()}
    ### ${t("examples.workout.chart")}

${generateWorkoutChartBlock(workoutName, { dateRange: 89 })}

## ${t("examples.exercises.squatMultiPower.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-10" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

**${t("examples.workout.note")}**

${generateCountdownTimerBlock(180, "Hip Thrust")}

${generateExerciseLogBlock(t("examples.exercises.squatMultiPower.name"), workoutName)}

## ${t("examples.exercises.rdl.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-12" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

${generateCountdownTimerBlock(180, "RDL")}

${generateExerciseLogBlock(t("examples.exercises.rdl.name"), workoutName)}

## ${t("examples.exercises.legPress45.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "120" })}

${generateCountdownTimerBlock(120, "Hack squat")}

${generateExerciseLogBlock(t("examples.exercises.legPress45.name"), workoutName)}

## ${t("examples.exercises.legCurlSeated.name")}:

### ${t("examples.workout.setsReps", { sets: "3", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "90" })}

${generateCountdownTimerBlock(90, "Leg Curl Sdraiato")}

${generateExerciseLogBlock(t("examples.exercises.legCurlSeated.name"), workoutName)}

## ${t("examples.exercises.calfMachine.name")}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "15-20" })} ${t("examples.workout.recoverySuffix", { seconds: "60" })}

${generateCountdownTimerBlock(60, "Calf Machine")}

${generateExerciseLogBlock(t("examples.exercises.calfMachine.name"), workoutName)}
`;
}

export function generateFeatureShowcaseContent(): string {
  const benchPress = t("examples.exercises.benchPress.name");
  const squat = t("examples.exercises.squat.name");
  const running = t("examples.exercises.running.name");
  const plank = t("examples.exercises.plank.name");
  const lowerBody = t("examples.workouts.lowerBodyA.name");

  return `# ${t("examples.featureShowcase.title")}

${t("examples.featureShowcase.intro")}

> ${t("examples.featureShowcase.tip", { dashboard: t("examples.fileNames.dashboard") })}

---

## ${t("examples.featureShowcase.chartsTitle")}

${t("examples.featureShowcase.chartsIntro")}

### ${t("examples.featureShowcase.strengthExerciseTitle")}

${generateExerciseChartBlock(benchPress, CHART_DATA_TYPE.VOLUME, { showStats: true })}

${generateExerciseChartBlock(squat, CHART_DATA_TYPE.WEIGHT)}

### ${t("examples.featureShowcase.cardioExerciseTitle")}

${generateExerciseChartBlock(running, CHART_DATA_TYPE.DISTANCE)}

${generateExerciseChartBlock(running, CHART_DATA_TYPE.PACE, { showStats: true })}

### ${t("examples.featureShowcase.timedExerciseTitle")}

${generateExerciseChartBlock(plank, CHART_DATA_TYPE.DURATION, { showStats: true })}

### ${t("examples.featureShowcase.workoutChartTitle")}

${generateWorkoutChartBlock(lowerBody)}

### ${t("examples.featureShowcase.allDataChartTitle")}

${generateAllDataChartBlock(CHART_DATA_TYPE.VOLUME)}

---

## ${t("examples.featureShowcase.tablesTitle")}

${t("examples.featureShowcase.tablesIntro")}

### ${t("examples.featureShowcase.byExerciseTitle")}

${generateExerciseOnlyLogBlock(benchPress, 10)}

### ${t("examples.featureShowcase.byWorkoutTitle")}

${generateWorkoutLogBlock(lowerBody, 15)}

### ${t("examples.featureShowcase.combinedTitle")}

${generateCombinedLogBlock(`${squat} multi power`, lowerBody, 10)}

---

## ${t("examples.featureShowcase.timersTitle")}

### ${t("examples.featureShowcase.countdownTimerTitle")}

${generateCountdownTimerBlock(90, "Rest Timer")}

### ${t("examples.featureShowcase.intervalTimerTitle")}

${generateIntervalTimerBlock(30, 5, "HIIT Intervals")}

---

## ${t("examples.featureShowcase.durationEstimatorTitle")}

${t("examples.featureShowcase.durationEstimatorIntro")}

${generateDurationBlock()}

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
}

export function generateHIITContent(): string {
  const running = t("examples.exercises.running.name");
  const cycling = t("examples.exercises.cycling.name");

  return `# ${t("examples.hiit.title")}

${t("examples.hiit.intro")}

${generateDurationBlock()}

---

## ${t("examples.hiit.warmupTitle")}

${generateCountdownTimerBlock(300, "Warm-up")}

---

## ${t("examples.hiit.sprintIntervalsTitle")}

${generateIntervalTimerBlock(30, 8, "Sprint Intervals")}

---

## ${t("examples.hiit.runningProgressTitle")}

${generateExerciseOnlyLogBlock(running, 8)}

${generateExerciseChartBlock(running, CHART_DATA_TYPE.DISTANCE, { showStats: true })}

---

## ${t("examples.hiit.cyclingCooldownTitle")}

${generateExerciseOnlyLogBlock(cycling, 8)}

${generateExerciseChartBlock(cycling, CHART_DATA_TYPE.DISTANCE)}
`;
}

export function generateDashboardContent(): string {
  return `# ${t("examples.dashboard.title")}

${t("examples.dashboard.description", { featureShowcase: t("examples.fileNames.featureShowcase") })}

${generateDashboardBlock()}
`;
}
