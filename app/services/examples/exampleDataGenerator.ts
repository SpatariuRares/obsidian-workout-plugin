import { t } from "@app/i18n";

interface LogEntryData {
  date: string;
  exercise: string;
  reps: number;
  weight: number;
  volume: number;
  workout: string;
  notes?: string;
  protocol?: string;
  timestamp?: number;
  origine?: string;
}

function addLogEntry(rows: string[], data: LogEntryData): void {
  const timestamp =
    data.timestamp ??
    new Date(data.date).getTime() +
      Math.floor(Math.random() * 3600000) +
      36000000;
  const protocol = data.protocol || "standard";
  const origine = data.origine || "";
  const row = `${data.date},${data.exercise},${data.reps},${data.weight},${data.volume},${origine},${data.workout},${timestamp},${data.notes || ""},${protocol},,,`;
  rows.push(row);
}

export function generateExampleCSVData(): string {
  const header =
    "date,exercise,reps,weight,volume,origine,workout,timestamp,notes,protocol,duration,distance,heartRate";
  const rows: string[] = [];

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  const workoutName = t("examples.workouts.lowerBodyA.name");

  // Lower body sessions: ~2x per week for 6 weeks (oldest first for proper progression)
  const lowerBodyOffsets = [40, 37, 33, 30, 26, 23, 19, 16, 12, 9, 5, 2];

  const baseWeights = {
    squatMultiPower: 70,
    rdl: 50,
    legPress: 100,
    legCurl: 30,
    calfMachine: 35,
  };

  const weeklyProgression = {
    squatMultiPower: 2.5,
    rdl: 2.5,
    legPress: 5,
    legCurl: 1.25,
    calfMachine: 2.5,
  };

  for (
    let sessionIdx = 0;
    sessionIdx < lowerBodyOffsets.length;
    sessionIdx++
  ) {
    const daysAgo = lowerBodyOffsets[sessionIdx];
    const date = new Date(now.getTime() - daysAgo * oneDay);
    const dateStr = date.toISOString();

    const weeksTraining = Math.floor((42 - daysAgo) / 7);

    const isToughDay = sessionIdx % 4 === 2;
    const dayModifier = isToughDay ? 0.95 : 1;

    const sessionStartHour = 7 + Math.floor(Math.random() * 3);
    let exerciseTime = new Date(date);
    exerciseTime.setHours(
      sessionStartHour,
      Math.floor(Math.random() * 60),
      0,
      0,
    );

    // 1. Squat multi power: 4 sets
    const squatWeight =
      Math.round(
        ((baseWeights.squatMultiPower +
          weeksTraining * weeklyProgression.squatMultiPower) *
          dayModifier) /
          2.5,
      ) * 2.5;
    const squatBaseReps = [10, 9, 8, 8];
    for (let set = 1; set <= 4; set++) {
      const reps =
        squatBaseReps[set - 1] +
        (isToughDay ? -1 : 0) +
        (Math.random() > 0.7 ? 1 : 0);
      const protocol =
        set === 4 && sessionIdx % 3 === 0 ? "myo-reps" : "standard";
      addLogEntry(rows, {
        date: dateStr,
        exercise: t("examples.exercises.squatMultiPower.name"),
        reps,
        weight: squatWeight,
        volume: reps * squatWeight,
        workout: workoutName,
        notes: protocol === "myo-reps" ? `Myo: ${reps}+3+3+2` : "",
        protocol,
        timestamp: exerciseTime.getTime(),
        origine: `[[${workoutName}]]`,
      });
      exerciseTime = new Date(
        exerciseTime.getTime() + 180000 + Math.random() * 60000,
      );
    }

    // 2. RDL: 4 sets
    const rdlWeight =
      Math.round(
        ((baseWeights.rdl + weeksTraining * weeklyProgression.rdl) *
          dayModifier) /
          2.5,
      ) * 2.5;
    const rdlBaseReps = [12, 11, 10, 10];
    for (let set = 1; set <= 4; set++) {
      const reps = rdlBaseReps[set - 1] + (isToughDay ? -1 : 0);
      const protocol =
        set === 4 && sessionIdx % 4 === 1 ? "rest-pause" : "standard";
      addLogEntry(rows, {
        date: dateStr,
        exercise: t("examples.exercises.rdl.name"),
        reps,
        weight: rdlWeight,
        volume: reps * rdlWeight,
        workout: workoutName,
        notes: protocol === "rest-pause" ? `RP: ${reps}+4+3` : "",
        protocol,
        timestamp: exerciseTime.getTime(),
        origine: `[[${workoutName}]]`,
      });
      exerciseTime = new Date(
        exerciseTime.getTime() + 150000 + Math.random() * 60000,
      );
    }

    // 3. Leg press 45: 4 sets
    const legPressWeight =
      Math.round(
        ((baseWeights.legPress +
          weeksTraining * weeklyProgression.legPress) *
          dayModifier) /
          5,
      ) * 5;
    const legPressBaseReps = [15, 14, 12, 12];
    for (let set = 1; set <= 4; set++) {
      const reps = legPressBaseReps[set - 1] + (isToughDay ? -2 : 0);
      const protocol =
        set === 4 && sessionIdx % 5 === 0 ? "dropset" : "standard";
      addLogEntry(rows, {
        date: dateStr,
        exercise: t("examples.exercises.legPress45.name"),
        reps,
        weight: legPressWeight,
        volume: reps * legPressWeight,
        workout: workoutName,
        notes:
          protocol === "dropset"
            ? `Drop: ${legPressWeight}->${legPressWeight - 20}->${legPressWeight - 40}`
            : "",
        protocol,
        timestamp: exerciseTime.getTime(),
        origine: `[[${workoutName}]]`,
      });
      exerciseTime = new Date(
        exerciseTime.getTime() + 120000 + Math.random() * 30000,
      );
    }

    // 4. Leg Curl seduto: 3 sets
    const legCurlWeight =
      Math.round(
        ((baseWeights.legCurl +
          weeksTraining * weeklyProgression.legCurl) *
          dayModifier) /
          1.25,
      ) * 1.25;
    const legCurlBaseReps = [14, 12, 11];
    for (let set = 1; set <= 3; set++) {
      const reps = legCurlBaseReps[set - 1] + (isToughDay ? -1 : 0);
      const protocol =
        set === 3 && sessionIdx % 6 === 0 ? "21s" : "standard";
      const actualReps = protocol === "21s" ? 21 : reps;
      addLogEntry(rows, {
        date: dateStr,
        exercise: t("examples.exercises.legCurlSeated.name"),
        reps: actualReps,
        weight: legCurlWeight,
        volume: actualReps * legCurlWeight,
        workout: workoutName,
        notes: protocol === "21s" ? "21s: 7+7+7" : "",
        protocol,
        timestamp: exerciseTime.getTime(),
        origine: `[[${workoutName}]]`,
      });
      exerciseTime = new Date(
        exerciseTime.getTime() + 90000 + Math.random() * 30000,
      );
    }

    // 5. Calf Machine: 4 sets
    const calfWeight =
      Math.round(
        ((baseWeights.calfMachine +
          weeksTraining * weeklyProgression.calfMachine) *
          dayModifier) /
          2.5,
      ) * 2.5;
    const calfBaseReps = [18, 16, 15, 14];
    for (let set = 1; set <= 4; set++) {
      const reps =
        calfBaseReps[set - 1] +
        (isToughDay ? -2 : 0) +
        (Math.random() > 0.8 ? 2 : 0);
      const protocol =
        set % 2 === 0 && sessionIdx > 6 ? "superset" : "standard";
      addLogEntry(rows, {
        date: dateStr,
        exercise: t("examples.exercises.calfMachine.name"),
        reps,
        weight: calfWeight,
        volume: reps * calfWeight,
        workout: workoutName,
        notes: protocol === "superset" ? "SS con calf BW" : "",
        protocol,
        timestamp: exerciseTime.getTime(),
        origine: `[[${workoutName}]]`,
      });
      exerciseTime = new Date(
        exerciseTime.getTime() + 60000 + Math.random() * 30000,
      );
    }

    // 6. Plank: 3 sets (Timed)
    const basePlankDuration = 45 + weeksTraining * 5;
    for (let set = 1; set <= 3; set++) {
      const duration =
        basePlankDuration + (3 - set) * 10 - (isToughDay ? 10 : 0);
      rows.push(
        `${dateStr},${t("examples.exercises.plank.name")},0,0,0,[[${workoutName}]],${workoutName},${exerciseTime.getTime()},,standard,${duration},,`,
      );
      exerciseTime = new Date(exerciseTime.getTime() + 90000);
    }
  }

  // Upper Body sessions: ~2x per week for 6 weeks
  const upperBodyOffsets = [39, 36, 32, 29, 25, 22, 18, 15, 11, 8, 4, 1];
  const upperWorkoutName = t("examples.workouts.upperBodyPower.name");

  const upperBaseWeights = {
    benchPress: 60,
    squat: 80,
  };

  for (
    let sessionIdx = 0;
    sessionIdx < upperBodyOffsets.length;
    sessionIdx++
  ) {
    const daysAgo = upperBodyOffsets[sessionIdx];
    const date = new Date(now.getTime() - daysAgo * oneDay);
    const dateStr = date.toISOString();

    const weeksTraining = Math.floor((42 - daysAgo) / 7);
    const isToughDay = sessionIdx % 5 === 3;
    const dayModifier = isToughDay ? 0.95 : 1;

    const sessionStartHour = 17 + Math.floor(Math.random() * 2);
    let exerciseTime = new Date(date);
    exerciseTime.setHours(
      sessionStartHour,
      Math.floor(Math.random() * 60),
      0,
      0,
    );

    // Bench Press: progressive overload
    const benchWeight =
      Math.round(
        ((upperBaseWeights.benchPress + weeksTraining * 2.5) * dayModifier) /
          2.5,
      ) * 2.5;
    const benchBaseReps = [8, 7, 6, 6];
    for (let set = 1; set <= 4; set++) {
      const reps = benchBaseReps[set - 1] + (isToughDay ? -1 : 0);
      const protocols = ["standard", "rest-pause", "myo-reps", "dropset"];
      const protocol =
        set === 4 && sessionIdx % 4 === set - 1
          ? protocols[sessionIdx % 4]
          : "standard";
      const notes = protocol !== "standard" ? `${protocol}` : "";
      rows.push(
        `${dateStr},${t("examples.exercises.benchPress.name")},${reps},${benchWeight},${reps * benchWeight},[[${upperWorkoutName}]],${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
      );
      exerciseTime = new Date(
        exerciseTime.getTime() + 180000 + Math.random() * 60000,
      );
    }

    // Squat: progressive overload
    const squatWeight =
      Math.round(
        ((upperBaseWeights.squat + weeksTraining * 5) * dayModifier) / 5,
      ) * 5;
    const squatBaseReps = [6, 5, 5, 5];
    for (let set = 1; set <= 4; set++) {
      const reps = squatBaseReps[set - 1] + (isToughDay ? -1 : 0);
      const protocol =
        sessionIdx % 3 === 0 && set === 4 ? "superset" : "standard";
      const notes = protocol === "superset" ? "SS con lunges" : "";
      rows.push(
        `${dateStr},Squat,${reps},${squatWeight},${reps * squatWeight},[[${upperWorkoutName}]],${upperWorkoutName},${exerciseTime.getTime()},${notes},${protocol},,,`,
      );
      exerciseTime = new Date(
        exerciseTime.getTime() + 180000 + Math.random() * 60000,
      );
    }
  }

  // Cardio sessions: ~2x per week for 6 weeks
  const cardioOffsets = [38, 34, 31, 27, 24, 20, 17, 13, 10, 6, 3];
  const cardioWorkoutName = t("examples.workouts.cardioDay.name");

  for (let sessionIdx = 0; sessionIdx < cardioOffsets.length; sessionIdx++) {
    const daysAgo = cardioOffsets[sessionIdx];
    const date = new Date(now.getTime() - daysAgo * oneDay);
    const dateStr = date.toISOString();

    const weeksTraining = Math.floor((42 - daysAgo) / 7);

    let exerciseTime = new Date(date);
    exerciseTime.setHours(
      6 + Math.floor(Math.random() * 2),
      Math.floor(Math.random() * 60),
      0,
      0,
    );

    // Running
    const baseRunDistance = 4;
    const runDistance =
      Math.round((baseRunDistance + weeksTraining * 0.3) * 10) / 10;
    const baseRunDuration = 28;
    const runDuration = Math.round(
      baseRunDuration + runDistance * 5.5 - weeksTraining * 0.5,
    );
    const runHeartRate =
      150 - weeksTraining * 2 + Math.floor(Math.random() * 10);
    rows.push(
      `${dateStr},${t("examples.exercises.running.name")},0,0,0,[[${cardioWorkoutName}]],${cardioWorkoutName},${exerciseTime.getTime()},,standard,${runDuration},${runDistance},${runHeartRate}`,
    );

    exerciseTime = new Date(
      exerciseTime.getTime() + runDuration * 60000 + 600000,
    );

    // Cycling
    const baseCycleDistance = 15;
    const cycleDistance =
      Math.round((baseCycleDistance + weeksTraining * 1.5) * 10) / 10;
    const baseCycleDuration = 40;
    const cycleDuration = Math.round(
      baseCycleDuration + cycleDistance * 1.8 - weeksTraining,
    );
    const cycleHeartRate =
      135 - weeksTraining + Math.floor(Math.random() * 8);
    rows.push(
      `${dateStr},Cycling,0,0,0,[[${cardioWorkoutName}]],${cardioWorkoutName},${exerciseTime.getTime()},,standard,${cycleDuration},${cycleDistance},${cycleHeartRate}`,
    );
  }

  return [header, ...rows].join("\n");
}
