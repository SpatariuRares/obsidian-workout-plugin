import { FakeVault } from "@app/services/exercise/__tests__/FakeVault";
import { t } from "@app/i18n";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import {
  shouldShowWelcome,
  markWelcomeShown,
  startFromScratch,
  type WelcomePluginPort,
} from "@app/services/onboarding/Welcome";

function makePlugin(existing: string[] = []) {
  const vault = new FakeVault();
  for (const path of existing) void vault.app.vault.create(path, "");
  const openFile = jest.fn();
  const openModal = jest.fn();
  const saveSettings = jest.fn().mockResolvedValue(undefined);
  const plugin = {
    settings: { ...DEFAULT_SETTINGS },
    saveSettings,
    createLogModalHandler: { openModal },
    app: { ...vault.app, workspace: { getLeaf: () => ({ openFile }) } },
  } as unknown as WelcomePluginPort;
  return { plugin, vault, openFile, openModal, saveSettings };
}

describe("shouldShowWelcome", () => {
  it("shows on a fresh install: no saved data, no CSV", async () => {
    const { plugin } = makePlugin();
    expect(await shouldShowWelcome(plugin, null)).toBe(true);
  });
  it("does not show when plugin data was saved", async () => {
    const { plugin } = makePlugin();
    expect(await shouldShowWelcome(plugin, { weightUnit: "kg" })).toBe(false);
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

describe("startFromScratch", () => {
  const name = t("welcome.scratchNoteName");

  it("creates the note at the vault root with a workout-log block, opens it and the log form", async () => {
    const { plugin, vault, openFile, openModal } = makePlugin();
    await startFromScratch(plugin);
    expect(vault.paths()).toEqual([`${name}.md`]);
    expect(vault.content(`${name}.md`)).toContain("```workout-log");
    expect(openFile).toHaveBeenCalled();
    expect(openModal).toHaveBeenCalled();
  });
  it("does not overwrite an existing note: picks a free name", async () => {
    const { plugin, vault } = makePlugin([`${name}.md`]);
    await startFromScratch(plugin);
    expect(vault.content(`${name}.md`)).toBe("");
    expect(vault.paths()).toEqual([`${name} 1.md`, `${name}.md`]);
  });
  it("keeps counting when several are taken", async () => {
    const { plugin, vault } = makePlugin([`${name}.md`, `${name} 1.md`]);
    await startFromScratch(plugin);
    expect(vault.paths()).toContain(`${name} 2.md`);
  });
});
