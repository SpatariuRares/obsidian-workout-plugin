#!/usr/bin/env node
/**
 * @fileoverview Complete i18n Migration Script
 *
 * Migrates ALL hardcoded strings in ui.constants.ts to i18n getters.
 * Uses a comprehensive approach to find all string literals.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  sourceFile: path.join(__dirname, "../app/constants/ui.constants.ts"),
  backupFile: path.join(__dirname, "../app/constants/ui.constants.ts.backup2"),
  reportFile: path.join(__dirname, "../migration-report-full.json"),
};

const stats = {
  totalStrings: 0,
  migratedStrings: 0,
  skippedStrings: 0,
  transformations: [],
};

// Sections to skip (not translatable)
const SKIP_SECTIONS = new Set([
  "ICONS",
  "EMOJI",
  "CODE_BLOCKS",
  "DEFAULTS",
  "DATA_TYPE_NAMES",
]);

// Context tracking for nested objects
let currentContext = [];

console.log("🚀 Starting complete i18n migration...\n");

try {
  // Backup
  console.log("📦 Creating backup...");
  const content = fs.readFileSync(CONFIG.sourceFile, "utf-8");
  fs.writeFileSync(CONFIG.backupFile, content);
  console.log(`✅ Backup: ${CONFIG.backupFile}\n`);

  // Transform
  console.log("🔄 Transforming ALL constants...");
  const transformed = transformAllConstants(content);

  // Write
  fs.writeFileSync(CONFIG.sourceFile, transformed);
  console.log(`✅ File updated\n`);

  // Report
  fs.writeFileSync(
    CONFIG.reportFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        statistics: {
          totalStrings: stats.totalStrings,
          migratedStrings: stats.migratedStrings,
          skippedStrings: stats.skippedStrings,
          successRate: `${((stats.migratedStrings / stats.totalStrings) * 100).toFixed(2)}%`,
        },
        transformations: stats.transformations.slice(0, 100),
      },
      null,
      2
    )
  );

  console.log("═══════════════════════════════════════");
  console.log("📋 Migration Summary");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Total: ${stats.totalStrings}`);
  console.log(`✅ Migrated: ${stats.migratedStrings}`);
  console.log(`⚠️  Skipped: ${stats.skippedStrings}`);
  console.log(
    `📊 Success: ${((stats.migratedStrings / stats.totalStrings) * 100).toFixed(2)}%`
  );
  console.log("═══════════════════════════════════════\n");
  console.log(`📊 Report: ${CONFIG.reportFile}`);
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}

function transformAllConstants(content) {
  let result = content;

  // Find all top-level constant exports
  const constantRegex = /export const (\w+) = \{/g;
  let match;
  const constants = [];

  while ((match = constantRegex.exec(content)) !== null) {
    constants.push(match[1]);
  }

  console.log(`Found ${constants.length} top-level constants:`, constants.join(", "));

  // Transform each constant
  for (const constantName of constants) {
    if (SKIP_SECTIONS.has(constantName)) {
      console.log(`⏭️  Skipping ${constantName}`);
      continue;
    }

    result = transformConstant(result, constantName);
  }

  return result;
}

function transformConstant(content, constantName) {
  // Extract the entire constant object
  const startPattern = `export const ${constantName} = {`;
  const startIndex = content.indexOf(startPattern);

  if (startIndex === -1) {
    return content;
  }

  // Find matching closing brace
  let braceCount = 0;
  let endIndex = startIndex + startPattern.length;
  let inString = false;
  let escapeNext = false;

  for (let i = endIndex; i < content.length; i++) {
    const char = content[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") braceCount++;
    if (char === "}") {
      if (braceCount === 0) {
        endIndex = i + 1;
        break;
      }
      braceCount--;
    }
  }

  const constantBlock = content.substring(startIndex, endIndex);
  const transformedBlock = transformConstantBlock(constantBlock, constantName);

  return (
    content.substring(0, startIndex) +
    transformedBlock +
    content.substring(endIndex)
  );
}

function transformConstantBlock(block, constantName) {
  const i18nPrefix = constantName
    .toLowerCase()
    .replace(/_ui$/, "")
    .replace(/_/g, "");

  // Transform property: "value" to getter
  return block.replace(
    /(\s+)(\w+):\s*"([^"]+)",?/g,
    (match, indent, key, value) => {
      // Skip if already a getter or function
      if (match.includes("get ") || match.includes("=>")) {
        return match;
      }

      // Skip dynamic getters
      if (key === "WEIGHT_INCREMENT" || key === "QUICK_WEIGHT_INCREMENT" || key === "WEIGHT") {
        return match;
      }

      const i18nKey = generateI18nKey(i18nPrefix, key);
      stats.totalStrings++;
      stats.migratedStrings++;
      stats.transformations.push({
        constant: constantName,
        key,
        oldValue: value,
        i18nKey,
      });

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    }
  );
}

function generateI18nKey(prefix, key) {
  const camelKey = key
    .toLowerCase()
    .replace(/_([a-z])/g, (m, letter) => letter.toUpperCase());

  return `${prefix}.${camelKey}`;
}
