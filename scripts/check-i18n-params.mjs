#!/usr/bin/env node

/**
 * check-i18n-params.mjs
 *
 * Analizza tutta la codebase TypeScript/JavaScript e verifica che:
 *  1. Le chiavi i18n con placeholder {param} vengano chiamate con i parametri corretti
 *  2. Le chiamate t("key", { ... }) non passino parametri in eccesso o mancanti
 *  3. Le chiavi con placeholder NON vengano chiamate senza passare i parametri
 *
 * Strategia:
 *  - Estrae tutte le chiavi foglia da en.json con i loro placeholder {param}
 *  - Scansiona ogni file .ts/.tsx/.js/.mjs cercando chiamate t("...") o t('...')
 *  - Per ogni chiamata trovata, controlla la coerenza tra placeholder attesi e params passati
 *
 * Uso:
 *   node scripts/check-i18n-params.mjs [--json] [--output report.json] [--verbose]
 *
 * Flag:
 *   --json          Output in formato JSON invece di testo
 *   --output <file> Salva il report su file
 *   --locale <file> Percorso alternativo al file JSON (default: app/i18n/locales/en.json)
 *   --include <dir> Directory aggiuntive da scansionare (separato da virgola)
 *   --verbose       Mostra anche le chiamate corrette
 *   --strict        Errore su parametri extra (non solo mancanti)
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
  "scripts", // Evita che lo script analizzi se stesso
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
const strictMode = args.includes("--strict");
const outputFile = getArgValue("--output");
const localePath = getArgValue("--locale") ?? "app/i18n/locales/en.json";
const extraDirs = getArgValue("--include")?.split(",").filter(Boolean) ?? [];

const EN_JSON_PATH = path.resolve(ROOT_DIR, localePath);

/** Directory di scansione di default */
const DEFAULT_SCAN_DIRS = ["app", "main.ts", ...extraDirs];

// ---------------------------------------------------------------------------
// Tipi (JSDoc)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TranslationKey
 * @property {string} key           - Chiave dot-notation (es. "modal.labels.weight")
 * @property {string} value         - Valore stringa della traduzione
 * @property {string[]} placeholders - Nomi dei placeholder {param} estratti dal valore
 */

/**
 * @typedef {Object} CallSite
 * @property {string} key         - Chiave i18n usata nella chiamata
 * @property {string[]} params    - Nomi dei parametri passati alla chiamata t()
 * @property {boolean} hasParams  - Se la chiamata include un oggetto params
 * @property {number} line        - Numero di riga nel file
 * @property {string} file        - Path relativo del file
 * @property {string} rawSnippet  - Snippet grezzo della chiamata (per debug)
 */

/**
 * @typedef {Object} Issue
 * @property {'missing_params' | 'extra_params' | 'missing_all_params' | 'params_on_no_placeholder'} type
 * @property {string} key
 * @property {string} file
 * @property {number} line
 * @property {string[]} expected    - Placeholder attesi dalla traduzione
 * @property {string[]} actual      - Parametri passati nella chiamata
 * @property {string[]} missing     - Placeholder mancanti nella chiamata
 * @property {string[]} extra       - Parametri sovrannumerari nella chiamata
 * @property {string} rawSnippet
 */

// ---------------------------------------------------------------------------
// Utilità: raccolta file
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
// Utilità: estrazione chiavi e placeholder dal JSON
// ---------------------------------------------------------------------------

/**
 * Estrae i placeholder {nome} da una stringa di traduzione.
 * Ritorna un array deduplicato di nomi di placeholder.
 *
 * @param {string} value
 * @returns {string[]}
 *
 * @example
 * extractPlaceholders("Weight ({unit}):") // ["unit"]
 * extractPlaceholders("Hello {name}, you have {count} items") // ["name", "count"]
 */
function extractPlaceholders(value) {
  const matches = [...value.matchAll(/\{(\w+)\}/g)];
  // Deduplication: un placeholder può ripetersi più volte nella stringa
  return [...new Set(matches.map((m) => m[1]))];
}

