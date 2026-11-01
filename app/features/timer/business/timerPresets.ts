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

/**
 * The settings list with the built-in presets it lacks added after the user's
 * own (so their order stays). Run once per vault (see
 * `timerPresetDefaultsAdded`), so a built-in the user deletes stays deleted.
 * A saved preset with the same name, in any case, is kept as it is.
 */
export function withDefaultTimerPresets(
  saved: Record<string, TimerPresetConfig> | null | undefined,
): Record<string, TimerPresetConfig> {
  const mine = saved ?? {};
  const names = new Set(Object.keys(mine).map((n) => n.toLowerCase()));
  const added = Object.fromEntries(
    Object.entries(BUILT_IN_TIMER_PRESETS)
      .filter(([name]) => !names.has(name.toLowerCase()))
      .map(([name, preset]) => [name, { ...preset }]),
  );
  return { ...mine, ...added };
}

/**
 * Whether this preset is a built-in one as the plugin added it (same name and
 * timing), so its explanation still applies
 */
export function isUnchangedDefaultTimerPreset(
  preset: TimerPresetConfig,
): boolean {
  if (!Object.prototype.hasOwnProperty.call(BUILT_IN_TIMER_PRESETS, preset.name)) {
    return false;
  }
  const builtIn = BUILT_IN_TIMER_PRESETS[preset.name];
  return (
    builtIn.type === preset.type &&
    builtIn.duration === preset.duration &&
    (builtIn.rest ?? 0) === (preset.rest ?? 0) &&
    builtIn.rounds === preset.rounds
  );
}

/**
 * Every preset a block can name: the built-in ones, then the user's (which win
 * on the same name). Built-ins stay here even when deleted from the settings
 * list, so blocks that name them keep working.
 */
export function timerPresets(
  settings: Pick<WorkoutChartsSettings, "timerPresets">,
): Record<string, TimerPresetConfig> {
  return { ...BUILT_IN_TIMER_PRESETS, ...settings.timerPresets };
}
