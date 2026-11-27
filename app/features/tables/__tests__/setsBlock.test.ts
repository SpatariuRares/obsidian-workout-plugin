import { blockRest, restParams, setsBlock } from "@app/features/tables/setsBlock";

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
});
