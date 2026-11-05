import { TIMER_TYPE, type TimerPresetConfig } from "@app/features/timer/types";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { t } from "@app/i18n";

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

/** What each built-in preset is for */
const BUILT_IN_PRESET_HELP: Record<string, string> = {
  Tabata: "settings.presetHelp.tabata",
  EMOM: "settings.presetHelp.emom",
};

/** What a built-in preset is for, in the current language; undefined for others */
export function timerPresetHelp(name: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(BUILT_IN_PRESET_HELP, name)
    ? t(BUILT_IN_PRESET_HELP[name])
    : undefined;
}

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

/**
 * The default preset, when it is still in the settings list (a deleted one is
 * not picked); undefined when there is none
 */
export function savedDefaultTimerPreset(
  settings: Pick<WorkoutChartsSettings, "timerPresets" | "defaultTimerPreset">,
): string | undefined {
  const name = settings.defaultTimerPreset;
  return name && Object.prototype.hasOwnProperty.call(settings.timerPresets, name)
    ? name
    : undefined;
}

const TIMER_TYPE_LABEL: Record<TIMER_TYPE, () => string> = {
  [TIMER_TYPE.COUNTDOWN]: () => t("timer.countdown"),
  [TIMER_TYPE.INTERVAL]: () => t("timer.interval"),
  [TIMER_TYPE.STOPWATCH]: () => t("timer.stopwatch"),
};

/** One line about a preset, for its row in Settings → Timer presets */
export function timerPresetSummary(preset: TimerPresetConfig): string {
  const typeLabel = TIMER_TYPE_LABEL[preset.type];
  const parts = [
    t("timer.presets.summaryType", {
      type: typeLabel ? typeLabel() : preset.type,
    }),
    t("timer.presets.summaryDuration", { seconds: preset.duration }),
  ];
  if (preset.type === TIMER_TYPE.INTERVAL && preset.rounds) {
    parts.push(t("timer.presets.summaryRounds", { rounds: preset.rounds }));
  }
  if (preset.type === TIMER_TYPE.INTERVAL && preset.rest) {
    parts.push(t("timer.presets.summaryRest", { seconds: preset.rest }));
  }

  const options: string[] = [];
  if (preset.showControls) options.push(t("timer.presets.detailsControls"));
  if (preset.sound) options.push(t("timer.presets.detailsSound"));
  if (options.length > 0) {
    parts.push(
      t("timer.presets.summaryOptions", { options: options.join(", ") }),
    );
  }
  return parts.join(" | ");
}
