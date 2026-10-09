/** @jest-environment jsdom */

import { DurationComparison } from "@app/features/dashboard/widgets/duration-comparison/DurationComparison";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { LocalizationService, t } from "@app/i18n";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";

const BASE = 1_700_000_000_000;
const SUFFIX = () => t("dashboard.durationComparison.minutesSuffix");

/** Builds a two-set session (estimated duration 180s) lasting `actualSec`. */
const session = (
  workout: string,
  date: string,
  start: number,
  actualSec: number,
): WorkoutLogData[] => [
  entry(workout, date, start),
  entry(workout, date, start + actualSec * 1000),
];

function entry(
  workout: string | undefined,
  date: string,
  timestamp: number | undefined,
): WorkoutLogData {
  return {
    date,
    exercise: "Squat",
    reps: 5,
    weight: 100,
    volume: 500,
    workout,
    timestamp,
  };
}

const render = (data: WorkoutLogData[]) => {
  const container = createObsidianContainer();
  DurationComparison.render(container, data, {});
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
        c.querySelector(".workout-duration-comparison-no-data")?.textContent,
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
      expect(cell(r, 1).textContent).toBe(`5${SUFFIX()}`);
      expect(cell(r, 2).textContent).toBe(`10${SUFFIX()}`);
      // (600-315)/315 = 90.48%
      expect(cell(r, 3).textContent).toBe("+90%");
    });

    it("should use first-to-last timestamp regardless of input order", () => {
      const c = render([
        entry("Push", "2024-01-01", BASE + 600_000),
        entry("Push", "2024-01-01", BASE),
      ]);
      expect(cell(rows(c)[0], 2).textContent).toBe(`10${SUFFIX()}`);
    });

    it("should keep different dates and workouts as separate sessions", () => {
      const c = render([
        ...session("Push", "2024-01-01", BASE, 180),
        ...session("Push", "2024-01-02", BASE + 1_000_000, 180),
        ...session("Pull", "2024-01-02", BASE + 2_000_000, 180),
      ]);
      expect(rows(c)).toHaveLength(3);
    });

    it("should list the most recent sessions first and cap at five", () => {
      const data: WorkoutLogData[] = [];
      for (let i = 0; i < 7; i++) {
        data.push(
          ...session(`W${i}`, `2024-01-0${i + 1}`, BASE + i * 10_000_000, 180),
        );
      }
      const names = rows(newContainerRows(data)).map(
        (r) =>
          r.querySelector(".workout-duration-comparison-workout-name")
            ?.textContent,
      );
      expect(names).toEqual(["W6", "W5", "W4", "W3", "W2"]);
    });
  });

  describe("duration formatting", () => {
    it("should format durations of an hour or more with hours and minutes", () => {
      // actual 4500s = 75 min
      const c = render(session("Push", "2024-01-01", BASE, 4500));
      const text = cell(rows(c)[0], 2).textContent as string;
      expect(text.startsWith("1h 15")).toBe(true);
      expect(text).toContain(SUFFIX().trim());
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
      const span = cls(190); // +5.56%
      expect(span.className).toBe("workout-duration-comparison-variance-good");
      expect(span.textContent).toBe("+6%");
    });

    it("should mark variance within 25% as moderate", () => {
      expect(cls(220).className).toBe(
        "workout-duration-comparison-variance-moderate",
      );
    });

    it("should mark larger variance as poor and show a negative sign", () => {
      const span = cls(90); // -50%
      expect(span.className).toBe("workout-duration-comparison-variance-poor");
      expect(span.textContent).toBe("-50%");
    });

    it("should treat exact estimate as 0% with a plus sign", () => {
      expect(cls(180).textContent).toBe("+0%");
    });
  });

  describe("variance trend", () => {
    // Two-set sessions estimate 180s: actual 180 -> 0%, 360 -> 100%.
    const twoSessions = (recentActual: number, olderActual: number) =>
      render([
        ...session("Push", "2024-01-02", BASE + 10_000_000, recentActual),
        ...session("Push", "2024-01-01", BASE, olderActual),
      ]);

    it("should not render a trend with a single session", () => {
      const c = render(session("Push", "2024-01-01", BASE, 180));
      expect(c.querySelector(".workout-duration-comparison-trend")).toBeNull();
    });

    it("should report improving when recent variance dropped more than 5 points", () => {
      const c = twoSessions(180, 360);
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendImproving"),
      );
      expect(
        c.querySelector(".workout-duration-comparison-trend-improving"),
      ).not.toBeNull();
      expect(
        c.querySelector(".workout-duration-comparison-trend-icon")?.textContent,
      ).toBe("↗");
    });

    it("should report declining when recent variance grew more than 5 points", () => {
      const c = twoSessions(360, 180);
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendDeclining"),
      );
      expect(
        c.querySelector(".workout-duration-comparison-trend-icon")?.textContent,
      ).toBe("↘");
    });

    it("should report stable for small changes", () => {
      const c = twoSessions(187, 180); // ~3.9 points
      expect(trendText(c)).toBe(
        t("dashboard.durationComparison.varianceTrendStable"),
      );
      expect(
        c.querySelector(".workout-duration-comparison-trend-icon")?.textContent,
      ).toBe("→");
    });

    it("should show the average absolute variance", () => {
      const c = twoSessions(180, 360); // |0| and |100| -> 50
      expect(
        c.querySelector(".workout-duration-comparison-trend-stat")?.textContent,
      ).toBe(t("dashboard.durationComparison.avgVarianceStat", { value: "50" }));
    });

    it("should use absolute values so over and under estimates both count", () => {
      // 100% and -50% -> avg 75
      const c = twoSessions(360, 90);
      expect(
        c.querySelector(".workout-duration-comparison-trend-stat")?.textContent,
      ).toBe(t("dashboard.durationComparison.avgVarianceStat", { value: "75" }));
    });

    it("should split odd session counts with the larger half as older", () => {
      // recent=[0%], older=[100%,100%] -> improving, avg 66.67 -> 67
      const c = render([
        ...session("Push", "2024-01-03", BASE + 20_000_000, 180),
        ...session("Push", "2024-01-02", BASE + 10_000_000, 360),
        ...session("Push", "2024-01-01", BASE, 360),
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
    const c = render(session("Push|Pull", "2024-01-01", BASE, 180));
    expect(
      rows(c)[0].querySelector(".workout-duration-comparison-workout-name")
        ?.textContent,
    ).toBe("Push|Pull");
  });
});

function newContainerRows(data: WorkoutLogData[]): HTMLElement {
  return render(data).querySelector("tbody") as HTMLElement;
}
