import { readWorkoutExport } from "@app/features/import/logic/readWorkoutExport";
import { WorkoutProtocol } from "@app/types/WorkoutLogData";

// Shaped like the apps' "Export workout data" files. Times are local
// (tests run in Europe/Rome), so 18:02 on 17 Jan 2024 is 17:02Z.
const HEVY = [
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Bench Press (Barbell)",,"Pause at chest",0,"warmup",40,10,,,',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Bench Press (Barbell)",,"Pause at chest",1,"normal",80,8,,,8.5',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Treadmill",,"",0,"normal",,,2.5,900,',
].join("\n");

const HEVY_START = 1705510920000;

describe("readWorkoutExport", () => {
  describe("Hevy", () => {
    it("reads one set per row, spread over the workout's start and end", () => {
      const result = readWorkoutExport(HEVY, "lb");

      expect(result?.source).toBe("hevy");
      expect(result?.sets).toEqual([
        {
          date: "2024-01-17T17:02:00.000Z",
          timestamp: HEVY_START,
          exercise: "Bench Press (Barbell)",
          reps: 10,
          weight: 40,
          weightUnit: "kg",
          workout: "Push Day",
          origine: "Hevy",
          notes: "Pause at chest",
          protocol: WorkoutProtocol.WARMUP,
        },
        {
          date: "2024-01-17T17:02:00.000Z",
          timestamp: HEVY_START + 30 * 60_000,
          exercise: "Bench Press (Barbell)",
          reps: 8,
          weight: 80,
          weightUnit: "kg",
          workout: "Push Day",
          origine: "Hevy",
          notes: "Pause at chest",
          protocol: WorkoutProtocol.STANDARD,
          customFields: { rpe: 8.5 },
        },
        {
          date: "2024-01-17T17:02:00.000Z",
          timestamp: HEVY_START + 60 * 60_000,
          exercise: "Treadmill",
          reps: 0,
          weight: 0,
          weightUnit: "kg",
          workout: "Push Day",
          origine: "Hevy",
          protocol: WorkoutProtocol.STANDARD,
          customFields: { distance: 2.5, duration: 15 },
        },
      ]);
    });

    it("keeps pounds and miles as the app exported them, and marks drop sets", () => {
      const content = [
        "title,start_time,end_time,exercise_title,set_type,weight_lbs,reps,distance_miles,duration_seconds",
        'Legs,"17 Jan 2024, 18:02","17 Jan 2024, 18:02",Squat (Barbell),dropset,225,5,,',
        'Legs,"17 Jan 2024, 18:02","17 Jan 2024, 18:02",Bike,normal,,,1,600',
      ].join("\n");

      const [squat, bike] = readWorkoutExport(content, "kg")?.sets ?? [];

      expect(squat).toMatchObject({
        weight: 225,
        weightUnit: "lb",
        protocol: WorkoutProtocol.DROP_SET,
      });
      expect(bike.customFields).toEqual({ distance: 1.61, duration: 10 });
    });
  });

  describe("Strong", () => {
    it("reads the semicolon export with units in the header, skipping rest timers", () => {
      const content = [
        "Workout #;Date;Workout Name;Duration (sec);Exercise Name;Set Order;Weight (kg);Reps;RPE;Distance (meters);Seconds;Notes;Workout Notes",
        "1;2024-03-05 07:30:00;Leg Day;3600;Squat (Barbell);W;60;5;;;0;;",
        "1;2024-03-05 07:30:00;Leg Day;3600;Squat (Barbell);1;102,5;5;8;;0;Felt heavy;",
        "1;2024-03-05 07:30:00;Leg Day;3600;Squat (Barbell);Rest Timer;;;;;120;;",
        "1;2024-03-05 07:30:00;Leg Day;3600;Plank;1;;;;;60;;",
        "1;2024-03-05 07:30:00;Leg Day;3600;Rowing (Machine);1;;;;2000;480;;",
      ].join("\n");

      const result = readWorkoutExport(content, "lb");

      expect(result?.source).toBe("strong");
      const start = 1709620200000;
      expect(result?.sets).toEqual([
        {
          date: "2024-03-05T06:30:00.000Z",
          timestamp: start,
          exercise: "Squat (Barbell)",
          reps: 5,
          weight: 60,
          weightUnit: "kg",
          workout: "Leg Day",
          origine: "Strong",
          protocol: WorkoutProtocol.WARMUP,
        },
        {
          date: "2024-03-05T06:30:00.000Z",
          timestamp: start + 20 * 60_000,
          exercise: "Squat (Barbell)",
          reps: 5,
          weight: 102.5,
          weightUnit: "kg",
          workout: "Leg Day",
          origine: "Strong",
          notes: "Felt heavy",
          protocol: WorkoutProtocol.STANDARD,
          customFields: { rpe: 8 },
        },
        {
          date: "2024-03-05T06:30:00.000Z",
          timestamp: start + 40 * 60_000,
          exercise: "Plank",
          reps: 0,
          weight: 0,
          weightUnit: "kg",
          workout: "Leg Day",
          origine: "Strong",
          protocol: WorkoutProtocol.STANDARD,
          customFields: { duration: 60 },
        },
        {
          date: "2024-03-05T06:30:00.000Z",
          timestamp: start + 60 * 60_000,
          exercise: "Rowing (Machine)",
          reps: 0,
          weight: 0,
          weightUnit: "kg",
          workout: "Leg Day",
          origine: "Strong",
          protocol: WorkoutProtocol.STANDARD,
          customFields: { distance: 2, duration: 8 },
        },
      ]);
    });

    it("reads the older comma export in the settings unit with a text duration", () => {
      const content = [
        "Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,Distance,Seconds,Notes,Workout Notes,RPE",
        '2020-06-10 18:46:02,"Evening Workout",1h 5m,"Deadlift (Barbell)",1,315.0,5,0,0,"","",',
        '2020-06-10 18:46:02,"Evening Workout",1h 5m,"Deadlift (Barbell)",2,315.0,3,0,0,"","",',
      ].join("\n");

      const sets = readWorkoutExport(content, "lb")?.sets ?? [];

      expect(sets.map((set) => [set.weight, set.weightUnit, set.timestamp])).toEqual([
        [315, "lb", 1591807562000],
        [315, "lb", 1591807562000 + 65 * 60_000],
      ]);
      expect(sets[0].customFields).toBeUndefined();
    });
  });

  it("reads thousands separators and decimal commas", () => {
    const content = [
      "Date;Workout Name;Exercise Name;Set Order;Weight (lbs);Reps",
      "2024-03-05 07:30:00;Legs;Leg Press;1;1,102.5;10",
      "2024-03-05 07:30:00;Legs;Leg Press;2;62,5;10",
    ].join("\n");

    const sets = readWorkoutExport(content, "kg")?.sets ?? [];

    expect(sets.map((set) => set.weight)).toEqual([1102.5, 62.5]);
  });

  it("reads a file saved with a byte order mark", () => {
    expect(readWorkoutExport(`﻿${HEVY}`, "kg")?.sets).toHaveLength(3);
  });

  it("does not recognise other CSV files", () => {
    expect(
      readWorkoutExport("date,exercise,reps,weight\n2024-01-01,Squat,5,100", "kg"),
    ).toBeNull();
  });
});