/**
 * Visita ricorsivamente `obj` e accumula tutte le chiavi foglia con i loro placeholder.
 *
 * @param {unknown} obj
 * @param {string} prefix
 * @param {Map<string, TranslationKey>} result
 * @returns {Map<string, TranslationKey>}
 */
function extractLeafKeys(obj, prefix = "", result = new Map()) {
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    const value = String(obj);
    const placeholders = extractPlaceholders(value);
    result.set(prefix, { key: prefix, value, placeholders });
    return result;
  }

  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    extractLeafKeys(v, fullKey, result);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Utilità: estrazione chiamate t() dal sorgente
// ---------------------------------------------------------------------------

/**
 * Estrattore di chiamate t("key") e t("key", { ... }) da un file sorgente.
 *
 * Strategia multiriga:
 *  - Cerca la firma `t(` seguita da una stringa letterale (', ", `)
 *  - Captura la chiave
 *  - Controlla se c'è un secondo argomento con oggetto { k: ... }
 *  - Estrae i nomi delle proprietà dell'oggetto params
 *
 * Limitazioni note (documentate come falsi negativi accettabili):
 *  - Chiavi costruite dinamicamente (es. `t(\`modal.${sub}\`)`)
 *  - Params costruiti dinamicamente (es. `t(key, myParams)`)
 *  - Chiamate spalmate su più righe in modo non convenzionale
 *
 * @param {string} content   - Contenuto del file sorgente
 * @param {string} filePath  - Path relativo del file (per il report)
 * @returns {CallSite[]}
 */
/**
 * Rimuove commenti single-line (//), multi-line (/* *\/) e JSDoc (/** *\/)
 * dal contenuto sorgente, preservando i numeri di riga (sostituisce ogni
 * riga di commento con una riga vuota della stessa lunghezza).
 *
 * Perché è necessario:
 * Il parser regex non distingue tra codice reale e commenti. Senza questo
 * step, le chiamate t() nei commenti JSDoc @example vengono erroneamente
 * analizzate come chiamate reali — producendo falsi positivi.
 *
 * @param {string} content
 * @returns {string}
 */
function stripComments(content) {
  // Sostituisce blocchi /* ... */ e /** ... */ preservando i newline
  // (ogni carattere non-newline viene sostituito con uno spazio)
  let result = content.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );

  // Rimuove commenti single-line // ... fino a fine riga
  result = result.replace(/\/\/[^\n]*/g, (match) => " ".repeat(match.length));

  return result;
}

