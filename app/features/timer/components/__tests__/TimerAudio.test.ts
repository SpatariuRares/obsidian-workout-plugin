/** @jest-environment jsdom */

import { TimerAudio } from "@app/features/timer/components/TimerAudio";

class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: AudioContextState = "suspended";
  currentTime = 0;
  destination = {};
  resume = jest.fn(() => {
    this.state = "running";
    return Promise.resolve();
  });
  close = jest.fn(() => {
    this.state = "closed";
    return Promise.resolve();
  });
  createOscillator = jest.fn(() => ({
    connect: jest.fn(),
    frequency: { value: 0 },
    type: "sine",
    start: jest.fn(),
    stop: jest.fn(),
  }));
  createGain = jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  }));

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

describe("TimerAudio", () => {
  beforeEach(() => {
    FakeAudioContext.instances = [];
    (window as unknown as { AudioContext: unknown }).AudioContext =
      FakeAudioContext;
  });

  it("creates and resumes the context on unlock", () => {
    const audio = new TimerAudio();

    audio.unlock();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalled();
  });

  it("reuses a single context across plays", () => {
    const audio = new TimerAudio();

    audio.unlock();
    audio.play();
    audio.play();

    expect(FakeAudioContext.instances).toHaveLength(1);
    expect(
      FakeAudioContext.instances[0].createOscillator,
    ).toHaveBeenCalled();
  });

  it("resumes a suspended context before playing", () => {
    const audio = new TimerAudio();

    audio.play();

    expect(FakeAudioContext.instances[0].resume).toHaveBeenCalled();
  });

  it("closes the context and creates a new one after close", () => {
    const audio = new TimerAudio();
    audio.unlock();

    audio.close();
    audio.play();

    expect(FakeAudioContext.instances[0].close).toHaveBeenCalled();
    expect(FakeAudioContext.instances).toHaveLength(2);
  });

  it("does not throw when AudioContext is unavailable", () => {
    (window as unknown as { AudioContext: unknown }).AudioContext =
      undefined;
    const audio = new TimerAudio();

    expect(() => {
      audio.unlock();
      audio.play();
      audio.close();
    }).not.toThrow();
  });
});
