import { readWorkoutExport } from "@app/features/import/logic/readWorkoutExport";
import { planImport } from "@app/features/import/logic/planImport";
import { WorkoutLogFile } from "@app/services/data/WorkoutLogFile";
import { WorkoutEventBus } from "@app/services/events/WorkoutEventBus";
import { InMemoryLogStorage } from "@app/services/data/__tests__/InMemoryLogStorage";
import {
  WorkoutProtocol,
  type WorkoutChartsSettings,
} from "@app/types/WorkoutLogData";

// A Hevy export in kg, imported into a log shown in lb: the log keeps the
// entered weight and unit, and the dates are written as the import gave them
const HEVY = [
  '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Bench Press (Barbell)",,"",0,"warmup",40,10,,,',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Bench Press (Barbell)",,"",1,"normal",80.5,8,,,8.5',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Bench Press (Barbell)",,"",2,"normal",80.5,8,,,',
  '"Push Day","17 Jan 2024, 18:02","17 Jan 2024, 19:02","","Treadmill",,"",0,"normal",,,2.5,900,',
  '"Leg Day","19 Jan 2024, 07:30","19 Jan 2024, 08:30","","Squat (Barbell)",,"",0,"normal",100,5,,,',
].join("\n");

function setup(content: string | null) {
  const storage = new InMemoryLogStorage(content);
  const settings = {
    csvLogFilePath: "workout_logs.csv",
    weightUnit: "lb",
  } as WorkoutChartsSettings;
  const logFile = new WorkoutLogFile(storage, settings, new WorkoutEventBus(), {
    retryDelayMs: 0,
  });
  return { storage, logFile };
}

function exportSets() {
  const sets = readWorkoutExport(HEVY, "lb")?.sets;
  if (!sets) throw new Error("the export should be readable");
  return sets;
}

const noPages = () => false;

describe("import round trip", () => {
  it("adds nothing when the same export is imported twice", async () => {
    const { logFile } = setup(null);

    const first = planImport(exportSets(), await logFile.read(), noPages);
    expect(first.toAdd).toHaveLength(5);
    await logFile.importSets(first.toAdd);

    const again = planImport(exportSets(), await logFile.read(), noPages);
    expect(again.toAdd).toEqual([]);
    expect(again.duplicates).toBe(5);
  });

  it("adds nothing on a second import into a log that already had sets", async () => {
    const { logFile } = setup(
      [
        "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol",
        "2024-01-10,Deadlift,5,140,700,,Pull Day,1704880000000,,standard",
      ].join("\n"),
    );

    await logFile.importSets(
      planImport(exportSets(), await logFile.read(), noPages).toAdd,
    );
    const again = planImport(exportSets(), await logFile.read(), noPages);

    expect(again.toAdd).toEqual([]);
    expect(await logFile.read()).toHaveLength(6);
  });

  it("still imports a set logged by hand on the same day", async () => {
    const { logFile } = setup(null);
    await logFile.add({
      date: "2024-01-19",
      exercise: "Squat (Barbell)",
      reps: 5,
      weight: 100,
      weightUnit: "kg",
      workout: "Leg Day",
      protocol: WorkoutProtocol.STANDARD,
    });

    const plan = planImport(exportSets(), await logFile.read(), noPages);

    expect(plan.toAdd).toHaveLength(5);
  });
});
