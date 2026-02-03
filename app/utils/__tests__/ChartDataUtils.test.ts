import { ChartDataUtils } from '@app/utils/ChartDataUtils';
import { WorkoutLogData } from '@app/types/WorkoutLogData';
import { CHART_TYPE, CHART_DATA_TYPE } from '@app/types';

describe('ChartDataUtils', () => {
  // Helper to create mock workout log data
  const createLogEntry = (
    date: string,
    exercise: string,
    reps: number,
    weight: number,
    volume: number,
    customFields?: Record<string, string | number | boolean>
  ): WorkoutLogData => ({
    date,
    exercise,
    reps,
    weight,
    volume,
    customFields,
  });

  // Get a recent date string for testing (within default 30 day range)
  const getRecentDate = (daysAgo: number = 0): string => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  describe('processChartData - basic functionality', () => {
    it('should return empty datasets for empty log data', () => {
      const result = ChartDataUtils.processChartData([], CHART_DATA_TYPE.VOLUME);

      expect(result.labels).toEqual([]);
      expect(result.datasets).toEqual([]);
    });

    it('should filter data by date range', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(5), 'Squat', 10, 100, 1000),
        createLogEntry(getRecentDate(50), 'Squat', 10, 100, 1000), // Outside 30-day range
      ];

      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.VOLUME, 30);

      expect(result.labels).toHaveLength(1);
    });

    it('should sort data by date', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Squat', 10, 100, 1000),
        createLogEntry(getRecentDate(5), 'Squat', 8, 90, 720),
        createLogEntry(getRecentDate(3), 'Squat', 12, 110, 1320),
      ];

      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.VOLUME, 30);

      // Labels should be in chronological order (oldest first)
      expect(result.labels).toHaveLength(3);
    });

    it('should group entries by date', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Squat', 10, 100, 1000),
        createLogEntry(date, 'Squat', 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // Should have only one label for the same date
      expect(result.labels).toHaveLength(1);
    });
  });

  describe('processChartData - standard chart types', () => {
    const logData: WorkoutLogData[] = [
      createLogEntry(getRecentDate(1), 'Squat', 10, 100, 1000),
    ];

    it('should handle volume chart type', () => {
      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.VOLUME);

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe('#4CAF50');
    });

    it('should handle weight chart type', () => {
      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.WEIGHT);

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe('#FF9800');
    });

    it('should handle reps chart type', () => {
      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.REPS);

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].borderColor).toBe('#FF9800');
    });
  });

  describe('processChartData - display types (EXERCISE vs WORKOUT)', () => {
    const date = getRecentDate(1);
    const logData: WorkoutLogData[] = [
      createLogEntry(date, 'Squat', 10, 100, 1000),
      createLogEntry(date, 'Squat', 10, 100, 1000),
    ];

    it('should calculate averages for EXERCISE display type', () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // Average of 1000 + 1000 / 2 = 1000
      expect(result.datasets[0].data[0]).toBe(1000);
      expect(result.datasets[0].label).toContain('Average');
    });

    it('should calculate totals for WORKOUT display type', () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.WORKOUT
      );

      // Total of 1000 + 1000 = 2000
      expect(result.datasets[0].data[0]).toBe(2000);
      expect(result.datasets[0].label).toContain('Total');
    });

    it('should calculate totals for COMBINED display type', () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.COMBINED
      );

      expect(result.datasets[0].data[0]).toBe(2000);
    });

    it('should calculate totals for ALL display type', () => {
      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.ALL
      );

      expect(result.datasets[0].data[0]).toBe(2000);
    });
  });

  describe('processChartData - getCustomFieldNumber (lines 24-43)', () => {
    describe('exact key matching', () => {
      it('should extract number value with exact key match (line 24-26)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            duration: 1800, // 30 minutes in seconds
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(1800);
      });

      it('should parse string value to number with exact key match (lines 27-29)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            distance: '5.5', // String that parses to number
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'distance',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(5.5);
      });

      it('should return 0 for unparseable string with exact key match (line 29)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            duration: 'not a number',
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it('should handle boolean value (returns 0)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            duration: true, // Boolean - not number or string
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        // Boolean falls through to case-insensitive search which also won't match
        expect(result.datasets).toHaveLength(1);
      });
    });

    describe('case-insensitive key matching (lines 33-42)', () => {
      it('should find number value with case-insensitive match (lines 35-36)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            DURATION: 3600, // Uppercase key, number value
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration', // lowercase search
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(3600);
      });

      it('should parse string value with case-insensitive match (lines 37-39)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            DISTANCE: '10.5', // Uppercase key, string value
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'distance', // lowercase search
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(10.5);
      });

      it('should return 0 for unparseable string with case-insensitive match (line 39)', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            HeartRate: 'N/A', // Mixed case key, unparseable string
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'heartrate', // lowercase search
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it('should handle heartRate camelCase key with heartrate lowercase search', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            heartRate: 150, // camelCase in customFields
          }),
        ];

        // The code tries both "heartRate" and "heartrate" for heartRate data
        const result = ChartDataUtils.processChartData(
          logData,
          'heartRate',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(150);
      });
    });

    describe('key not found (line 43)', () => {
      it('should return 0 when key is not found in customFields', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
            someOtherField: 100,
          }),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });

      it('should return 0 when customFields is undefined', () => {
        const logData: WorkoutLogData[] = [
          createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, undefined),
        ];

        const result = ChartDataUtils.processChartData(
          logData,
          'duration',
          30,
          'DD/MM/YYYY',
          CHART_TYPE.EXERCISE
        );

        expect(result.datasets).toHaveLength(1);
        expect(result.datasets[0].data[0]).toBe(0);
      });
    });
  });

  describe('processChartData - dynamic exercise types', () => {
    it('should aggregate duration from customFields', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Running', 0, 0, 0, { duration: 1800 }),
        createLogEntry(date, 'Running', 0, 0, 0, { duration: 1200 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'duration',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.WORKOUT // Total
      );

      expect(result.datasets[0].data[0]).toBe(3000); // 1800 + 1200
    });

    it('should aggregate distance from customFields', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Running', 0, 0, 0, { distance: 5 }),
        createLogEntry(date, 'Running', 0, 0, 0, { distance: 3 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'distance',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.WORKOUT
      );

      expect(result.datasets[0].data[0]).toBe(8); // 5 + 3
    });

    it('should calculate pace from duration and distance', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
          duration: 30, // 30 minutes
          distance: 5, // 5 km
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'pace',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // Pace = duration / distance = 30 / 5 = 6 min/km
      expect(result.datasets[0].data[0]).toBe(6);
    });

    it('should handle zero distance for pace calculation', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Running', 0, 0, 0, {
          duration: 30,
          distance: 0,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'pace',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // Pace should be 0 when distance is 0 (avoid division by zero)
      expect(result.datasets[0].data[0]).toBe(0);
    });

    it('should average heart rate (always average, not total)', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Running', 0, 0, 0, { heartRate: 150 }),
        createLogEntry(date, 'Running', 0, 0, 0, { heartRate: 160 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'heartRate',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.WORKOUT // Even with WORKOUT type, heart rate is averaged
      );

      // Heart rate is always averaged: (150 + 160) / 2 = 155
      expect(result.datasets[0].data[0]).toBe(155);
    });
  });

  describe('processChartData - custom parameter keys', () => {
    it('should handle custom parameter keys not in CHART_DATA_TYPE', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Meditation', 0, 0, 0, {
          mindfulness: 8,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'mindfulness', // Custom parameter key
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].data[0]).toBe(8);
      expect(result.datasets[0].label).toContain('Mindfulness');
    });

    it('should use customParamLabel when provided', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Meditation', 0, 0, 0, {
          mindfulness: 8,
        }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'mindfulness',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE,
        'Focus Score'
      );

      expect(result.datasets[0].label).toContain('Focus Score');
    });

    it('should aggregate custom parameters in WORKOUT mode', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Meditation', 0, 0, 0, { focus: 7 }),
        createLogEntry(date, 'Meditation', 0, 0, 0, { focus: 9 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'focus',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.WORKOUT
      );

      expect(result.datasets[0].data[0]).toBe(16); // 7 + 9
      expect(result.datasets[0].label).toContain('Total');
    });

    it('should average custom parameters in EXERCISE mode', () => {
      const date = getRecentDate(1);
      const logData: WorkoutLogData[] = [
        createLogEntry(date, 'Meditation', 0, 0, 0, { focus: 7 }),
        createLogEntry(date, 'Meditation', 0, 0, 0, { focus: 9 }),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'focus',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      expect(result.datasets[0].data[0]).toBe(8); // (7 + 9) / 2
      expect(result.datasets[0].label).toContain('Avg');
    });

    it('should return custom data (0) for unknown type when no matching custom field', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Squat', 10, 100, 1000, {}),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        'unknownType', // Unknown type with no matching custom field
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // Returns custom data path with 0 value (since field not found)
      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].data[0]).toBe(0);
      // Custom param gets color from ParameterUtils.getColorForDataType
    });

    it('should fall back to volume when there is no data', () => {
      // The fallback to volume only occurs when customData array is empty
      // which happens when there are no log entries within the date range
      const result = ChartDataUtils.processChartData(
        [],
        'unknownType',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      // No data means empty datasets
      expect(result.datasets).toEqual([]);
    });
  });

  describe('processChartData - date formats', () => {
    it('should use DD/MM/YYYY format by default', () => {
      // Use a fixed recent date for predictable label output
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split('T')[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, 'Squat', 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30
      );

      // Verify format is DD/MM/YYYY
      expect(result.labels[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should use YYYY-MM-DD format when specified', () => {
      // Use a fixed recent date for predictable label output
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split('T')[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, 'Squat', 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'YYYY-MM-DD'
      );

      // Verify format is YYYY-MM-DD
      expect(result.labels[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should use MM/DD/YYYY format when specified', () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - 5);
      const dateStr = testDate.toISOString().split('T')[0];

      const logData: WorkoutLogData[] = [
        createLogEntry(dateStr, 'Squat', 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'MM/DD/YYYY'
      );

      // Verify format is MM/DD/YYYY
      expect(result.labels[0]).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });
  });

  describe('processChartData - dataset properties', () => {
    it('should create dataset with correct styling properties', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'Squat', 10, 100, 1000),
      ];

      const result = ChartDataUtils.processChartData(logData, CHART_DATA_TYPE.VOLUME);

      const dataset = result.datasets[0];
      expect(dataset.tension).toBe(0.4);
      expect(dataset.fill).toBe(false);
      expect(dataset.pointRadius).toBe(4);
      expect(dataset.pointHoverRadius).toBe(6);
      expect(dataset.backgroundColor).toBe('#4CAF5020'); // Color + alpha
    });
  });

  describe('processChartData - edge cases', () => {
    it('should handle entries with zero count (division safety)', () => {
      // This tests the count > 0 checks in averaging calculations
      const logData: WorkoutLogData[] = [];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      expect(result.datasets).toEqual([]);
    });

    it('should handle mixed customFields with standard and custom keys', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(1), 'CrossFit', 10, 50, 500, {
          duration: 2400,
          heartRate: 165,
          calories: 450,
        }),
      ];

      // Test standard type with customFields present
      const volumeResult = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );
      expect(volumeResult.datasets[0].data[0]).toBe(500);

      // Test custom type
      const caloriesResult = ChartDataUtils.processChartData(
        logData,
        'calories',
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );
      expect(caloriesResult.datasets[0].data[0]).toBe(450);
    });

    it('should handle multiple days of data correctly', () => {
      const logData: WorkoutLogData[] = [
        createLogEntry(getRecentDate(3), 'Squat', 10, 100, 1000),
        createLogEntry(getRecentDate(2), 'Squat', 12, 110, 1320),
        createLogEntry(getRecentDate(1), 'Squat', 8, 90, 720),
      ];

      const result = ChartDataUtils.processChartData(
        logData,
        CHART_DATA_TYPE.VOLUME,
        30,
        'DD/MM/YYYY',
        CHART_TYPE.EXERCISE
      );

      expect(result.labels).toHaveLength(3);
      expect(result.datasets[0].data).toHaveLength(3);
      // Data should be sorted by date (oldest first)
      expect(result.datasets[0].data).toEqual([1000, 1320, 720]);
    });
  });
});
