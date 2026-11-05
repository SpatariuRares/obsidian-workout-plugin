import { timerPoint } from "@app/features/timer/business/timerPoint";
import { TIMER_TYPE } from "@app/features/timer/types";

const countdown = { timerType: TIMER_TYPE.COUNTDOWN, duration: 90, rest: 0, totalRounds: 1 };
const tabata = { timerType: TIMER_TYPE.INTERVAL, duration: 20, rest: 10, totalRounds: 8 };

describe("timerPoint", () => {
  it("should give a countdown's time left", () => {
    expect(timerPoint({ ...countdown, elapsedTime: 30_500 })).toEqual({
      remainingMs: 59_500,
      remainingToEndMs: 59_500,
      phase: "work",
      round: 1,
      done: false,
    });
  });

  it("should mark a countdown done once its time is up, never below zero", () => {
    expect(timerPoint({ ...countdown, elapsedTime: 95_000 })).toEqual({
      remainingMs: 0,
      remainingToEndMs: 0,
      phase: "done",
      round: 1,
      done: true,
    });
  });

  it("should give an interval timer's phase, round, time left in the phase and to the end", () => {
    expect(timerPoint({ ...tabata, elapsedTime: 51_000 })).toEqual({
      remainingMs: 9_000,
      remainingToEndMs: 189_000,
      phase: "rest",
      round: 2,
      done: false,
    });
  });

  it("should mark an interval timer done after the last round's rest", () => {
    expect(timerPoint({ ...tabata, elapsedTime: 240_000 })).toEqual({
      remainingMs: 0,
      remainingToEndMs: 0,
      phase: "done",
      round: 8,
      done: true,
    });
  });

  it("should have no time left for a stopwatch, which never ends", () => {
    expect(
      timerPoint({ ...countdown, timerType: TIMER_TYPE.STOPWATCH, elapsedTime: 500_000 }),
    ).toEqual({
      remainingMs: null,
      remainingToEndMs: null,
      phase: "work",
      round: 1,
      done: false,
    });
  });
});
