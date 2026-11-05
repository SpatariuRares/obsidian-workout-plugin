/**
 * esbuild plugin: bundles every locale but en.json packed (app/i18n/packedLocale.ts),
 * a third of its size. en.json stays plain: it is the fallback and gives the
 * key order the others are packed in.
 */
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const formatFile = path.join(root, "app/i18n/packedLocale.ts");
const packFile = path.join(root, "app/i18n/packLocale.ts");
const englishFile = path.join(root, "app/i18n/locales/en.json");

/** packLocale.ts compiled for this script, so the format has one owner */
async function loadPacker() {
  const { outputFiles } = await esbuild.build({
    entryPoints: [packFile],
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
  });
  const code = Buffer.from(outputFiles[0].contents).toString("base64");
  return import(`data:text/javascript;base64,${code}`);
}

export function packedLocales() {
  return {
    name: "packed-locales",
    setup(build) {
      let packer;
      build.onLoad({ filter: /i18n[\\/]locales[\\/][^\\/]+\.json$/ }, async (args) => {
        if (path.resolve(args.path) === englishFile) return undefined;
        packer ??= await loadPacker();
        const english = JSON.parse(await fs.promises.readFile(englishFile, "utf8"));
        const locale = JSON.parse(await fs.promises.readFile(args.path, "utf8"));
        const packed = packer.packLocale(english, locale);
        return {
          contents: `module.exports = require(${JSON.stringify(formatFile)}).unpackLocale(require(${JSON.stringify(englishFile)}), ${JSON.stringify(packed)});`,
          loader: "js",
          resolveDir: root,
          watchFiles: [englishFile],
        };
      });
    },
  };
}
