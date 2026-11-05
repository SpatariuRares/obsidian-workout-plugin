import type { ButtonComponent } from "obsidian";

/** What a busy button says: before, while it works, and how it ended */
export interface BusyButtonLabels {
  idle: string;
  /** Shown while `fn` runs (unset: the text stays) */
  busy?: string;
  /** Shown for 2s after `fn` resolved (unset: back to idle at once) */
  done?: string;
  /** Shown for 2s after `fn` threw (unset: back to idle at once) */
  failed?: string;
}

/** How long the done/failed text stays before the button is given back */
export const BUSY_RESULT_MS = 2000;

/**
 * Runs `fn` with `button` disabled, saying what happens on it, then gives the
 * button back. An error of `fn` is shown as `labels.failed`, not thrown.
 */
export async function runWithBusyButton(
  button: ButtonComponent,
  labels: BusyButtonLabels,
  fn: () => Promise<void>,
): Promise<void> {
  button.setDisabled(true);
  if (labels.busy) button.setButtonText(labels.busy);

  let result: string | undefined;
  try {
    await fn();
    result = labels.done;
  } catch {
    result = labels.failed;
  }

  const restore = () => {
    button.setButtonText(labels.idle);
    button.setDisabled(false);
  };
  if (result === undefined) {
    restore();
    return;
  }
  button.setButtonText(result);
  window.setTimeout(restore, BUSY_RESULT_MS);
}
