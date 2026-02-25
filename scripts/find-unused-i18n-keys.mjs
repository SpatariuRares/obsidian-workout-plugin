#!/usr/bin/env node

/**
 * find-unused-i18n-keys.mjs
 *
 * Scansiona tutta la codebase TypeScript/JavaScript alla ricerca di chiavi i18n
 * non utilizzate definite in en.json.
 *
 * Strategia di rilevamento:
 *  1. Estrae tutte le chiavi foglia dal JSON in notazione dot-path (es. "modal.titles.createLog")
 *  2. Scansiona ogni file .ts / .tsx / .js / .mjs nella cartella /app e radice
 *  3. Cerca occorrenze di ogni chiave come stringa letterale (es. t("modal.titles.createLog"))
 *     oppure come accesso dinamico parziale
 *  4. Rapporta le chiavi presenti nel JSON ma mai trovate nel codice
 *
 * Uso:
 *   node scripts/find-unused-i18n-keys.mjs [--json] [--output report.json]
 *
 * Flag:
 *   --json          Output in formato JSON invece di testo
 *   --output <file> Salva il report su file
 *   --locale <file> Percorso alternativo al file JSON (default: app/i18n/locales/en.json)
 *   --include <dir> Directory aggiuntive da scansionare (separato da virgola)
 *   --verbose       Stampa anche le chiavi usate
 *   --fix           Rimuove le chiavi non usate da en.json (e da tutti i locales se --sync-locales)
 *   --dry-run       Mostra cosa verrebbe rimosso senza modificare i file (da usare con --fix)
 *   --sync-locales  Applica la stessa pulizia a tutti i file nella cartella locales/
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

/** Estensioni dei file da analizzare */
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);

/** Directory da escludere sempre */
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".obsidian",
]);

// ---------------------------------------------------------------------------
// Parsing degli argomenti CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 ? (args[idx + 1] ?? null) : null;
}

const outputJson = args.includes("--json");
const verbose = args.includes("--verbose");
const fixMode = args.includes("--fix");
const dryRun = args.includes("--dry-run");
const syncLocales = args.includes("--sync-locales");
const outputFile = getArgValue("--output");
const localePath = getArgValue("--locale") ?? "app/i18n/locales/en.json";
const extraDirs = getArgValue("--include")?.split(",").filter(Boolean) ?? [];

const EN_JSON_PATH = path.resolve(ROOT_DIR, localePath);

/** Directory di scansione di default */
const DEFAULT_SCAN_DIRS = ["app", "main.ts", ...extraDirs];

// ---------------------------------------------------------------------------
// Utilità: lettura ricorsiva dei file
// ---------------------------------------------------------------------------

/**
 * Restituisce tutti i file con le estensioni richieste sotto `dir`.
 * @param {string} dir
 * @param {string[]} acc
 * @returns {string[]}
 */
function collectFiles(dir, acc = []) {
  const full = path.resolve(ROOT_DIR, dir);

  if (!fs.existsSync(full)) return acc;

  const stat = fs.statSync(full);

  // Gestisce sia un singolo file che una directory
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
// Utilità: estrazione chiavi JSON
// ---------------------------------------------------------------------------

/**
 * Visita ricorsivamente `obj` e accumula tutti i percorsi foglia in dot-notation.
 *
 * Perché solo le foglie?
 * La funzione t() riceve sempre chiavi complete ("modal.titles.createLog"), mai
 * chiavi intermedie ("modal.titles"). Le chiavi intermedie quindi NON vanno mai
 * cercate nel codice sorgente.
 *
 * @param {unknown} obj
 * @param {string} prefix
 * @param {Map<string, string>} result  key -> valore stringa
 * @returns {Map<string, string>}
 */
function extractLeafKeys(obj, prefix = "", result = new Map()) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    // È una foglia
    result.set(prefix, String(obj));
    return result;
  }

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    extractLeafKeys(v, fullKey, result);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Utilità: ricerca chiavi nel sorgente
// ---------------------------------------------------------------------------

/**
 * Costruisce un set di "frammenti" cercabili per una data chiave.
 *
 * Oltre alla chiave completa ("modal.titles.createLog"), includiamo:
 * - Ogni segmento individuale ("createLog", "titles", "modal") — per catturare
 *   accessi dinamici tipo `t(\`modal.${sub}\`)` o template literal.
 *
 * NOTA: questo può generare falsi negativi (chiave segnata come "usata" perché
 * un segmento omonimo appare in un altro contesto). Per ridurre il rumore,
 * cerchiamo il segmento solo se ha lunghezza >= 4 caratteri.
 *
 * @param {string} key  Es. "modal.titles.createLog"
 * @returns {string[]}
 */
