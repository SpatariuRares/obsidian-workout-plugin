/** @jest-environment jsdom */

import { TimerCore } from "@app/features/timer/business/TimerCore";
import { TimerAudio } from "@app/features/timer/components/TimerAudio";
import { TIMER_TYPE } from "@app/features/timer/types";

jest.mock("@app/features/timer/components/TimerAudio");
jest.mock("@app/features/timer/components/TimerDisplay", () => ({
  TimerDisplay: { updateDisplay: jest.fn(), cleanupOverlay: jest.fn() },
}));
jest.mock("@app/features/timer/components/TimerControls", () => ({
  TimerControls: { updateStartStopButton: jest.fn() },
}));

const audioInstance = (): jest.Mocked<TimerAudio> =>
  (TimerAudio as jest.MockedClass<typeof TimerAudio>).mock.instances[0] as
    jest.Mocked<TimerAudio>;

const runCountdown = (core: TimerCore, seconds: number) => {
  core.setState({
    timerType: TIMER_TYPE.COUNTDOWN,
    duration: seconds,
    timerDisplay: document.createElement("div"),
  });
  core.start();
  jest.advanceTimersByTime(seconds * 1000 + 200);
};

describe("TimerCore sound", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
    (TimerAudio as jest.MockedClass<typeof TimerAudio>).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("plays sound at the end of a countdown by default", () => {
    const core = new TimerCore("t1");

    runCountdown(core, 3);

    expect(audioInstance().play).toHaveBeenCalled();
  });

  it("does not play sound when sound is disabled", () => {
    const core = new TimerCore("t1");
    core.setSoundEnabled(false);

    runCountdown(core, 3);

    expect(audioInstance().play).not.toHaveBeenCalled();
  });

  it("unlocks audio on start when sound is enabled", () => {
    const core = new TimerCore("t1");
    core.setState({ timerDisplay: document.createElement("div") });

    core.start();

    expect(audioInstance().unlock).toHaveBeenCalled();
  });

  it("closes audio on destroy", () => {
    const core = new TimerCore("t1");

    core.destroy();

    expect(audioInstance().close).toHaveBeenCalled();
  });
});
