#!/usr/bin/env node

/**
 * Script to check for missing i18n keys in en.json
 * Compares keys used in ui.constants.ts with keys present in en.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const EN_JSON_PATH = path.join(ROOT_DIR, "app/i18n/locales/en.json");
const UI_CONSTANTS_PATH = path.join(ROOT_DIR, "app/constants/ui.constants.ts");

/**
 * Reads and parses the en.json file
 * @returns {Object} Parsed JSON object
 */
function readEnJson() {
  const content = fs.readFileSync(EN_JSON_PATH, "utf-8");
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
      // Recursively extract nested keys
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

  // Match t("key") or t('key') calls
  const regex = /t\(["']([^"']+)["']\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    keys.add(match[1]);
  }

  return keys;
}

/**
 * Main function
 */
function main() {
  console.log("🔍 Checking for missing i18n keys...\n");

  // Read files
  const enJson = readEnJson();
  const uiConstantsContent = readUiConstants();

  // Extract keys
  const jsonKeys = extractJsonKeys(enJson);
  const usedKeys = extractUsedKeys(uiConstantsContent);

  console.log(`📦 Keys in en.json: ${jsonKeys.size}`);
  console.log(`🔑 Keys used in ui.constants.ts: ${usedKeys.size}\n`);

  // Find missing keys
  const missingKeys = new Set();
  for (const key of usedKeys) {
    if (!jsonKeys.has(key)) {
      missingKeys.add(key);
    }
  }

  // Find unused keys (keys in JSON but not used in code)
  const unusedKeys = new Set();
  for (const key of jsonKeys) {
    if (!usedKeys.has(key)) {
      unusedKeys.add(key);
    }
  }

  // Report results
  if (missingKeys.size === 0) {
    console.log("✅ All keys are present in en.json!");
  } else {
    console.log(`❌ Missing keys in en.json: ${missingKeys.size}\n`);
    console.log("Missing keys:");
    const sortedMissing = Array.from(missingKeys).sort();
    sortedMissing.forEach((key) => {
      console.log(`  - ${key}`);
    });
  }

  console.log();

  if (unusedKeys.size > 0) {
    console.log(`⚠️  Unused keys in en.json: ${unusedKeys.size}\n`);
    console.log("Unused keys (may be used elsewhere or legacy):");
    const sortedUnused = Array.from(unusedKeys).sort();
    sortedUnused.forEach((key) => {
      console.log(`  - ${key}`);
    });
  }

  console.log("\n" + "=".repeat(60));
  console.log(
    `Summary: ${missingKeys.size} missing, ${unusedKeys.size} unused`,
  );
  console.log("=".repeat(60));

  // Exit with error code if there are missing keys
  process.exit(missingKeys.size > 0 ? 1 : 0);
}

main();
