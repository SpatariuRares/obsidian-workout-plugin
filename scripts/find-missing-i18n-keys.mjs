#!/usr/bin/env node

/**
 * find-missing-i18n-keys.mjs
 *
 * Scansiona l'intera codebase TypeScript/JavaScript e identifica chiamate t()
 * con chiavi i18n che NON esistono in en.json.
 *
 * Strategia:
 *  1. Estrae tutte le chiavi foglia da en.json in dot-notation
 *  2. Scansiona ogni file .ts/.tsx/.js/.mjs nella cartella /app e main.ts
 *  3. Estrae ogni chiamata t("chiave") o t('chiave') con riga e file
 *  4. Confronta le chiavi usate con quelle definite in en.json
 *  5. Riporta le chiavi mancanti raggruppate per file
 *
 * Uso:
 *   node scripts/find-missing-i18n-keys.mjs [--json] [--output report.json]
 *   node scripts/find-missing-i18n-keys.mjs --verbose
 *   node scripts/find-missing-i18n-keys.mjs --ignore-patterns "examples.*,legacy.*"
 *
 * Flag:
 *   --json               Output in formato JSON
 *   --output <file>      Salva il report su file
 *   --locale <file>      Percorso al file JSON (default: app/i18n/locales/en.json)
 *   --verbose            Mostra anche le chiavi trovate che esistono
 *   --ignore-patterns    Pattern di chiavi da ignorare (regex, separati da virgola)
 *   --include <dir>      Directory aggiuntive da scansionare (separato da virgola)
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
const localePath = getArgValue("--locale") ?? "app/i18n/locales/en.json";
const extraDirs = getArgValue("--include")?.split(",").filter(Boolean) ?? [];
const ignorePatternsRaw = getArgValue("--ignore-patterns");

const ignorePatterns = ignorePatternsRaw
  ? ignorePatternsRaw
      .split(",")
      .filter(Boolean)
      .map((p) => new RegExp(p.trim()))
  : [];

const EN_JSON_PATH = path.resolve(ROOT_DIR, localePath);
const DEFAULT_SCAN_DIRS = ["app", "main.ts", ...extraDirs];

// ---------------------------------------------------------------------------
// Raccolta file
// ---------------------------------------------------------------------------

function collectFiles(dir, acc = []) {
  const full = path.resolve(ROOT_DIR, dir);
  if (!fs.existsSync(full)) return acc;

  const stat = fs.statSync(full);

  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.has(path.extname(full))) acc.push(full);
    return acc;
  }

  for (const entry of fs.readdirSync(full)) {
    if (EXCLUDED_DIRS.has(entry)) continue;

    const childPath = path.join(full, entry);
    const childStat = fs.statSync(childPath);

    if (childStat.isDirectory()) {
      collectFiles(path.relative(ROOT_DIR, childPath), acc);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry))) {
      acc.push(childPath);
    }
  }

  return acc;
}

// ---------------------------------------------------------------------------
// Estrazione chiavi JSON (foglie)
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

/**
 * Estrae anche le chiavi intermedie (nodi non-foglia) per gestire
 * casi dove t() potrebbe ricevere un nodo intermedio.
 */
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

/**
 * @typedef {{ key: string, line: number, column: number, context: string }} TCall
 */

/**
 * Rimuove tutti i commenti dal codice sorgente, sostituendoli con spazi
 * per preservare le posizioni dei caratteri (e quindi il mapping riga/colonna).
 *
 * Gestisce:
 *   - Commenti blocco (anche multi-riga)
 *   - Commenti inline //
 *   - Non tocca stringhe che contengono // o sequenze simili
 *
 * @param {string} content
 * @returns {string} Contenuto con commenti sostituiti da spazi
 */
