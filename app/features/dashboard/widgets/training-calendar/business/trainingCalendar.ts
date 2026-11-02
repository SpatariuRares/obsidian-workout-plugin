import {
  TrainingHistory,
  localDay,
  weekStart,
} from "@app/services/history/TrainingHistory";

/** Heat levels: 0 = rest day, 1–4 = trained, 4 = busiest */
export type CalendarLevel = 0 | 1 | 2 | 3 | 4;

export interface CalendarDay {
  /** Local YYYY-MM-DD */
  day: string;
  volume: number;
  level: CalendarLevel;
  /** After today: drawn empty */
  future: boolean;
}

export interface TrainingCalendar {
  /** Oldest first; each week Monday to Sunday, the last one holding today */
  weeks: CalendarDay[][];
}

/** About a year, like a GitHub contribution graph */
export const CALENDAR_WEEKS = 53;

/**
 * The training days of the last `weekCount` calendar weeks, each graded
 * by its volume against the busiest day shown. A day with sets but no
 * volume (cardio) still counts as trained; sets dated after today don't.
 */
export function trainingCalendar(
  history: TrainingHistory,
  today: Date = new Date(),
  weekCount = CALENDAR_WEEKS,
): TrainingCalendar {
  const volumes = history.volumeByDay();
  const [y, m, d] = weekStart(today).split("-").map(Number);
  const todayKey = localDay(today);

  const weeks: CalendarDay[][] = [];
  for (let w = weekCount - 1; w >= 0; w--) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const day = localDay(new Date(y, m - 1, d - w * 7 + i));
      week.push({
        day,
        volume: day > todayKey ? 0 : (volumes.get(day) ?? 0),
        level: 0,
        future: day > todayKey,
      });
    }
    weeks.push(week);
  }

  const days = weeks.flat();
  const busiest = Math.max(0, ...days.map((cell) => cell.volume));
  for (const cell of days) {
    if (cell.future || !volumes.has(cell.day)) continue;
    cell.level =
      busiest > 0
        ? (Math.max(
            1,
            Math.ceil((cell.volume / busiest) * 4),
          ) as CalendarLevel)
        : 1;
  }

  return { weeks };
}
