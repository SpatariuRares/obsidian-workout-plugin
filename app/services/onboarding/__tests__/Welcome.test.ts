import { TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import {
  shouldShowWelcome,
  markWelcomeShown,
  startFromScratch,
  type WelcomePluginPort,
} from "@app/services/onboarding/Welcome";

function makeFile(path: string): TFile {
  const f = new TFile();
  f.path = path;
  return f;
}

function makePlugin(existing: string[] = []) {
  const files = new Set(existing);
  const created: Record<string, string> = {};
  const openFile = jest.fn();
  const openModal = jest.fn();
  const saveSettings = jest.fn().mockResolvedValue(undefined);
  const plugin = {
    settings: { ...DEFAULT_SETTINGS },
    saveSettings,
    createLogModalHandler: { openModal },
    app: {
      vault: {
        adapter: { exists: async (p: string) => files.has(p) },
        getAbstractFileByPath: (p: string) =>
          files.has(p) ? makeFile(p) : null,
        createFolder: async (p: string) => void files.add(p),
        create: async (p: string, c: string) => {
          files.add(p);
          created[p] = c;
          return makeFile(p);
        },
      },
      workspace: { getLeaf: () => ({ openFile }) },
    },
  } as unknown as WelcomePluginPort;
  return { plugin, created, openFile, openModal, saveSettings };
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
  it("creates a note with a workout-log block, opens it and the log form", async () => {
    const { plugin, created, openFile, openModal } = makePlugin();
    await startFromScratch(plugin);
    const [path, content] = Object.entries(created)[0];
    expect(path.endsWith(".md")).toBe(true);
    expect(content).toContain("```workout-log");
    expect(openFile).toHaveBeenCalled();
    expect(openModal).toHaveBeenCalled();
  });
  it("does not overwrite an existing note", async () => {
    const first = makePlugin();
    await startFromScratch(first.plugin);
    const path = Object.keys(first.created)[0];
    const second = makePlugin([path]);
    await startFromScratch(second.plugin);
    const created = Object.keys(second.created);
    expect(created).toHaveLength(1);
    expect(created[0]).not.toBe(path);
  });
});
