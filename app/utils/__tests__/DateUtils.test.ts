import { DateUtils } from '@app/utils/DateUtils';
import { WorkoutLogData } from '@app/types/WorkoutLogData';

describe('DateUtils', () => {
  describe('extractDateOnly', () => {
    it('should extract date from ISO datetime string', () => {
      const result = DateUtils.extractDateOnly('2024-01-15T10:30:00');
      expect(result).toBe('2024-01-15');
    });

    it('should handle date-only strings', () => {
      const result = DateUtils.extractDateOnly('2024-01-15');
      expect(result).toBe('2024-01-15');
    });

    it('should handle ISO strings with timezone', () => {
      const result = DateUtils.extractDateOnly('2024-01-15T10:30:00.000Z');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatDate', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = DateUtils.formatDate(date);
      expect(result).toBe('2024-01-15');
    });

    it('should handle different times on same day', () => {
      const date1 = new Date('2024-01-15T08:00:00');
      const date2 = new Date('2024-01-15T20:00:00');
      expect(DateUtils.formatDate(date1)).toBe(DateUtils.formatDate(date2));
    });
  });

  describe('getDaysAgo', () => {
    it('should return date N days ago', () => {
      const result = DateUtils.getDaysAgo(7);
      const today = new Date();
      const expected = new Date();
      expected.setDate(today.getDate() - 7);

      // Compare only dates, not times
      expect(DateUtils.formatDate(result)).toBe(DateUtils.formatDate(expected));
    });

    it('should handle 0 days (today)', () => {
      const result = DateUtils.getDaysAgo(0);
      const today = new Date();
      expect(DateUtils.formatDate(result)).toBe(DateUtils.formatDate(today));
    });
  });

  describe('getTimeFrameDate', () => {
    it('should return date for week timeframe', () => {
      const result = DateUtils.getTimeFrameDate('week');
      const now = new Date();
      const expected = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Compare dates within 1 second tolerance
      const diff = Math.abs(result.getTime() - expected.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should return date for month timeframe', () => {
      const result = DateUtils.getTimeFrameDate('month');
      const now = new Date();
      const expected = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const diff = Math.abs(result.getTime() - expected.getTime());
      expect(diff).toBeLessThan(1000);
    });

    it('should return date for year timeframe', () => {
      const result = DateUtils.getTimeFrameDate('year');
      const now = new Date();
      const expected = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const diff = Math.abs(result.getTime() - expected.getTime());
      expect(diff).toBeLessThan(1000);
    });
  });

  describe('filterByDateRange', () => {
    const mockData: WorkoutLogData[] = [
      {
        date: '2024-01-10T10:00:00',
        exercise: 'Squat',
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: 'test',
        workout: 'Lower A',
        timestamp: new Date('2024-01-10T10:00:00').getTime()
      },
      {
        date: '2024-01-15T10:00:00',
        exercise: 'Bench Press',
        reps: 8,
        weight: 80,
        volume: 640,
        origine: 'test',
        workout: 'Upper A',
        timestamp: new Date('2024-01-15T10:00:00').getTime()
      },
      {
        date: '2024-01-20T10:00:00',
        exercise: 'Deadlift',
        reps: 5,
        weight: 150,
        volume: 750,
        origine: 'test',
        workout: 'Lower B',
        timestamp: new Date('2024-01-20T10:00:00').getTime()
      },
    ];

    it('should filter data after cutoff date', () => {
      const cutoff = new Date('2024-01-12T00:00:00');
      const result = DateUtils.filterByDateRange(mockData, cutoff);

      expect(result).toHaveLength(2);
      expect(result[0].exercise).toBe('Bench Press');
      expect(result[1].exercise).toBe('Deadlift');
    });

    it('should include entries on cutoff date', () => {
      const cutoff = new Date('2024-01-15T00:00:00');
      const result = DateUtils.filterByDateRange(mockData, cutoff);

      expect(result).toHaveLength(2);
    });

    it('should return empty array if all data is before cutoff', () => {
      const cutoff = new Date('2024-01-25T00:00:00');
      const result = DateUtils.filterByDateRange(mockData, cutoff);

      expect(result).toHaveLength(0);
    });
  });

  describe('filterByTimeFrame', () => {
    const today = new Date();
    const mockData: WorkoutLogData[] = [
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000)),
        exercise: 'Squat',
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: 'test',
        workout: 'Lower A',
        timestamp: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).getTime()
      },
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)),
        exercise: 'Bench Press',
        reps: 8,
        weight: 80,
        volume: 640,
        origine: 'test',
        workout: 'Upper A',
        timestamp: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).getTime()
      },
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000)),
        exercise: 'Deadlift',
        reps: 5,
        weight: 150,
        volume: 750,
        origine: 'test',
        workout: 'Lower B',
        timestamp: new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000).getTime()
      },
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 400 * 24 * 60 * 60 * 1000)),
        exercise: 'Old Exercise',
        reps: 10,
        weight: 50,
        volume: 500,
        origine: 'test',
        workout: 'Old Workout',
        timestamp: new Date(today.getTime() - 400 * 24 * 60 * 60 * 1000).getTime()
      },
    ];

    it('should filter data by week timeframe', () => {
      const result = DateUtils.filterByTimeFrame(mockData, 'week');
      expect(result.length).toBe(1);
      expect(result[0].exercise).toBe('Squat');
    });

    it('should filter data by month timeframe', () => {
      const result = DateUtils.filterByTimeFrame(mockData, 'month');
      expect(result.length).toBe(2);
    });

    it('should filter data by year timeframe', () => {
      const result = DateUtils.filterByTimeFrame(mockData, 'year');
      expect(result.length).toBe(3);
    });
  });

  describe('filterByDaysAgo', () => {
    const today = new Date();
    const mockData: WorkoutLogData[] = [
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000)),
        exercise: 'Squat',
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: 'test',
        workout: 'Lower A',
        timestamp: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).getTime()
      },
      {
        date: DateUtils.formatDate(new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000)),
        exercise: 'Bench Press',
        reps: 8,
        weight: 80,
        volume: 640,
        origine: 'test',
        workout: 'Upper A',
        timestamp: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).getTime()
      },
    ];

    it('should filter by days ago', () => {
      const result = DateUtils.filterByDaysAgo(mockData, 7);

      expect(result).toHaveLength(1);
      expect(result[0].exercise).toBe('Bench Press');
    });
  });

  describe('getUniqueDates', () => {
    const mockData: WorkoutLogData[] = [
      {
        date: '2024-01-15T10:00:00',
        exercise: 'Squat',
        reps: 10,
        weight: 100,
        volume: 1000,
        origine: 'test',
        workout: 'Lower A',
        timestamp: new Date('2024-01-15T10:00:00').getTime()
      },
      {
        date: '2024-01-15T14:00:00',
        exercise: 'Leg Press',
        reps: 12,
        weight: 200,
        volume: 2400,
        origine: 'test',
        workout: 'Lower A',
        timestamp: new Date('2024-01-15T14:00:00').getTime()
      },
      {
        date: '2024-01-16T10:00:00',
        exercise: 'Bench Press',
        reps: 8,
        weight: 80,
        volume: 640,
        origine: 'test',
        workout: 'Upper A',
        timestamp: new Date('2024-01-16T10:00:00').getTime()
      },
    ];

    it('should return unique dates sorted', () => {
      const result = DateUtils.getUniqueDates(mockData);

      expect(result).toHaveLength(2);
      expect(result).toEqual(['2024-01-15', '2024-01-16']);
    });

    it('should handle empty data', () => {
      const result = DateUtils.getUniqueDates([]);
      expect(result).toEqual([]);
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-15T20:00:00');

      expect(DateUtils.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2024-01-15T10:00:00');
      const date2 = new Date('2024-01-16T10:00:00');

      expect(DateUtils.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('getDateRangeForDays', () => {
    it('should return array of dates for N days', () => {
      const result = DateUtils.getDateRangeForDays(7);

      expect(result).toHaveLength(7);
      expect(result[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result[6]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return dates in chronological order', () => {
      const result = DateUtils.getDateRangeForDays(3);

      const date0 = new Date(result[0]);
      const date1 = new Date(result[1]);
      const date2 = new Date(result[2]);

      expect(date1.getTime()).toBeGreaterThan(date0.getTime());
      expect(date2.getTime()).toBeGreaterThan(date1.getTime());
    });

    it('should handle single day', () => {
      const result = DateUtils.getDateRangeForDays(1);

      expect(result).toHaveLength(1);
      const today = new Date();
      expect(result[0]).toBe(DateUtils.formatDate(today));
    });
  });

  describe('getWeekNumberFromToday', () => {
    it('should return 0 for current week', () => {
      const today = new Date();
      const result = DateUtils.getWeekNumberFromToday(today);

      expect(result).toBe(0);
    });

    it('should return 1 for last week', () => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const result = DateUtils.getWeekNumberFromToday(lastWeek);

      expect(result).toBe(1);
    });

    it('should return 4 for 4 weeks ago', () => {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      const result = DateUtils.getWeekNumberFromToday(fourWeeksAgo);

      expect(result).toBe(4);
    });
  });

  describe('groupDatesByWeek', () => {
    it('should group dates by week number', () => {
      const today = new Date();
      const dates = [
        DateUtils.formatDate(today),
        DateUtils.formatDate(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)),
        DateUtils.formatDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)),
      ];

      const result = DateUtils.groupDatesByWeek(dates);

      expect(result.size).toBe(3);
      expect(result.has(0)).toBe(true); // Current week
      expect(result.has(1)).toBe(true); // Last week
      expect(result.has(2)).toBe(true); // 2 weeks ago
    });

    it('should deduplicate same week', () => {
      const today = new Date();
      const dates = [
        DateUtils.formatDate(today),
        DateUtils.formatDate(new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000)), // Yesterday
        DateUtils.formatDate(new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      ];

      const result = DateUtils.groupDatesByWeek(dates);

      // All should be in current week (week 0)
      expect(result.size).toBe(1);
      expect(result.has(0)).toBe(true);
    });
  });

  describe('toTime', () => {
    it('should format date string to HH:MM', () => {
      // Use a date with specific hours/minutes
      const date = new Date(2024, 0, 15, 14, 30, 0); // Jan 15, 2024 14:30:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe('14:30');
    });

    it('should pad single digit hours and minutes', () => {
      const date = new Date(2024, 0, 15, 5, 7, 0); // Jan 15, 2024 05:07:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe('05:07');
    });

    it('should handle midnight', () => {
      const date = new Date(2024, 0, 15, 0, 0, 0); // Jan 15, 2024 00:00:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe('00:00');
    });

    it('should handle end of day', () => {
      const date = new Date(2024, 0, 15, 23, 59, 0); // Jan 15, 2024 23:59:00
      const result = DateUtils.toTime(date.toISOString());
      expect(result).toBe('23:59');
    });

    it('should handle date string without time (parses as local midnight)', () => {
      // When given just a date string, JavaScript parses it as UTC midnight
      // which then gets converted to local time
      const result = DateUtils.toTime('2024-01-15');
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('toDateKey', () => {
    it('should format date string to YYYY-MM-DD', () => {
      const result = DateUtils.toDateKey('2024-01-15T10:30:00');
      expect(result).toBe('2024-01-15');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2024, 0, 5); // Jan 5, 2024
      const result = DateUtils.toDateKey(date.toISOString());
      expect(result).toBe('2024-01-05');
    });

    it('should handle ISO date string with timezone', () => {
      const date = new Date(2024, 11, 25, 10, 0, 0); // Dec 25, 2024 local time
      const result = DateUtils.toDateKey(date.toISOString());
      expect(result).toBe('2024-12-25');
    });

    it('should handle date-only string', () => {
      const result = DateUtils.toDateKey('2024-06-20');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle various valid date formats', () => {
      // Test with a Date object's ISO string
      const date = new Date(2024, 5, 15); // June 15, 2024
      const result = DateUtils.toDateKey(date.toISOString());
      expect(result).toBe('2024-06-15');
    });
  });

  describe('toShortDate', () => {
    it('should format date string to DD/MM', () => {
      const date = new Date(2024, 0, 15, 10, 0, 0); // Jan 15, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe('15/01');
    });

    it('should pad single digit day and month', () => {
      const date = new Date(2024, 2, 5, 10, 0, 0); // Mar 5, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe('05/03');
    });

    it('should handle end of year date', () => {
      const date = new Date(2024, 11, 31, 10, 0, 0); // Dec 31, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe('31/12');
    });

    it('should handle beginning of year date', () => {
      const date = new Date(2024, 0, 1, 10, 0, 0); // Jan 1, 2024
      const result = DateUtils.toShortDate(date.toISOString());
      expect(result).toBe('01/01');
    });
  });

  describe('toFullDate', () => {
    it('should format date string to DD/MM/YYYY', () => {
      const date = new Date(2024, 0, 15, 10, 0, 0); // Jan 15, 2024
      const result = DateUtils.toFullDate(date.toISOString());
      expect(result).toBe('15/01/2024');
    });

    it('should pad single digit day and month', () => {
      const date = new Date(2024, 2, 5, 10, 0, 0); // Mar 5, 2024
      const result = DateUtils.toFullDate(date.toISOString());
      expect(result).toBe('05/03/2024');
    });

    it('should handle different years', () => {
      const date = new Date(2020, 5, 20, 10, 0, 0); // Jun 20, 2020
      const result = DateUtils.toFullDate(date.toISOString());
      expect(result).toBe('20/06/2020');
    });

    it('should handle leap year date', () => {
      const date = new Date(2024, 1, 29, 10, 0, 0); // Feb 29, 2024 (leap year)
      const result = DateUtils.toFullDate(date.toISOString());
      expect(result).toBe('29/02/2024');
    });
  });

  describe('formatDateWithFormat', () => {
    it('should format date with DD/MM/YYYY by default', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15');
      expect(result).toBe('15/01/2024');
    });

    it('should format date with DD/MM/YYYY explicitly', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15', 'DD/MM/YYYY');
      expect(result).toBe('15/01/2024');
    });

    it('should format date with YYYY-MM-DD', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15', 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });

    it('should format date with MM/DD/YYYY', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15', 'MM/DD/YYYY');
      expect(result).toBe('01/15/2024');
    });

    it('should handle Date object input', () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(date, 'DD/MM/YYYY');
      expect(result).toBe('20/06/2024');
    });

    it('should handle Date object with YYYY-MM-DD format', () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-06-20');
    });

    it('should handle Date object with MM/DD/YYYY format', () => {
      const date = new Date(2024, 5, 20); // Jun 20, 2024
      const result = DateUtils.formatDateWithFormat(date, 'MM/DD/YYYY');
      expect(result).toBe('06/20/2024');
    });

    it('should use default format for unknown format string', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15', 'UNKNOWN');
      expect(result).toBe('15/01/2024');
    });

    it('should pad single digit day and month', () => {
      const result = DateUtils.formatDateWithFormat('2024-03-05', 'DD/MM/YYYY');
      expect(result).toBe('05/03/2024');
    });

    it('should handle ISO date string with time', () => {
      const result = DateUtils.formatDateWithFormat('2024-01-15T10:30:00.000Z', 'YYYY-MM-DD');
      expect(result).toBe('2024-01-15');
    });
  });
});
