#!/usr/bin/env node

/**
 * Script to add missing i18n keys to locale JSON files
 * Adds keys used in ui.constants.ts but missing from en.json and it.json
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const EN_JSON_PATH = path.join(ROOT_DIR, "app/i18n/locales/en.json");
const IT_JSON_PATH = path.join(ROOT_DIR, "app/i18n/locales/it.json");
const UI_CONSTANTS_PATH = path.join(ROOT_DIR, "app/constants/ui.constants.ts");

/**
 * Reads and parses a JSON file
 * @param {string} filePath - Path to JSON file
 * @returns {Object} Parsed JSON object
 */
function readJson(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Writes JSON object to file with proper formatting
 * @param {string} filePath - Path to JSON file
 * @param {Object} data - JSON data to write
 */
function writeJson(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, content, "utf-8");
}

/**
 * Creates a backup of a file
 * @param {string} filePath - Path to file
 */
function createBackup(filePath) {
  const backupPath = filePath + ".backup";
  fs.copyFileSync(filePath, backupPath);
  console.log(`📋 Backup created: ${path.basename(backupPath)}`);
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

/**
 * Converts a dot-notation key to a nested object structure
 * @param {string} key - Key in dot notation (e.g., "modal.labels.exercise")
 * @param {string} value - Value for the key
 * @returns {Object} Nested object
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
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key])
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
 * @param {string} key - Key in dot notation
 * @returns {string} Human-readable phrase
 */
function keyToEnglishPhrase(key) {
  // Get the last part of the key
  const parts = key.split(".");
  const lastPart = parts[parts.length - 1];

  // Convert camelCase to words
  const words = lastPart
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();

  return words;
}

/**
 * Main function
 */
function main() {
  console.log("🔧 Adding missing i18n keys...\n");

  // Read files
  const enJson = readJson(EN_JSON_PATH);
  const itJson = readJson(IT_JSON_PATH);
  const uiConstantsContent = readUiConstants();

  // Extract keys
  const jsonKeys = extractJsonKeys(enJson);
  const usedKeys = extractUsedKeys(uiConstantsContent);

  // Find missing keys
  const missingKeys = [];
  for (const key of usedKeys) {
    if (!jsonKeys.has(key)) {
      missingKeys.push(key);
    }
  }

  if (missingKeys.length === 0) {
    console.log("✅ No missing keys found!");
    return;
  }

  console.log(`📝 Found ${missingKeys.length} missing keys\n`);

  // Create backups
  createBackup(EN_JSON_PATH);
  createBackup(IT_JSON_PATH);

  // Build nested objects for missing keys
  let enAdditions = {};
  let itAdditions = {};

  for (const key of missingKeys.sort()) {
    const englishValue = keyToEnglishPhrase(key);
    const italianValue = "TODO";

    const enNested = keyToNestedObject(key, englishValue);
    const itNested = keyToNestedObject(key, italianValue);

    enAdditions = deepMerge(enAdditions, enNested);
    itAdditions = deepMerge(itAdditions, itNested);
  }

  // Merge with existing JSON
  const updatedEnJson = deepMerge(enJson, enAdditions);
  const updatedItJson = deepMerge(itJson, itAdditions);

  // Write updated JSON files
  writeJson(EN_JSON_PATH, updatedEnJson);
  writeJson(IT_JSON_PATH, updatedItJson);

  console.log("\n✅ Successfully added missing keys!");
  console.log(`📦 en.json: ${missingKeys.length} keys added`);
  console.log(`📦 it.json: ${missingKeys.length} keys added (marked as TODO)`);
  console.log("\n💡 Review the changes and update Italian translations as needed.");
  console.log("🔄 Backups saved as *.json.backup");
}

main();
