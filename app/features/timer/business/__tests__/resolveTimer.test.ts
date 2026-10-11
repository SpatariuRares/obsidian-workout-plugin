import { resolveTimer } from "@app/features/timer/business/resolveTimer";
import { TIMER_TYPE } from "@app/features/timer/types";

const rest = { name: "rest", type: TIMER_TYPE.COUNTDOWN, duration: 90, showControls: true, sound: true };
const tabata = { name: "tabata", type: TIMER_TYPE.INTERVAL, duration: 20, showControls: true, sound: false, rounds: 8 };
const settings = (defaultTimerPreset: string | null = null) => ({
  timerPresets: { rest, tabata },
  defaultTimerPreset,
});

describe("resolveTimer", () => {
  it("should take the preset's values", () => {
    expect(resolveTimer({ preset: "tabata" }, settings()).params).toMatchObject({
      type: TIMER_TYPE.INTERVAL,
      duration: 20,
      rounds: 8,
    });
  });

  it("should let the block's own values win over the preset", () => {
    expect(resolveTimer({ preset: "rest", duration: 120 }, settings()).params.duration).toBe(120);
  });

  it("should use the default preset when the block names none", () => {
    expect(resolveTimer({}, settings("rest")).params.duration).toBe(90);
  });

  it("should fall back to the block defaults", () => {
    expect(resolveTimer({}, settings()).params).toMatchObject({ duration: 30, rounds: 1 });
  });

  it("should report an unknown preset", () => {
    expect(resolveTimer({ preset: "nope" }, settings()).error).toContain('"nope"');
  });
});
