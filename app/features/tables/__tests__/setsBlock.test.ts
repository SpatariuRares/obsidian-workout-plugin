import {
  betweenRest,
  blockExercises,
  blockProtocol,
  blockRest,
  isSupersetBlock,
  restParams,
  setsBlock,
  slotLetter,
} from "@app/features/tables/setsBlock";
import { tableBlock } from "@app/features/tables/tableBlock";

describe("the rest timer written in a workout-sets block", () => {
  it("reads rest and timer.* back as the timer they write", () => {
    const { params, errors } = setsBlock.parse(
      ["exercise: Bench", "rest: 30", "timer.type: interval", "timer.rest: 15", "timer.rounds: 4", "timer.sound: false"].join("\n"),
    );

    expect(errors).toEqual([]);
    expect(blockRest(params)).toEqual({ type: "interval", duration: 30, rest: 15, rounds: 4, sound: false });
  });

  it("has no timer of its own without rest or timer.*, nor with rest: 0", () => {
    expect(blockRest({ exercise: "Bench" })).toBeUndefined();
    expect(blockRest({ rest: 0, "timer.type": "interval" })).toBeUndefined();
  });

  it("rejects an unknown timer type", () => {
    expect(setsBlock.parse("timer.type: tabata").invalidKeys).toEqual(["timer.type"]);
  });

  it("writes the timer form's values, removing interval options from a countdown", () => {
    expect(restParams({ type: "countdown", duration: 90, rest: 10, showControls: true, sound: true })).toEqual({
      rest: 90,
      "timer.preset": undefined,
      "timer.type": "countdown",
      "timer.rest": undefined,
      "timer.rounds": undefined,
      "timer.showControls": true,
      "timer.sound": true,
    });
    const interval = { preset: "Tabata", type: "interval" as const, work: 20, rest: 10, rounds: 8, sound: false };
    expect(blockRest(restParams(interval))).toEqual({
      preset: "Tabata",
      type: "interval",
      duration: 20,
      rest: 10,
      rounds: 8,
      sound: false,
    });
  });

  it("round-trips warmups through parse, serialize, and patch, rejecting negative values", () => {
    const { params, errors } = setsBlock.parse("exercise: Bench\nsets: 4\nwarmups: 2");
    expect(errors).toEqual([]);
    expect(params).toEqual({ exercise: "Bench", sets: 4, warmups: 2 });

    const serialized = setsBlock.serialize({ exercise: "Bench", sets: 4, warmups: 2 });
    const body = serialized.replace(/^```workout-sets\n|\n```$/g, "");
    expect(setsBlock.parse(body).params).toEqual({ exercise: "Bench", sets: 4, warmups: 2 });

    const patched = setsBlock.patch("exercise: Bench\nsets: 4", { warmups: 0 });
    expect(setsBlock.parse(patched).params).toEqual({ exercise: "Bench", sets: 4, warmups: 0 });
    expect(setsBlock.parse(setsBlock.patch(patched, { warmups: undefined })).params).toEqual({
      exercise: "Bench",
      sets: 4,
    });

    expect(setsBlock.parse("warmups: -1").invalidKeys).toEqual(["warmups"]);
  });

  it("round-trips built-in and custom protocol ids through parse, serialize, and patch without affecting tableBlock", () => {
    for (const id of ["drop_set", "myo_reps", "rest_pause", "twentyone", "custom_cluster"]) {
      const { params, errors } = setsBlock.parse(`exercise: Bench\nsets: 3\nprotocol: ${id}`);
      expect(errors).toEqual([]);
      expect(params).toEqual({ exercise: "Bench", sets: 3, protocol: id });

      const serialized = setsBlock.serialize({ exercise: "Bench", sets: 3, protocol: id });
      const body = serialized.replace(/^```workout-sets\n|\n```$/g, "");
      expect(setsBlock.parse(body).params).toEqual({ exercise: "Bench", sets: 3, protocol: id });
    }

    const patched = setsBlock.patch("exercise: Bench\nsets: 3", { protocol: "myo_reps" });
    expect(setsBlock.parse(patched).params).toEqual({
      exercise: "Bench",
      sets: 3,
      protocol: "myo_reps",
    });
    expect(setsBlock.parse(setsBlock.patch(patched, { protocol: undefined })).params).toEqual({
      exercise: "Bench",
      sets: 3,
    });
    expect(tableBlock.parse("exercise: Bench\nprotocol: drop_set").params).toEqual({
      exercise: "Bench",
    });
  });

  it("round-trips exercises and restBetween without affecting tableBlock, and rejects negative restBetween", () => {
    const source = "exercises: [Bench Press, Barbell Row]\nsets: 3\nrestBetween: 30\nrest: 120";
    const { params, errors } = setsBlock.parse(source);
    expect(errors).toEqual([]);
    expect(params).toEqual({
      exercises: ["Bench Press", "Barbell Row"],
      sets: 3,
      restBetween: 30,
      rest: 120,
    });

    const serialized = setsBlock.serialize(params);
    const body = serialized.replace(/^```workout-sets\n|\n```$/g, "");
    expect(setsBlock.parse(body).params).toEqual(params);

    const patched = setsBlock.patch("exercises: [Bench Press, Barbell Row]\nsets: 3", {
      restBetween: 45,
    });
    expect(setsBlock.parse(patched).params).toEqual({
      exercises: ["Bench Press", "Barbell Row"],
      sets: 3,
      restBetween: 45,
    });
    expect(setsBlock.parse(setsBlock.patch(patched, { restBetween: undefined })).params).toEqual({
      exercises: ["Bench Press", "Barbell Row"],
      sets: 3,
    });

    expect(setsBlock.parse("restBetween: -10").invalidKeys).toEqual(["restBetween"]);
    expect(tableBlock.parse(source).params).toEqual({ sets: 3 });
  });

  it("derives blockExercises, isSupersetBlock, and default superset protocol", () => {
    expect(blockExercises({ exercise: "Squat" })).toEqual(["Squat"]);
    expect(isSupersetBlock({ exercise: "Squat" })).toBe(false);
    expect(blockProtocol({ exercise: "Squat" })).toBeUndefined();

    expect(
      blockExercises({ exercise: "Squat", exercises: ["Bench Press", "Barbell Row"] }),
    ).toEqual(["Bench Press", "Barbell Row"]);
    expect(
      isSupersetBlock({ exercise: "Squat", exercises: ["Bench Press", "Barbell Row"] }),
    ).toBe(true);
    expect(blockProtocol({ exercises: ["Bench Press", "Barbell Row"] })).toBe("superset");
    expect(
      blockProtocol({ exercises: ["Bench Press", "Barbell Row"], protocol: "drop_set" }),
    ).toBe("drop_set");
    expect(
      blockProtocol({ exercises: ["Bench Press", "Barbell Row"], protocol: "standard" }),
    ).toBe("standard");

    expect(blockExercises({ exercise: "Squat", exercises: ["OnlyOne"] })).toEqual(["Squat"]);
    expect(isSupersetBlock({ exercise: "Squat", exercises: ["OnlyOne"] })).toBe(false);
    expect(blockExercises({ exercises: ["OnlyOne"] })).toEqual([]);
    expect(blockExercises({})).toEqual([]);
  });

  it("derives betweenRest countdown and superset slotLetter", () => {
    expect(betweenRest({})).toBeUndefined();
    expect(betweenRest({ restBetween: 0 })).toBeUndefined();
    expect(betweenRest({ restBetween: 45 })).toEqual({ type: "countdown", duration: 45 });

    expect(slotLetter(0)).toBe("A");
    expect(slotLetter(1)).toBe("B");
    expect(slotLetter(25)).toBe("Z");
    expect(slotLetter(26)).toBe("27");
  });
});
