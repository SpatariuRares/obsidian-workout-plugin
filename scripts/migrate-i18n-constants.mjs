#!/usr/bin/env node
/**
 * @fileoverview i18n Constants Migration Script
 *
 * Part of the DOE Framework - Execution Layer (E)
 * Deterministic script to migrate hardcoded strings to i18n getters.
 *
 * Usage:
 *   node scripts/migrate-i18n-constants.mjs
 *
 * What it does:
 * 1. Reads ui.constants.ts
 * 2. Identifies hardcoded strings in constant objects
 * 3. Transforms strings to getters with t() calls
 * 4. Preserves functions, icons, and non-translatable content
 * 5. Generates migration report
 *
 * Example transformation:
 *   BEFORE: CREATE_LOG: "Create workout log",
 *   AFTER:  get CREATE_LOG() { return t("modal.titles.createLog"); },
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  sourceFile: path.join(
    __dirname,
    "../app/constants/ui.constants.ts",
  ),
  backupFile: path.join(
    __dirname,
    "../app/constants/ui.constants.ts.backup",
  ),
  reportFile: path.join(__dirname, "../migration-report.json"),
};

// Statistics
const stats = {
  totalStrings: 0,
  migratedStrings: 0,
  skippedStrings: 0,
  errors: [],
  warnings: [],
  transformations: [],
};

/**
 * Main migration function
 */