function extractCallSites(content, filePath) {
  /** @type {CallSite[]} */
  const results = [];

  // Rimuovi i commenti prima di cercare le chiamate t()
  // Questo evita falsi positivi da esempi in JSDoc o commenti inline
  const strippedContent = stripComments(content);

  // Calcola il numero di riga data la posizione nel contenuto
  const lineOf = (pos) => content.slice(0, pos).split("\n").length;

  /**
   * Pattern per catturare chiamate t("key") o t('key') o t(`key`).
   * Gruppo 1: delimitatore stringa (', ", `)
   * Gruppo 2: contenuto della stringa chiave
   *
   * NOTE: template literals dinamici come t(`modal.${x}`) vengono
   * catturati ma la chiave risultante conterrà ${x} — li filtriamo.
   */
  const tCallPattern = /\bt\(\s*(['"`])((?:[^'"`\\]|\\.)*?)\1([\s\S]*?)\)/g;

  let match;
  // Esegui la ricerca sul contenuto senza commenti per evitare falsi positivi
  // (es. t() dentro JSDoc @example, commenti inline, ecc.)
  while ((match = tCallPattern.exec(strippedContent)) !== null) {
    const [fullMatch, , key, rest] = match;
    const startPos = match.index;

    // Salta le chiamate con chiavi dinamiche (template literals con ${ })
    if (key.includes("${")) continue;

    // Salta le chiavi vuote o che non sembrano path i18n validi
    if (!key || key.length < 2) continue;

    // Salta le key che non hanno almeno un punto (probabilmente non sono i18n)
    // Esempio: t('en') o t('fr') — skip. t('modal.titles.create') — ok.
    // Eccezione: alcune chiavi root valide potrebbero essere senza punto.
    // Usiamo una euristica: skip se < 5 caratteri e nessun punto.
    if (!key.includes(".") && key.length < 5) continue;

    const line = lineOf(startPos);

    // Determina se c'è un secondo argomento (oggetto params)
    // `rest` è il testo dopo il primo argomento stringa, fino alla ")"
    // Cerca un pattern {  key: value, ... } nel resto della chiamata

    // Prima, estraiamo il secondo argomento più accuratamente:
    // dopo la chiusura della stringa (delimitatore), il prossimo token
    // significativo potrebbe essere "," (c'è un secondo arg) o ")" (nessun arg)

    const trimmedRest = rest.trimStart();
    const hasSecondArg = trimmedRest.startsWith(",");

    let params = [];
    let hasParams = false;

    if (hasSecondArg) {
      // Estrai i nomi delle proprietà dell'oggetto params
      // Cerchiamo pattern come: { key1: ..., key2: ... }
      // oppure { key1, key2 } (shorthand)
      const objectPattern = /\{([^}]*)\}/;
      const objMatch = objectPattern.exec(trimmedRest.slice(1)); // Skip la ","

      if (objMatch) {
        hasParams = true;
        // Estratta la parte interna dell'oggetto: "unit: ..., count: ..."
        const innerObj = objMatch[1];

        // Estrai i nomi delle proprietà (key: value o solo key per shorthand)
        // Pattern: nome di proprietà seguito da ":" o "," o "}"
        const propPattern = /(\w+)\s*:/g;
        let propMatch;
        while ((propMatch = propPattern.exec(innerObj)) !== null) {
          params.push(propMatch[1]);
        }

        // Gestisci anche shorthand object properties: { unit, count }
        // Se non abbiamo trovato nessuna propertà con ":", proviamo lo shorthand
        if (params.length === 0) {
          const shorthandPattern = /\b(\w+)\b/g;
          let shortMatch;
          while ((shortMatch = shorthandPattern.exec(innerObj)) !== null) {
            // Salta keyword JS comuni
            const kw = new Set([
              "true",
              "false",
              "null",
              "undefined",
              "new",
              "return",
            ]);
            if (!kw.has(shortMatch[1])) {
              params.push(shortMatch[1]);
            }
          }
        }
      } else {
        // Il secondo argomento esiste ma non è un oggetto letterale
        // (es. t(key, myVariableParams)) — nota come dinamico
        hasParams = true;
        params = ["<dynamic>"];
      }
    }

    results.push({
      key,
      params,
      hasParams,
      line,
      file: filePath,
      rawSnippet: fullMatch.slice(0, 120).replace(/\n/g, "↵"),
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Core: analisi delle call site vs. i18n keys
// ---------------------------------------------------------------------------

/**
 * Confronta le call site trovate con le chiavi i18n definite in en.json.
 *
 * Rileva:
 *  1. Chiave con placeholder chiamata SENZA params → missing_all_params
 *  2. Chiave con placeholder dove mancano alcuni params → missing_params
 *  3. Chiave SENZA placeholder chiamata WITH params → params_on_no_placeholder
 *  4. Se --strict: chiave con params extra → extra_params
 *
 * @param {CallSite[]} callSites
 * @param {Map<string, TranslationKey>} allKeys
 * @returns {{ issues: Issue[], ok: CallSite[], unknownKeys: CallSite[] }}
 */
function analyzeCallSites(callSites, allKeys) {
  /** @type {Issue[]} */
  const issues = [];

  /** @type {CallSite[]} */
  const ok = [];

  /** @type {CallSite[]} */
  const unknownKeys = [];

  for (const call of callSites) {
    const keyDef = allKeys.get(call.key);

    // Chiave non trovata in en.json — la segnaliamo separatamente
    if (!keyDef) {
      unknownKeys.push(call);
      continue;
    }

    const expected = keyDef.placeholders;
    const hasDynamicParams = call.params.includes("<dynamic>");

    // Se i params sono dinamici, non possiamo validarli staticamente — skip
    if (hasDynamicParams) {
      ok.push(call);
      continue;
    }

    const actual = call.params;

    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));

    // Caso 1: chiave ha placeholder ma chiamata senza params
    if (expected.length > 0 && !call.hasParams) {
      issues.push({
        type: "missing_all_params",
        key: call.key,
        file: call.file,
        line: call.line,
        expected,
        actual: [],
        missing: expected,
        extra: [],
        rawSnippet: call.rawSnippet,
      });
      continue;
    }

    // Caso 2: placeholder mancanti nei params passati
    if (missing.length > 0) {
      issues.push({
        type: "missing_params",
        key: call.key,
        file: call.file,
        line: call.line,
        expected,
        actual,
        missing,
        extra,
        rawSnippet: call.rawSnippet,
      });
      continue;
    }

    // Caso 3: params passati ma la chiave non ha placeholder
    if (expected.length === 0 && actual.length > 0) {
      issues.push({
        type: "params_on_no_placeholder",
        key: call.key,
        file: call.file,
        line: call.line,
        expected: [],
        actual,
        missing: [],
        extra: actual,
        rawSnippet: call.rawSnippet,
      });
      continue;
    }

    // Caso 4 (solo --strict): params extra
    if (strictMode && extra.length > 0) {
      issues.push({
        type: "extra_params",
        key: call.key,
        file: call.file,
        line: call.line,
        expected,
        actual,
        missing: [],
        extra,
        rawSnippet: call.rawSnippet,
      });
      continue;
    }

    ok.push(call);
  }

  return { issues, ok, unknownKeys };
}

// ---------------------------------------------------------------------------
// Output: report testo
// ---------------------------------------------------------------------------

/**
 * Icona per il tipo di issue.
 * @param {Issue['type']} type
 * @returns {string}
 */
function issueIcon(type) {
  switch (type) {
    case "missing_all_params":
      return "🚨";
    case "missing_params":
      return "⚠️ ";
    case "extra_params":
      return "📦";
    case "params_on_no_placeholder":
      return "🤔";
    default:
      return "❓";
  }
}

/**
 * Descrizione leggibile del tipo di issue.
 * @param {Issue['type']} type
 * @returns {string}
 */
function issueLabel(type) {
  switch (type) {
    case "missing_all_params":
      return "Chiamata senza params (richiesti)";
    case "missing_params":
      return "Params mancanti";
    case "extra_params":
      return "Params extra (non usati dalla traduzione)";
    case "params_on_no_placeholder":
      return "Params passati a chiave senza placeholder";
    default:
      return "Problema sconosciuto";
  }
}

/**
 * @param {{ issues: Issue[], ok: CallSite[], unknownKeys: CallSite[] }} result
 * @param {number} totalFiles
 * @param {number} totalCallSites
 * @param {Map<string, TranslationKey>} allKeys
 */
function printTextReport(result, totalFiles, totalCallSites, allKeys) {
  const { issues, ok, unknownKeys } = result;

  // Chiavi con placeholder definite nel JSON
  const keysWithPlaceholders = [...allKeys.values()].filter(
    (k) => k.placeholders.length > 0,
  );

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║         🔍  i18n Params Validator                        ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`📁 File scansionati:              ${totalFiles}`);
  console.log(`📞 Chiamate t() trovate:          ${totalCallSites}`);
  console.log(
    `🗝️  Chiavi con placeholder (JSON): ${keysWithPlaceholders.length}`,
  );
  console.log(`✅ Chiamate corrette:              ${ok.length}`);
  console.log(`❓ Chiavi non trovate (unknown):   ${unknownKeys.length}`);
  console.log(`❌ Problemi trovati:               ${issues.length}\n`);

  if (issues.length === 0) {
    console.log(
      "🎉 Nessun problema trovato! Tutti i parametri i18n sono corretti.",
    );
  } else {
    console.log("─".repeat(62));
    console.log("  PROBLEMI TROVATI");
    console.log("─".repeat(62));

    // Raggruppa per tipo
    /** @type {Map<string, Issue[]>} */
    const byType = new Map();
    for (const issue of issues) {
      if (!byType.has(issue.type)) byType.set(issue.type, []);
      byType.get(issue.type).push(issue);
    }

    for (const [type, typeIssues] of byType) {
      console.log(
        `\n  ${issueIcon(type)} ${issueLabel(type)} (${typeIssues.length})`,
      );
      console.log("  " + "─".repeat(58));

      for (const issue of typeIssues) {
        console.log(`\n     📄 ${issue.file}:${issue.line}`);
        console.log(`     🔑 Chiave:    ${issue.key}`);
        console.log(
          `     📝 Valore:    "${allKeys.get(issue.key)?.value ?? "?"}"`,
        );
        if (issue.expected.length > 0) {
          console.log(`     ✅ Attesi:    { ${issue.expected.join(", ")} }`);
        }
        if (issue.actual.length > 0) {
          console.log(`     📦 Passati:   { ${issue.actual.join(", ")} }`);
        }
        if (issue.missing.length > 0) {
          console.log(`     ❌ Mancanti:  [ ${issue.missing.join(", ")} ]`);
        }
        if (issue.extra.length > 0) {
          console.log(`     ➕ Extra:     [ ${issue.extra.join(", ")} ]`);
        }
        console.log(`     💬 Snippet:   ${issue.rawSnippet}`);
      }
    }
  }

  // Chiavi con placeholder mai usate con params
  const paramKeys = new Set(
    [...allKeys.values()]
      .filter((k) => k.placeholders.length > 0)
      .map((k) => k.key),
  );

  // Trova quali chiavi parametrizzate non sono mai usate in nessuna call site
  const usedParamKeys = new Set(
    [...ok, ...issues.filter((i) => i.type !== "missing_all_params")]
      .map((c) => c.key)
      .filter((k) => paramKeys.has(k)),
  );

  const neverCalledParamKeys = [...paramKeys].filter(
    (k) => !usedParamKeys.has(k),
  );

  if (neverCalledParamKeys.length > 0) {
    console.log("\n" + "─".repeat(62));
    console.log(
      `  ℹ️  Chiavi con placeholder MAI usate come t(key, {...}) (${neverCalledParamKeys.length})`,
    );
    console.log("─".repeat(62));
    for (const k of neverCalledParamKeys.sort()) {
      const def = allKeys.get(k);
      console.log(`     📭 ${k}`);
      console.log(
        `        └─ Placeholder: [${def?.placeholders.join(", ")}] — "${def?.value}"`,
      );
    }
  }

  if (verbose && unknownKeys.length > 0) {
    console.log("\n" + "─".repeat(62));
    console.log(`  ❓ Chiavi NON trovate in en.json (${unknownKeys.length})`);
    console.log("─".repeat(62));
    for (const call of unknownKeys) {
      console.log(`     ${call.file}:${call.line} — "${call.key}"`);
    }
  }

  if (verbose && ok.length > 0) {
    console.log("\n" + "─".repeat(62));
    console.log(
      `  ✅ Chiamate corrette con params (${ok.filter((c) => c.hasParams).length})`,
    );
    console.log("─".repeat(62));
    for (const call of ok.filter((c) => c.hasParams)) {
      console.log(
        `     ${call.file}:${call.line} — "${call.key}" { ${call.params.join(", ")} }`,
      );
    }
  }

  console.log("\n" + "═".repeat(62));
  if (issues.length > 0) {
    console.log(
      `  ⚠️  ${issues.length} problema/i trovato/i — verificare le chiamate t() sopra`,
    );
  } else {
    console.log("  ✅ Validazione completata con successo!");
  }
  console.log("═".repeat(62));
}

// ---------------------------------------------------------------------------
// Output: report JSON
// ---------------------------------------------------------------------------

/**
 * @param {{ issues: Issue[], ok: CallSite[], unknownKeys: CallSite[] }} result
 * @param {number} totalFiles
 * @param {number} totalCallSites
 * @param {Map<string, TranslationKey>} allKeys
 * @returns {object}
 */
function buildJsonReport(result, totalFiles, totalCallSites, allKeys) {
  const { issues, ok, unknownKeys } = result;

  const keysWithPlaceholders = [...allKeys.values()].filter(
    (k) => k.placeholders.length > 0,
  );

  return {
    summary: {
      totalFiles,
      totalCallSites,
      keysWithPlaceholders: keysWithPlaceholders.length,
      correctCalls: ok.length,
      unknownKeys: unknownKeys.length,
      issuesFound: issues.length,
    },
    issues: issues.sort((a, b) => {
      const typeOrder = {
        missing_all_params: 0,
        missing_params: 1,
        extra_params: 2,
        params_on_no_placeholder: 3,
      };
      const ta = typeOrder[a.type] ?? 9;
      const tb = typeOrder[b.type] ?? 9;
      if (ta !== tb) return ta - tb;
      return a.key.localeCompare(b.key);
    }),
    ...(verbose
      ? {
          correctCalls: ok,
          unknownKeys,
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

  // Conta le chiavi con placeholder per il report
  const keysWithPlaceholders = [...allKeys.values()].filter(
    (k) => k.placeholders.length > 0,
  );

  if (!outputJson) {
    console.log(
      `\n🔎 Trovate ${keysWithPlaceholders.length} chiavi con placeholder in en.json`,
    );
    console.log("   Esempi:");
    for (const k of keysWithPlaceholders.slice(0, 5)) {
      console.log(
        `   • ${k.key} → { ${k.placeholders.join(", ")} } — "${k.value}"`,
      );
    }
    if (keysWithPlaceholders.length > 5) {
      console.log(`   ... e altre ${keysWithPlaceholders.length - 5} chiavi`);
    }
    console.log();
  }

  // 2. Raccogli file sorgente
  /** @type {string[]} */
  const files = [];
  for (const dir of DEFAULT_SCAN_DIRS) {
    collectFiles(dir, files);
  }

  // Escludi lo script stesso
  const selfPath = path.resolve(__filename);
  const filteredFiles = files.filter((f) => path.resolve(f) !== selfPath);

  if (!outputJson) {
    console.log(`📂 Scansione di ${filteredFiles.length} file...\n`);
  }

  // 3. Estrai tutte le call site
  /** @type {CallSite[]} */
  const allCallSites = [];

  for (const filePath of filteredFiles) {
    let content;
    try {
      content = fs.readFileSync(filePath, "utf-8");
    } catch {
      continue; // File non leggibile: skip
    }

    const relPath = path.relative(ROOT_DIR, filePath);
    const callSites = extractCallSites(content, relPath);
    allCallSites.push(...callSites);
  }

  // 4. Analizza
  const result = analyzeCallSites(allCallSites, allKeys);

  // 5. Output
  if (outputJson) {
    const report = buildJsonReport(
      result,
      filteredFiles.length,
      allCallSites.length,
      allKeys,
    );
    const jsonStr = JSON.stringify(report, null, 2);

    if (outputFile) {
      fs.writeFileSync(path.resolve(ROOT_DIR, outputFile), jsonStr, "utf-8");
      console.log(`✅ Report salvato in: ${outputFile}`);
    } else {
      console.log(jsonStr);
    }
  } else {
    printTextReport(result, filteredFiles.length, allCallSites.length, allKeys);

    if (outputFile) {
      const report = buildJsonReport(
        result,
        filteredFiles.length,
        allCallSites.length,
        allKeys,
      );
      fs.writeFileSync(
        path.resolve(ROOT_DIR, outputFile),
        JSON.stringify(report, null, 2),
        "utf-8",
      );
      console.log(`\n💾 Report JSON salvato in: ${outputFile}`);
    }
  }

  // Exit code 1 se ci sono problemi (utile in CI)
  process.exit(result.issues.length > 0 ? 1 : 0);
}

main();