function searchFragments(key) {
  const parts = key.split(".");
  const fragments = [key]; // chiave completa sempre inclusa

  // Aggiungi l'ultimo segmento come frammento (es. "createLog")
  const lastName = parts[parts.length - 1];
  if (lastName.length >= 4) {
    fragments.push(lastName);
  }

  // Sotto-percorsi di almeno 2 segmenti (es. "titles.createLog")
  for (let start = 1; start < parts.length; start++) {
    const sub = parts.slice(start).join(".");
    if (sub.length >= 5 && !fragments.includes(sub)) {
      fragments.push(sub);
    }
  }

  return fragments;
}

/**
 * Verifica se `content` contiene almeno uno dei `fragments` come stringa
 * letterale racchiusa tra delimitatori stringa (", ', `).
 *
 * @param {string} content
 * @param {string[]} fragments
 * @returns {boolean}
 */
function isKeyUsedInContent(content, fragments) {
  for (const fragment of fragments) {
    // Cerca il frammento delimitato da quotes o backtick
    // Usiamo una regex semplice ma efficace
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // \x60 = backtick character — cannot nest backtick inside a template literal
    const pattern = new RegExp("['\"\x60]" + escaped + "['\"\x60]");
    if (pattern.test(content)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Core: analisi della codebase
// ---------------------------------------------------------------------------

/**
 * @typedef {{ key: string, value: string, usedIn: string[] }} UsedKey
 * @typedef {{ key: string, value: string }} UnusedKey
 */

/**
 * @param {string[]} files
 * @param {Map<string, string>} allKeys
 * @returns {{ used: Map<string, string[]>, unused: Map<string, string> }}
 */
function analyzeUsage(files, allKeys) {
  // Pre-carica tutti i file in memoria (evita letture multiple per chiave)
  /** @type {Map<string, string>} */
  const fileContents = new Map();
  for (const filePath of files) {
    try {
      fileContents.set(filePath, fs.readFileSync(filePath, "utf-8"));
    } catch {
      // File non leggibile: skip silenzioso
    }
  }

  /** @type {Map<string, string[]>} key -> lista file che la usano */
  const used = new Map();
  /** @type {Map<string, string>} key -> valore */
  const unused = new Map();

  for (const [key, value] of allKeys) {
    const fragments = searchFragments(key);
    /** @type {string[]} */
    const usedIn = [];

    for (const [filePath, content] of fileContents) {
      if (isKeyUsedInContent(content, fragments)) {
        usedIn.push(path.relative(ROOT_DIR, filePath));
      }
    }

    if (usedIn.length > 0) {
      used.set(key, usedIn);
    } else {
      unused.set(key, value);
    }
  }

  return { used, unused };
}

// ---------------------------------------------------------------------------
// Fix: rimozione chiavi non usate dal JSON
// ---------------------------------------------------------------------------

/**
 * Elimina dal JSON tutte le chiavi in `unusedKeys` (dot-notation) e
 * rimuove i nodi intermedi rimasti vuoti.
 *
 * @param {object} json  Oggetto JSON originale (NON mutato)
 * @param {Map<string, string>} unusedKeys
 * @returns {object} Nuovo oggetto JSON senza le chiavi non usate
 */
function removeUnusedKeys(json, unusedKeys) {
  // Deep-clone per non mutare l'originale
  const clone = JSON.parse(JSON.stringify(json));

  for (const key of unusedKeys.keys()) {
    const parts = key.split(".");
    deleteNestedKey(clone, parts);
  }

  // Secondo passaggio: rimuovi i nodi vuoti risultanti
  pruneEmptyNodes(clone);

  return clone;
}

/**
 * Naviga `obj` seguendo `parts` ed elimina la chiave foglia.
 *
 * @param {object} obj
 * @param {string[]} parts
 */
function deleteNestedKey(obj, parts) {
  if (parts.length === 0 || typeof obj !== "object" || obj === null) return;

  const [head, ...tail] = parts;

  if (tail.length === 0) {
    delete obj[head];
  } else if (head in obj) {
    deleteNestedKey(obj[head], tail);
  }
}

/**
 * Rimuove ricorsivamente tutte le proprietà di tipo oggetto vuoto.
 *
 * @param {object} obj
 * @returns {boolean} true se `obj` è diventato vuoto dopo la pulizia
 */
function pruneEmptyNodes(obj) {
  if (typeof obj !== "object" || obj === null) return false;

  for (const key of Object.keys(obj)) {
    const child = obj[key];
    if (typeof child === "object" && child !== null && !Array.isArray(child)) {
      const isEmpty = pruneEmptyNodes(child);
      if (isEmpty) delete obj[key];
    }
  }

  return Object.keys(obj).length === 0;
}

/**
 * Applica la pulizia a un file di locale generico:
 * mantiene solo le chiavi presenti nel JSON di riferimento ripulito.
 *
 * @param {string} localePath  Percorso assoluto al file da sincronizzare
 * @param {Set<string>} validKeys  Set di dot-path da mantenere
 */
function syncLocaleFile(localePath, validKeys) {
  if (!fs.existsSync(localePath)) return;

  const raw = JSON.parse(fs.readFileSync(localePath, "utf-8"));
  const cleaned = filterByKeys(raw, "", validKeys);
  pruneEmptyNodes(cleaned);

  if (!dryRun) {
    fs.writeFileSync(
      localePath,
      JSON.stringify(cleaned, null, 2) + "\n",
      "utf-8",
    );
  }
  console.log(
    `  ${dryRun ? "[dry-run] " : ""}🌍 ${path.basename(localePath)} sincronizzato`,
  );
}

/**
 * Ricostruisce `obj` mantenendo solo le foglie il cui percorso è in `validKeys`.
 *
 * @param {unknown} obj
 * @param {string} prefix
 * @param {Set<string>} validKeys
 * @returns {unknown}
 */
function filterByKeys(obj, prefix, validKeys) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return validKeys.has(prefix) ? obj : undefined;
  }

  /** @type {Record<string, unknown>} */
  const result = {};
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    const child = filterByKeys(v, fullKey, validKeys);
    if (child !== undefined) result[k] = child;
  }
  return result;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/**
 * Stampa il report in formato testo leggibile.
 *
 * @param {{ used: Map<string, string[]>, unused: Map<string, string> }} result
 * @param {number} totalFiles
 * @param {number} totalKeys
 */
function printTextReport(result, totalFiles, totalKeys) {
  const { used, unused } = result;
  const unusedCount = unused.size;
  const usedCount = used.size;

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          🔍  i18n Unused Keys Analyzer                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`📁 File scansionati:   ${totalFiles}`);
  console.log(`🗝️  Chiavi totali JSON: ${totalKeys}`);
  console.log(`✅ Chiavi usate:       ${usedCount}`);
  console.log(`❌ Chiavi NON usate:   ${unusedCount}\n`);

  if (unusedCount === 0) {
    console.log("🎉 Nessuna chiave inutilizzata trovata!");
    return;
  }

  console.log("─".repeat(60));
  console.log("  CHIAVI NON UTILIZZATE");
  console.log("─".repeat(60));

  // Raggruppa per sezione radice per leggibilità
  /** @type {Map<string, Array<{key: string, value: string}>>} */
  const bySection = new Map();
  for (const [key, value] of unused) {
    const section = key.split(".")[0];
    if (!bySection.has(section)) bySection.set(section, []);
    bySection.get(section).push({ key, value });
  }

  for (const [section, keys] of [...bySection].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(`\n  📂 ${section} (${keys.length})`);
    for (const { key, value } of keys.sort((a, b) =>
      a.key.localeCompare(b.key),
    )) {
      const preview = String(value).slice(0, 50);
      const ellipsis = String(value).length > 50 ? "…" : "";
      console.log(`     ⚠️  ${key}`);
      console.log(`         └─ "${preview}${ellipsis}"`);
    }
  }

  if (verbose) {
    console.log("\n" + "─".repeat(60));
    console.log("  CHIAVI UTILIZZATE");
    console.log("─".repeat(60));
    for (const [key, files] of [...used].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      console.log(`\n  ✅ ${key}`);
      files.forEach((f) => console.log(`     └─ ${f}`));
    }
  }

  console.log("\n" + "═".repeat(60));
  console.log(
    `  Riepilogo: ${unusedCount} chiavi non usate su ${totalKeys} totali` +
      ` (${((unusedCount / totalKeys) * 100).toFixed(1)}%)`,
  );
  console.log("═".repeat(60));
}

