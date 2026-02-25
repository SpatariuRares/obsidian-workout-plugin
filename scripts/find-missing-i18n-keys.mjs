#!/usr/bin/env node

/**
 * find-missing-i18n-keys.mjs
 *
 * Scansiona l'intera codebase TypeScript/JavaScript e identifica chiamate t()
 * con chiavi i18n che mancano in uno o più file locale in app/i18n/locales/.
 *
 * Strategia:
 *  1. Carica tutti i file JSON da app/i18n/locales/
 *  2. Estrae tutte le chiavi foglia da ogni locale in dot-notation
 *  3. Scansiona ogni file .ts/.tsx/.js/.mjs nella cartella /app e main.ts
 *  4. Estrae ogni chiamata t("chiave") o t('chiave')
 *  5. Confronta le chiavi usate con quelle definite in OGNI file locale
 *  6. Riporta le chiavi mancanti raggruppate per file e indica in quali lingue mancano
 *
 * Uso:
 *   node scripts/find-missing-i18n-keys.mjs [--json] [--output report.json]
 *   node scripts/find-missing-i18n-keys.mjs --verbose
 *   node scripts/find-missing-i18n-keys.mjs --ignore-patterns "examples.*,legacy.*"
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Configurazione
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".obsidian",
  "__mocks__",
]);

const LOCALES_DIR = path.resolve(ROOT_DIR, "app/i18n/locales");

// ---------------------------------------------------------------------------
// Parsing CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const outputJson = args.includes("--json");
const verbose = args.includes("--verbose");
const outputFile = getArgValue("--output");
const extraDirs = getArgValue("--include")?.split(",").filter(Boolean) ?? [];
const ignorePatternsRaw = getArgValue("--ignore-patterns");

const ignorePatterns = ignorePatternsRaw
  ? ignorePatternsRaw
      .split(",")
      .filter(Boolean)
      .map((p) => new RegExp(p.trim()))
  : [];

const DEFAULT_SCAN_DIRS = ["app", "main.ts", ...extraDirs];

// ---------------------------------------------------------------------------
// Raccolta file
// ---------------------------------------------------------------------------

function collectFiles(dir, acc = [], extensions = SCAN_EXTENSIONS) {
  const full = path.resolve(ROOT_DIR, dir);
  if (!fs.existsSync(full)) return acc;

  const stat = fs.statSync(full);

  if (stat.isFile()) {
    if (extensions.has(path.extname(full))) acc.push(full);
    return acc;
  }

  for (const entry of fs.readdirSync(full)) {
    if (EXCLUDED_DIRS.has(entry)) continue;

    const childPath = path.join(full, entry);
    const childStat = fs.statSync(childPath);

    if (childStat.isDirectory()) {
      collectFiles(path.relative(ROOT_DIR, childPath), acc, extensions);
    } else if (extensions.has(path.extname(entry))) {
      acc.push(childPath);
    }
  }

  return acc;
}

// ---------------------------------------------------------------------------
// Estrazione chiavi JSON
// ---------------------------------------------------------------------------

function extractLeafKeys(obj, prefix = "", result = new Set()) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    result.add(prefix);
    return result;
  }

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    extractLeafKeys(v, fullKey, result);
  }

  return result;
}

function extractAllKeys(obj, prefix = "", result = new Set()) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return result;
  }

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    result.add(fullKey);
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      extractAllKeys(v, fullKey, result);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Estrazione chiamate t() dal codice sorgente
// ---------------------------------------------------------------------------

function stripComments(content) {
  const result = [];
  let i = 0;
  const len = content.length;

  while (i < len) {
    const ch = content[i];

    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      result.push(ch);
      i++;
      while (i < len) {
        const c = content[i];
        result.push(c);
        if (c === "\\" && i + 1 < len) {
          i++;
          result.push(content[i]);
        } else if (c === quote && quote !== "`") {
          break;
        } else if (c === quote) {
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    if (ch === "/" && i + 1 < len && content[i + 1] === "*") {
      result.push(" ", " ");
      i += 2;
      while (i < len) {
        if (content[i] === "*" && i + 1 < len && content[i + 1] === "/") {
          result.push(" ", " ");
          i += 2;
          break;
        }
        result.push(content[i] === "\n" ? "\n" : " ");
        i++;
      }
      continue;
    }

    if (ch === "/" && i + 1 < len && content[i + 1] === "/") {
      while (i < len && content[i] !== "\n") {
        result.push(" ");
        i++;
      }
      continue;
    }

    result.push(ch);
    i++;
  }

  return result.join("");
}

function offsetToLineCol(lineStarts, offset) {
  let lo = 0;
  let hi = lineStarts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (lineStarts[mid] <= offset) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return { line: lo + 1, column: offset - lineStarts[lo] + 1 };
}

function buildLineStarts(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") {
      starts.push(i + 1);
    }
  }
  return starts;
}

function extractTCalls(content, filePath) {
  const calls = [];
  const stripped = stripComments(content);
  const lineStarts = buildLineStarts(content);
  const originalLines = content.split("\n");

  const regex = /(?<![.\w])t\(\s*["']([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)["']\s*[,)]/g;
  let match;

  while ((match = regex.exec(stripped)) !== null) {
    const key = match[1];
    if (!key.includes(".")) continue;

    const { line, column } = offsetToLineCol(lineStarts, match.index);
    const contextLine = originalLines[line - 1]?.trim() ?? "";
    const context =
      contextLine.length > 120
        ? contextLine.substring(0, 120) + "..."
        : contextLine;

    calls.push({ key, line, column, context });
  }

  return calls;
}

// ---------------------------------------------------------------------------
// Analisi
// ---------------------------------------------------------------------------

function analyze(files, localesMap) {
  const missing = [];
  const valid = [];
  let totalCalls = 0;

  for (const filePath of files) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }

    const calls = extractTCalls(content, filePath);
    totalCalls += calls.length;

    for (const call of calls) {
      if (ignorePatterns.some((p) => p.test(call.key))) continue;

      const missingIn = [];
      const intermediateIn = [];

      for (const [localeFile, data] of localesMap.entries()) {
        if (!data.leafKeys.has(call.key)) {
          if (data.allKeys.has(call.key)) {
            intermediateIn.push(localeFile);
          } else {
            missingIn.push(localeFile);
          }
        }
      }

      const ref = {
        key: call.key,
        file: path.relative(ROOT_DIR, filePath),
        line: call.line,
        column: call.column,
        context: call.context,
      };

      if (missingIn.length === 0 && intermediateIn.length === 0) {
        valid.push(ref);
      } else {
        missing.push({
          ...ref,
          missingIn,
          intermediateIn,
        });
      }
    }
  }

  return { missing, valid, totalCalls };
}

// ---------------------------------------------------------------------------
// Output: Testo
// ---------------------------------------------------------------------------

function printTextReport(result, totalFiles, localesCount) {
  const { missing, valid, totalCalls } = result;

  console.log(
    "\n" +
    "+" + "-".repeat(62) + "+" + "\n" +
    "|         FIND MISSING i18n KEYS - Codebase Analyzer          |" + "\n" +
    "+" + "-".repeat(62) + "+"
  );

  console.log(`\n  File scansionati:      ${totalFiles}`);
  console.log(`  Lingue controllate:    ${localesCount}`);
  console.log(`  Chiamate t() trovate:  ${totalCalls}`);
  console.log(`  Chiavi valide ovunque: ${valid.length}`);
  console.log(`  Chiavi MANCANTI:       ${missing.length}`);

  if (missing.length === 0) {
    console.log("\n  Tutte le chiavi i18n referenziate esistono in tutti i file locale!");
    console.log("+" + "-".repeat(62) + "+\n");
    return;
  }

  const byFile = new Map();
  for (const ref of missing) {
    if (!byFile.has(ref.file)) byFile.set(ref.file, []);
    byFile.get(ref.file).push(ref);
  }

  const byKey = new Map();
  for (const ref of missing) {
    if (!byKey.has(ref.key)) byKey.set(ref.key, []);
    byKey.get(ref.key).push(ref);
  }

  console.log("\n" + "-".repeat(64));
  console.log("  CHIAVI MANCANTI PER FILE");
  console.log("-".repeat(64));

  const sortedFiles = [...byFile.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [file, refs] of sortedFiles) {
    console.log(`\n  ${file} (${refs.length} riferimenti problematici)`);
    for (const ref of refs.sort((a, b) => a.line - b.line)) {
      console.log(`    L${ref.line}:${ref.column}  ${ref.key}`);
      if (ref.missingIn.length > 0) {
        console.log(`             ❌ Mancante in: ${ref.missingIn.join(", ")}`);
      }
      if (ref.intermediateIn.length > 0) {
        console.log(`             ⚠️  Nodo intermedio in: ${ref.intermediateIn.join(", ")}`);
      }
    }
  }

  console.log("\n" + "-".repeat(64));
  console.log("  RIEPILOGO CHIAVI PROBLEMATICHE");
  console.log("-".repeat(64));

  const bySection = new Map();
  for (const [key, refs] of [...byKey.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const section = key.split(".")[0];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ key, refs });
  }

  for (const [section, items] of [...bySection.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`\n  [${section}] (${items.length} chiavi)`);
    for (const { key, refs } of items) {
      const missingCount = refs[0].missingIn.length;
      const interCount = refs[0].intermediateIn.length;
      let status = "";
      if (missingCount > 0) status += `❌ mancano ${missingCount} lingue`;
      if (interCount > 0) status += `${status ? ", " : ""}⚠️ intermedio in ${interCount} lingue`;
      
      console.log(`    - ${key} (${status})`);
    }
  }

  if (verbose) {
    console.log("\n" + "-".repeat(64));
    console.log("  CHIAVI VALIDE TROVATE");
    console.log("-".repeat(64));
    const uniqueValid = [...new Set(valid.map((r) => r.key))].sort();
    for (const key of uniqueValid) {
      console.log(`    ${key}`);
    }
  }

  console.log("\n" + "=".repeat(64));
  console.log(
    `  Riepilogo: ${byKey.size} chiavi problematiche, ${missing.length} riferimenti totali`,
  );
  console.log(`  in ${byFile.size} file su ${totalFiles} scansionati`);
  console.log("=".repeat(64) + "\n");
}

function buildJsonReport(result, totalFiles, localesCount) {
  const { missing, valid, totalCalls } = result;
  const uniqueMissing = [...new Set(missing.map((r) => r.key))].sort();

  const missingByKey = {};
  for (const ref of missing) {
    if (!missingByKey[ref.key]) missingByKey[ref.key] = [];
    missingByKey[ref.key].push({
      file: ref.file,
      line: ref.line,
      column: ref.column,
      missingIn: ref.missingIn,
      intermediateIn: ref.intermediateIn
    });
  }

  return {
    summary: {
      totalFiles,
      localesCount,
      totalTCalls: totalCalls,
      validEverywhere: valid.length,
      problematicReferences: missing.length,
      uniqueProblematicKeys: uniqueMissing.length,
    },
    problematicKeys: missingByKey,
    ...(verbose
      ? { validKeys: [...new Set(valid.map((r) => r.key))].sort() }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    console.error(`Directory locale non trovata: ${LOCALES_DIR}`);
    process.exit(2);
  }

  const localeFiles = collectFiles(LOCALES_DIR, [], new Set([".json"]));
  const localesMap = new Map();

  for (const filePath of localeFiles) {
    const fileName = path.relative(LOCALES_DIR, filePath);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      localesMap.set(fileName, {
        leafKeys: extractLeafKeys(data),
        allKeys: extractAllKeys(data)
      });
    } catch (e) {
      console.warn(`⚠️  Errore nel parsing di ${fileName}: ${e.message}`);
    }
  }

  if (localesMap.size === 0) {
    console.error("Nessun file locale JSON valido trovato.");
    process.exit(2);
  }

  const files = [];
  for (const dir of DEFAULT_SCAN_DIRS) {
    collectFiles(dir, files);
  }

  const selfPath = path.resolve(__filename);
  const filteredFiles = files.filter((f) => path.resolve(f) !== selfPath);

  const skipTests = args.includes("--skip-tests");
  const finalFiles = skipTests
    ? filteredFiles.filter(
        (f) => !f.includes("__tests__") && !f.endsWith(".test.ts"),
      )
    : filteredFiles;

  const result = analyze(finalFiles, localesMap);

  if (outputJson) {
    const report = buildJsonReport(result, finalFiles.length, localesMap.size);
    const jsonStr = JSON.stringify(report, null, 2);

    if (outputFile) {
      fs.writeFileSync(path.resolve(ROOT_DIR, outputFile), jsonStr, "utf-8");
      console.log(`Report salvato in: ${outputFile}`);
    } else {
      console.log(jsonStr);
    }
  } else {
    printTextReport(result, finalFiles.length, localesMap.size);

    if (outputFile) {
      const report = buildJsonReport(result, finalFiles.length, localesMap.size);
      fs.writeFileSync(
        path.resolve(ROOT_DIR, outputFile),
        JSON.stringify(report, null, 2),
        "utf-8",
      );
      console.log(`Report JSON salvato in: ${outputFile}`);
    }
  }

  process.exit(result.missing.length > 0 ? 1 : 0);
}

main();