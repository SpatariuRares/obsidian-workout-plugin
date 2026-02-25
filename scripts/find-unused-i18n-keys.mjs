#!/usr/bin/env node

/**
 * find-unused-i18n-keys.mjs
 *
 * Scansiona tutta la codebase TypeScript/JavaScript alla ricerca di chiavi i18n
 * non utilizzate definite nei file locale.
 * Una chiave è considerata "inutilizzata" solo se non appare nel codice,
 * ma viene controllata la sua presenza in TUTTI i file locale.
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
const fixMode = args.includes("--fix");
const dryRun = args.includes("--dry-run");
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

function isKeyUsedInContent(content, key) {
  const parts = key.split(".");
  const fragments = [key];
  const lastName = parts[parts.length - 1];
  if (lastName.length >= 4) fragments.push(lastName);
  
  for (const fragment of fragments) {
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp("['\"\x60]" + escaped + "['\"\x60]");
    if (pattern.test(content)) return true;
  }
  return false;
}

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

function deleteNestedKey(obj, parts) {
  if (parts.length === 0 || typeof obj !== "object" || obj === null) return;
  const [head, ...tail] = parts;
  if (tail.length === 0) {
    delete obj[head];
  } else if (head in obj) {
    deleteNestedKey(obj[head], tail);
  }
}

function main() {
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));
  const allLocaleKeys = new Set();
  const localeDataMap = new Map();

  for (const file of localeFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), "utf-8"));
    const keys = extractLeafKeys(data);
    localeDataMap.set(file, data);
    keys.forEach(k => allLocaleKeys.add(k));
  }

  const sourceFiles = [];
  for (const dir of DEFAULT_SCAN_DIRS) collectFiles(dir, sourceFiles);
  const filteredFiles = sourceFiles.filter(f => path.resolve(f) !== path.resolve(__filename));
  
  const fileContents = filteredFiles.map(f => fs.readFileSync(f, "utf-8"));

  const unusedKeys = [];
  const usedKeys = new Set();

  console.log(`🔍 Checking ${allLocaleKeys.size} unique keys across ${localeFiles.length} locales...\n`);

  for (const key of allLocaleKeys) {
    let used = false;
    for (const content of fileContents) {
      if (isKeyUsedInContent(content, key)) {
        used = true;
        break;
      }
    }
    if (used) {
      usedKeys.add(key);
    } else {
      unusedKeys.push(key);
    }
  }

  if (unusedKeys.length === 0) {
    console.log("🎉 No unused keys found!");
  } else {
    console.log(`❌ Found ${unusedKeys.length} unused keys:\n`);
    unusedKeys.sort().forEach(k => console.log(`   - ${k}`));
  }

  if (fixMode && unusedKeys.length > 0) {
    console.log("\n🔧 Cleaning up locale files...");
    for (const file of localeFiles) {
      const data = localeDataMap.get(file);
      let removedCount = 0;
      for (const key of unusedKeys) {
        const parts = key.split(".");
        // Check if key exists in this locale
        let current = data;
        let exists = true;
        for (const p of parts) {
          if (current && typeof current === "object" && p in current) {
            current = current[p];
          } else {
            exists = false;
            break;
          }
        }
        if (exists) {
          deleteNestedKey(data, parts);
          removedCount++;
        }
      }
      pruneEmptyNodes(data);
      if (!dryRun) {
        fs.writeFileSync(path.join(LOCALES_DIR, file), JSON.stringify(data, null, 2) + "\n");
        console.log(`   ✅ ${file}: Removed ${removedCount} keys`);
      } else {
        console.log(`   [dry-run] ${file}: Would remove ${removedCount} keys`);
      }
    }
  }

  process.exit(unusedKeys.length > 0 ? 1 : 0);
}

main();