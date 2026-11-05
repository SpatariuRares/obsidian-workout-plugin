/** @jest-environment jsdom */

import { DurationComparison } from "@app/features/dashboard/widgets/duration-comparison/DurationComparison";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { LocalizationService, t } from "@app/i18n";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import { ICONS } from "@app/constants/ui.constants";

const BASE = 1_700_000_000_000;
const MIN = (count: number) => t("common.duration.minutes", { count });

/**
 * Builds a six-set session lasting `actualSec`. Estimated duration is
 * 6*45 + 5*90 = 720s; sessions shorter than 5 minutes are not counted.
 */
const session = (
  workout: string,
  date: string,
  start: number,
  actualSec: number,
): WorkoutLogData[] =>
  Array.from({ length: 6 }, (_, i) =>
    entry(workout, date, start + Math.round((actualSec * 1000 * i) / 5)),
  );

function entry(
  workout: string | undefined,
  date: string,
  timestamp: number | undefined,
): WorkoutLogData {
  return logRow({ date, exercise: "Squat", reps: 5, weight: 100, workout, timestamp });
}

const render = (data: WorkoutLogData[], setDuration = 45) => {
  const container = createObsidianContainer();
  DurationComparison.render(container, data, {}, { setDuration });
  return container;
};

const rows = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("tbody tr")) as HTMLElement[];
const cell = (r: HTMLElement, i: number) => r.querySelectorAll("td")[i];
const trendText = (c: HTMLElement) =>
  c.querySelector(".workout-duration-comparison-trend-text")?.textContent;

