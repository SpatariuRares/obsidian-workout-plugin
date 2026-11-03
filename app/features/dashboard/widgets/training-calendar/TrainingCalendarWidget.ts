import { getUnitsMap } from "@app/constants";
import { WorkoutLogData } from "@app/types/WorkoutLogData";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import {
  CALENDAR_WEEKS,
  CalendarDay,
  trainingCalendar,
} from "@app/features/dashboard/widgets/training-calendar/business/trainingCalendar";
import { WidgetContainer } from "@app/features/dashboard/ui/WidgetContainer";
import { FormatUtils } from "@app/utils/FormatUtils";
import { t } from "@app/i18n";

/**
 * A year of training days as a heat map (one column per week, Monday on
 * top), with the streak of weeks that met the weekly goal and the best one.
 */
export class TrainingCalendarWidget {
  static render(
    container: HTMLElement,
    /** Every logged set: the calendar and streaks ignore the dashboard's period */
    history: WorkoutLogData[],
    /** Training days a week that keep the streak */
    weeklyGoal: number,
    today: Date = new Date(),
    { weeks = CALENDAR_WEEKS, showStats = true }: {
      /** Weeks shown, counting back from this one */
      weeks?: number;
      /** The streaks and this week's progress above the grid */
      showStats?: boolean;
    } = {},
  ): void {
    const widgetEl = WidgetContainer.create(container, {
      title: t("dashboard.trainingCalendar.title"),
      className: "workout-training-calendar",
      isWide: true,
    });

    const training = new TrainingHistory(history);
    const calendar = trainingCalendar(training, today, weeks);
    const thisWeek = training.weekProgress(today, weeklyGoal);

    if (showStats) {
      const statsEl = widgetEl.createDiv({
        cls: "workout-calendar-stats",
      });
      this.stat(
        statsEl,
        t("dashboard.trainingCalendar.currentStreak"),
        t("dashboard.trainingCalendar.weeks", {
          count: training.streak(today, weeklyGoal),
        }),
      );
      this.stat(
        statsEl,
        t("dashboard.trainingCalendar.bestStreak"),
        t("dashboard.trainingCalendar.weeks", {
          count: training.bestStreak(weeklyGoal),
        }),
      );
      this.stat(
        statsEl,
        t("dashboard.trainingCalendar.thisWeek"),
        t("dashboard.trainingCalendar.daysOfGoal", {
          days: thisWeek.days,
          goal: thisWeek.goal,
        }),
        thisWeek.met,
      );
    }

    // Newest week first: the grid runs right to left (see _calendar.scss), so
    // the latest weeks show without scrolling when the year does not fit
    const gridEl = widgetEl.createDiv({
      cls: "workout-calendar-grid",
    });
    for (const day of [...calendar.weeks].reverse().flat()) this.cell(gridEl, day);

    const legendEl = widgetEl.createDiv({
      cls: "workout-calendar-legend",
    });
    legendEl.createSpan({
      text: t("dashboard.trainingCalendar.less"),
    });
    for (const level of [0, 1, 2, 3, 4]) {
      legendEl.createDiv({
        cls: `workout-calendar-cell workout-calendar-level-${level}`,
      });
    }
    legendEl.createSpan({
      text: t("dashboard.trainingCalendar.more"),
    });
  }

  private static stat(
    container: HTMLElement,
    label: string,
    value: string,
    met = false,
  ): void {
    const statEl = container.createDiv({
      cls: "workout-calendar-stat",
    });
    statEl.createDiv({
      cls: "workout-calendar-stat-label",
      text: label,
    });
    statEl.createDiv({
      cls: `workout-calendar-stat-value${met ? " is-met" : ""}`,
      text: value,
    });
  }

  private static cell(
    container: HTMLElement,
    day: CalendarDay,
  ): void {
    const cellEl = container.createDiv({
      cls: `workout-calendar-cell workout-calendar-level-${day.level}`,
    });
    if (day.future) {
      cellEl.addClass("is-future");
      return;
    }
    const label =
      day.level > 0 && day.volume === 0
        ? t("dashboard.trainingCalendar.trainedDayNoVolume", {
            day: day.day,
          })
        : day.level > 0
          ? t("dashboard.trainingCalendar.trainedDay", {
              day: day.day,
              volume: FormatUtils.formatNumber(
                Math.round(day.volume),
              ),
              unit: getUnitsMap()["volume"],
            })
          : t("dashboard.trainingCalendar.restDay", { day: day.day });
    cellEl.setAttribute("aria-label", label);
    cellEl.setAttribute("title", label);
  }
}
