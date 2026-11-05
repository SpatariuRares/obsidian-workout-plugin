import { FormatUtils } from "@app/utils/FormatUtils";
import { CHART_DATA_TYPE } from "@app/features/charts/types";
import { LocalizationService, t } from "@app/i18n";

describe("FormatUtils", () => {
  beforeAll(() => LocalizationService.initialize({} as never));

  describe("formatDuration", () => {
    it("should format 0 seconds as '0s'", () => {
      expect(FormatUtils.formatDuration(0)).toBe("0s");
    });

    it("should format 30 seconds as '30s'", () => {
      expect(FormatUtils.formatDuration(30)).toBe("30s");
    });

    it("should format 90 seconds as '1m 30s'", () => {
      expect(FormatUtils.formatDuration(90)).toBe("1m 30s");
    });

    it("should format 3600 seconds (1 hour) as '1h'", () => {
      expect(FormatUtils.formatDuration(3600)).toBe("1h");
    });

    it("should format 5400 seconds (1.5 hours) as '1h 30m'", () => {
      expect(FormatUtils.formatDuration(5400)).toBe("1h 30m");
    });

    it("should format 60 seconds as '1m'", () => {
      expect(FormatUtils.formatDuration(60)).toBe("1m");
    });

    it("should format 3661 seconds (1h 1m 1s) as '1h 1m'", () => {
      // Hours format drops seconds
      expect(FormatUtils.formatDuration(3661)).toBe("1h 1m");
    });

    it("should treat negative values as 0", () => {
      expect(FormatUtils.formatDuration(-100)).toBe("0s");
    });

    it("rounds fractional seconds to the nearest second", () => {
      expect(FormatUtils.formatDuration(89.6)).toBe("1m 30s");
    });

    it("writes the units of the plugin's language", () => {
      expect(FormatUtils.formatDuration(5430)).toBe(
        `${t("common.duration.hours", { count: 1 })} ${t("common.duration.minutes", { count: 30 })}`,
      );
      expect(FormatUtils.formatDuration(45)).toBe(
        t("common.duration.seconds", { count: 45 }),
      );
    });

    describe("precision: m", () => {
      const inMinutes = (seconds: number) =>
        FormatUtils.formatDuration(seconds, { precision: "m" });

      it("rounds to whole minutes", () => {
        expect(inMinutes(45 * 60 + 29)).toBe("45m");
        expect(inMinutes(45 * 60 + 30)).toBe("46m");
      });

      it("shows hours and minutes from an hour up", () => {
        expect(inMinutes(4500)).toBe("1h 15m");
        expect(inMinutes(7200)).toBe("2h");
      });

      it("carries rounding into the hour", () => {
        expect(inMinutes(3599)).toBe("1h");
      });

      it("shows 0m under half a minute and for negative values", () => {
        expect(inMinutes(20)).toBe("0m");
        expect(inMinutes(-5)).toBe("0m");
      });
    });
  });

  describe("formatPace", () => {
    it("should format 5.0 min/km as '5:00'", () => {
      expect(FormatUtils.formatPace(5.0)).toBe("5:00");
    });

    it("should format 5.5 min/km as '5:30'", () => {
      expect(FormatUtils.formatPace(5.5)).toBe("5:30");
    });

    it("should format 4.25 min/km as '4:15'", () => {
      expect(FormatUtils.formatPace(4.25)).toBe("4:15");
    });

    it("should format 0 min/km as '0:00'", () => {
      expect(FormatUtils.formatPace(0)).toBe("0:00");
    });

    it("should format 10.75 min/km as '10:45'", () => {
      expect(FormatUtils.formatPace(10.75)).toBe("10:45");
    });

    it("should treat negative values as 0", () => {
      expect(FormatUtils.formatPace(-5)).toBe("0:00");
    });
  });

  describe("improvement", () => {
    it("keeps the line's direction when higher is better", () => {
      expect(FormatUtils.improvement("up", CHART_DATA_TYPE.VOLUME)).toBe("up");
      expect(FormatUtils.improvement("down", CHART_DATA_TYPE.WEIGHT)).toBe("down");
    });

    it("turns it round when lower is better (pace)", () => {
      expect(FormatUtils.improvement("down", CHART_DATA_TYPE.PACE)).toBe("up");
      expect(FormatUtils.improvement("up", CHART_DATA_TYPE.PACE)).toBe("down");
    });

    it("calls a stable line neutral", () => {
      expect(FormatUtils.improvement("stable", CHART_DATA_TYPE.PACE)).toBe("neutral");
      expect(FormatUtils.improvement("stable", CHART_DATA_TYPE.VOLUME)).toBe("neutral");
    });

    it("treats a missing data type as higher is better", () => {
      expect(FormatUtils.improvement("up")).toBe("up");
    });
  });

  describe("isLowerBetter", () => {
    it("should return true for PACE type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.PACE)).toBe(
        true,
      );
    });

    it("should return false for VOLUME type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.VOLUME)).toBe(
        false,
      );
    });

    it("should return false for WEIGHT type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.WEIGHT)).toBe(
        false,
      );
    });

    it("should return false for REPS type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.REPS)).toBe(
        false,
      );
    });

    it("should return false for DURATION type", () => {
      expect(
        FormatUtils.isLowerBetter(CHART_DATA_TYPE.DURATION),
      ).toBe(false);
    });

    it("should return false for DISTANCE type", () => {
      expect(
        FormatUtils.isLowerBetter(CHART_DATA_TYPE.DISTANCE),
      ).toBe(false);
    });

    it("should return false for HEART_RATE type", () => {
      expect(
        FormatUtils.isLowerBetter(CHART_DATA_TYPE.HEART_RATE),
      ).toBe(false);
    });
  });

  describe("formatValue", () => {
    describe("DURATION type", () => {
      it("should use formatDuration for duration values", () => {
        expect(
          FormatUtils.formatValue(90, CHART_DATA_TYPE.DURATION),
        ).toBe("1m 30s");
      });

      it("should format large duration values", () => {
        expect(
          FormatUtils.formatValue(5400, CHART_DATA_TYPE.DURATION),
        ).toBe("1h 30m");
      });
    });

    describe("PACE type", () => {
      it("should use formatPace for pace values", () => {
        expect(
          FormatUtils.formatValue(5.5, CHART_DATA_TYPE.PACE),
        ).toBe("5:30");
      });

      it("should format integer pace values", () => {
        expect(FormatUtils.formatValue(6, CHART_DATA_TYPE.PACE)).toBe(
          "6:00",
        );
      });
    });

    describe("REPS type", () => {
      it("should round reps to integer", () => {
        expect(
          FormatUtils.formatValue(10.7, CHART_DATA_TYPE.REPS),
        ).toBe("11");
      });

      it("should format integer reps without decimals", () => {
        expect(
          FormatUtils.formatValue(12, CHART_DATA_TYPE.REPS),
        ).toBe("12");
      });
    });

    describe("VOLUME type", () => {
      it("should format volume with kg unit", () => {
        expect(
          FormatUtils.formatValue(1000, CHART_DATA_TYPE.VOLUME),
        ).toBe("1000 kg");
      });

      it("should format decimal volume with 2 decimal places", () => {
        expect(
          FormatUtils.formatValue(1000.567, CHART_DATA_TYPE.VOLUME),
        ).toBe("1000.57 kg");
      });
    });

    describe("WEIGHT type", () => {
      it("should format weight with kg unit", () => {
        expect(
          FormatUtils.formatValue(80, CHART_DATA_TYPE.WEIGHT),
        ).toBe("80 kg");
      });

      it("should format decimal weight with 2 decimal places", () => {
        expect(
          FormatUtils.formatValue(82.5, CHART_DATA_TYPE.WEIGHT),
        ).toBe("82.50 kg");
      });
    });

    describe("DISTANCE type", () => {
      it("should format distance with km unit", () => {
        expect(
          FormatUtils.formatValue(5, CHART_DATA_TYPE.DISTANCE),
        ).toBe(`5 ${t("common.km")}`);
      });

      it("should format decimal distance with 2 decimal places", () => {
        expect(
          FormatUtils.formatValue(10.123, CHART_DATA_TYPE.DISTANCE),
        ).toBe(`10.12 ${t("common.km")}`);
      });
    });

    describe("HEART_RATE type", () => {
      it("should format heart rate with bpm unit", () => {
        expect(
          FormatUtils.formatValue(150, CHART_DATA_TYPE.HEART_RATE),
        ).toBe(`150 ${t("common.bpm")}`);
      });

      it("should format decimal heart rate with 2 decimal places", () => {
        expect(
          FormatUtils.formatValue(145.67, CHART_DATA_TYPE.HEART_RATE),
        ).toBe(`145.67 ${t("common.bpm")}`);
      });
    });
  });
});

