/**
 * @fileoverview Packs a locale in the format of packedLocale.ts. Build time
 * only (scripts/esbuild-packed-locales.mjs and tests), never bundled.
 */

import { deflateSync, strFromU8, strToU8 } from "fflate";
import {
  eachString,
  type Translations,
} from "@app/i18n/packedLocale";

function valueAt(
  translations: Translations,
  path: string[],
): unknown {
  let current: unknown = translations;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Translations)[key];
  }
  return current;
}

/** `locale` packed against `english` (build time) */
export function packLocale(
  english: Translations,
  locale: Translations,
): string {
  const values: (string | null)[] = [];
  eachString(english, (path) => {
    const value = valueAt(locale, path);
    values.push(typeof value === "string" ? value : null);
  });
  const deflated = deflateSync(strToU8(JSON.stringify(values)), {
    level: 9,
  });
  return btoa(strFromU8(deflated, true));
}
