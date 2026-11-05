import {
  isUnchangedDefaultTimerPreset,
  timerPresets,
  timerPresetSummary,
  withDefaultTimerPresets,
} from "@app/features/timer/business/timerPresets";
import { TIMER_TYPE, type TimerPresetConfig } from "@app/features/timer/types";
import { t } from "@app/i18n";

describe("timerPresetSummary", () => {
  it("lists a countdown's type, duration and options in the current language", () => {
    const preset: TimerPresetConfig = {
      name: "Rest",
      type: TIMER_TYPE.COUNTDOWN,
      duration: 90,
      showControls: true,
      sound: true,
    };
    expect(timerPresetSummary(preset)).toBe(
      [
        t("timer.presets.summaryType", { type: t("timer.countdown") }),
        t("timer.presets.summaryDuration", { seconds: 90 }),
        t("timer.presets.summaryOptions", {
          options: [t("timer.presets.detailsControls"), t("timer.presets.detailsSound")].join(", "),
        }),
      ].join(" | "),
    );
  });

  it("adds rounds and rest for an interval, and no options when none is on", () => {
    const tabata: TimerPresetConfig = {
      name: "Tabata",
      type: TIMER_TYPE.INTERVAL,
      duration: 20,
      rest: 10,
      rounds: 8,
      showControls: false,
      sound: false,
    };
    expect(timerPresetSummary(tabata)).toBe(
      [
        t("timer.presets.summaryType", { type: t("timer.interval") }),
        t("timer.presets.summaryDuration", { seconds: 20 }),
        t("timer.presets.summaryRounds", { rounds: 8 }),
        t("timer.presets.summaryRest", { seconds: 10 }),
      ].join(" | "),
    );
  });
});

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
