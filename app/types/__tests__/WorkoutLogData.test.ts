import {
  parseCSVLogFile,
  CSVWorkoutLogEntry,
  entryToCSVLine,
  entriesToCSVContent,
  collectCustomColumns,
  WorkoutProtocol,
} from "../WorkoutLogData";

describe("parseCSVLogFile - CSV Parsing Validation", () => {
  test("should parse valid CSV entries correctly", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,100,1000,mobile,Push Day,1706054400000,Good set
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({
      date: "2024-01-24",
      exercise: "Bench Press",
      reps: 10,
      weight: 100,
      volume: 1000,
      origine: "mobile",
      workout: "Push Day",
      timestamp: 1706054400000,
      notes: "Good set",
      protocol: WorkoutProtocol.STANDARD,
    });
    expect(entries[1]).toEqual({
      date: "2024-01-24",
      exercise: "Squat",
      reps: 5,
      weight: 150,
      volume: 750,
      origine: "mobile",
      workout: "Leg Day",
      timestamp: 1706054500000,
      notes: undefined,
      protocol: WorkoutProtocol.STANDARD,
    });
  });

  test("should skip entries with NaN reps", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,abc,100,1000,mobile,Push Day,1706054400000,Invalid reps
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should skip entries with NaN weight", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,invalid,1000,mobile,Push Day,1706054400000,Invalid weight
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should skip entries with NaN volume", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,100,xyz,mobile,Push Day,1706054400000,Invalid volume
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should skip entries with reps <= 0", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,0,100,0,mobile,Push Day,1706054400000,Zero reps
2024-01-24,Deadlift,-5,200,-1000,mobile,Pull Day,1706054450000,Negative reps
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should skip entries with weight < 0", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,-50,-500,mobile,Push Day,1706054400000,Negative weight
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should accept entries with weight = 0 (bodyweight exercises)", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Pull-ups,10,0,0,mobile,Pull Day,1706054400000,Bodyweight`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].weight).toBe(0);
    expect(entries[0].exercise).toBe("Pull-ups");
  });

  test("should skip entries with empty exercise name", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,,10,100,1000,mobile,Push Day,1706054400000,Missing exercise
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should skip entries with insufficient columns", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
  });

  test("should continue parsing remaining entries after encountering invalid entry", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,abc,100,1000,mobile,Push Day,1706054400000,Invalid reps
2024-01-24,Squat,0,150,0,mobile,Leg Day,1706054450000,Zero reps
2024-01-24,Deadlift,5,200,1000,mobile,Pull Day,1706054500000,Valid entry 1
2024-01-24,Row,-3,80,-240,mobile,Pull Day,1706054550000,Negative reps
2024-01-24,Press,10,60,600,mobile,Push Day,1706054600000,Valid entry 2`;

    const entries = parseCSVLogFile(csvContent);

    // Should have only the 2 valid entries
    expect(entries).toHaveLength(2);
    expect(entries[0].exercise).toBe("Deadlift");
    expect(entries[1].exercise).toBe("Press");
  });

  test("should handle empty CSV content", () => {
    const csvContent = "";
    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(0);
  });

  test("should handle CSV with only header", () => {
    const csvContent =
      "date,exercise,reps,weight,volume,origine,workout,timestamp,notes";
    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(0);
  });

  test("should return empty array on parse exception", () => {
    // Force an error by providing null as content (will cause split to throw)
    const entries = parseCSVLogFile(null as any);

    expect(entries).toHaveLength(0);
  });

  test("should handle multiple validation failures in single line", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,,0,-50,0,mobile,Push Day,1706054400000,Multiple issues`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(0);
  });

  test("should use Date.now() as fallback when timestamp is NaN", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,100,1000,mobile,Push Day,invalid_timestamp,Invalid timestamp`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].timestamp).toBeGreaterThan(0);
    expect(typeof entries[0].timestamp).toBe("number");
  });
});

describe("entryToCSVLine - CSV Injection Protection", () => {
  const baseEntry: CSVWorkoutLogEntry = {
    date: "2024-01-24",
    exercise: "Bench Press",
    reps: 10,
    weight: 100,
    volume: 1000,
    origine: "mobile",
    workout: "Push Day",
    timestamp: 1706054400000,
  };

  test("should prefix formula starting with = with single quote", () => {
    const entry = {
      ...baseEntry,
      notes: "=1+1",
    };

    const csvLine = entryToCSVLine(entry);

    // The notes field should be prefixed with single quote
    expect(csvLine).toContain("'=1+1");
    expect(csvLine).not.toContain(",=1+1");
  });

  test("should prefix formula starting with + with single quote", () => {
    const entry = {
      ...baseEntry,
      notes: "+1",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("'+1");
    expect(csvLine).not.toContain(",+1");
  });

  test("should prefix formula starting with - with single quote", () => {
    const entry = {
      ...baseEntry,
      notes: "-1",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("'-1");
    expect(csvLine).not.toContain(",-1");
  });

  test("should prefix formula starting with @ with single quote", () => {
    const entry = {
      ...baseEntry,
      notes: "@SUM(A1:A10)",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("'@SUM(A1:A10)");
    expect(csvLine).not.toContain(",@SUM(A1:A10)");
  });

  test("should protect exercise names starting with formula characters", () => {
    const entry = {
      ...baseEntry,
      exercise: "=HYPERLINK(\"http://evil.com\",\"Click me\")",
    };

    const csvLine = entryToCSVLine(entry);

    // Exercise field (2nd field) should be protected
    expect(csvLine).toContain("'=HYPERLINK");
  });

  test("should not prefix normal text values", () => {
    const entry = {
      ...baseEntry,
      notes: "This is a normal note",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("This is a normal note");
    expect(csvLine).not.toContain("'This is a normal note");
  });

  test("should protect workout names starting with formula characters", () => {
    const entry = {
      ...baseEntry,
      workout: "+EVIL_FORMULA",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("'+EVIL_FORMULA");
  });

  test("should handle empty fields correctly without adding prefix", () => {
    const entry = {
      ...baseEntry,
      notes: "",
      origine: "",
    };

    const csvLine = entryToCSVLine(entry);

    // Should not have single quotes for empty values
    const fields = csvLine.split(",");
    // Notes is the 9th field (index 8), protocol is the 10th field (index 9)
    expect(fields[8]).toBe(""); // Notes field should be empty
    expect(fields[9]).toBe(WorkoutProtocol.STANDARD); // Protocol field should be standard
  });

  test("should combine injection protection with quote escaping", () => {
    const entry = {
      ...baseEntry,
      notes: '=1+1"test',
    };

    const csvLine = entryToCSVLine(entry);

    // Should prefix with single quote AND escape the quote character
    expect(csvLine).toContain("'=1+1\"\"test"); // Double quote escaped
  });

  test("should protect multiple fields in same entry", () => {
    const entry = {
      ...baseEntry,
      exercise: "=EVIL1",
      workout: "+EVIL2",
      notes: "@EVIL3",
    };

    const csvLine = entryToCSVLine(entry);

    expect(csvLine).toContain("'=EVIL1");
    expect(csvLine).toContain("'+EVIL2");
    expect(csvLine).toContain("'@EVIL3");
  });
});

describe("Custom Fields - Dynamic CSV Columns", () => {
  describe("parseCSVLogFile with custom columns", () => {
    test("should parse custom columns into customFields", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance
2024-01-24,Running,1,0,0,mobile,Cardio,1706054400000,,standard,30,5.5`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toEqual({
        duration: 30,
        distance: 5.5,
      });
    });

    test("should parse boolean custom field values", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,completed
2024-01-24,Plank,1,0,0,mobile,Core,1706054400000,,standard,true`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toEqual({
        completed: true,
      });
    });

    test("should parse string custom field values", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,intensity
2024-01-24,HIIT,1,0,0,mobile,Cardio,1706054400000,,standard,high`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toEqual({
        intensity: "high",
      });
    });

    test("should handle empty custom field values", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration
2024-01-24,Running,1,0,0,mobile,Cardio,1706054400000,,standard,`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toBeUndefined();
    });

    test("should work with standard columns only (backward compatible)", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol
2024-01-24,Bench Press,10,100,1000,mobile,Push Day,1706054400000,Good set,standard`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toBeUndefined();
      expect(entries[0].exercise).toBe("Bench Press");
    });

    test("should parse multiple custom columns", () => {
      const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,heartRate,calories
2024-01-24,Running,1,0,0,mobile,Cardio,1706054400000,,standard,45,150,400`;

      const entries = parseCSVLogFile(csvContent);

      expect(entries).toHaveLength(1);
      expect(entries[0].customFields).toEqual({
        duration: 45,
        heartRate: 150,
        calories: 400,
      });
    });
  });

  describe("entryToCSVLine with custom columns", () => {
    const baseEntry: CSVWorkoutLogEntry = {
      date: "2024-01-24",
      exercise: "Running",
      reps: 1,
      weight: 0,
      volume: 0,
      origine: "mobile",
      workout: "Cardio",
      timestamp: 1706054400000,
    };

    test("should include custom fields in CSV line", () => {
      const entry: CSVWorkoutLogEntry = {
        ...baseEntry,
        customFields: {
          duration: 30,
          distance: 5.5,
        },
      };

      const csvLine = entryToCSVLine(entry, ["distance", "duration"]);

      expect(csvLine).toContain(",5.5,30");
    });

    test("should write empty string for missing custom fields", () => {
      const entry: CSVWorkoutLogEntry = {
        ...baseEntry,
        customFields: {
          duration: 30,
        },
      };

      const csvLine = entryToCSVLine(entry, ["distance", "duration"]);

      // distance is missing, should be empty
      expect(csvLine).toContain(",,30");
    });

    test("should write boolean custom fields correctly", () => {
      const entry: CSVWorkoutLogEntry = {
        ...baseEntry,
        customFields: {
          completed: true,
        },
      };

      const csvLine = entryToCSVLine(entry, ["completed"]);

      expect(csvLine).toContain(",true");
    });

    test("should not add custom columns when none specified", () => {
      const entry: CSVWorkoutLogEntry = {
        ...baseEntry,
        customFields: {
          duration: 30,
        },
      };

      const csvLine = entryToCSVLine(entry);
      const fields = csvLine.split(",");

      // Standard columns only (10 fields)
      expect(fields).toHaveLength(10);
    });
  });

  describe("collectCustomColumns", () => {
    test("should collect unique custom column names from entries", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054400000,
          customFields: { duration: 30, distance: 5 },
        },
        {
          date: "2024-01-24",
          exercise: "Cycling",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054500000,
          customFields: { duration: 45, heartRate: 140 },
        },
      ];

      const columns = collectCustomColumns(entries);

      expect(columns).toEqual(["distance", "duration", "heartRate"]);
    });

    test("should return empty array when no custom fields", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Bench Press",
          reps: 10,
          weight: 100,
          volume: 1000,
          timestamp: 1706054400000,
        },
      ];

      const columns = collectCustomColumns(entries);

      expect(columns).toEqual([]);
    });
  });

  describe("entriesToCSVContent with custom columns", () => {
    test("should generate CSV with custom columns in header", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054400000,
          customFields: { duration: 30, distance: 5 },
        },
      ];

      const csv = entriesToCSVContent(entries);
      const lines = csv.split("\n");

      expect(lines[0]).toBe(
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,distance,duration",
      );
      expect(lines[1]).toContain(",5,30");
    });

    test("should preserve existing custom column order", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054400000,
          customFields: { newField: 100 },
        },
      ];

      const csv = entriesToCSVContent(entries, ["existingField", "duration"]);
      const lines = csv.split("\n");

      // Existing columns first, then new columns sorted
      expect(lines[0]).toBe(
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,existingField,duration,newField",
      );
    });

    test("should generate standard CSV when no custom fields", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Bench Press",
          reps: 10,
          weight: 100,
          volume: 1000,
          timestamp: 1706054400000,
        },
      ];

      const csv = entriesToCSVContent(entries);
      const lines = csv.split("\n");

      expect(lines[0]).toBe(
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
      );
    });

    test("should handle entries with different custom fields", () => {
      const entries: CSVWorkoutLogEntry[] = [
        {
          date: "2024-01-24",
          exercise: "Running",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054400000,
          customFields: { duration: 30 },
        },
        {
          date: "2024-01-24",
          exercise: "Cycling",
          reps: 1,
          weight: 0,
          volume: 0,
          timestamp: 1706054500000,
          customFields: { distance: 10 },
        },
      ];

      const csv = entriesToCSVContent(entries);
      const lines = csv.split("\n");

      // Both custom columns should be in header
      expect(lines[0]).toContain("distance");
      expect(lines[0]).toContain("duration");

      // First entry: duration=30, distance=empty
      expect(lines[1]).toMatch(/,30,?$/);

      // Second entry: distance=10, duration=empty
      expect(lines[2]).toContain(",10,");
    });
  });

  describe("Round-trip: parse and write", () => {
    test("should preserve custom fields through parse and write cycle", () => {
      const originalCSV = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance
2024-01-24,Running,1,0,0,mobile,Cardio,1706054400000,,standard,30,5.5`;

      const entries = parseCSVLogFile(originalCSV);
      const regeneratedCSV = entriesToCSVContent(entries);

      const reparsedEntries = parseCSVLogFile(regeneratedCSV);

      expect(reparsedEntries[0].customFields).toEqual({
        duration: 30,
        distance: 5.5,
      });
    });
  });
});
