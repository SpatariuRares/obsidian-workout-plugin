import { gettingStartedIndex } from "@app/services/examples/GettingStartedPages";
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
  generatePresetTimerBlock,
} from "@app/features/timer/exampleTimerGenerator";
import { timerPresetHelp } from "@app/features/timer/business/timerPresets";
import {
  generateExerciseLogBlock,
  generateExerciseOnlyLogBlock,
  generateWorkoutLogBlock,
  generateCombinedLogBlock,
} from "@app/features/tables/exampleTableGenerator";
import {
  generateDashboardBlock,
  generateGridDashboardBlock,
} from "@app/features/dashboard/exampleDashboardGenerator";
import { generateDurationBlock } from "@app/features/duration/exampleDurationGenerator";
import { generateSessionBlock } from "@app/features/session/exampleSessionGenerator";
import { CHART_DATA_TYPE } from "@app/types/WorkoutConfigTypes";
import {
  ProtocolCatalog,
  defaultProtocolEntries,
  protocolHelp,
} from "@app/services/protocols/ProtocolCatalog";

export function generateGettingStartedContent(): string {
  return gettingStartedIndex();
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
  const squatMultiPower = t("examples.exercises.squatMultiPower.name");
  const rdl = t("examples.exercises.rdl.name");
  const legPress = t("examples.exercises.legPress45.name");
  const legCurl = t("examples.exercises.legCurlSeated.name");
  const calfMachine = t("examples.exercises.calfMachine.name");

  return `## ${t("examples.workout.duration")}

${generateDurationBlock()}

### ${t("examples.workout.chart")}

${generateWorkoutChartBlock(workoutName, { dateRange: 89 })}

## ${t("examples.workout.session")}

${generateSessionBlock()}

## ${squatMultiPower}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-10" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

**${t("examples.workout.note")}**

${generateCountdownTimerBlock("idSquatMultiPower", 180, squatMultiPower)}

${generateExerciseLogBlock(squatMultiPower, workoutName, { sets: 4 })}

## ${rdl}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "8-12" })} ${t("examples.workout.recoverySuffix", { seconds: "180" })}

${generateCountdownTimerBlock("idRDL", 180, rdl)}

${generateExerciseLogBlock(rdl, workoutName, { sets: 4 })}

## ${legPress}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "120" })}

${generateCountdownTimerBlock("idLegPress45", 120, legPress)}

${generateExerciseLogBlock(legPress, workoutName, { sets: 4 })}

## ${legCurl}:

### ${t("examples.workout.setsReps", { sets: "3", reps: "10-15" })} ${t("examples.workout.recoverySuffix", { seconds: "90" })}

${generateCountdownTimerBlock("idLegCurl", 90, legCurl)}

${generateExerciseLogBlock(legCurl, workoutName, { sets: 3 })}

## ${calfMachine}:

### ${t("examples.workout.setsReps", { sets: "4", reps: "15-20" })} ${t("examples.workout.recoverySuffix", { seconds: "60" })}

${generateCountdownTimerBlock("idCalfMachine", 60, calfMachine)}

${generateExerciseLogBlock(calfMachine, workoutName, { sets: 4 })}
`;
}

/** Standard plus the built-in protocols, as a markdown table */
function protocolTable(): string {
  const rows = new ProtocolCatalog(defaultProtocolEntries())
    .all()
    .map(
      (p) =>
        `| ${p.name} | ${p.abbreviation} | ${protocolHelp(p.id) ?? t("examples.featureShowcase.protocolStandard")} |`,
    );
  return [
    `| ${t("examples.featureShowcase.protocolColumn")} | ${t("examples.featureShowcase.badgeColumn")} | ${t("examples.featureShowcase.descriptionColumn")} |`,
    "|---|---|---|",
    ...rows,
  ].join("\n");
}

