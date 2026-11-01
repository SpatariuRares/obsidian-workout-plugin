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

/** A rendering of the block, in the document like a real one */
const surface = () => ({
  timerDisplay: document.body.appendChild(document.createElement("div")),
});

const runCountdown = (core: TimerCore, seconds: number) => {
  core.setState({ timerType: TIMER_TYPE.COUNTDOWN, duration: seconds });
  core.addSurface(surface());
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
    core.addSurface(surface());

    core.start();

    expect(audioInstance().unlock).toHaveBeenCalled();
  });

  it("closes audio on destroy", () => {
    const core = new TimerCore("t1");

    core.destroy();

    expect(audioInstance().close).toHaveBeenCalled();
  });
});

describe("TimerCore pause", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000_000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("redraws the display as paused when stopped mid-countdown", () => {
    const { TimerDisplay } = jest.requireMock(
      "@app/features/timer/components/TimerDisplay",
    );
    const core = new TimerCore("t1");
    core.setState({ timerType: TIMER_TYPE.COUNTDOWN, duration: 10 });
    core.addSurface(surface());
    core.start();
    jest.advanceTimersByTime(8000);
    (TimerDisplay.updateDisplay as jest.Mock).mockClear();

    core.stop();

    // Not running any more, so the last-seconds overlay goes and "Paused" shows
    expect(TimerDisplay.updateDisplay).toHaveBeenCalledWith(
      expect.objectContaining({ isRunning: false }),
      "t1",
    );
  });
});

describe("TimerCore surfaces", () => {
  it("starts on a rendering Obsidian has not attached to the document yet", () => {
    const core = new TimerCore("t1");
    core.addSurface({ timerDisplay: document.createElement("div") });

    core.start();

    expect(core.isRunning()).toBe(true);
    core.destroy();
  });

  it("draws on every rendering still in the document (reading and editing view)", () => {
    const { TimerDisplay } = jest.requireMock(
      "@app/features/timer/components/TimerDisplay",
    );
    const core = new TimerCore("t1");
    const reading = surface();
    const editing = surface();
    const gone = surface();
    core.addSurface(gone);
    core.reset(); // seen in the document
    gone.timerDisplay.remove();
    core.addSurface(reading);
    core.addSurface(editing);
    (TimerDisplay.updateDisplay as jest.Mock).mockClear();

    core.reset();

    const drawn = (TimerDisplay.updateDisplay as jest.Mock).mock.calls[0][0].surfaces;
    expect(drawn).toEqual([reading, editing]);
  });
});