async function migrate() {
  console.log("🚀 Starting i18n constants migration...\n");

  try {
    // Step 1: Backup original file
    console.log("📦 Creating backup...");
    const content = fs.readFileSync(CONFIG.sourceFile, "utf-8");
    fs.writeFileSync(CONFIG.backupFile, content);
    console.log(`✅ Backup created: ${CONFIG.backupFile}\n`);

    // Step 2: Transform content
    console.log("🔄 Transforming constants...");
    const transformed = transformConstants(content);

    // Step 3: Write transformed content
    console.log("💾 Writing transformed file...");
    fs.writeFileSync(CONFIG.sourceFile, transformed);
    console.log(`✅ File updated: ${CONFIG.sourceFile}\n`);

    // Step 4: Generate report
    console.log("📊 Generating migration report...");
    generateReport();
    console.log(`✅ Report saved: ${CONFIG.reportFile}\n`);

    // Step 5: Print summary
    printSummary();
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Transform constants from hardcoded strings to i18n getters
 */
function transformConstants(content) {
  // Skip sections that don't need translation
  const skipSections = [
    "ICONS",
    "EMOJI",
    "CODE_BLOCKS",
    "DEFAULTS",
    "SELECT_OPTIONS",
    "CHART_DATA_TYPE",
  ];

  let result = content;

  // Transform BUTTONS section
  result = transformSection(
    result,
    "BUTTONS",
    "modal.buttons",
    skipSections,
  );

  // Transform LABELS section (complex - has dynamic getters)
  result = transformLabelsSection(result);

  // Transform PLACEHOLDERS section
  result = transformSection(
    result,
    "PLACEHOLDERS",
    "modal.placeholders",
    skipSections,
  );

  // Transform NOTICES section (has some dynamic functions)
  result = transformNoticesSection(result);

  // Transform CHECKBOXES section
  result = transformSection(
    result,
    "CHECKBOXES",
    "modal.checkboxes",
    skipSections,
  );

  // Transform SECTIONS section
  result = transformSection(
    result,
    "SECTIONS",
    "modal.sections",
    skipSections,
  );

  // Transform EXERCISE_STATUS section
  result = transformExerciseStatusSection(result);

  // Transform SETTINGS_UI sections
  result = transformSettingsUI(result);

  // Transform TABLE_UI sections
  result = transformTableUI(result);

  // Transform DASHBOARD_UI sections
  result = transformDashboardUI(result);

  // Transform CHARTS_UI sections
  result = transformChartsUI(result);

  // Transform GENERAL_UI sections
  result = transformGeneralUI(result);

  // Transform MESSAGES_UI sections
  result = transformMessagesUI(result);

  return result;
}

/**
 * Transform a simple constant section
 */
function transformSection(content, sectionName, i18nPrefix, skipSections) {
  if (skipSections.includes(sectionName)) {
    stats.warnings.push(`Skipped section: ${sectionName}`);
    return content;
  }

  // Find section boundaries
  const sectionRegex = new RegExp(
    `(${sectionName}:\\s*{)([\\s\\S]*?)(^\\s*},)`,
    "m",
  );
  const match = content.match(sectionRegex);

  if (!match) {
    stats.warnings.push(`Section not found: ${sectionName}`);
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  // Transform each property
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      const i18nKey = `${i18nPrefix}.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;
      stats.transformations.push({
        section: sectionName,
        key,
        oldValue: value,
        i18nKey,
      });

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Transform LABELS section (has dynamic getters for WEIGHT, TARGET_WEIGHT)
 */
function transformLabelsSection(content) {
  const sectionRegex = /(LABELS:\s*{)([\s\S]*?)(^\s*},)/m;
  const match = content.match(sectionRegex);

  if (!match) {
    stats.warnings.push("LABELS section not found");
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  // Transform simple string properties (skip existing getters)
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      // Skip if already a getter or dynamic
      if (key === "WEIGHT" || key === "TARGET_WEIGHT") {
        stats.skippedStrings++;
        return match; // Keep existing getter
      }

      const i18nKey = `modal.labels.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;
      stats.transformations.push({
        section: "LABELS",
        key,
        oldValue: value,
        i18nKey,
      });

      // Handle special case for labels with ({unit})
      const translatedValue = value.includes("{unit}")
        ? value
        : value;

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Transform NOTICES section (has some arrow functions)
 */
function transformNoticesSection(content) {
  const sectionRegex = /(NOTICES:\s*{)([\s\S]*?)(^\s*},)/m;
  const match = content.match(sectionRegex);

  if (!match) {
    stats.warnings.push("NOTICES section not found");
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  // Transform simple string properties only (skip arrow functions)
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      const i18nKey = `modal.notices.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;
      stats.transformations.push({
        section: "NOTICES",
        key,
        oldValue: value,
        i18nKey,
      });

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Transform EXERCISE_STATUS section (has arrow functions)
 */
function transformExerciseStatusSection(content) {
  // This section has mixed content - keep arrow functions, transform strings
  const sectionRegex = /(EXERCISE_STATUS:\s*{)([\s\S]*?)(^\s*},)/m;
  const match = content.match(sectionRegex);

  if (!match) {
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  // Only transform simple string properties
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      const i18nKey = `modal.exerciseStatus.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Transform SETTINGS_UI sections
 */
function transformSettingsUI(content) {
  // Transform LABELS subsection
  content = transformNestedSection(
    content,
    "SETTINGS_UI",
    "LABELS",
    "settings.labels",
  );

  // Transform DESCRIPTIONS subsection
  content = transformNestedSection(
    content,
    "SETTINGS_UI",
    "DESCRIPTIONS",
    "settings.descriptions",
  );

  // Transform SECTIONS subsection
  content = transformNestedSection(
    content,
    "SETTINGS_UI",
    "SECTIONS",
    "settings.sections",
  );

  // Transform BUTTONS subsection
  content = transformNestedSection(
    content,
    "SETTINGS_UI",
    "BUTTONS",
    "settings.buttons",
  );

  return content;
}

/**
 * Transform TABLE_UI sections
 */
function transformTableUI(content) {
  content = transformNestedSection(
    content,
    "TABLE_UI",
    "COLUMNS",
    "table.columns",
  );
  content = transformNestedSection(
    content,
    "TABLE_UI",
    "LABELS",
    "table.labels",
  );
  content = transformNestedSection(
    content,
    "TABLE_UI",
    "MESSAGES",
    "table.messages",
  );

  return content;
}

/**
 * Transform DASHBOARD_UI sections
 */
function transformDashboardUI(content) {
  // Quick Stats
  content = transformDeeplyNestedSection(
    content,
    "DASHBOARD_UI",
    "QUICK_STATS",
    "PERIODS",
    "dashboard.quickStats.periods",
  );
  content = transformDeeplyNestedSection(
    content,
    "DASHBOARD_UI",
    "QUICK_STATS",
    "METRICS",
    "dashboard.quickStats.metrics",
  );

  return content;
}

/**
 * Transform CHARTS_UI sections
 */
function transformChartsUI(content) {
  content = transformNestedSection(
    content,
    "CHARTS_UI",
    "LABELS",
    "charts.labels",
  );

  return content;
}

/**
 * Transform GENERAL_UI sections
 */
function transformGeneralUI(content) {
  content = transformNestedSection(
    content,
    "GENERAL_UI",
    "LABELS",
    "general.labels",
  );
  content = transformNestedSection(
    content,
    "GENERAL_UI",
    "ACTIONS",
    "general.actions",
  );

  return content;
}

/**
 * Transform MESSAGES_UI sections
 */
function transformMessagesUI(content) {
  // Top-level messages
  const messagesRegex = /(MESSAGES_UI:\s*{)([\s\S]*?)(NO_DATA:)/;
  const match = content.match(messagesRegex);

  if (match) {
    const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
    content = content.replace(propertyRegex, (match, indent, key, value) => {
      if (
        match.includes("MESSAGES_UI") ||
        ["NO_DATA", "LOADING", "NO_DATA_PERIOD", "TIMER_COMPLETED"].includes(
          key,
        )
      ) {
        const i18nKey = `messages.${camelToSnake(key)}`;
        stats.totalStrings++;
        stats.migratedStrings++;

        return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
      }
      return match;
    });
  }

  return content;
}

/**
 * Transform nested section (e.g., SETTINGS_UI.LABELS)
 */
function transformNestedSection(
  content,
  parentSection,
  childSection,
  i18nPrefix,
) {
  const sectionRegex = new RegExp(
    `(${parentSection}:[\\s\\S]*?${childSection}:\\s*{)([\\s\\S]*?)(^\\s*},)`,
    "m",
  );
  const match = content.match(sectionRegex);

  if (!match) {
    stats.warnings.push(
      `Nested section not found: ${parentSection}.${childSection}`,
    );
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  // Transform simple string properties (skip getters and functions)
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      // Skip if it's already a getter
      if (match.includes("get ")) {
        return match;
      }

      const i18nKey = `${i18nPrefix}.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Transform deeply nested section (e.g., DASHBOARD_UI.QUICK_STATS.PERIODS)
 */
function transformDeeplyNestedSection(
  content,
  parentSection,
  middleSection,
  childSection,
  i18nPrefix,
) {
  const sectionRegex = new RegExp(
    `(${parentSection}:[\\s\\S]*?${middleSection}:[\\s\\S]*?${childSection}:\\s*{)([\\s\\S]*?)(^\\s*},)`,
    "m",
  );
  const match = content.match(sectionRegex);

  if (!match) {
    return content;
  }

  const [fullMatch, opening, sectionContent, closing] = match;
  let transformed = sectionContent;

  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  transformed = transformed.replace(
    propertyRegex,
    (match, indent, key, value) => {
      if (match.includes("get ")) {
        return match;
      }

      const i18nKey = `${i18nPrefix}.${camelToSnake(key)}`;
      stats.totalStrings++;
      stats.migratedStrings++;

      return `${indent}get ${key}() {\n${indent}  return t("${i18nKey}");\n${indent}},`;
    },
  );

  return content.replace(fullMatch, opening + transformed + closing);
}

/**
 * Convert SCREAMING_SNAKE_CASE or camelCase to camelCase
 * Examples:
 *   CREATE → create
 *   INSERT_CHART → insertChart
 *   LOG_CREATE_ERROR → logCreateError
 */
function camelToSnake(str) {
  // If already lowercase, return as is
  if (str === str.toLowerCase()) {
    return str;
  }

  // Convert SCREAMING_SNAKE_CASE to camelCase
  return str
    .toLowerCase()
    .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Generate migration report
 */
function generateReport() {
  const report = {
    timestamp: new Date().toISOString(),
    statistics: {
      totalStrings: stats.totalStrings,
      migratedStrings: stats.migratedStrings,
      skippedStrings: stats.skippedStrings,
      successRate: `${((stats.migratedStrings / stats.totalStrings) * 100).toFixed(2)}%`,
    },
    warnings: stats.warnings,
    errors: stats.errors,
    transformations: stats.transformations.slice(0, 50), // First 50 transformations
  };

  fs.writeFileSync(
    CONFIG.reportFile,
    JSON.stringify(report, null, 2),
  );
}

/**
 * Print summary to console
 */
function printSummary() {
  console.log("═══════════════════════════════════════");
  console.log("📋 Migration Summary");
  console.log("═══════════════════════════════════════");
  console.log(`✅ Total strings found: ${stats.totalStrings}`);
  console.log(`✅ Strings migrated: ${stats.migratedStrings}`);
  console.log(`⚠️  Strings skipped: ${stats.skippedStrings}`);
  console.log(`❌ Errors: ${stats.errors.length}`);
  console.log(`⚠️  Warnings: ${stats.warnings.length}`);
  console.log(
    `📊 Success rate: ${((stats.migratedStrings / stats.totalStrings) * 100).toFixed(2)}%`,
  );
  console.log("═══════════════════════════════════════\n");

  if (stats.warnings.length > 0) {
    console.log("⚠️  Warnings:");
    stats.warnings.forEach((w) => console.log(`   - ${w}`));
    console.log();
  }

  if (stats.errors.length > 0) {
    console.log("❌ Errors:");
    stats.errors.forEach((e) => console.log(`   - ${e}`));
    console.log();
  }

  console.log("✨ Migration complete!");
  console.log(
    `📦 Backup available at: ${CONFIG.backupFile}`,
  );
  console.log(
    `📊 Full report available at: ${CONFIG.reportFile}`,
  );
}

// Run migration
migrate().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
