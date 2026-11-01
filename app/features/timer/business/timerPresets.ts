import { TIMER_TYPE, type TimerPresetConfig } from "@app/features/timer/types";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";

// Preset names are written into blocks (`preset: Tabata`), so they are not translated
const BUILT_IN_TIMER_PRESETS: Record<string, TimerPresetConfig> = {
  /** 20 s work, 10 s rest, 8 rounds */
  Tabata: {
    name: "Tabata",
    type: TIMER_TYPE.INTERVAL,
    duration: 20,
    rest: 10,
    rounds: 8,
    showControls: true,
    sound: true,
  },
  /** Every minute on the minute, 10 minutes */
  EMOM: {
    name: "EMOM",
    type: TIMER_TYPE.INTERVAL,
    duration: 60,
    rest: 0,
    rounds: 10,
    showControls: true,
    sound: true,
  },
};

/** Every preset a block can name: the built-in ones, then the user's (which win on the same name) */
export function timerPresets(
  settings: Pick<WorkoutChartsSettings, "timerPresets">,
): Record<string, TimerPresetConfig> {
  return { ...BUILT_IN_TIMER_PRESETS, ...settings.timerPresets };
}
