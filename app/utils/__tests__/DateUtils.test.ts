import { DateUtils } from "@app/utils/DateUtils";
import { localDay } from "@app/services/history/TrainingHistory";

describe("DateUtils", () => {
  describe("getDateRangeForDays", () => {
    it("should return array of dates for N days", () => {
      const result = DateUtils.getDateRangeForDays(7);

      expect(result).toHaveLength(7);
      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result[6]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return dates in chronological order", () => {
      const result = DateUtils.getDateRangeForDays(3);

      const date0 = new Date(result[0]);
      const date1 = new Date(result[1]);
      const date2 = new Date(result[2]);

      expect(date1.getTime()).toBeGreaterThan(date0.getTime());
      expect(date2.getTime()).toBeGreaterThan(date1.getTime());
    });

    it("should handle single day", () => {
      const result = DateUtils.getDateRangeForDays(1);

      expect(result).toHaveLength(1);
      const today = new Date();
      expect(result[0]).toBe(localDay(today));
    });
  });

  describe("toTime", () => {
    it("should format date string to HH:MM", () => {
      // Use a date with specific hours/minutes
      const date = new Date(2024, 0, 15, 14, 30, 0); // Jan 15, 2024 14:30:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe("14:30");
    });

    it("should pad single digit hours and minutes", () => {
      const date = new Date(2024, 0, 15, 5, 7, 0); // Jan 15, 2024 05:07:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe("05:07");
    });

    it("should handle midnight", () => {
      const date = new Date(2024, 0, 15, 0, 0, 0); // Jan 15, 2024 00:00:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe("00:00");
    });

    it("should handle end of day", () => {
      const date = new Date(2024, 0, 15, 23, 59, 0); // Jan 15, 2024 23:59:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe("23:59");
    });

    it("should handle date string without time (parses as local midnight)", () => {
      // When given just a date string, JavaScript parses it as UTC midnight
      // which then gets converted to local time
      const result = DateUtils.toTime("2024-01-15");
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe("toShortDate", () => {
    it("should format date string to DD/MM", () => {
      const date = new Date(2024, 0, 15, 10, 0, 0); // Jan 15, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe("15/01");
    });

    it("should pad single digit day and month", () => {
      const date = new Date(2024, 2, 5, 10, 0, 0); // Mar 5, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe("05/03");
    });

    it("should handle end of year date", () => {
      const date = new Date(2024, 11, 31, 10, 0, 0); // Dec 31, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe("31/12");
    });

    it("should handle beginning of year date", () => {
      const date = new Date(2024, 0, 1, 10, 0, 0); // Jan 1, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe("01/01");
    });
  });

  describe("formatDateWithFormat", () => {
    it("should format date with DD/MM/YYYY by default", () => {
      const result = DateUtils.formatDateWithFormat("2024-01-15");
      expect(result).toBe("15/01/2024");
    });

    it("should format date with DD/MM/YYYY explicitly", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-01-15",
        "DD/MM/YYYY",
      );
      expect(result).toBe("15/01/2024");
    });

    it("should format date with YYYY-MM-DD", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-01-15",
        "YYYY-MM-DD",
      );
      expect(result).toBe("2024-01-15");
    });

    it("should format date with MM/DD/YYYY", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-01-15",
        "MM/DD/YYYY",
      );
      expect(result).toBe("01/15/2024");
    });

    it("should handle Date object input", () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(
        date,
        "DD/MM/YYYY",
      );
      expect(result).toBe("20/06/2024");
    });

    it("should handle Date object with YYYY-MM-DD format", () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(
        date,
        "YYYY-MM-DD",
      );
      expect(result).toBe("2024-06-20");
    });

    it("should handle Date object with MM/DD/YYYY format", () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(
        date,
        "MM/DD/YYYY",
      );
      expect(result).toBe("06/20/2024");
    });

    it("should use default format for unknown format string", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-01-15",
        "UNKNOWN",
      );
      expect(result).toBe("15/01/2024");
    });

    it("should pad single digit day and month", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-03-05",
        "DD/MM/YYYY",
      );
      expect(result).toBe("05/03/2024");
    });

    it("should handle ISO date string with time", () => {
      const result = DateUtils.formatDateWithFormat(
        "2024-01-15T10:30:00.000Z",
        "YYYY-MM-DD",
      );
      expect(result).toBe("2024-01-15");
    });
  });
});
