#!/usr/bin/env node

/**
 * Script to add missing i18n keys to all locale JSON files.
 * Adds keys used in ui.constants.ts but missing from locale files.
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
 * Writes JSON object to file with proper formatting
 * @param {string} filePath
 * @param {Object} data
 */
function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + "\n";
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Creates a backup of a file
 * @param {string} filePath
 */
function createBackup(filePath) {
  const backupPath = filePath + ".backup";
  fs.copyFileSync(filePath, backupPath);
}

/**
 * Extracts all keys from nested JSON object
 * @param {Object} obj
 * @param {string} prefix
 * @returns {Set<string>}
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
 * @param {string} content
 * @returns {Set<string>}
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

/**
 * Converts a dot-notation key to a nested object structure
 * @param {string} key
 * @param {string} value
 * @returns {Object}
 */
function keyToNestedObject(key, value) {
  const parts = key.split(".");
  const result = {};
  let current = result;
  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
  return result;
}

/**
 * Deep merge two objects
 * @param {Object} target
 * @param {Object} source
 * @returns {Object}
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const [key, value] of Object.entries(source)) {
    if (
      value && typeof value === "object" && !Array.isArray(value) &&
      result[key] && typeof result[key] === "object" && !Array.isArray(result[key])
    ) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Converts a dot-notation key to a human-readable English phrase
 * @param {string} key
 * @returns {string}
 */
function keyToEnglishPhrase(key) {
  const parts = key.split(".");
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function main() {
  console.log("🔧 Adding missing i18n keys to ALL locales...\n");

  const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));
  const uiConstantsContent = fs.readFileSync(UI_CONSTANTS_PATH, "utf-8");
  const usedKeys = extractUsedKeys(uiConstantsContent);

  for (const file of localeFiles) {
    const filePath = path.join(LOCALES_DIR, file);
    const localeData = readJson(filePath);
    const existingKeys = extractJsonKeys(localeData);

    const missingKeys = [];
    for (const key of usedKeys) {
      if (!existingKeys.has(key)) {
        missingKeys.push(key);
      }
    }

    if (missingKeys.length > 0) {
      console.log(`📝 ${file}: Adding ${missingKeys.length} keys`);
      createBackup(filePath);
      
      let additions = {};
      for (const key of missingKeys.sort()) {
        const placeholderValue = file === "en.json" ? keyToEnglishPhrase(key) : "TODO";
        additions = deepMerge(additions, keyToNestedObject(key, placeholderValue));
      }
      
      const updatedData = deepMerge(localeData, additions);
      writeJson(filePath, updatedData);
    } else {
      console.log(`✅ ${file}: No missing keys.`);
    }
  }

  console.log("\n✅ Done! Missing keys added to all locale files.");
  console.log("🔄 Backups saved as *.json.backup");
}

main();