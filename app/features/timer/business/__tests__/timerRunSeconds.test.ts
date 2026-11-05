import { timerRunSeconds } from "@app/features/timer/business/timerRunSeconds";
import { TIMER_TYPE } from "@app/features/timer/types";

const rest = { name: "rest", type: TIMER_TYPE.COUNTDOWN, duration: 90, showControls: true, sound: true };
const settings = (defaultTimerPreset: string | null = null) => ({
  timerPresets: { rest },
  defaultTimerPreset,
});

describe("timerRunSeconds", () => {
  it("should give a countdown's duration", () => {
    expect(timerRunSeconds({ duration: 45 }, settings())).toBe(45);
  });

  it("should give a preset's length", () => {
    expect(timerRunSeconds({ preset: "rest" }, settings())).toBe(90);
  });

  it("should count every round of the built-in Tabata", () => {
    // 8 rounds of 20 s work + 10 s rest
    expect(timerRunSeconds({ preset: "Tabata" }, settings())).toBe(240);
  });

  it("should use the default preset when the timer names none", () => {
    expect(timerRunSeconds({}, settings("rest"))).toBe(90);
  });

  it("should be 0 for a stopwatch", () => {
    expect(timerRunSeconds({ type: TIMER_TYPE.STOPWATCH }, settings())).toBe(0);
  });

  it("should be 0 for an unknown preset", () => {
    expect(timerRunSeconds({ preset: "nope" }, settings())).toBe(0);
  });
});
