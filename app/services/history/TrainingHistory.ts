import {
  WorkoutProtocol,
  type WorkoutLogData,
} from "@app/types/WorkoutLogData";
import { protocolId } from "@app/services/protocols/ProtocolCatalog";
import { StringUtils } from "@app/utils/StringUtils";

/** Session durations outside this window are logging gaps, not training. */
const MIN_SESSION_SECONDS = 5 * 60;
const MAX_SESSION_SECONDS = 5 * 60 * 60;

/**
 * The training day of a set: its calendar day in local time (YYYY-MM-DD).
 * A date-only value ("2024-01-15") stays on that day.
 */
export function trainingDay(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date.split("T")[0];
  return localDay(d);
}

function localDay(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

/** Monday (local YYYY-MM-DD) of the calendar week containing `d`. */
function weekStart(d: Date): string {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return localDay(monday);
}

function previousWeek(monday: string): string {
  const [y, m, d] = monday.split("-").map(Number);
  return localDay(new Date(y, m - 1, d - 7));
}

/** All sets of one workout on one training day. See "Session" in CONTEXT.md. */
export interface Session {
  day: string;
  /** Workout name as the first set wrote it; undefined for sets without one */
  workout?: string;
  /** In the order they were logged */
  sets: WorkoutLogData[];
  /** First and last set timestamps (ms); undefined when no set has one */
  start?: number;
  end?: number;
  /** Seconds from first to last set, only when plausible (≥2 sets, 5 min–5 h) */
  duration?: number;
}

/** A series' direction from its regression line. See "Trend" in CONTEXT.md. */
export interface Trend {
  direction: "up" | "down" | "stable";
  /** Fitted line value at the first and last point */
  start: number;
  end: number;
  /** Change from start to end in % of start; undefined when start is 0 */
  percentChange?: number;
  slope: number;
  intercept: number;
}

/**
 * Trend of a series, read from its linear regression line: stable while the
 * line moves less than 5% of the mean. Undefined with fewer than two values.
 * Callers decide what "up" means for them (for pace, lower is better).
 */
export function trendOf(values: number[]): Trend | undefined {
  const n = values.length;
  if (n < 2) return undefined;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const start = intercept;
  const end = intercept + slope * (n - 1);
  const threshold = 0.05 * Math.abs(sumY / n) || Number.EPSILON;
  const change = end - start;
  const direction =
    change > threshold
      ? "up"
      : change < -threshold
        ? "down"
        : "stable";

  return {
    direction,
    start,
    end,
    percentChange:
      start !== 0 ? (change / Math.abs(start)) * 100 : undefined,
    slope,
    intercept,
  };
}

/** An exercise's heaviest set. See "Personal record" in CONTEXT.md. */
export interface PersonalRecord {
  weight: number;
  reps: number;
  day: string;
  set: WorkoutLogData;
}

/**
 * Reads logged sets back as training: training days, sessions, PRs, streak,
 * volume and the daily series trends are read from.
 * Pure: give it the rows (already filtered if needed), ask it questions.
 */
export class TrainingHistory {
  constructor(private readonly logs: WorkoutLogData[]) {}

  /** Sessions in the order they started, optionally only one workout's. */
  sessions(filter: { workout?: string } = {}): Session[] {
    const wanted =
      filter.workout === undefined
        ? undefined
        : workoutKey(filter.workout);
    const groups = new Map<string, WorkoutLogData[]>();

    for (const log of this.logs) {
      const key = workoutKey(log.workout);
      if (wanted !== undefined && key !== wanted) continue;
      // The unnamed key is "", which no real workout name normalizes to
      const sessionKey = `${trainingDay(log.date)}\u0000${key}`;
      const group = groups.get(sessionKey);
      if (group) group.push(log);
      else groups.set(sessionKey, [log]);
    }

    return Array.from(groups.values())
      .map(toSession)
      .sort((a, b) => sortTime(a) - sortTime(b));
  }

  /**
   * The exercise's heaviest set; on a tie the one with most reps, then the
   * earliest. Undefined when the exercise was never logged with weight.
   */
  personalRecord(exercise: string): PersonalRecord | undefined {
    const wanted = StringUtils.normalize(exercise);
    let best: WorkoutLogData | undefined;
    for (const log of this.chronological()) {
      if (!countsForRecord(log)) continue;
      if (StringUtils.normalize(log.exercise) !== wanted) continue;
      if (
        !best ||
        log.weight > best.weight ||
        (log.weight === best.weight && log.reps > best.reps)
      ) {
        best = log;
      }
    }
    return best
      ? {
          weight: best.weight,
          reps: best.reps,
          day: trainingDay(best.date),
          set: best,
        }
      : undefined;
  }

  /**
   * Sets that set a new PR: strictly heavier than every earlier weighted set
   * of the same exercise. An exercise's first weighted set has nothing to beat.
   */
  newRecordSets(): WorkoutLogData[] {
    const best = new Map<string, number>();
    const records: WorkoutLogData[] = [];
    for (const log of this.chronological()) {
      if (!countsForRecord(log)) continue;
      const exercise = StringUtils.normalize(log.exercise);
      const previous = best.get(exercise);
      if (previous !== undefined && log.weight > previous)
        records.push(log);
      if (previous === undefined || log.weight > previous) {
        best.set(exercise, log.weight);
      }
    }
    return records;
  }

  /** Latest exact exercise match, independent of table sorting and filters. */
  lastSet(exercise: string): WorkoutLogData | undefined {
    const wanted = StringUtils.normalize(exercise);
    return this.chronological()
      .reverse()
      .find((log) => StringUtils.normalize(log.exercise) === wanted);
  }

  /** Position of the next set in today's session for this exercise. */
  nextSetNumber(
    exercise: string,
    workout?: string,
    today = new Date(),
  ): number {
    const wanted = StringUtils.normalize(exercise);
    const session = this.sessions({ workout: workout ?? "" }).find(
      (s) => s.day === trainingDay(today.toISOString()),
    );
    return (
      1 +
      (session?.sets.filter(
        (s) => StringUtils.normalize(s.exercise) === wanted,
      ).length ?? 0)
    );
  }

  /** Increase over the prior PR; the first weighted set is not a new record. */
  recordIncrease(set: WorkoutLogData): number | undefined {
    if (!countsForRecord(set)) return undefined;
    const previous = new TrainingHistory(
      this.logs.filter((log) => setTime(log) <= setTime(set)),
    ).personalRecord(set.exercise);
    return previous && set.weight > previous.weight
      ? set.weight - previous.weight
      : undefined;
  }

  /**
   * Consecutive calendar weeks (Monday to Sunday) with a session, counting
   * back from `today`'s week; that week only breaks the streak once over.
   */
  streak(today: Date = new Date()): number {
    const weeks = new Set(
      this.sessions().map((session) => {
        const [y, m, d] = session.day.split("-").map(Number);
        return weekStart(new Date(y, m - 1, d));
      }),
    );
    let week = weekStart(today);
    if (!weeks.has(week)) week = previousWeek(week);
    let count = 0;
    while (weeks.has(week)) {
      count++;
      week = previousWeek(week);
    }
    return count;
  }

  totalVolume(): number {
    return this.logs.reduce((sum, log) => sum + (log.volume || 0), 0);
  }

  /** Total volume of each training day */
  volumeByDay(): Map<string, number> {
    const byDay = new Map<string, number>();
    for (const log of this.logs) {
      const day = trainingDay(log.date);
      byDay.set(day, (byDay.get(day) ?? 0) + (log.volume || 0));
    }
    return byDay;
  }

  /**
   * The `n` exercises with most volume, names matched ignoring case and
   * spacing and shown as first logged.
   */
  topExercisesByVolume(n: number): [string, number][] {
    const byExercise = new Map<string, [string, number]>();
    for (const log of this.chronological()) {
      const key = StringUtils.normalize(log.exercise);
      const entry = byExercise.get(key) ?? [log.exercise.trim(), 0];
      entry[1] += log.volume || 0;
      byExercise.set(key, entry);
    }
    return Array.from(byExercise.values())
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }

  /** The heaviest set of each training day for the exercise, oldest first. */
  heaviestPerDay(exercise: string): number[] {
    const wanted = StringUtils.normalize(exercise);
    const byDay = new Map<string, number>();
    for (const log of this.logs) {
      if (StringUtils.normalize(log.exercise) !== wanted) continue;
      const day = trainingDay(log.date);
      byDay.set(
        day,
        Math.max(byDay.get(day) ?? -Infinity, log.weight),
      );
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, weight]) => weight);
  }

  private chronological(): WorkoutLogData[] {
    return [...this.logs].sort((a, b) => setTime(a) - setTime(b));
  }
}