function stripComments(content) {
  const result = [];
  let i = 0;
  const len = content.length;

  while (i < len) {
    const ch = content[i];

    // Stringhe: salta l'intero contenuto (non rimuovere nulla)
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      result.push(ch);
      i++;
      while (i < len) {
        const c = content[i];
        result.push(c);
        if (c === "\\" && i + 1 < len) {
          // Carattere escaped: copia e salta
          i++;
          result.push(content[i]);
        } else if (c === quote && quote !== "`") {
          break;
        } else if (c === quote) {
          // Backtick: chiude template literal (ignoriamo ${} annidati per semplicita)
          break;
        }
        i++;
      }
      i++;
      continue;
    }

    // Commento blocco
    if (ch === "/" && i + 1 < len && content[i + 1] === "*") {
      // Sostituisci con spazi, ma mantieni i newline
      result.push(" ", " ");
      i += 2;
      while (i < len) {
        if (content[i] === "*" && i + 1 < len && content[i + 1] === "/") {
          result.push(" ", " ");
          i += 2;
          break;
        }
        // Preserva newline per il mapping riga
        result.push(content[i] === "\n" ? "\n" : " ");
        i++;
      }
      continue;
    }

    // Commento inline
    if (ch === "/" && i + 1 < len && content[i + 1] === "/") {
      // Sostituisci fino a fine riga
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

/**
 * Data una posizione (offset) nel contenuto, restituisce riga e colonna (1-based).
 *
 * @param {number[]} lineStarts - Array di offset di inizio riga
 * @param {number} offset
 * @returns {{ line: number, column: number }}
 */
function offsetToLineCol(lineStarts, offset) {
  // Binary search per trovare la riga
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

/**
 * Costruisce un array di offset di inizio per ogni riga.
 *
 * @param {string} content
 * @returns {number[]}
 */
function buildLineStarts(content) {
  const starts = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === "\n") {
      starts.push(i + 1);
    }
  }
  return starts;
}

/**
 * Estrae tutte le chiamate t("key") e t('key') da un file.
 *
 * Funziona sull'intero contenuto (non riga per riga) per catturare
 * chiamate multi-riga come:
 *   t("modal.notices.auditConfirmRename", {
 *     oldName,
 *     newName,
 *   })
 * oppure:
 *   t(
 *     "modal.notices.auditConfirmRename",
 *     { oldName, newName }
 *   )
 *
 * @param {string} content - Contenuto del file
 * @param {string} filePath - Percorso del file (per esclusioni)
 * @returns {TCall[]}
 */
function extractTCalls(content, filePath) {
  const calls = [];

  // 1. Rimuovi commenti (preservando posizioni con spazi)
  const stripped = stripComments(content);

  // 2. Prepara mapping offset -> riga/colonna (sul contenuto originale)
  const lineStarts = buildLineStarts(content);
  const originalLines = content.split("\n");

  // 3. Cerca tutte le chiamate t() nel contenuto senza commenti
  //    Il pattern e' multiline-aware grazie al flag 's' (dotAll) e [\s\S]*
  //    Cattura: t( opzionali-spazi/newline "chiave.con.punti" opzionali-spazi/newline , o )
  const regex = /(?<![.\w])t\(\s*["']([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)["']\s*[,)]/g;
  let match;

  while ((match = regex.exec(stripped)) !== null) {
    const key = match[1];

    // Chiavi senza punto sono probabilmente non-i18n
    if (!key.includes(".")) continue;

    // Calcola riga e colonna della chiamata t(
    const { line, column } = offsetToLineCol(lineStarts, match.index);

    // Contesto: la riga originale dove inizia la chiamata t(
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

/**
 * @typedef {{
 *   key: string,
 *   file: string,
 *   line: number,
 *   column: number,
 *   context: string
 * }} MissingKeyReference
 */

/**
 * Analizza tutti i file e trova le chiavi mancanti.
 *
 * @param {string[]} files
 * @param {Set<string>} validKeys - Chiavi foglia esistenti in en.json
 * @param {Set<string>} allJsonKeys - Tutte le chiavi (incluse intermedie)
 * @returns {{ missing: MissingKeyReference[], valid: MissingKeyReference[], totalCalls: number }}
 */
function analyze(files, validKeys, allJsonKeys) {
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
      // Controlla se la chiave e' nei pattern da ignorare
      if (ignorePatterns.some((p) => p.test(call.key))) continue;

      const ref = {
        key: call.key,
        file: path.relative(ROOT_DIR, filePath),
        line: call.line,
        column: call.column,
        context: call.context,
      };

      if (validKeys.has(call.key)) {
        valid.push(ref);
      } else if (allJsonKeys.has(call.key)) {
        // La chiave esiste ma e' un nodo intermedio, non una foglia
        // Questo e' probabilmente un errore - t() dovrebbe ricevere chiavi foglia
        missing.push({
          ...ref,
          note: "Chiave intermedia (nodo, non foglia) - t() si aspetta una chiave foglia",
        });
      } else {
        missing.push(ref);
      }
    }
  }

  return { missing, valid, totalCalls };
}

// ---------------------------------------------------------------------------
// Output: Testo
// ---------------------------------------------------------------------------

function printTextReport(result, totalFiles) {
  const { missing, valid, totalCalls } = result;

  console.log(
    "\n" +
    "+" + "-".repeat(62) + "+" + "\n" +
    "|         FIND MISSING i18n KEYS - Codebase Analyzer          |" + "\n" +
    "+" + "-".repeat(62) + "+"
  );

  console.log(`\n  File scansionati:      ${totalFiles}`);
  console.log(`  Chiamate t() trovate:  ${totalCalls}`);
  console.log(`  Chiavi valide:         ${valid.length}`);
  console.log(`  Chiavi MANCANTI:       ${missing.length}`);

  if (missing.length === 0) {
    console.log("\n  Tutte le chiavi i18n referenziate esistono in en.json!");
    console.log("+" + "-".repeat(62) + "+\n");
    return;
  }

  // Raggruppa per file
  /** @type {Map<string, MissingKeyReference[]>} */
  const byFile = new Map();
  for (const ref of missing) {
    if (!byFile.has(ref.file)) byFile.set(ref.file, []);
    byFile.get(ref.file).push(ref);
  }

  // Raggruppa per chiave (per il riepilogo)
  /** @type {Map<string, MissingKeyReference[]>} */
  const byKey = new Map();
  for (const ref of missing) {
    if (!byKey.has(ref.key)) byKey.set(ref.key, []);
    byKey.get(ref.key).push(ref);
  }

  // --- Sezione 1: Dettaglio per file ---
  console.log("\n" + "-".repeat(64));
  console.log("  CHIAVI MANCANTI PER FILE");
  console.log("-".repeat(64));

  const sortedFiles = [...byFile.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  for (const [file, refs] of sortedFiles) {
    console.log(`\n  ${file} (${refs.length} chiavi mancanti)`);
    for (const ref of refs.sort((a, b) => a.line - b.line)) {
      console.log(`    L${ref.line}:${ref.column}  ${ref.key}`);
      if (ref.note) {
        console.log(`             ^ ${ref.note}`);
      }
    }
  }

  // --- Sezione 2: Chiavi uniche mancanti ---
  console.log("\n" + "-".repeat(64));
  console.log("  CHIAVI UNICHE MANCANTI (ordinate)");
  console.log("-".repeat(64));

  // Raggruppa per sezione radice
  /** @type {Map<string, Array<{key: string, count: number}>>} */
  const bySection = new Map();
  for (const [key, refs] of [...byKey.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const section = key.split(".")[0];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ key, count: refs.length });
  }

  for (const [section, keys] of [...bySection.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`\n  [${section}] (${keys.length} chiavi)`);
    for (const { key, count } of keys) {
      const countStr = count > 1 ? ` (x${count})` : "";
      console.log(`    - ${key}${countStr}`);
    }
  }

  // --- Verbose: chiavi valide ---
  if (verbose) {
    console.log("\n" + "-".repeat(64));
    console.log("  CHIAVI VALIDE TROVATE");
    console.log("-".repeat(64));
    const uniqueValid = [...new Set(valid.map((r) => r.key))].sort();
    for (const key of uniqueValid) {
      console.log(`    ${key}`);
    }
  }

  // --- Riepilogo ---
  console.log("\n" + "=".repeat(64));
  console.log(
    `  Riepilogo: ${byKey.size} chiavi uniche mancanti, ${missing.length} riferimenti totali`,
  );
  console.log(`  in ${byFile.size} file su ${totalFiles} scansionati`);
  console.log("=".repeat(64) + "\n");
}

// ---------------------------------------------------------------------------
// Output: JSON
// ---------------------------------------------------------------------------

function buildJsonReport(result, totalFiles) {
  const { missing, valid, totalCalls } = result;

  const uniqueMissing = [...new Set(missing.map((r) => r.key))].sort();

  /** @type {Record<string, Array<{file: string, line: number, column: number}>>} */
  const missingByKey = {};
  for (const ref of missing) {
    if (!missingByKey[ref.key]) missingByKey[ref.key] = [];
    missingByKey[ref.key].push({
      file: ref.file,
      line: ref.line,
      column: ref.column,
      ...(ref.note ? { note: ref.note } : {}),
    });
  }

  return {
    summary: {
      totalFiles,
      totalTCalls: totalCalls,
      validKeys: valid.length,
      missingReferences: missing.length,
      uniqueMissingKeys: uniqueMissing.length,
    },
    missingKeys: missingByKey,
    ...(verbose
      ? { validKeys: [...new Set(valid.map((r) => r.key))].sort() }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Leggi en.json
  if (!fs.existsSync(EN_JSON_PATH)) {
    console.error(`File non trovato: ${EN_JSON_PATH}`);
    process.exit(2);
  }

  const enJson = JSON.parse(fs.readFileSync(EN_JSON_PATH, "utf-8"));
  const leafKeys = extractLeafKeys(enJson);
  const allJsonKeys = extractAllKeys(enJson);

  // 2. Raccogli file sorgente
  const files = [];
  for (const dir of DEFAULT_SCAN_DIRS) {
    collectFiles(dir, files);
  }

  // Escludi questo script
  const selfPath = path.resolve(__filename);
  const filteredFiles = files.filter((f) => path.resolve(f) !== selfPath);

  // Escludi file .test.ts e __tests__ per ridurre rumore (opzionale)
  // I test possono usare chiavi inesistenti per motivi di mock
  const skipTests = args.includes("--skip-tests");
  const finalFiles = skipTests
    ? filteredFiles.filter(
        (f) => !f.includes("__tests__") && !f.endsWith(".test.ts"),
      )
    : filteredFiles;

  // 3. Analizza
  const result = analyze(finalFiles, leafKeys, allJsonKeys);

  // 4. Output
  if (outputJson) {
    const report = buildJsonReport(result, finalFiles.length);
    const jsonStr = JSON.stringify(report, null, 2);

    if (outputFile) {
      fs.writeFileSync(path.resolve(ROOT_DIR, outputFile), jsonStr, "utf-8");
      console.log(`Report salvato in: ${outputFile}`);
    } else {
      console.log(jsonStr);
    }
  } else {
    printTextReport(result, finalFiles.length);

    if (outputFile) {
      const report = buildJsonReport(result, finalFiles.length);
      fs.writeFileSync(
        path.resolve(ROOT_DIR, outputFile),
        JSON.stringify(report, null, 2),
        "utf-8",
      );
      console.log(`Report JSON salvato in: ${outputFile}`);
    }
  }

  // Exit code 1 se ci sono chiavi mancanti (utile in CI)
  process.exit(result.missing.length > 0 ? 1 : 0);
}

main();
