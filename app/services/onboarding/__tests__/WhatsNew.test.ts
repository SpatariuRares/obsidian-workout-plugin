import { DEFAULT_SETTINGS } from "@app/constants/defaults.constants";
import { LocalizationService, t } from "@app/i18n";
import type { SettingsPort } from "@app/types/PluginPorts";
import {
  allReleaseNotes,
  compareVersions,
  MAX_RELEASES,
  unseenReleaseNotes,
  releaseVersions,
  versionsSince,
} from "@app/services/onboarding/WhatsNew";

beforeAll(() => LocalizationService.initialize({} as never));

function makePlugin(lastSeenVersion = "") {
  const saveSettings = jest.fn().mockResolvedValue(undefined);
  const plugin: SettingsPort = {
    settings: { ...DEFAULT_SETTINGS, lastSeenVersion },
    saveSettings,
  };
  return { plugin, saveSettings };
}

describe("compareVersions", () => {
  it("compares each part as a number", () => {
    expect(compareVersions("3.10.0", "3.9.1")).toBeGreaterThan(0);
    expect(compareVersions("2.11.0", "3.0.0")).toBeLessThan(0);
    expect(compareVersions("3.0.0", "3.0.0")).toBe(0);
  });
});

describe("versionsSince", () => {
  const versions = ["3.2.0", "3.1.0", "3.0.0"];

  it("lists the versions after the last seen, up to the current one", () => {
    expect(versionsSince(versions, "3.0.0", "3.2.0")).toEqual([
      "3.2.0",
      "3.1.0",
    ]);
    expect(versionsSince(versions, "3.0.0", "3.1.0")).toEqual(["3.1.0"]);
  });
  it("shows only the current version when none was recorded", () => {
    expect(versionsSince(versions, "", "3.1.0")).toEqual(["3.1.0"]);
  });
  it("shows nothing on a downgrade or a version without notes", () => {
    expect(versionsSince(versions, "3.2.0", "3.1.0")).toEqual([]);
    expect(versionsSince(versions, "", "3.0.5")).toEqual([]);
  });
});

describe("release notes in en.json", () => {
  it("lists the bundled versions newest first, each with its notes", () => {
    const versions = releaseVersions();
    expect(versions).toContain("3.0.0");
    expect(versions.length).toBeLessThanOrEqual(MAX_RELEASES);
    expect([...versions].sort((a, b) => compareVersions(b, a))).toEqual(
      versions,
    );
    for (const release of allReleaseNotes()) {
      expect(release.notes).toBe(
        t(`whatsNew.releases.v${release.version.replace(/\./g, "_")}`),
      );
      expect(release.notes).not.toMatch(/^whatsNew\./);
    }
  });
});

describe("unseenReleaseNotes", () => {
  it("shows the current version's notes after an update and records it", async () => {
    const { plugin, saveSettings } = makePlugin("2.11.0");
    const releases = await unseenReleaseNotes(plugin, "3.0.0");
    expect(releases.map((r) => r.version)).toEqual(["3.0.0"]);
    expect(plugin.settings.lastSeenVersion).toBe("3.0.0");
    expect(saveSettings).toHaveBeenCalled();
  });
  it("shows the installed version's notes on a fresh install", async () => {
    const { plugin } = makePlugin();
    const releases = await unseenReleaseNotes(plugin, "3.0.0");
    expect(releases.map((r) => r.version)).toEqual(["3.0.0"]);
    expect(plugin.settings.lastSeenVersion).toBe("3.0.0");
  });
  it("shows nothing on later loads of the same version", async () => {
    const { plugin, saveSettings } = makePlugin();
    await unseenReleaseNotes(plugin, "3.0.0");
    saveSettings.mockClear();
    expect(await unseenReleaseNotes(plugin, "3.0.0")).toEqual([]);
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