export function generateFeatureShowcaseContent(): string {
  const benchPress = t("examples.exercises.benchPress.name");
  const squat = t("examples.exercises.squat.name");
  const squatMultiPower = t("examples.exercises.squatMultiPower.name");
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

### ${t("examples.featureShowcase.e1rmChartTitle")}

${t("examples.featureShowcase.e1rmIntro")}

${generateExerciseChartBlock(benchPress, CHART_DATA_TYPE.E1RM, { dateRange: 60, showStats: true })}

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

${generateCombinedLogBlock(squatMultiPower, lowerBody, 10)}

---

## ${t("examples.featureShowcase.timersTitle")}

### ${t("examples.featureShowcase.countdownTimerTitle")}

${generateCountdownTimerBlock("idCountdown", 90, benchPress)}

### ${t("examples.featureShowcase.intervalTimerTitle")}

${generateIntervalTimerBlock("idIntervals", { work: 40, rest: 20, rounds: 5 }, running)}

### ${t("examples.featureShowcase.presetTimersTitle")}

${t("examples.featureShowcase.presetTimersIntro")}

${timerPresetHelp("Tabata")}

${generatePresetTimerBlock("idTabata", "Tabata")}

${timerPresetHelp("EMOM")}

${generatePresetTimerBlock("idEmom", "EMOM", squat)}

---

## ${t("examples.featureShowcase.durationEstimatorTitle")}

${t("examples.featureShowcase.durationEstimatorIntro")}

${generateDurationBlock()}

---

## ${t("examples.featureShowcase.trainingProtocolsTitle")}

${t("examples.featureShowcase.trainingProtocolsIntro")}

${protocolTable()}

---

## ${t("examples.featureShowcase.sessionTitle")}

${t("examples.featureShowcase.sessionIntro", { workout: lowerBody })}

---

## ${t("examples.featureShowcase.dashboardsTitle")}

${t("examples.featureShowcase.dashboardsIntro")}

### ${t("examples.featureShowcase.dashboardWidgetsTitle")}

${t("examples.featureShowcase.trainingCalendarIntro")}

${generateDashboardBlock({ widgets: ["summary", "trainingCalendar", "recentWorkouts"] })}

### ${t("examples.featureShowcase.dashboardGridTitle")}

${t("examples.featureShowcase.dashboardGridIntro")}

${generateGridDashboardBlock(3, [
  { id: "summary", width: 3, height: 1 },
  { id: "trainingCalendar", width: 2, height: 2 },
  { id: "quickStats", width: 1, height: 2 },
  { id: "heatMap", width: 2, height: 2 },
  { id: "recentWorkouts", width: 1, height: 2 },
])}

---

## ${t("examples.featureShowcase.importTitle")}

${t("examples.featureShowcase.importIntro", { command: t("commands.importWorkouts") })}

---

## ${t("examples.featureShowcase.quickReferenceTitle")}

| ${t("examples.featureShowcase.codeBlockColumn")} | ${t("examples.featureShowcase.purposeColumn")} |
|---|---|
| \`workout-chart\` | ${t("examples.featureShowcase.codeBlockWorkoutChart")} |
| \`workout-log\` | ${t("examples.featureShowcase.codeBlockWorkoutLog")} |
| \`workout-timer\` | ${t("examples.featureShowcase.codeBlockWorkoutTimer")} |
| \`workout-duration\` | ${t("examples.featureShowcase.codeBlockWorkoutDuration")} |
| \`workout-session\` | ${t("examples.featureShowcase.codeBlockWorkoutSession")} |
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

${generateCountdownTimerBlock("idWarmup", 300, running)}

---

## ${t("examples.hiit.sprintIntervalsTitle")}

${generateIntervalTimerBlock("idIntervals", { work: 30, rest: 30, rounds: 8 }, running)}

---

## ${t("examples.hiit.runningProgressTitle")}

${generateExerciseOnlyLogBlock(running, 8)}

${generateExerciseChartBlock(running, CHART_DATA_TYPE.DISTANCE, { showStats: true })}

---

## ${t("examples.hiit.tabataTitle")}

${timerPresetHelp("Tabata")}

${generatePresetTimerBlock("idTabata", "Tabata", cycling)}

---

## ${t("examples.hiit.cyclingCooldownTitle")}

${generateExerciseOnlyLogBlock(cycling, 8)}

${generateExerciseChartBlock(cycling, CHART_DATA_TYPE.DISTANCE)}
`;
}

/** A yoga flow: timed holds the guided session walks through, pose by pose */
export function generateYogaContent(): string {
  const workoutName = t("examples.workouts.yogaFlow.name");
  // Targets one step (5 s) above the last holds in the example log
  const poses = [
    { id: "idDownwardDog", name: t("examples.exercises.downwardDog.name"), seconds: 70 },
    { id: "idWarriorTwo", name: t("examples.exercises.warriorTwo.name"), seconds: 60 },
    { id: "idTreePose", name: t("examples.exercises.treePose.name"), seconds: 60 },
  ];
  const restSeconds = 20;

  return `${t("examples.yoga.intro")}

## ${t("examples.workout.session")}

${generateSessionBlock()}

${poses
  .map(
    (pose) => `## ${pose.name}

### ${t("examples.yoga.holds", { holds: "3", seconds: String(pose.seconds) })} ${t("examples.workout.recoverySuffix", { seconds: String(restSeconds) })}

${generateCountdownTimerBlock(pose.id, restSeconds, pose.name)}

${generateExerciseLogBlock(pose.name, workoutName, { sets: 3 })}`,
  )
  .join("\n\n")}

## ${t("examples.yoga.progressTitle")}

${generateExerciseChartBlock(poses[0].name, CHART_DATA_TYPE.DURATION, { dateRange: 60, showStats: true })}
`;
}

export function generateDashboardContent(): string {
  return `# ${t("examples.dashboard.title")}

${t("examples.dashboard.description", { featureShowcase: t("examples.fileNames.featureShowcase") })}

${generateDashboardBlock()}
`;
}