describe("DurationComparison", () => {
  beforeAll(() => {
    window.localStorage.clear();
    LocalizationService.initialize({} as never);
  });

  describe("empty states", () => {
    it("should show the no data message when there are no logs", () => {
      const c = render([]);
      expect(
        c.querySelector(".workout-block-card .workout-feedback-info")
          ?.textContent,
      ).toBe(t("dashboard.durationComparison.noData"));
      expect(c.querySelector("table")).toBeNull();
    });

    it("should render the title and subtitle", () => {
      const c = render([]);
      expect(c.querySelector(".workout-widget-title")?.textContent).toBe(
        t("dashboard.durationComparison.title"),
      );
      expect(c.querySelector(".workout-widget-subtitle")?.textContent).toBe(
        t("dashboard.durationComparison.subtitle"),
      );
    });

    it("should ignore entries without a timestamp or workout name", () => {
      const c = render([
        entry("Push", "2024-01-01", undefined),
        entry("Push", "2024-01-01", 0),
        entry(undefined, "2024-01-01", BASE),
        entry("", "2024-01-01", BASE + 1000),
      ]);
      expect(c.querySelector("table")).toBeNull();
    });

    it("should ignore sessions with a single entry", () => {
      const c = render([entry("Push", "2024-01-01", BASE)]);
      expect(c.querySelector("table")).toBeNull();
    });

    it("should ignore sessions whose entries share the same timestamp", () => {
      const c = render([
        entry("Push", "2024-01-01", BASE),
        entry("Push", "2024-01-01", BASE),
      ]);
      expect(c.querySelector("table")).toBeNull();
    });
  });

  describe("session calculation", () => {
    it("should render estimated vs actual duration and variance for one session", () => {
      // 3 sets: estimated = 3*45 + 2*90 = 315s (5 min); actual 600s (10 min)
      const c = render([
        entry("Push", "2024-01-01", BASE),
        entry("Push", "2024-01-01", BASE + 300_000),
        entry("Push", "2024-01-01", BASE + 600_000),
      ]);
      const [r] = rows(c);
      expect(r.querySelector(".workout-duration-comparison-workout-name")?.textContent).toBe("Push");
      expect(r.querySelector(".workout-duration-comparison-workout-date")?.textContent).toBe("2024-01-01");
      expect(cell(r, 1).textContent).toBe(MIN(5));
      expect(cell(r, 2).textContent).toBe(MIN(10));
      // (600-315)/315 = 90.48%
      expect(cell(r, 3).textContent).toBe("+90%");
    });

    it("should group sets logged at different times of one day into one session", () => {
      // Real logs: every set carries its own ISO date, not just the day
      const at = (minutes: number) => {
        const ts = Date.parse("2024-01-15T17:00:00.000Z") + minutes * 60_000;
        return entry("Push", new Date(ts).toISOString(), ts);
      };
      const c = render([at(0), at(10), at(20)]);
      expect(rows(c)).toHaveLength(1);
      expect(cell(rows(c)[0], 2).textContent).toBe(MIN(20));
      expect(
        rows(c)[0].querySelector(".workout-duration-comparison-workout-date")
          ?.textContent,
      ).toBe("2024-01-15");
    });

    it("should estimate each set with the set duration from settings", () => {
      // 6 sets at 30s + 5 rests of 90s = 630s, shown as 11 min
      const c = render(session("Push", "2024-01-01", BASE, 630), 30);
      expect(cell(rows(c)[0], 1).textContent).toBe(MIN(11));
      expect(cell(rows(c)[0], 3).textContent).toBe("0%");
    });

    it("should use first-to-last timestamp regardless of input order", () => {
      const c = render([
        entry("Push", "2024-01-01", BASE + 600_000),
        entry("Push", "2024-01-01", BASE),
      ]);
      expect(cell(rows(c)[0], 2).textContent).toBe(MIN(10));
    });

    it("should keep different dates and workouts as separate sessions", () => {
      const c = render([
        ...session("Push", "2024-01-01", BASE, 720),
        ...session("Push", "2024-01-02", BASE + 1_000_000, 720),
        ...session("Pull", "2024-01-02", BASE + 2_000_000, 720),
      ]);
      expect(rows(c)).toHaveLength(3);
    });

    it("should list the most recent sessions first and cap at five", () => {
      const data: WorkoutLogData[] = [];
      for (let i = 0; i < 7; i++) {
        data.push(
          ...session(`W${i}`, `2024-01-0${i + 1}`, BASE + i * 10_000_000, 720),
        );
      }
      const names = rows(newContainerRows(data)).map(
        (r) =>
          r.querySelector(".workout-duration-comparison-workout-name")
            ?.textContent,
      );
      expect(names).toEqual(["W6", "W5", "W4", "W3", "W2"]);
    });

    it("should place a session whose date was edited on its new day", () => {
      // Moved to a later day in the CSV, it keeps its older timestamps
      const names = rows(
        render([
          ...session("Moved", "2024-01-05", BASE, 720),
          ...session("Kept", "2024-01-02", BASE + 50_000_000, 720),
        ]),
      ).map(
        (r) =>
          r.querySelector(".workout-duration-comparison-workout-name")
            ?.textContent,
      );
      expect(names).toEqual(["Moved", "Kept"]);
    });
  });

  describe("duration formatting", () => {
    it("should format durations of an hour or more with hours and minutes", () => {
      // actual 4500s = 75 min
      const c = render(session("Push", "2024-01-01", BASE, 4500));
      const text = cell(rows(c)[0], 2).textContent as string;
      expect(text).toBe(`${t("common.duration.hours", { count: 1 })} ${MIN(15)}`);
    });

    it("should omit minutes when the duration is whole hours", () => {
      const c = render(session("Push", "2024-01-01", BASE, 7200));
      expect(cell(rows(c)[0], 2).textContent).toBe("2h");
    });

    // Suspected bug: formatDuration() builds `${h}h ${m} ${suffix}` while the
    // locale suffix already starts with a space, giving "1h 15  min".
    it("should not produce double spaces in hour-plus durations", () => {
      const c = render(session("Push", "2024-01-01", BASE, 4500));
      expect(cell(rows(c)[0], 2).textContent).not.toMatch(/\s{2}/);
    });
  });

  describe("variance classes", () => {
    const cls = (actual: number) => {
      const c = render(session("Push", "2024-01-01", BASE, actual));
      return cell(rows(c)[0], 3).querySelector("span") as HTMLElement;
    };

    it("should mark variance within 10% as good", () => {
      const span = cls(760); // +5.56%
      expect(span.className).toBe("workout-duration-comparison-variance-good");
      expect(span.textContent).toBe("+6%");
    });

    it("should mark variance within 25% as moderate", () => {
      expect(cls(880).className).toBe(
        "workout-duration-comparison-variance-moderate",
      );
    });

    it("should mark larger variance as poor and show a negative sign", () => {
      const span = cls(360); // -50%
      expect(span.className).toBe("workout-duration-comparison-variance-poor");
      expect(span.textContent).toBe("-50%");
    });

    it("should treat exact estimate as 0% without a sign", () => {
      expect(cls(720).textContent).toBe("0%");
    });
  });

  describe("variance trend", () => {
    // Six-set sessions estimate 720s: actual 720 -> 0%, 1440 -> 100%.
    const twoSessions = (recentActual: number, olderActual: number) =>
      render([
        ...session("Push", "2024-01-02", BASE + 10_000_000, recentActual),
        ...session("Push", "2024-01-01", BASE, olderActual),
      ]);

    it("should not render a trend with a single session", () => {
      const c = render(session("Push", "2024-01-01", BASE, 720));
      expect(c.querySelector(".workout-duration-comparison-trend")).toBeNull();
    });

    it("should report improving when the variance line falls", () => {
      const c = twoSessions(720, 1440); // 100% -> 0%
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendImproving"),
      );
      expect(
        c.querySelector(".workout-duration-comparison-trend-improving"),
      ).not.toBeNull();
      expect(
        (c.querySelector(".workout-duration-comparison-trend-icon") as HTMLElement | null)
          ?.dataset.icon,
      ).toBe(ICONS.TREND.UP);
    });

    it("should report declining when the variance line rises", () => {
      const c = twoSessions(1440, 720); // 0% -> 100%
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendDeclining"),
      );
      expect(
        (c.querySelector(".workout-duration-comparison-trend-icon") as HTMLElement | null)
          ?.dataset.icon,
      ).toBe(ICONS.TREND.DOWN);
    });

    it("should report stable while the line moves less than 5% of the mean", () => {
      const c = twoSessions(2224, 2160); // 200% -> ~209%: 9 points of a ~204 mean
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendStable"),
      );
      expect(
        (c.querySelector(".workout-duration-comparison-trend-icon") as HTMLElement | null)
          ?.dataset.icon,
      ).toBe(ICONS.TREND.FLAT);
    });

    it("should report a small rise as declining when it is more than 5% of the mean", () => {
      const c = twoSessions(749, 720); // 0% -> ~4%
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendDeclining"),
      );
    });

    it("should report stable when every session matches its estimate", () => {
      const c = twoSessions(720, 720);
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendStable"),
      );
    });

    it("should show the average absolute variance", () => {
      const c = twoSessions(720, 1440); // |0| and |100| -> 50
      expect(
        c.querySelector(".workout-duration-comparison-trend-stat")?.textContent,
      ).toBe(t("dashboard.durationComparison.avgVarianceStat", { value: "50" }));
    });

    it("should use absolute values so over and under estimates both count", () => {
      // 100% and -50% -> avg 75
      const c = twoSessions(1440, 360);
      expect(
        c.querySelector(".workout-duration-comparison-trend-stat")?.textContent,
      ).toBe(t("dashboard.durationComparison.avgVarianceStat", { value: "75" }));
    });

    it("should read the trend from the line through every session, oldest first", () => {
      // 100%, 100%, 0% (oldest first): the line falls -> improving, avg 66.67 -> 67
      const c = render([
        ...session("Push", "2024-01-03", BASE + 20_000_000, 720),
        ...session("Push", "2024-01-02", BASE + 10_000_000, 1440),
        ...session("Push", "2024-01-01", BASE, 1440),
      ]);
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendImproving"),
      );
      expect(
        c.querySelector(".workout-duration-comparison-trend-stat")?.textContent,
      ).toBe(t("dashboard.durationComparison.avgVarianceStat", { value: "67" }));
    });
  });

  // Suspected bug: sessions are keyed by `${workout}|${date}` and split on "|"
  // again, so a workout name containing "|" is truncated.
  it("should keep workout names that contain a pipe character", () => {
    const c = render(session("Push|Pull", "2024-01-01", BASE, 720));
    expect(
      rows(c)[0].querySelector(".workout-duration-comparison-workout-name")
        ?.textContent,
    ).toBe("Push|Pull");
  });
});

function newContainerRows(data: WorkoutLogData[]): HTMLElement {
  return render(data).querySelector("tbody") as HTMLElement;
}
