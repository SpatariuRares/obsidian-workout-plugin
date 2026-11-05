import { LocalizationService, t } from "@app/i18n";
import type { SettingsPort } from "@app/types/PluginPorts";

/** One release's notes (markdown, in the vault's language) */
export interface ReleaseNotes {
  version: string;
  notes: string;
}

/** Release notes live in en.json under this group, one key per version: v3_0_0 */
const RELEASES_KEY = "whatsNew.releases";

/** The plugin keeps the notes of the latest versions; older ones are on GitHub */
export const MAX_RELEASES = 7;

export const RELEASES_URL =
  "https://github.com/SpatariuRares/obsidian-workout-plugin/releases";

/** Numeric comparison of X.Y.Z versions: negative when a is older */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] || 0) - (pb[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Versions that have notes in the plugin, newest first, at most MAX_RELEASES */
export function releaseVersions(): string[] {
  return LocalizationService.getInstance()
    .keysOf(RELEASES_KEY)
    .map((key) => key.replace(/^v/, "").replace(/_/g, "."))
    .sort((a, b) => compareVersions(b, a))
    .slice(0, MAX_RELEASES);
}

/** Every release with notes, newest first */
export function allReleaseNotes(): ReleaseNotes[] {
  return releaseVersions().map((version) => ({
    version,
    notes: t(`${RELEASES_KEY}.v${version.replace(/\./g, "_")}`),
  }));
}

/**
 * The versions to show when `current` replaces `lastSeen`, newest first.
 * With no `lastSeen` (a fresh install, or an update from a plugin that didn't
 * record it) only `current`'s notes, so nobody gets the whole history.
 */
export function versionsSince(
  versions: string[],
  lastSeen: string,
  current: string,
): string[] {
  return versions.filter(
    (version) =>
      compareVersions(version, current) <= 0 &&
      (lastSeen
        ? compareVersions(version, lastSeen) > 0
        : compareVersions(version, current) === 0),
  );
}

/**
 * The notes to show once when `current` is new to this vault (installed or
 * updated), and records it as seen: every later load of the same version
 * shows nothing.
 */
export async function unseenReleaseNotes(
  plugin: SettingsPort,
  current: string,
): Promise<ReleaseNotes[]> {
  const lastSeen = plugin.settings.lastSeenVersion;
  if (lastSeen === current) return [];
  const shown = versionsSince(releaseVersions(), lastSeen, current);
  plugin.settings.lastSeenVersion = current;
  await plugin.saveSettings();
  return allReleaseNotes().filter((release) => shown.includes(release.version));
}
