#!/usr/bin/env node

/**
 * Script to check for missing i18n keys in all locale JSON files.
 * Compares keys used in ui.constants.ts with keys present in each locale file.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT_DIR, "app/i18n/locales");
const UI_CONSTANTS_PATH = path.join(ROOT_DIR, "app/constants/ui.constants.ts");

/**
 * Reads and parses a JSON file
 * @param {string} filePath
 * @returns {Object} Parsed JSON object
 */
function readJson(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Reads the ui.constants.ts file
 * @returns {string} File content
 */
function readUiConstants() {
  return fs.readFileSync(UI_CONSTANTS_PATH, "utf-8");
}

/**
 * Extracts all keys from nested JSON object
 * @param {Object} obj - JSON object
 * @param {string} prefix - Current key prefix
 * @returns {Set<string>} Set of all keys in dot notation
 */
function extractJsonKeys(obj, prefix = "") {
  const keys = new Set();

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nestedKeys = extractJsonKeys(value, fullKey);
      nestedKeys.forEach((k) => keys.add(k));
    } else {
      keys.add(fullKey);
    }
  }

  return keys;
}

/**
 * Extracts all t() calls from ui.constants.ts
 * @param {string} content - File content
 * @returns {Set<string>} Set of all keys used in t() calls
 */
function extractUsedKeys(content) {
  const keys = new Set();
  const regex = /t\(["']([^"']+)["']\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

function main() {
  console.log("🔍 Checking for missing i18n keys across all locales...\n");

  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));
  const uiConstantsContent = readUiConstants();
  const usedKeys = extractUsedKeys(uiConstantsContent);

  console.log(`🔑 Keys used in ui.constants.ts: ${usedKeys.size}\n`);

  let totalMissing = 0;
  let problematicLocales = 0;

  for (const file of localeFiles) {
    const filePath = path.join(LOCALES_DIR, file);
    const localeData = readJson(filePath);
    const jsonKeys = extractJsonKeys(localeData);

    const missingKeys = [];
    for (const key of usedKeys) {
      if (!jsonKeys.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length === 0) {
      console.log(`✅ ${file}: All keys present.`);
    } else {
      console.log(`❌ ${file}: Missing ${missingKeys.length} keys`);
      problematicLocales++;
      totalMissing += missingKeys.length;
      if (missingKeys.length <= 10) {
        missingKeys.sort().forEach(k => console.log(`   - ${k}`));
      } else {
        console.log(`   - ${missingKeys.slice(0, 10).join("\n   - ")}`);
        console.log(`   ... and ${missingKeys.length - 10} more`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`Summary: ${problematicLocales} locales with missing keys, ${totalMissing} total missing references`);
  console.log("=".repeat(60));

  process.exit(problematicLocales > 0 ? 1 : 0);
}

main();