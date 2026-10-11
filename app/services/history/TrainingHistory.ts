import type { WorkoutLogData } from "@app/types/WorkoutLogData";

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
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
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

/**
 * Reads logged sets back as training: training days and sessions.
 * Pure: give it the rows (already filtered if needed), ask it questions.
 */
export class TrainingHistory {
  constructor(private readonly logs: WorkoutLogData[]) {}

  /** Sessions in the order they started, optionally only one workout's. */
  sessions(filter: { workout?: string } = {}): Session[] {
    const wanted =
      filter.workout === undefined ? undefined : workoutKey(filter.workout);
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
