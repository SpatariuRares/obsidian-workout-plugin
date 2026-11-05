import { normalizePath } from "obsidian";
import { t } from "@app/i18n";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { tableBlock } from "@app/features/tables/tableBlock";
import { setsBlock } from "@app/features/tables/setsBlock";
import { chartBlock } from "@app/features/charts/chartBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { TIMER_TYPE } from "@app/features/timer/types";
import { timerBlock } from "@app/features/timer/timerBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
import { sessionBlock } from "@app/features/session/sessionBlock";
import { generateCodeBlockId } from "@app/utils/IdUtils";
import {
  CHART_DATA_TYPE,
  CHART_TYPE,
} from "@app/types/WorkoutConfigTypes";

/** Native notes keep navigation and scrolling in Obsidian's own reading view. */
export function gettingStartedPages() {
  const exercise = t("examples.exercises.squatMultiPower.name");
  const chart = (exercise: string, type: CHART_DATA_TYPE) =>
    chartBlock.serialize({
      chartType: CHART_TYPE.EXERCISE,
      exercise,
      type,
      dateRange: 60,
      showStats: true,
      showTrendLine: true,
    });
  const workout = t("examples.workouts.lowerBodyA.name");
  const rdl = t("examples.exercises.rdl.name");
  /** Several blocks on one page, each under its own heading and explanation */
  const variants = (...list: { title: string; intro: string; block: string }[]) =>
    list
      .map((variant) => `## ${variant.title}\n\n${variant.intro}\n\n${variant.block}`)
      .join("\n\n");
  const sections = [
    {
      name: "01 Tables",
      title: t("tour.noteTable"),
      intro: t("examples.gettingStarted.tryLog"),
      block: variants(
        {
          title: t("examples.gettingStarted.tables.latestTitle"),
          intro: t("examples.gettingStarted.tables.latestIntro"),
          block: tableBlock.serialize({
            id: generateCodeBlockId(),
            exercise,
            limit: 8,
          }),
        },
        {
          title: t("examples.gettingStarted.tables.targetTitle"),
          intro: t("examples.gettingStarted.tables.targetIntro"),
          block: tableBlock.serialize({
            id: generateCodeBlockId(),
            exercise,
            workout,
            exactMatch: true,
            sets: 4,
            targetWeight: 85,
            targetReps: 8,
          }),
        },
        {
          title: t("examples.gettingStarted.tables.workoutTitle"),
          intro: t("examples.gettingStarted.tables.workoutIntro"),
          block: tableBlock.serialize({
            id: generateCodeBlockId(),
            workout,
            dateRange: 14,
            limit: 20,
          }),
        },
        {
          title: t("examples.gettingStarted.tables.columnsTitle"),
          intro: t("examples.gettingStarted.tables.columnsIntro"),
          block: tableBlock.serialize({
            id: generateCodeBlockId(),
            exercise,
            columns: ["date", "weight", "reps", "volume"],
            sortBy: "weight",
            sortOrder: "desc",
            limit: 10,
            showAddButton: false,
          }),
        },
      ),
    },
    {
      name: "02 Strength charts",
      title: t("tour.noteChart"),
      intro: t("tour.steps.chart.text"),
      block: chart(exercise, CHART_DATA_TYPE.VOLUME),
    },
    {
      name: "03 Cardio charts",
      title: t("examples.featureShowcase.cardioExerciseTitle"),
      intro: t("examples.featureShowcase.chartsIntro"),
      block: chart(
        t("examples.exercises.running.name"),
        CHART_DATA_TYPE.DISTANCE,
      ),
    },
    {
      name: "04 Timed charts",
      title: t("examples.featureShowcase.timedExerciseTitle"),
      intro: t("examples.featureShowcase.chartsIntro"),
      block: chart(
        t("examples.exercises.plank.name"),
        CHART_DATA_TYPE.DURATION,
      ),
    },
    {
      name: "05 Statistics",
      title: t("tour.noteDashboard"),
      intro: t("tour.steps.dashboard.text"),
      block: dashboardBlock.serialize({
        id: generateCodeBlockId(),
        dateRange: 60,
      }),
    },
    {
      name: "06 Rest timer",
      title: t("examples.featureShowcase.countdownTimerTitle"),
      intro: t("tour.steps.timer.text"),
      block: timerBlock.serialize({
        id: "gettingStartedRest",
        duration: 90,
        showControls: true,
      }),
    },
    {
      name: "07 Interval timer",
      title: t("examples.featureShowcase.intervalTimerTitle"),
      intro: t("tour.steps.timer.text"),
      block: timerBlock.serialize({
        id: "gettingStartedIntervals",
        type: TIMER_TYPE.INTERVAL,
        duration: 30,
        rounds: 5,
        showControls: true,
      }),
    },
    {
      name: "08 Workout duration",
      title: t("examples.featureShowcase.durationEstimatorTitle"),
      intro: t("examples.featureShowcase.durationEstimatorIntro"),
      block: durationBlock.serialize({
        workout: `${examplePaths.workouts()}/${t("examples.workouts.lowerBodyA.name")}.md`,
      }),
    },
    {
      name: "09 Estimated 1RM",
      title: t("examples.featureShowcase.e1rmChartTitle"),
      intro: t("examples.featureShowcase.e1rmIntro"),
      block: chart(exercise, CHART_DATA_TYPE.E1RM),
    },
    {
      // A session follows the plan of its own note, so this page carries one
      name: "10 Guided session",
      title: t("examples.workout.session"),
      intro: t("examples.gettingStarted.sessionIntro"),
      block: [
        sessionBlock.serialize({}),
        `## ${exercise}`,
        timerBlock.serialize({
          id: "gettingStartedSessionRest",
          duration: 90,
          exercise,
        }),
        setsBlock.serialize({
          id: generateCodeBlockId(),
          exercise,
          sets: 3,
          targetReps: 8,
        }),
      ].join("\n\n"),
    },
    {
      name: "11 Workout sets",
      title: t("examples.featureShowcase.setsTitle"),
      intro: t("examples.featureShowcase.setsIntro"),
      block: variants(
        {
          title: t("examples.gettingStarted.sets.lastTimeTitle"),
          intro: t("examples.gettingStarted.sets.lastTimeIntro"),
          block: setsBlock.serialize({
            id: generateCodeBlockId(),
            exercise,
            workout,
            sets: 4,
          }),
        },
        {
          title: t("examples.gettingStarted.sets.restTitle"),
          intro: t("examples.gettingStarted.sets.restIntro"),
          block: setsBlock.serialize({
            id: generateCodeBlockId(),
            exercise: rdl,
            workout,
            sets: 3,
            targetWeight: 65,
            targetReps: 10,
            rest: 120,
          }),
        },
        {
          title: t("examples.gettingStarted.sets.restTimerTitle"),
          intro: t("examples.gettingStarted.sets.restTimerIntro"),
          block: setsBlock.serialize({
            id: generateCodeBlockId(),
            exercise,
            workout,
            sets: 3,
            rest: 90,
            "timer.sound": false,
          }),
        },
      ),
    },
  ];
  const index = examplePaths
    .gettingStartedGuide()
    .replace(/\.md$/, "");
  const pages = sections.map((section) => ({
    ...section,
    path: normalizePath(
      `${examplePaths.gettingStartedFolder()}/${section.name}.md`,
    ),
  }));
  return pages.map((page, i) => {
    const link = (path: string, label: string) =>
      `[[${path.replace(/\.md$/, "")}|${label}]]`;
    const navigation = [
      link(i > 0 ? pages[i - 1].path : index, t("tour.back")),
      link(index, t("examples.gettingStarted.title")),
      link(
        i + 1 < pages.length ? pages[i + 1].path : index,
        i + 1 < pages.length ? t("tour.next") : t("tour.done"),
      ),
    ].join(" · ");
    return {
      path: page.path,
      title: page.title,
      content: `# ${page.title}\n\n${navigation}\n\n${page.intro}\n\n${page.block}\n\n${navigation}\n`,
    };
  });
}

export function gettingStartedIndex(): string {
  return `# ${t("examples.gettingStarted.title")}\n\n${t("examples.gettingStarted.pagesIntro")}\n\n${gettingStartedPages()
    .map(
      (page) =>
        `- [[${page.path.replace(/\.md$/, "")}|${page.title}]]`,
    )
    .join("\n")}\n\n${t("examples.gettingStarted.ownData")}\n`;
}
