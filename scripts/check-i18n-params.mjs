#!/usr/bin/env node

/**
 * check-i18n-params.mjs
 *
 * Analizza tutta la codebase TypeScript/JavaScript e verifica che:
 *  1. Le chiavi i18n con placeholder {param} vengano chiamate con i parametri corretti
 *  2. Le chiamate t("key", { ... }) non passino parametri in eccesso o mancanti
 *  3. Le chiavi con placeholder NON vengano chiamate senza passare i parametri
 *  4. Verifica la coerenza dei parametri in TUTTI i file locale
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
  "scripts",
]);

const LOCALES_DIR = path.resolve(ROOT_DIR, "app/i18n/locales");

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
const extraDirs = getArgValue("--include")?.split(",").filter(Boolean) ?? [];

const DEFAULT_SCAN_DIRS = ["app", "main.ts", ...extraDirs];

// ---------------------------------------------------------------------------
// Utilità
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

function extractPlaceholders(value) {
  const matches = [...String(value).matchAll(/\{(\w+)\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

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

function stripComments(content) {
  let result = content.replace(/\/\*[\s\S]*?\*\//g, (match) =>
    match.replace(/[^\n]/g, " "),
  );
  result = result.replace(/\/\/[^\n]*/g, (match) => " ".repeat(match.length));
  return result;
}

function extractCallSites(content, filePath) {
  const results = [];
  const strippedContent = stripComments(content);
  const lineOf = (pos) => content.slice(0, pos).split("\n").length;
  const tCallPattern = /\bt\(\s*(['"`])((?:[^'"`\\]|\\.)*?)\1([\s\S]*?)\)/g;

  let match;
  while ((match = tCallPattern.exec(strippedContent)) !== null) {
    const [fullMatch, , key, rest] = match;
    if (key.includes("${") || !key || key.length < 2) continue;
    if (!key.includes(".") && key.length < 5) continue;

    const line = lineOf(match.index);
    const trimmedRest = rest.trimStart();
    const hasSecondArg = trimmedRest.startsWith(",");

    let params = [];
    let hasParams = false;

    if (hasSecondArg) {
      const objectPattern = /\{([^}]*)\}/;
      const objMatch = objectPattern.exec(trimmedRest.slice(1));
      if (objMatch) {
        hasParams = true;
        const innerObj = objMatch[1];
        const propPattern = /(\w+)\s*:/g;
        let propMatch;
        while ((propMatch = propPattern.exec(innerObj)) !== null) {
          params.push(propMatch[1]);
        }
        if (params.length === 0) {
          const shorthandPattern = /\b(\w+)\b/g;
          let shortMatch;
          while ((shortMatch = shorthandPattern.exec(innerObj)) !== null) {
            const kw = new Set(["true", "false", "null", "undefined", "new", "return"]);
            if (!kw.has(shortMatch[1])) params.push(shortMatch[1]);
          }
        }
      } else {
        hasParams = true;
        params = ["<dynamic>"];
      }
    }

    results.push({ key, params, hasParams, line, file: filePath, rawSnippet: fullMatch.slice(0, 120).replace(/\n/g, "↵") });
  }
  return results;
}

function analyzeLocale(callSites, allKeys, localeName) {
  const issues = [];
  const unknownKeys = [];
  
  for (const call of callSites) {
    const keyDef = allKeys.get(call.key);
    if (!keyDef) {
      unknownKeys.push(call);
      continue;
    }

    const expected = keyDef.placeholders;
    if (call.params.includes("<dynamic>")) continue;

    const actual = call.params;
    const missing = expected.filter((p) => !actual.includes(p));
    const extra = actual.filter((p) => !expected.includes(p));

    if (expected.length > 0 && !call.hasParams) {
      issues.push({ type: "missing_all_params", key: call.key, file: call.file, line: call.line, expected, actual: [], missing, extra: [], locale: localeName });
    } else if (missing.length > 0) {
      issues.push({ type: "missing_params", key: call.key, file: call.file, line: call.line, expected, actual, missing, extra, locale: localeName });
    } else if (expected.length === 0 && actual.length > 0) {
      issues.push({ type: "params_on_no_placeholder", key: call.key, file: call.file, line: call.line, expected: [], actual, missing: [], extra, locale: localeName });
    } else if (strictMode && extra.length > 0) {
      issues.push({ type: "extra_params", key: call.key, file: call.file, line: call.line, expected, actual, missing: [], extra, locale: localeName });
    }
  }
  return { issues, unknownKeys };
}

function main() {
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));
  const sourceFiles = [];
  for (const dir of DEFAULT_SCAN_DIRS) collectFiles(dir, sourceFiles);
  const filteredFiles = sourceFiles.filter(f => path.resolve(f) !== path.resolve(__filename));

  const allCallSites = [];
  for (const filePath of filteredFiles) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      allCallSites.push(...extractCallSites(content, path.relative(ROOT_DIR, filePath)));
    } catch {}
  }

  const allIssues = [];
  const allUnknown = new Set();

  console.log(`🔍 Validating i18n params across ${localeFiles.length} locales...\n`);

  for (const file of localeFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf-8"));
    const keysMap = extractLeafKeys(data);
    const { issues, unknownKeys } = analyzeLocale(allCallSites, keysMap, file);
    
    allIssues.push(...issues);
    unknownKeys.forEach(k => allUnknown.add(k.key));
    
    if (issues.length > 0) {
      console.log(`❌ ${file}: Found ${issues.length} issues`);
    } else {
      if (verbose) console.log(`✅ ${file}: OK`);
    }
  }

  if (allIssues.length > 0) {
    console.log("\n" + "─".repeat(60));
    console.log("  DETTAGLIO ERRORI");
    console.log("─".repeat(60));
    allIssues.slice(0, 20).forEach(issue => {
      console.log(`\n  [${issue.locale}] ${issue.file}:${issue.line} - ${issue.key}`);
      if (issue.missing.length > 0) console.log(`    ❌ Mancanti: ${issue.missing.join(", ")}`);
      if (issue.extra.length > 0) console.log(`    ➕ Extra: ${issue.extra.join(", ")}`);
    });
    if (allIssues.length > 20) console.log(`\n  ... e altri ${allIssues.length - 20} errori`);
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${allIssues.length} issues found across all locales`);
  console.log("=".repeat(60));

  process.exit(allIssues.length > 0 ? 1 : 0);
}

main();