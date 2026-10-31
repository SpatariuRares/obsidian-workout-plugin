import { normalizePath } from "obsidian";
import { t } from "@app/i18n";
import { examplePaths } from "@app/services/examples/ExamplePaths";
import { tableBlock } from "@app/features/tables/tableBlock";
import { chartBlock } from "@app/features/charts/chartBlock";
import { dashboardBlock } from "@app/features/dashboard/dashboardBlock";
import { TIMER_TYPE } from "@app/features/timer/types";
import { timerBlock } from "@app/features/timer/timerBlock";
import { durationBlock } from "@app/features/duration/durationBlock";
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
  const sections = [
    {
      name: "01 Tables",
      title: t("tour.noteTable"),
      intro: t("examples.gettingStarted.tryLog"),
      block: tableBlock.serialize({
        id: generateCodeBlockId(),
        exercise,
        limit: 8,
      }),
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
      block: dashboardBlock.serialize({ dateRange: 60 }),
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
