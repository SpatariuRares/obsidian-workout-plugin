/** @jest-environment jsdom */

import { EmbeddedTimerView } from "@app/features/timer/views/EmbeddedTimerView";
import { TimerCore } from "@app/features/timer/business/TimerCore";
import {
  attachObsidianHelpers,
  createObsidianContainer,
} from "@app/components/__tests__/obsidianDomMocks";
import { TIMER_TYPE } from "@app/features/timer/types";
import { t } from "@app/i18n";
import type WorkoutChartsPlugin from "main";

jest.mock("@app/features/timer/components/TimerAudio");
jest.mock("@app/features/timer/ui/TimerActionSelect", () => ({
  TimerActionSelect: { render: jest.fn() },
}));

const createPlugin = () =>
  ({
    app: {},
    settings: { timerPresets: {}, defaultTimerPreset: undefined },
    timerDeviceEffects: { setRunning: jest.fn(), complete: jest.fn() },
  }) as unknown as WorkoutChartsPlugin;

describe("EmbeddedTimerView", () => {
  let startSpy: jest.SpyInstance;
  let soundSpy: jest.SpyInstance;

  beforeEach(() => {
    startSpy = jest.spyOn(TimerCore.prototype, "start");
    soundSpy = jest.spyOn(TimerCore.prototype, "setSoundEnabled");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("sound", () => {
    it("enables sound by default", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");

      view.createTimer(createObsidianContainer(), { duration: 30 });

      expect(soundSpy).toHaveBeenLastCalledWith(true);
      view.destroy();
    });

    it("disables sound when sound is false", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");

      view.createTimer(createObsidianContainer(), {
        duration: 30,
        sound: false,
      });

      expect(soundSpy).toHaveBeenLastCalledWith(false);
      view.destroy();
    });

    it("lets an explicit sound param override the preset", () => {
      const plugin = createPlugin();
      plugin.settings.timerPresets = {
        rest: {
          name: "rest",
          type: "countdown",
          duration: 90,
          showControls: true,
          sound: true,
        },
      } as never;
      const view = new EmbeddedTimerView(plugin, "t1");

      view.createTimer(createObsidianContainer(), {
        preset: "rest",
        sound: false,
      });

      expect(soundSpy).toHaveBeenLastCalledWith(false);
      view.destroy();
    });
  });

  describe("autoStart", () => {
    it("does not start without autoStart", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");

      view.createTimer(createObsidianContainer(), { duration: 30 });

      expect(startSpy).not.toHaveBeenCalled();
      expect(view.isTimerRunning()).toBe(false);
    });

    it("starts the timer on first render with autoStart", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");

      view.createTimer(createObsidianContainer(), {
        duration: 30,
        autoStart: true,
      });

      expect(view.isTimerRunning()).toBe(true);
      view.destroy();
    });

    it("starts only once across re-renders", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");
      const params = { duration: 30, autoStart: true };

      view.createTimer(createObsidianContainer(), params);
      view.stop();
      view.createTimer(createObsidianContainer(), params);

      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(view.isTimerRunning()).toBe(false);
    });
  });

  describe("interval phases", () => {
    beforeEach(() => {
      // The last-seconds overlay is drawn on the page body
      attachObsidianHelpers(document.body);
      jest.useFakeTimers();
      jest.setSystemTime(1_000_000);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const tabata = {
      type: TIMER_TYPE.INTERVAL,
      work: 20,
      rest: 10,
      rounds: 8,
    };

    it("shows the work phase, then the rest phase with its own countdown", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");
      const container = createObsidianContainer();
      view.createTimer(container, tabata);

      expect(container.textContent).toContain(t("timer.phase.work"));
      expect(container.textContent).toContain("00:20");

      view.start();
      jest.advanceTimersByTime(21_000);

      expect(container.textContent).toContain(t("timer.phase.rest"));
      expect(container.textContent).toContain("00:09");
      expect(container.textContent).toContain(
        t("timer.round", { current: 1, total: 8 }),
      );
      view.destroy();
    });

    it("runs the built-in Tabata preset to the end", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");
      const container = createObsidianContainer();
      view.createTimer(container, { preset: "Tabata" });

      view.start();
      jest.advanceTimersByTime(240_200);

      expect(view.isTimerRunning()).toBe(false);
      expect(container.textContent).toContain(t("timer.status.done"));
      view.destroy();
    });

    it("shows no phase when the rounds have no rest (EMOM)", () => {
      const view = new EmbeddedTimerView(createPlugin(), "t1");
      const container = createObsidianContainer();
      view.createTimer(container, { preset: "EMOM" });

      expect(container.textContent).toContain("01:00");
      expect(container.textContent).not.toContain(t("timer.phase.work"));
      view.destroy();
    });
  });
});
