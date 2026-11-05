/** @jest-environment jsdom */
import { t } from "@app/i18n";

import { ProtocolEffectiveness } from "@app/features/dashboard/widgets/protocol-effectiveness/ProtocolEffectiveness";
import { createObsidianContainer } from "@app/components/__tests__/obsidianDomMocks";
import { LocalizationService, t } from "@app/i18n";
import {
  WorkoutLogData,
  WorkoutProtocol,
} from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";
import type { SettingsPort } from "@app/types/PluginPorts";

const log = (
  exercise: string,
  timestamp: number | undefined,
  weight: number,
  volume: number,
  protocol?: string,
): WorkoutLogData =>
  logRow({
    date: "2024-01-01",
    exercise,
    reps: 5,
    weight,
    volume,
    timestamp,
    protocol: protocol as WorkoutProtocol | undefined,
  });

/** Builds a series of entries for one exercise, all with the given protocol. */
const series = (
  exercise: string,
  weights: number[],
  volumes: number[],
  protocol?: string,
  startTs = 1,
): WorkoutLogData[] =>
  weights.map((w, i) => log(exercise, startTs + i, w, volumes[i], protocol));

const render = (data: WorkoutLogData[], plugin?: SettingsPort) => {
  const container = createObsidianContainer();
  ProtocolEffectiveness.render(container, data, {}, plugin);
  return container;
};

const rows = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("tbody tr")) as HTMLElement[];
const cellSpan = (r: HTMLElement, cls: string) =>
  r.querySelector(`.${cls} span`) as HTMLElement;
const volume = (r: HTMLElement) =>
  cellSpan(r, "workout-protocol-effectiveness-volume-cell");
const progression = (r: HTMLElement) =>
  cellSpan(r, "workout-protocol-effectiveness-progression-cell");
const entries = (r: HTMLElement) =>
  r.querySelector(".workout-protocol-effectiveness-entries-cell")
    ?.textContent;

const POS = "workout-protocol-effectiveness-positive";
const NEG = "workout-protocol-effectiveness-negative";
const NEU = "workout-protocol-effectiveness-neutral";

const pluginWith = (customProtocols: unknown[]): SettingsPort =>
  ({ settings: { customProtocols } }) as unknown as SettingsPort;

