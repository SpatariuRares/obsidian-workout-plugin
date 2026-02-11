#!/usr/bin/env node
/**
 * @fileoverview Sync JSON Keys Script
 *
 * Reads migration-report.json and updates locale JSON files
 * with all generated i18n keys.
 *
 * Usage: node scripts/sync-json-keys.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  reportFile: path.join(__dirname, "../migration-report-full.json"),
  enJsonFile: path.join(__dirname, "../app/i18n/locales/en.json"),
  itJsonFile: path.join(__dirname, "../app/i18n/locales/it.json"),
};

console.log("🔄 Syncing JSON keys from migration report...\n");

// Read migration report
const report = JSON.parse(fs.readFileSync(CONFIG.reportFile, "utf-8"));
const transformations = report.transformations;

// Read existing JSON files
const enJson = JSON.parse(fs.readFileSync(CONFIG.enJsonFile, "utf-8"));
const itJson = JSON.parse(fs.readFileSync(CONFIG.itJsonFile, "utf-8"));

// Helper: Set nested value in object
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  const lastKey = keys[keys.length - 1];
  if (!current[lastKey]) {
    current[lastKey] = value;
  }
}

// Process transformations
let addedKeys = 0;
for (const transform of transformations) {
  const { i18nKey, oldValue } = transform;

  // Add to English JSON
  setNestedValue(enJson, i18nKey, oldValue);
  addedKeys++;

  // Add placeholder to Italian JSON (needs manual translation)
  if (!getNestedValue(itJson, i18nKey)) {
    setNestedValue(itJson, i18nKey, oldValue); // Temporary English value
  }
}

// Helper: Get nested value
function getNestedValue(obj, path) {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

// Write updated JSON files
fs.writeFileSync(CONFIG.enJsonFile, JSON.stringify(enJson, null, 2));
fs.writeFileSync(CONFIG.itJsonFile, JSON.stringify(itJson, null, 2));

console.log(`✅ Added ${addedKeys} keys to JSON files`);
console.log(`📝 English file updated: ${CONFIG.enJsonFile}`);
console.log(`📝 Italian file updated: ${CONFIG.itJsonFile}`);
console.log(
  `\n⚠️  Note: Italian translations use English values as placeholders.`,
);
console.log(`   Please review and translate manually.`);
