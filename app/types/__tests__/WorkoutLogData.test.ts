import {
  parseCSVLogFile,
  CSVWorkoutLogEntry,
  entryToCSVLine,
  WorkoutProtocol,
} from "../WorkoutLogData";

describe("parseCSVLogFile - CSV Parsing Validation", () => {
  // Mock console.warn to test warning messages
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

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

  test("should skip entries with NaN reps and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,abc,100,1000,mobile,Push Day,1706054400000,Invalid reps
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: invalid numeric values")
    );
  });

  test("should skip entries with NaN weight and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,invalid,1000,mobile,Push Day,1706054400000,Invalid weight
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: invalid numeric values")
    );
  });

  test("should skip entries with NaN volume and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,100,xyz,mobile,Push Day,1706054400000,Invalid volume
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: invalid numeric values")
    );
  });

  test("should skip entries with reps <= 0 and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,0,100,0,mobile,Push Day,1706054400000,Zero reps
2024-01-24,Deadlift,-5,200,-1000,mobile,Pull Day,1706054450000,Negative reps
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: reps must be > 0 (got 0)")
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 3: reps must be > 0 (got -5)")
    );
  });

  test("should skip entries with weight < 0 and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10,-50,-500,mobile,Push Day,1706054400000,Negative weight
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: weight must be >= 0 (got -50)")
    );
  });

  test("should accept entries with weight = 0 (bodyweight exercises)", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Pull-ups,10,0,0,mobile,Pull Day,1706054400000,Bodyweight`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].weight).toBe(0);
    expect(entries[0].exercise).toBe("Pull-ups");
  });

  test("should skip entries with empty fields and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,,10,100,1000,mobile,Push Day,1706054400000,Missing exercise
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: missing exercise name")
    );
  });

  test("should skip entries with insufficient columns and log warning", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,Bench Press,10
2024-01-24,Squat,5,150,750,mobile,Leg Day,1706054500000,Valid entry`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(1);
    expect(entries[0].exercise).toBe("Squat");
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: insufficient columns")
    );
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

    // Should have logged 3 warnings
    expect(consoleWarnSpy).toHaveBeenCalledTimes(3);
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

  test("should log error and return empty array on parse exception", () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    // Force an error by providing null as content (will cause split to throw)
    const entries = parseCSVLogFile(null as any);

    expect(entries).toHaveLength(0);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[WorkoutLogData] Error parsing CSV:"),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test("should handle multiple validation failures in single line", () => {
    const csvContent = `date,exercise,reps,weight,volume,origine,workout,timestamp,notes
2024-01-24,,0,-50,0,mobile,Push Day,1706054400000,Multiple issues`;

    const entries = parseCSVLogFile(csvContent);

    expect(entries).toHaveLength(0);
    // Should fail on reps <= 0 first, before checking exercise name
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping line 2: reps must be > 0")
    );
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
