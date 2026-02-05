import { FormatUtils } from "@app/utils/FormatUtils";
import { CHART_DATA_TYPE } from "@app/features/charts/types";

describe("FormatUtils", () => {
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

  describe("isLowerBetter", () => {
    it("should return true for PACE type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.PACE)).toBe(true);
    });

    it("should return false for VOLUME type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.VOLUME)).toBe(false);
    });

    it("should return false for WEIGHT type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.WEIGHT)).toBe(false);
    });

    it("should return false for REPS type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.REPS)).toBe(false);
    });

    it("should return false for DURATION type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.DURATION)).toBe(false);
    });

    it("should return false for DISTANCE type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.DISTANCE)).toBe(false);
    });

    it("should return false for HEART_RATE type", () => {
      expect(FormatUtils.isLowerBetter(CHART_DATA_TYPE.HEART_RATE)).toBe(false);
    });
  });

  describe("formatValue", () => {
    describe("DURATION type", () => {
      it("should use formatDuration for duration values", () => {
        expect(FormatUtils.formatValue(90, CHART_DATA_TYPE.DURATION)).toBe(
          "1m 30s"
        );
      });

      it("should format large duration values", () => {
        expect(FormatUtils.formatValue(5400, CHART_DATA_TYPE.DURATION)).toBe(
          "1h 30m"
        );
      });
    });

    describe("PACE type", () => {
      it("should use formatPace for pace values", () => {
        expect(FormatUtils.formatValue(5.5, CHART_DATA_TYPE.PACE)).toBe("5:30");
      });

      it("should format integer pace values", () => {
        expect(FormatUtils.formatValue(6, CHART_DATA_TYPE.PACE)).toBe("6:00");
      });
    });

    describe("REPS type", () => {
      it("should round reps to integer", () => {
        expect(FormatUtils.formatValue(10.7, CHART_DATA_TYPE.REPS)).toBe("11");
      });

      it("should format integer reps without decimals", () => {
        expect(FormatUtils.formatValue(12, CHART_DATA_TYPE.REPS)).toBe("12");
      });
    });

    describe("VOLUME type", () => {
      it("should format volume with kg unit", () => {
        expect(FormatUtils.formatValue(1000, CHART_DATA_TYPE.VOLUME)).toBe(
          "1000 kg"
        );
      });

      it("should format decimal volume with 2 decimal places", () => {
        expect(FormatUtils.formatValue(1000.567, CHART_DATA_TYPE.VOLUME)).toBe(
          "1000.57 kg"
        );
      });
    });

    describe("WEIGHT type", () => {
      it("should format weight with kg unit", () => {
        expect(FormatUtils.formatValue(80, CHART_DATA_TYPE.WEIGHT)).toBe(
          "80 kg"
        );
      });

      it("should format decimal weight with 2 decimal places", () => {
        expect(FormatUtils.formatValue(82.5, CHART_DATA_TYPE.WEIGHT)).toBe(
          "82.50 kg"
        );
      });
    });

    describe("DISTANCE type", () => {
      it("should format distance with km unit", () => {
        expect(FormatUtils.formatValue(5, CHART_DATA_TYPE.DISTANCE)).toBe(
          "5 km"
        );
      });

      it("should format decimal distance with 2 decimal places", () => {
        expect(FormatUtils.formatValue(10.123, CHART_DATA_TYPE.DISTANCE)).toBe(
          "10.12 km"
        );
      });
    });

    describe("HEART_RATE type", () => {
      it("should format heart rate with bpm unit", () => {
        expect(FormatUtils.formatValue(150, CHART_DATA_TYPE.HEART_RATE)).toBe(
          "150 bpm"
        );
      });

      it("should format decimal heart rate with 2 decimal places", () => {
        expect(
          FormatUtils.formatValue(145.67, CHART_DATA_TYPE.HEART_RATE)
        ).toBe("145.67 bpm");
      });
    });
  });
});
