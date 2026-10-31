import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import {
  shouldShowWelcome,
  markWelcomeShown,
  openOnboarding,
  type WelcomePluginPort,
} from "@app/services/onboarding/Welcome";

function makePlugin(existing: string[] = []) {
  const vault = new FakeVault();
  for (const path of existing) void vault.app.vault.create(path, "");
  const saveSettings = jest.fn().mockResolvedValue(undefined);
  const plugin = {
    settings: { ...DEFAULT_SETTINGS },
    saveSettings,
    app: vault.app,
  } as unknown as WelcomePluginPort;
  return { plugin, vault, saveSettings };
}

describe("shouldShowWelcome", () => {
  it("shows on a fresh install: no saved data, no CSV", async () => {
    const { plugin } = makePlugin();
    expect(await shouldShowWelcome(plugin, null)).toBe(true);
  });
  it("does not show when plugin data was saved", async () => {
    const { plugin } = makePlugin();
    expect(
      await shouldShowWelcome(plugin, { weightUnit: "kg" }),
    ).toBe(false);
  });
  it("does not show when the CSV exists", async () => {
    const { plugin } = makePlugin([DEFAULT_SETTINGS.csvLogFilePath]);
    expect(await shouldShowWelcome(plugin, null)).toBe(false);
  });
  it("does not show once the flag is set", async () => {
    const { plugin } = makePlugin();
    plugin.settings.welcomeShown = true;
    expect(await shouldShowWelcome(plugin, null)).toBe(false);
  });
});

describe("markWelcomeShown", () => {
  it("saves the flag", async () => {
    const { plugin, saveSettings } = makePlugin();
    await markWelcomeShown(plugin);
    expect(plugin.settings.welcomeShown).toBe(true);
    expect(saveSettings).toHaveBeenCalled();
  });
});

const mockOpenGuide = jest.fn();
jest.mock("@app/services/examples/GettingStartedGuide", () => ({
  openGettingStartedGuide: (...args: unknown[]) =>
    mockOpenGuide(...args),
}));

describe("openOnboarding", () => {
  beforeEach(() => mockOpenGuide.mockReset());

  it("marks onboarding complete only after opening the populated guide", async () => {
    const { plugin, saveSettings } = makePlugin();
    mockOpenGuide.mockImplementation(async () => {
      expect(plugin.settings.welcomeShown).toBe(false);
      return true;
    });
    await expect(openOnboarding(plugin)).resolves.toBe(true);
    expect(mockOpenGuide).toHaveBeenCalledWith(plugin);
    expect(plugin.settings.welcomeShown).toBe(true);
    expect(saveSettings).toHaveBeenCalledTimes(1);
  });

  it("does not mark onboarding complete if examples cannot be created", async () => {
    const { plugin, saveSettings } = makePlugin();
    mockOpenGuide.mockResolvedValue(false);
    await expect(openOnboarding(plugin)).resolves.toBe(false);
    expect(plugin.settings.welcomeShown).toBe(false);
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
