import {
  isUnchangedDefaultTimerPreset,
  timerPresets,
  withDefaultTimerPresets,
} from "@app/features/timer/business/timerPresets";
import { TIMER_TYPE, type TimerPresetConfig } from "@app/features/timer/types";

const rest: TimerPresetConfig = {
  name: "Rest",
  type: TIMER_TYPE.COUNTDOWN,
  duration: 90,
  showControls: true,
  sound: true,
};

describe("withDefaultTimerPresets", () => {
  it("adds Tabata and EMOM after the saved presets, keeping their order", () => {
    const list = withDefaultTimerPresets({ Rest: rest });

    expect(Object.keys(list)).toEqual(["Rest", "Tabata", "EMOM"]);
    expect(list.Tabata).toMatchObject({ duration: 20, rest: 10, rounds: 8 });
  });

  it("keeps a saved preset with a built-in name, in any case", () => {
    const mine = { ...rest, name: "tabata", duration: 30 };

    const list = withDefaultTimerPresets({ tabata: mine });

    expect(Object.keys(list)).toEqual(["tabata", "EMOM"]);
    expect(list.tabata).toBe(mine);
  });

  it("copes with a missing list in the saved settings", () => {
    expect(Object.keys(withDefaultTimerPresets(null))).toEqual(["Tabata", "EMOM"]);
  });

  it("adds copies, so editing one leaves the built-in untouched", () => {
    withDefaultTimerPresets().Tabata.duration = 99;

    expect(withDefaultTimerPresets().Tabata.duration).toBe(20);
    expect(timerPresets({ timerPresets: {} }).Tabata.duration).toBe(20);
  });
});

describe("timerPresets", () => {
  it("still finds a built-in deleted from the list, so blocks naming it work", () => {
    expect(timerPresets({ timerPresets: { Rest: rest } }).EMOM).toBeDefined();
  });
});

describe("isUnchangedDefaultTimerPreset", () => {
  it("is true only for a built-in preset with its original timing", () => {
    const { Tabata } = withDefaultTimerPresets({});

    expect(isUnchangedDefaultTimerPreset(Tabata)).toBe(true);
    expect(isUnchangedDefaultTimerPreset({ ...Tabata, rounds: 6 })).toBe(false);
    expect(isUnchangedDefaultTimerPreset(rest)).toBe(false);
    expect(isUnchangedDefaultTimerPreset({ ...rest, name: "toString" })).toBe(false);
  });
});
