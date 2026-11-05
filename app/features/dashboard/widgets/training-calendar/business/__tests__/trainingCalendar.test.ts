import { trainingCalendar } from "@app/features/dashboard/widgets/training-calendar/business/trainingCalendar";
import { TrainingHistory } from "@app/services/history/TrainingHistory";
import type { WorkoutLogData } from "@app/types/WorkoutLogData";
import { logRow } from "@app/types/__tests__/logRow";

// Tests run with TZ=Europe/Rome (jest.config.js)

function set(date: string, volume: number): WorkoutLogData {
  return logRow({ date, exercise: "Squat", reps: 5, weight: 0, volume });
}

// Wednesday 17 January 2024, local time
const today = new Date(2024, 0, 17, 12, 0);

describe("trainingCalendar", () => {
  it("should lay out whole weeks from Monday, the last one holding today", () => {
    const calendar = trainingCalendar(
      new TrainingHistory([]),
      today,
      3,
    );

    expect(calendar.weeks).toHaveLength(3);
    expect(calendar.weeks.every((week) => week.length === 7)).toBe(
      true,
    );
    expect(calendar.weeks[0][0].day).toBe("2024-01-01");
    expect(calendar.weeks[2][0].day).toBe("2024-01-15");
    expect(calendar.weeks[2][6].day).toBe("2024-01-21");
  });

  it("should mark days after today as future", () => {
    const calendar = trainingCalendar(
      new TrainingHistory([]),
      today,
      1,
    );

    expect(calendar.weeks[0].map((cell) => cell.future)).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
      true,
    ]);
  });

  it("should grade trained days by volume against the busiest day", () => {
    const calendar = trainingCalendar(
      new TrainingHistory([
        set("2024-01-15", 1000),
        set("2024-01-16", 250),
        set("2024-01-16", 50),
        set("2024-01-17", 0), // cardio only: still a training day
      ]),
      today,
      1,
    );

    expect(calendar.weeks[0].map((cell) => cell.level)).toEqual([
      4, 2, 1, 0, 0, 0, 0,
    ]);
    expect(calendar.weeks[0][1].volume).toBe(300);
  });

  it("should leave sets dated after today out of the grading", () => {
    const calendar = trainingCalendar(
      new TrainingHistory([
        set("2024-01-15", 100),
        set("2024-01-19", 1000), // Friday, planned
      ]),
      today,
      1,
    );

    expect(calendar.weeks[0].map((cell) => cell.level)).toEqual([
      4, 0, 0, 0, 0, 0, 0,
    ]);
  });
});