/**
 * Restituisce la struttura dati per il report JSON.
 *
 * @param {{ used: Map<string, string[]>, unused: Map<string, string> }} result
 * @param {number} totalFiles
 * @param {number} totalKeys
 * @returns {object}
 */
function buildJsonReport(result, totalFiles, totalKeys) {
  const { used, unused } = result;
  return {
    summary: {
      totalFiles,
      totalKeys,
      usedKeys: used.size,
      unusedKeys: unused.size,
      unusedPercentage: parseFloat(
        ((unused.size / totalKeys) * 100).toFixed(2),
      ),
    },
    unusedKeys: Object.fromEntries(
      [...unused].sort((a, b) => a[0].localeCompare(b[0])),
    ),
    ...(verbose
      ? {
          usedKeys: Object.fromEntries(
            [...used].sort((a, b) => a[0].localeCompare(b[0])),
          ),
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Leggi en.json
  if (!fs.existsSync(EN_JSON_PATH)) {
    console.error(`❌ File non trovato: ${EN_JSON_PATH}`);
    process.exit(2);
  }

  const enJson = JSON.parse(fs.readFileSync(EN_JSON_PATH, "utf-8"));
  const allKeys = extractLeafKeys(enJson);

  // 2. Raccogli file sorgente
  /** @type {string[]} */
  const files = [];
  for (const dir of DEFAULT_SCAN_DIRS) {
    collectFiles(dir, files);
  }

  // Escludi lo script stesso
  const selfPath = path.resolve(__filename);
  const filteredFiles = files.filter((f) => path.resolve(f) !== selfPath);

  // 3. Analizza
  const result = analyzeUsage(filteredFiles, allKeys);

  // 4. Output report (sempre stampato, anche in fix mode)
  if (outputJson) {
    const report = buildJsonReport(result, filteredFiles.length, allKeys.size);
    const jsonStr = JSON.stringify(report, null, 2);

    if (outputFile) {
      fs.writeFileSync(path.resolve(ROOT_DIR, outputFile), jsonStr, "utf-8");
      console.log(`✅ Report salvato in: ${outputFile}`);
    } else {
      console.log(jsonStr);
    }
  } else {
    printTextReport(result, filteredFiles.length, allKeys.size);

    if (outputFile) {
      const report = buildJsonReport(
        result,
        filteredFiles.length,
        allKeys.size,
      );
      fs.writeFileSync(
        path.resolve(ROOT_DIR, outputFile),
        JSON.stringify(report, null, 2),
        "utf-8",
      );
      console.log(`\n💾 Report JSON salvato in: ${outputFile}`);
    }
  }

  // 5. Fix mode: rimuovi le chiavi non usate dal JSON
  if (fixMode && result.unused.size > 0) {
    console.log("\n" + "─".repeat(60));
    if (dryRun) {
      console.log("  🔍 DRY RUN — nessun file verrà modificato");
    } else {
      console.log("  🔧 FIX — rimozione chiavi non usate...");
    }
    console.log("─".repeat(60));

    // Costruisci il JSON ripulito
    const cleanedJson = removeUnusedKeys(enJson, result.unused);
    const cleanedStr = JSON.stringify(cleanedJson, null, 2) + "\n";

    if (!dryRun) {
      fs.writeFileSync(EN_JSON_PATH, cleanedStr, "utf-8");
      console.log(`\n  ✅ ${path.relative(ROOT_DIR, EN_JSON_PATH)} aggiornato`);
      console.log(`     Rimosse ${result.unused.size} chiavi non usate`);
    } else {
      console.log(
        `\n  [dry-run] Verrebbero rimosse ${result.unused.size} chiavi da ${path.relative(ROOT_DIR, EN_JSON_PATH)}`,
      );
    }

    // Sincronizza gli altri file locale se richiesto
    if (syncLocales) {
      const localesDir = path.dirname(EN_JSON_PATH);
      const enBasename = path.basename(EN_JSON_PATH);
      const validKeys = new Set(extractLeafKeys(cleanedJson).keys());

      console.log("\n  Sincronizzazione altri file locales...");
      for (const entry of fs.readdirSync(localesDir)) {
        if (entry === enBasename || !entry.endsWith(".json")) continue;
        syncLocaleFile(path.join(localesDir, entry), validKeys);
      }
    }

    console.log("\n" + "═".repeat(60));
    if (!dryRun) console.log("  ✅ Fix completato!");
    else console.log("  ℹ️  Nessuna modifica applicata (--dry-run)");
    console.log("═".repeat(60));

    process.exit(0);
  }

  // Exit code 1 se ci sono chiavi non usate (utile in CI)
  process.exit(result.unused.size > 0 ? 1 : 0);
}

main();