function workoutKey(workout: string | undefined): string {
  return (workout ?? "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function toSession(sets: WorkoutLogData[]): Session {
  const ordered = [...sets].sort((a, b) => setTime(a) - setTime(b));
  const stamps = ordered
    .map((s) => s.timestamp ?? 0)
    .filter((t) => t > 0);
  const start = stamps.length > 0 ? Math.min(...stamps) : undefined;
  const end = stamps.length > 0 ? Math.max(...stamps) : undefined;
  const seconds =
    start !== undefined && end !== undefined && stamps.length >= 2
      ? Math.round((end - start) / 1000)
      : undefined;
  const plausible =
    seconds !== undefined &&
    seconds >= MIN_SESSION_SECONDS &&
    seconds <= MAX_SESSION_SECONDS;

  const named = ordered.find((s) => workoutKey(s.workout) !== "");
  return {
    day: trainingDay(ordered[0].date),
    workout: named?.workout,
    sets: ordered,
    start,
    end,
    duration: plausible ? seconds : undefined,
  };
}

function setTime(log: WorkoutLogData): number {
  if (log.timestamp && log.timestamp > 0) return log.timestamp;
  const parsed = Date.parse(log.date);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortTime(session: Session): number {
  return session.start ?? setTime(session.sets[0]);
}

function countsForRecord(log: WorkoutLogData): boolean {
  const protocol = protocolId(log.protocol);
  return (
    Number.isFinite(log.weight) &&
    log.weight > 0 &&
    protocol !== protocolId(WorkoutProtocol.WARMUP) &&
    protocol !== protocolId(WorkoutProtocol.DROP_SET)
  );
}
