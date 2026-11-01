import {
  intervalAt,
  intervalPlan,
  intervalSeconds,
} from "@app/features/timer/business/intervalSchedule";

const tabata = { work: 20, rest: 10, rounds: 8 };

describe("intervalPlan", () => {
  it("should use duration as the work phase when work is not set", () => {
    expect(intervalPlan({ duration: 45, rounds: 3 })).toEqual({
      work: 45,
      rest: 0,
      rounds: 3,
    });
  });

  it("should let work win over duration", () => {
    expect(intervalPlan({ duration: 45, work: 20, rest: 10, rounds: 8 })).toEqual(
      tabata,
    );
  });
});

describe("intervalAt", () => {
  it("should start in the work phase of round 1", () => {
    expect(intervalAt(tabata, 0)).toEqual({
      phase: "work",
      round: 1,
      remainingMs: 20_000,
    });
  });

  it("should move to rest when the work phase ends", () => {
    expect(intervalAt(tabata, 21_000)).toEqual({
      phase: "rest",
      round: 1,
      remainingMs: 9_000,
    });
  });

  it("should start the next round's work after the rest", () => {
    expect(intervalAt(tabata, 30_000)).toEqual({
      phase: "work",
      round: 2,
      remainingMs: 20_000,
    });
  });

  it("should count the last round's rest before finishing", () => {
    expect(intervalAt(tabata, 235_000)).toEqual({
      phase: "rest",
      round: 8,
      remainingMs: 5_000,
    });
    expect(intervalAt(tabata, 240_000)).toEqual({
      phase: "done",
      round: 8,
      remainingMs: 0,
    });
  });

  it("should go straight from work to the next round without rest", () => {
    const emom = { work: 60, rest: 0, rounds: 10 };
    expect(intervalAt(emom, 60_000)).toEqual({
      phase: "work",
      round: 2,
      remainingMs: 60_000,
    });
  });
});

describe("intervalSeconds", () => {
  it("should add every round's work and rest", () => {
    expect(intervalSeconds(tabata)).toBe(240);
    expect(intervalSeconds({ work: 60, rest: 0, rounds: 10 })).toBe(600);
  });
});
