/**
 * @fileoverview The format the bundle ships translations in.
 *
 * Every locale but English is bundled packed (scripts/esbuild-packed-locales.mjs):
 * its values in the order of en.json's keys, so the keys are written only once,
 * as JSON deflated and base64 encoded. The locale in use is unpacked once, when
 * LocalizationService loads it. A key the locale lacks stays missing, so it
 * falls back to English as before. Packing is in packLocale.ts, kept apart so
 * the deflate code stays out of the bundle.
 */

import { inflateSync, strFromU8, strToU8 } from "fflate";

export type Translations = Record<string, unknown>;

/** Calls `visit` with the path of every string of `english`, in key order */
export function eachString(
  english: Translations,
  visit: (path: string[]) => void,
  path: string[] = [],
): void {
  for (const [key, value] of Object.entries(english)) {
    if (typeof value === "string") visit([...path, key]);
    else if (value && typeof value === "object")
      eachString(value as Translations, visit, [...path, key]);
  }
}

/** The translations `packLocale` packed, keyed like `english` */
export function unpackLocale(
  english: Translations,
  packed: string,
): Translations {
  const json = strFromU8(inflateSync(strToU8(atob(packed), true)));
  const values = JSON.parse(json) as (string | null)[];
  const locale: Translations = {};
  let index = 0;
  eachString(english, (path) => {
    const value = values[index++];
    if (typeof value !== "string") return;
    let group = locale;
    for (const key of path.slice(0, -1)) {
      group = (group[key] ??= {}) as Translations;
    }
    group[path[path.length - 1]] = value;
  });
  return locale;
}
