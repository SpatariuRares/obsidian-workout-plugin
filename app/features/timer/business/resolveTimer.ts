import type {
  EmbeddedTimerParams,
  TimerPresetConfig,
} from "@app/features/timer/types";
import type { WorkoutChartsSettings } from "@app/types/WorkoutLogData";
import { timerBlock } from "@app/features/timer/timerBlock";

/**
 * The timer a `workout-timer` block runs. Priority: the block's own values,
 * then its preset (or, without one, the default preset), then the
 * timerBlock defaults. An unknown preset is an error.
 */
export function resolveTimer(
  params: EmbeddedTimerParams,
  settings: Pick<WorkoutChartsSettings, "timerPresets" | "defaultTimerPreset">,
): { params: EmbeddedTimerParams; error?: string } {
  let base: Partial<EmbeddedTimerParams> = {};

  if (params.preset) {
    const preset = settings.timerPresets[params.preset];
    if (!preset) {
      return {
        params,
        error: `Timer preset "${params.preset}" not found. Available presets: ${Object.keys(settings.timerPresets).join(", ") || "none"}`,
      };
    }
    base = presetToParams(preset);
  } else if (settings.defaultTimerPreset) {
    const preset = settings.timerPresets[settings.defaultTimerPreset];
    if (preset) base = presetToParams(preset);
  }

  const resolved: EmbeddedTimerParams = {
    ...timerBlock.defaults,
    ...base,
    ...withoutUndefined(params),
  };
  // The preset name is not needed to run the timer
  delete resolved.preset;
  return { params: resolved };
}

function presetToParams(preset: TimerPresetConfig): Partial<EmbeddedTimerParams> {
  return {
    type: preset.type,
    duration: preset.duration,
    showControls: preset.showControls,
    sound: preset.sound,
    rounds: preset.rounds,
  };
}

function withoutUndefined(params: EmbeddedTimerParams): Partial<EmbeddedTimerParams> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined),
  ) as Partial<EmbeddedTimerParams>;
}
