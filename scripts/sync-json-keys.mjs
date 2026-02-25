#!/usr/bin/env node
/**
 * @fileoverview Sync JSON Keys Script
 *
 * Reads migration-report.json and updates ALL locale JSON files
 * with all generated i18n keys.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const LOCALES_DIR = path.join(ROOT_DIR, "app/i18n/locales");
const REPORT_FILE = path.join(ROOT_DIR, "migration-report-full.json");

if (!fs.existsSync(REPORT_FILE)) {
  console.error(`❌ Report file not found: ${REPORT_FILE}`);
  process.exit(1);
}

console.log("🔄 Syncing JSON keys from migration report to ALL locales...\n");

const report = JSON.parse(fs.readFileSync(REPORT_FILE, "utf-8"));
const transformations = report.transformations;

const localeFiles = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith(".json"));

function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  const lastKey = keys[keys.length - 1];
  if (!current[lastKey]) current[lastKey] = value;
}

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

for (const file of localeFiles) {
  const filePath = path.join(LOCALES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let addedCount = 0;

  for (const transform of transformations) {
    const { i18nKey, oldValue } = transform;
    if (!getNestedValue(data, i18nKey)) {
      setNestedValue(data, i18nKey, oldValue);
      addedCount++;
    }
  }

  if (addedCount > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
    console.log(`✅ ${file}: Added ${addedCount} keys`);
  } else {
    console.log(`✅ ${file}: No new keys to add.`);
  }
}

console.log("\n💡 Note: New keys use English values as placeholders. Please translate manually or using AI translate.");