describe("ProtocolEffectiveness", () => {
  beforeAll(() => {
    window.localStorage.clear();
    LocalizationService.initialize({} as never);
  });

  it("says it covers all logged sets, unlike the 30-day distribution", () => {
    expect(
      render([]).querySelector(".workout-widget-subtitle")?.textContent,
    ).toBe(t("dashboard.protocolEffectiveness.subtitle"));
  });

  describe("empty states", () => {
    it("should render the title and no data message when there are no logs", () => {
      const c = render([]);
      expect(c.querySelector(".workout-widget-title")?.textContent).toBe(
        t("dashboard.protocolEffectiveness.title"),
      );
      // The kit's empty state, inside the widget card
      expect(
        c.querySelector(".workout-block-card .workout-feedback-info")
          ?.textContent,
      ).toBe(t("dashboard.protocolEffectiveness.noData"));
      expect(c.querySelector("table")).toBeNull();
    });

    it("should show no data when every protocol has fewer than five entries", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100], [1, 1, 1, 1], "drop_set"),
      );
      expect(c.querySelector(".workout-feedback-info")?.textContent).toBe(
        t("dashboard.protocolEffectiveness.noData"),
      );
    });

    it("compares a protocol with fewer sets when the block lowers the minimum", () => {
      const container = createObsidianContainer();
      ProtocolEffectiveness.render(
        container,
        series("Squat", [100, 100, 100, 100], [1, 1, 1, 1], "drop_set"),
        { protocolMinEntries: 4 },
      );

      expect(rows(container)).toHaveLength(1);
    });

    it("still shows a protocol whose custom definition was deleted, by its id", () => {
      const data = series("Squat", [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], "mystery");
      expect(render(data, pluginWith([])).textContent).toContain("mystery");
    });
  });

  describe("table rendering", () => {
    it("should render the header columns and the disclaimer", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [1, 1, 1, 1, 1], "drop_set"),
      );
      const heads = Array.from(c.querySelectorAll("th")).map(
        (h) => h.textContent,
      );
      expect(heads).toEqual([
        t("dashboard.protocolEffectiveness.columnProtocol"),
        t("dashboard.protocolEffectiveness.columnEntries"),
        t("dashboard.protocolEffectiveness.columnVolumeChange"),
        t("dashboard.protocolEffectiveness.columnProgression"),
      ]);
      expect(
        c.querySelector(".workout-protocol-effectiveness-disclaimer")
          ?.textContent,
      ).toBe(t("dashboard.protocolEffectiveness.disclaimer"));
    });

    it("orders the rows by the figure the block asks for", () => {
      const data = [
        ...series("Squat", [100, 100, 100, 100, 100], [1, 1, 1, 1, 1], "drop_set"),
        ...series(
          "Curl",
          [10, 10, 10, 10, 10, 10, 10],
          [1, 1, 1, 1, 1, 1, 1],
          "rest_pause",
          10,
        ),
      ];
      const container = createObsidianContainer();
      ProtocolEffectiveness.render(container, data, {
        protocolSortBy: "entryCount",
      });

      expect(rows(container).map(entries)).toEqual(["7", "5"]);
    });

    it("should render a coloured badge for built-in protocols", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [1, 1, 1, 1, 1], "drop_set"),
      );
      const badge = c.querySelector(
        ".workout-protocol-effectiveness-badge",
      ) as HTMLElement;
      expect(badge.style.backgroundColor).toBe("rgb(239, 68, 68)");
    });
  });

  describe("metric calculation", () => {
    // Squat t=1..5 (drop_set) then 2 standard rows (t=6,7: below the minimum).
    // weights 100,100,100,90,110,100,100 / volumes 100,100,100,200,200,200,200
    const scenario = (): WorkoutLogData[] => [
      ...series(
        "Squat",
        [100, 100, 100, 90, 110],
        [100, 100, 100, 200, 200],
        "drop_set",
      ),
      log("Squat", 6, 100, 200),
      log("Squat", 7, 100, 200),
    ];

    it("should compute average volume change and progression rate", () => {
      const [r] = rows(render(scenario()));
      expect(entries(r)).toBe("5");
      // changes: +66.67, +100, +100, +50 -> mean 79.17
      expect(volume(r).textContent).toBe("+79.2%");
      expect(volume(r).className).toBe(POS);
      // progressions: yes, yes, no, yes, no -> 3/5
      expect(progression(r).textContent).toBe("60.0%");
      expect(progression(r).className).toBe(NEU);
    });

    it("should hide protocols below the minimum entry count", () => {
      expect(rows(render(scenario()))).toHaveLength(1);
    });

    it("should treat entries without a protocol as standard", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [1, 1, 1, 1, 1]),
      );
      const [r] = rows(c);
      expect(entries(r)).toBe("5");
      const badge = r.querySelector(
        ".workout-protocol-effectiveness-badge",
      ) as HTMLElement;
      expect(badge.style.backgroundColor).toBe("rgb(128, 128, 128)");
    });

    it("should report a negative volume change with a minus sign", () => {
      // volumes 200,200,200,100,100 -> -33.33, -50, -50 -> mean -44.44
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [200, 200, 200, 100, 100], "drop_set"),
      );
      const [r] = rows(c);
      expect(volume(r).textContent).toBe("-44.4%");
      expect(volume(r).className).toBe(NEG);
      // 4 comparisons, all next weight >= current
      expect(progression(r).textContent).toBe("100.0%");
      expect(progression(r).className).toBe(POS);
    });

    it("should show neutral zero change when volume is flat", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [100, 100, 100, 100, 100], "drop_set"),
      );
      expect(volume(rows(c)[0]).textContent).toBe("0.0%");
      expect(volume(rows(c)[0]).className).toBe(NEU);
    });

    it("should classify progression below 50 percent as negative", () => {
      // weights strictly decreasing: no progression
      const c = render(
        series("Squat", [100, 90, 80, 70, 60], [1, 1, 1, 1, 1], "drop_set"),
      );
      expect(progression(rows(c)[0]).textContent).toBe("0.0%");
      expect(progression(rows(c)[0]).className).toBe(NEG);
    });

    it("should report zeros when exercises have a single logged entry", () => {
      const data = ["A", "B", "C", "D", "E"].map((e, i) =>
        log(e, i + 1, 100, 100, "drop_set"),
      );
      const [r] = rows(render(data));
      expect(volume(r).textContent).toBe("0.0%");
      expect(progression(r).textContent).toBe("0.0%");
    });

    it("should ignore volume change when the previous volume is zero", () => {
      const c = render(
        series("Squat", [100, 100, 100, 100, 100], [0, 0, 0, 100, 100], "drop_set"),
      );
      // i1: before [0] -> skipped; i2 before [0,0] -> skipped; i3 before [0,0,0] -> skipped
      expect(volume(rows(c)[0]).textContent).toBe("0.0%");
    });

    it("compares sets without a timestamp in the order they were logged", () => {
      const data = series(
        "Squat",
        [100, 100, 100, 100, 100],
        [100, 100, 100, 100, 100],
        "drop_set",
      ).map((e) => ({ ...e, timestamp: undefined }));
      const [r] = rows(render(data));
      expect(progression(r).textContent).toBe("100.0%");
      expect(volume(r).textContent).toBe("0.0%");
    });

    describe("in set order (training day, then timestamp)", () => {
      const renderMin1 = (data: WorkoutLogData[]) => {
        const container = createObsidianContainer();
        ProtocolEffectiveness.render(
          container,
          data,
          { protocolMinEntries: 1 },
        );
        return container;
      };
      const dropSetRow = (c: HTMLElement) =>
        rows(c).find((r) => entries(r) === "1") as HTMLElement;

      it("puts a set whose date was edited (old timestamp) on its new day", () => {
        const c = renderMin1([
          { ...log("Squat", 1, 100, 100), date: "2024-01-01" },
          // Logged first, then its date was moved to the 3rd: it comes after
          { ...log("Squat", 5, 110, 200), date: "2024-01-03" },
          { ...log("Squat", 10, 100, 100, "drop_set"), date: "2024-01-02" },
        ]);
        const r = dropSetRow(c);
        expect(volume(r).textContent).toBe("+100.0%");
        expect(progression(r).textContent).toBe("100.0%");
      });

      it("matches the exercise ignoring case and spacing", () => {
        const c = renderMin1([
          log("bench press", 1, 100, 100),
          log("Bench  Press", 2, 100, 100, "drop_set"),
          log("bench press ", 3, 100, 150),
        ]);
        const r = dropSetRow(c);
        expect(volume(r).textContent).toBe("+50.0%");
        expect(progression(r).textContent).toBe("100.0%");
      });
    });
  });

  describe("custom protocols and ordering", () => {
    const custom = pluginWith([
      { id: "tempo", name: "Tempo Work", abbreviation: "TW", color: "#FF0000" },
    ]);

    it("should render custom protocols using their name and converted colour", () => {
      const c = render(
        series("Bench", [100, 100, 100, 100, 100], [100, 100, 100, 100, 100], "tempo"),
        custom,
      );
      const badge = rows(c)[0].querySelector(
        ".workout-protocol-effectiveness-badge",
      ) as HTMLElement;
      expect(badge.textContent).toBe("Tempo Work");
      expect(badge.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("should accept custom colours without a leading hash", () => {
      const c = render(
        series("Bench", [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], "tempo"),
        pluginWith([
          { id: "tempo", name: "Tempo", abbreviation: "T", color: "00FF00" },
        ]),
      );
      const badge = rows(c)[0].querySelector(
        ".workout-protocol-effectiveness-badge",
      ) as HTMLElement;
      expect(badge.style.backgroundColor).toBe("rgb(0, 255, 0)");
    });

    it("should sort protocols by progression rate descending", () => {
      const data = [
        // drop_set on Squat: 60% progression
        ...series("Squat", [100, 100, 100, 90, 110], [100, 100, 100, 200, 200], "drop_set"),
        log("Squat", 6, 100, 200),
        log("Squat", 7, 100, 200),
        // tempo on Bench: 100% progression
        ...series("Bench", [100, 100, 100, 100, 100], [100, 100, 100, 100, 100], "tempo"),
      ];
      const rs = rows(render(data, custom));
      expect(rs).toHaveLength(2);
      expect(progression(rs[0]).textContent).toBe("100.0%");
      expect(progression(rs[1]).textContent).toBe("60.0%");
    });
  });
});