describe("FormatUtils.formatNumber", () => {
  const { LocalizationService } = jest.requireActual("@app/i18n");
  const withLocale = (locale: string) =>
    jest
      .spyOn(LocalizationService, "getInstance")
      .mockReturnValue({ getCurrentLocale: () => locale });

  afterEach(() => jest.restoreAllMocks());

  it("uses the plugin language's separators", () => {
    withLocale("en");
    expect(FormatUtils.formatNumber(63814)).toBe("63,814");
    withLocale("it");
    expect(FormatUtils.formatNumber(63814)).toBe("63.814");
  });

  it("rounds to the decimals asked for", () => {
    withLocale("en");
    expect(FormatUtils.formatNumber(9895.6)).toBe("9,896");
    expect(FormatUtils.formatNumber(82.567, 1)).toBe("82.6");
  });

  it("falls back to English for a locale code Intl rejects", () => {
    withLocale("not a locale");
    expect(FormatUtils.formatNumber(1234)).toBe("1,234");
  });
});

describe("FormatUtils number formatters", () => {
  const { LocalizationService } = jest.requireActual("@app/i18n");
  const withLocale = (locale: string) =>
    jest
      .spyOn(LocalizationService, "getInstance")
      .mockReturnValue({ getCurrentLocale: () => locale });

  beforeEach(() => withLocale("en"));
  afterEach(() => jest.restoreAllMocks());

  describe("formatValue", () => {
    it("uses the plugin language's decimal separator", () => {
      withLocale("it");
      expect(FormatUtils.formatValue(82.5, CHART_DATA_TYPE.WEIGHT)).toBe(
        "82,50 kg",
      );
    });

    it("keeps figures ungrouped, as before", () => {
      expect(FormatUtils.formatValue(12345.5, CHART_DATA_TYPE.VOLUME)).toBe(
        "12345.50 kg",
      );
    });

    it("shows exactly the decimals asked for, whole numbers too", () => {
      expect(
        FormatUtils.formatValue(100, CHART_DATA_TYPE.WEIGHT, { decimals: 1 }),
      ).toBe("100.0 kg");
      expect(
        FormatUtils.formatValue(82.56, CHART_DATA_TYPE.WEIGHT, { decimals: 1 }),
      ).toBe("82.6 kg");
    });

    it("still rounds reps and writes duration and pace their own way with decimals", () => {
      jest.restoreAllMocks(); // t() needs the real service
      const one = { decimals: 1 };
      expect(FormatUtils.formatValue(10.7, CHART_DATA_TYPE.REPS, one)).toBe("11");
      expect(FormatUtils.formatValue(90, CHART_DATA_TYPE.DURATION, one)).toBe(
        "1m 30s",
      );
      expect(FormatUtils.formatValue(5.5, CHART_DATA_TYPE.PACE, one)).toBe("5:30");
    });

    it("writes a pace as a decimal number when asked", () => {
      expect(
        FormatUtils.formatValue(0.5, CHART_DATA_TYPE.PACE, {
          decimals: 2,
          pace: "decimal",
        }),
      ).toBe(`0.50 ${t("common.minPerKm")}`);
    });
  });

  describe("formatSignedPercent", () => {
    it("signs a change, positive and negative", () => {
      expect(FormatUtils.formatSignedPercent(12.34, 1)).toBe("+12.3%");
      expect(FormatUtils.formatSignedPercent(-5, 0)).toBe("-5%");
    });

    it("gives zero no sign, also when it rounds to zero", () => {
      expect(FormatUtils.formatSignedPercent(0, 1)).toBe("0.0%");
      expect(FormatUtils.formatSignedPercent(-0.04, 1)).toBe("0.0%");
    });

    it("uses the plugin language's decimal separator", () => {
      withLocale("it");
      expect(FormatUtils.formatSignedPercent(12.34, 1)).toBe("+12,3%");
    });
  });

  describe("formatVolume", () => {
    it("writes a volume grouped, in the settings weight unit", () => {
      expect(FormatUtils.formatVolume(63814.4)).toBe("63,814 kg");
      withLocale("it");
      expect(FormatUtils.formatVolume(63814)).toBe("63.814 kg");
    });
  });
});
