#!/usr/bin/env node
/**
 * Script: Replace constant getters with direct t() calls
 *
 * Finds all constants in ui.constants.ts that are simple getters wrapping t("key"),
 * then replaces their usages across the codebase with direct t("key") calls.
 *
 * Usage:
 *   node scripts/replace-constants-with-i18n.mjs --dry-run   # Preview changes
 *   node scripts/replace-constants-with-i18n.mjs              # Apply changes
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "app");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// ─── Step 1: Parse ui.constants.ts to extract getter → t() mappings ───

function parseGetterMappings() {
  const filePath = path.join(APP_DIR, "constants", "ui.constants.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  // Map: "MODAL_UI.TITLES.CREATE_LOG" → "modal.titles.createLog"
  const mappings = new Map();

  // Match exported const declarations: export const MODAL_UI = {
  const exportConstRegex = /export\s+const\s+(\w+)\s*=\s*\{/g;
  const constNames = [];
  let m;
  while ((m = exportConstRegex.exec(content)) !== null) {
    constNames.push({ name: m[1], startIndex: m.index });
  }

  // For each exported const, find all nested getters with t() calls
  // Pattern: get PROP_NAME() { return t("key"); }
  // We need to track nesting levels to build the full path

  for (const constInfo of constNames) {
    extractGettersFromObject(content, constInfo.name, constInfo.startIndex, mappings);
  }

  return mappings;
}

function extractGettersFromObject(content, rootName, startSearchFrom, mappings) {
  // Find the opening brace of this const
  const constDeclRegex = new RegExp(
    `export\\s+const\\s+${rootName}\\s*=\\s*\\{`
  );
  const constMatch = constDeclRegex.exec(content);
  if (!constMatch) return;

  const objectStart = constMatch.index + constMatch[0].length - 1; // position of {
  const objectEnd = findMatchingBrace(content, objectStart);
  if (objectEnd === -1) return;

  const objectContent = content.substring(objectStart, objectEnd + 1);

  // Recursively find all getters
  findGettersRecursive(objectContent, rootName, [], mappings);
}

function findGettersRecursive(objectStr, rootName, pathParts, mappings) {
  // Remove outer braces
  const inner = objectStr.substring(1, objectStr.length - 1);

  let i = 0;
  while (i < inner.length) {
    // Skip whitespace/newlines
    while (i < inner.length && /\s/.test(inner[i])) i++;
    if (i >= inner.length) break;

    // Check for getter: get PROP_NAME() { return t("key"); }
    const getterMatch = inner.substring(i).match(
      /^get\s+(\w+)\(\)\s*\{\s*return\s+t\(["']([^"']+)["']\);\s*\}/
    );
    if (getterMatch) {
      const propName = getterMatch[1];
      const i18nKey = getterMatch[2];
      const fullPath = [rootName, ...pathParts, propName].join(".");
      mappings.set(fullPath, i18nKey);
      i += getterMatch[0].length;
      // Skip comma
      while (i < inner.length && /[\s,]/.test(inner[i])) i++;
      continue;
    }

    // Check for nested object: PROP_NAME: { ... }
    const nestedMatch = inner.substring(i).match(/^(\w+)\s*:\s*\{/);
    if (nestedMatch) {
      const propName = nestedMatch[1];
      const braceStart = i + nestedMatch.index + nestedMatch[0].length - 1;
      const braceEnd = findMatchingBrace(inner, braceStart);
      if (braceEnd !== -1) {
        const nestedObj = inner.substring(braceStart, braceEnd + 1);
        findGettersRecursive(nestedObj, rootName, [...pathParts, propName], mappings);
        i = braceEnd + 1;
        // Skip comma
        while (i < inner.length && /[\s,]/.test(inner[i])) i++;
        continue;
      }
    }

    // Check for getter with non-t() body, or function, or static prop — skip
    const skipGetterMatch = inner.substring(i).match(/^get\s+\w+\(\)\s*\{/);
    if (skipGetterMatch) {
      const braceStart = i + skipGetterMatch[0].length - 1;
      const braceEnd = findMatchingBrace(inner, braceStart);
      if (braceEnd !== -1) {
        i = braceEnd + 1;
        while (i < inner.length && /[\s,]/.test(inner[i])) i++;
        continue;
      }
    }

    // Skip any other token (static properties, functions, etc.)
    // Find next comma or end
    const nextCommaOrBrace = findNextTopLevelComma(inner, i);
    if (nextCommaOrBrace !== -1) {
      i = nextCommaOrBrace + 1;
    } else {
      break;
    }
  }
}

function findMatchingBrace(str, openPos) {
  if (str[openPos] !== "{" && str[openPos] !== "[") return -1;
  const open = str[openPos];
  const close = open === "{" ? "}" : "]";
  let depth = 1;
  let inString = false;
  let stringChar = "";

  for (let i = openPos + 1; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      if (ch === "\\" ) {
        i++; // skip escaped char
        continue;
      }
      if (ch === stringChar) {
        inString = false;
      }
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === open) depth++;
    if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function findNextTopLevelComma(str, startPos) {
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = startPos; i < str.length; i++) {
    const ch = str[i];

    if (inString) {
      if (ch === "\\") {
        i++;
        continue;
      }
      if (ch === stringChar) inString = false;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === "{" || ch === "[" || ch === "(") depth++;
    if (ch === "}" || ch === "]" || ch === ")") {
      if (depth === 0) return -1; // end of object
      depth--;
    }

    if (ch === "," && depth === 0) return i;
  }
  return -1;
}

// ─── Step 2: Parse CONSTANTS alias mappings from index.ts ───

function parseConstantsAliases(directMappings) {
  const filePath = path.join(APP_DIR, "constants", "index.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  // Build aliases: "CONSTANTS.WORKOUT.MODAL.TITLES.CREATE_LOG" → "MODAL_UI.TITLES.CREATE_LOG"
  // We trace paths like MODAL: MODAL_UI → CONSTANTS.WORKOUT.MODAL.X = MODAL_UI.X
  const aliases = new Map();

  // Simple direct references: PROP: SOME_UI.NESTED.PATH or PROP: SOME_UI
  // Find patterns like: MESSAGES: MESSAGES_UI, or MODAL: MODAL_UI,
  const directRefRegex = /(\w+):\s*((?:MODAL_UI|TABLE_UI|CHARTS_UI|DASHBOARD_UI|GENERAL_UI|MESSAGES_UI|TIMER_UI|FORMS_UI|STATS_UI|TRENDS_UI|TIME_PERIODS_UI|COMMON_UI)(?:\.\w+)*)/g;

  let match;
  while ((match = directRefRegex.exec(content)) !== null) {
    const aliasKey = match[1]; // e.g., "MODAL"
    const sourceRef = match[2]; // e.g., "MODAL_UI"

    // For each direct mapping, check if it points to a known constant path
    for (const [directPath, i18nKey] of directMappings) {
      if (directPath.startsWith(sourceRef + ".") || directPath === sourceRef) {
        const suffix = directPath.substring(sourceRef.length);
        // Build the CONSTANTS path - we need to figure out the full prefix
        // This is complex because CONSTANTS has nested structure
        // For now, store source → alias mapping
      }
    }
  }

  // More targeted approach: scan for known patterns
  // CONSTANTS.WORKOUT.MODAL = MODAL_UI → any MODAL_UI.X.Y = CONSTANTS.WORKOUT.MODAL.X.Y
  const knownAliases = [
    { prefix: "CONSTANTS.WORKOUT.MODAL", source: "MODAL_UI" },
    { prefix: "CONSTANTS.WORKOUT.MESSAGES", source: "MESSAGES_UI" },
    { prefix: "CONSTANTS.WORKOUT.CHARTS.LABELS", source: "CHARTS_UI.LABELS" },
    { prefix: "CONSTANTS.WORKOUT.CHARTS.TYPES", source: "CHARTS_UI.TYPES" },
    { prefix: "CONSTANTS.WORKOUT.TIMER.TYPES", source: "TIMER_UI.TYPES" },
    { prefix: "CONSTANTS.WORKOUT.LABELS.GENERAL", source: "GENERAL_UI.LABELS" },
    { prefix: "CONSTANTS.WORKOUT.LABELS.ACTIONS", source: "GENERAL_UI.ACTIONS" },
    { prefix: "CONSTANTS.WORKOUT.LABELS.LOGS", source: "GENERAL_UI.LOGS" },
    { prefix: "CONSTANTS.WORKOUT.LABELS.DASHBOARD", source: "DASHBOARD_UI" },
    { prefix: "CONSTANTS.WORKOUT.LABELS.CHARTS", source: "CHARTS_UI.LABELS" },
    { prefix: "CONSTANTS.WORKOUT.FORMS.LABELS", source: "FORMS_UI.LABELS" },
    { prefix: "CONSTANTS.WORKOUT.FORMS.PLACEHOLDERS", source: "FORMS_UI.PLACEHOLDERS" },
    { prefix: "CONSTANTS.WORKOUT.STATS.LABELS", source: "STATS_UI.LABELS" },
    { prefix: "CONSTANTS.WORKOUT.TRENDS.STATUS", source: "TRENDS_UI.STATUS" },
    { prefix: "CONSTANTS.WORKOUT.TRENDS.DIRECTIONS", source: "TRENDS_UI.DIRECTIONS" },
    { prefix: "CONSTANTS.WORKOUT.TIME_PERIODS", source: "TIME_PERIODS_UI" },
    { prefix: "CONSTANTS.WORKOUT.COMMON", source: "COMMON_UI" },
    { prefix: "CONSTANTS.WORKOUT.TABLE.MESSAGES", source: "TABLE_UI.MESSAGES" },
    { prefix: "CONSTANTS.WORKOUT.TABLE.TARGET", source: "TABLE_UI.TARGET" },
  ];

  for (const alias of knownAliases) {
    for (const [directPath, i18nKey] of directMappings) {
      if (directPath.startsWith(alias.source + ".")) {
        const suffix = directPath.substring(alias.source.length);
        aliases.set(alias.prefix + suffix, i18nKey);
      } else if (directPath === alias.source) {
        aliases.set(alias.prefix, i18nKey);
      }
    }
  }

  // Also add single-level references from CONSTANTS
  // e.g., CONSTANTS.WORKOUT.MESSAGES.NO_DATA_PERIOD → MESSAGES_UI.NO_DATA_PERIOD
  // These are direct property access, not nested
  const singleProps = [
    { path: "CONSTANTS.WORKOUT.MESSAGES.NO_DATA_PERIOD", source: "MESSAGES_UI.NO_DATA_PERIOD" },
    { path: "CONSTANTS.WORKOUT.MESSAGES.TIMER_COMPLETED", source: "MESSAGES_UI.TIMER_COMPLETED" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.FRONT", source: "GENERAL_UI.LABELS.FRONT" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.BACK", source: "GENERAL_UI.LABELS.BACK" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.MUSCLE_HEAT_MAP", source: "GENERAL_UI.LABELS.MUSCLE_HEAT_MAP" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_DATA", source: "GENERAL_UI.LABELS.WORKOUT_DATA" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.WORKOUT_LOG", source: "GENERAL_UI.LABELS.WORKOUT_LOG" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.CURRENT_FILE", source: "GENERAL_UI.LABELS.CURRENT_FILE" },
    { path: "CONSTANTS.WORKOUT.UI.LABELS.DASHBOARD", source: "GENERAL_UI.LABELS.DASHBOARD" },
  ];
  for (const prop of singleProps) {
    const i18nKey = directMappings.get(prop.source);
    if (i18nKey) {
      aliases.set(prop.path, i18nKey);
    }
  }

  return aliases;
}

// ─── Step 3: Collect all TS files ───

function collectTsFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "i18n") continue;
      collectTsFiles(fullPath, files);
    } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Step 4: Replace usages in files ───

function replaceInFile(filePath, allMappings) {
  const originalContent = fs.readFileSync(filePath, "utf-8");
  let content = originalContent;
  let replacementCount = 0;
  const replacements = [];

  // Skip the constants definition files themselves
  const relativePath = path.relative(ROOT, filePath);
  if (
    relativePath.includes("constants/ui.constants.ts") ||
    relativePath.includes("constants/index.ts")
  ) {
    return { replacementCount: 0, replacements: [] };
  }

  // Sort mappings by length (longest first) to avoid partial replacements
  const sortedMappings = [...allMappings.entries()].sort(
    (a, b) => b[0].length - a[0].length
  );

  for (const [constPath, i18nKey] of sortedMappings) {
    // Build regex to match the constant access
    // Escape dots for regex
    const escapedPath = constPath.replace(/\./g, "\\.");
    // Match the full path as a property access, ensuring it's not part of a larger identifier
    // Also handle destructured access patterns
    const regex = new RegExp(`\\b${escapedPath}\\b`, "g");

    let match;
    while ((match = regex.exec(content)) !== null) {
      // Verify this is actually a property access and not inside a string or comment
      const before = content.substring(Math.max(0, match.index - 200), match.index);

      // Skip if inside a string
      if (isInsideString(content, match.index)) continue;
      // Skip if inside a comment
      if (isInsideComment(before)) continue;
      // Skip if it's a definition (in ui.constants.ts or index.ts)
      if (before.match(/(?:get|set)\s+$/)) continue;

      const replacement = `t("${i18nKey}")`;
      replacements.push({
        original: match[0],
        replacement,
        line: content.substring(0, match.index).split("\n").length,
      });
    }

    // Perform all replacements (do it in reverse to preserve indices)
    content = content.replace(regex, (matched, offset) => {
      if (isInsideString(content, offset)) return matched;
      // Simple check - if inside a comment line
      const lineStart = content.lastIndexOf("\n", offset) + 1;
      const lineContent = content.substring(lineStart, offset);
      if (lineContent.match(/^\s*\/\//) || lineContent.match(/^\s*\*/)) return matched;

      replacementCount++;
      return `t("${i18nKey}")`;
    });
  }

  if (replacementCount === 0) {
    return { replacementCount: 0, replacements: [] };
  }

  // Ensure t import exists
  content = ensureTImport(content);

  // Clean up unused constant imports
  content = cleanupUnusedImports(content, originalContent);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, content, "utf-8");
  }

  return { replacementCount, replacements, content };
}

function isInsideString(content, index) {
  // Simple heuristic: count unescaped quotes before this position on the same line
  const lineStart = content.lastIndexOf("\n", index) + 1;
  const beforeOnLine = content.substring(lineStart, index);

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  for (let i = 0; i < beforeOnLine.length; i++) {
    const ch = beforeOnLine[i];
    if (ch === "\\" ) {
      i++;
      continue;
    }
    if (!inDouble && !inTemplate && ch === "'") inSingle = !inSingle;
    if (!inSingle && !inTemplate && ch === '"') inDouble = !inDouble;
    if (!inSingle && !inDouble && ch === "`") inTemplate = !inTemplate;
  }

  return inSingle || inDouble || inTemplate;
}

function isInsideComment(textBefore) {
  // Check if last line starts with //
  const lastNewline = textBefore.lastIndexOf("\n");
  const lastLine = textBefore.substring(lastNewline + 1);
  if (lastLine.match(/^\s*\/\//)) return true;

  // Check for block comment (simplistic)
  const lastBlockOpen = textBefore.lastIndexOf("/*");
  const lastBlockClose = textBefore.lastIndexOf("*/");
  if (lastBlockOpen > lastBlockClose) return true;

  return false;
}

function ensureTImport(content) {
  // Check if t is already imported
  if (content.match(/import\s*\{[^}]*\bt\b[^}]*\}\s*from\s*["']@app\/i18n["']/)) {
    return content;
  }

  // Check if there's an existing @app/i18n import we can extend
  const existingImport = content.match(
    /import\s*\{([^}]*)\}\s*from\s*["']@app\/i18n["']/
  );
  if (existingImport) {
    const imports = existingImport[1];
    if (!imports.includes("t")) {
      return content.replace(existingImport[0], existingImport[0].replace("{", "{ t, "));
    }
    return content;
  }

  // Add new import after the last import statement
  const lastImport = content.lastIndexOf("\nimport ");
  if (lastImport !== -1) {
    const endOfImport = content.indexOf(";", lastImport);
    if (endOfImport !== -1) {
      return (
        content.substring(0, endOfImport + 1) +
        '\nimport { t } from "@app/i18n";' +
        content.substring(endOfImport + 1)
      );
    }
  }

  // No imports at all, add at top
  return 'import { t } from "@app/i18n";\n' + content;
}

function cleanupUnusedImports(newContent, originalContent) {
  // Find constant imports that might now be unused
  const constantNames = [
    "MODAL_UI", "TABLE_UI", "CHARTS_UI", "DASHBOARD_UI", "GENERAL_UI",
    "MESSAGES_UI", "TIMER_UI", "FORMS_UI", "STATS_UI", "TRENDS_UI",
    "TIME_PERIODS_UI", "COMMON_UI", "CONSTANTS",
    "getDynamicModalLabels", "getDynamicSettingsLabels",
    "getDynamicDashboardLabels", "getDynamicGeneralLabels",
    "getDynamicDataTypeOptions", "getDynamicCommonLabels",
    "getColumnLabels", "DATA_TYPE_NAMES",
  ];

  for (const name of constantNames) {
    // Check if the constant is still used (outside imports)
    const importRegex = new RegExp(
      `import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["'][^"']*["']`
    );
    const importMatch = newContent.match(importRegex);
    if (!importMatch) continue;

    // Count usages outside of import statements
    const contentWithoutImports = newContent.replace(
      /^import\s+.*$/gm,
      ""
    );
    const usageRegex = new RegExp(`\\b${name}\\b`, "g");
    const usages = contentWithoutImports.match(usageRegex);

    if (!usages || usages.length === 0) {
      // Remove this name from the import
      // Handle cases: { NAME }, { NAME, OTHER }, { OTHER, NAME }, { OTHER, NAME, OTHER2 }
      let updated = newContent;

      // Try to remove just this name from the import
      // Pattern: , NAME or NAME,
      updated = updated.replace(
        new RegExp(`(import\\s*\\{[^}]*)\\b${name}\\b\\s*,\\s*`, ""),
        "$1"
      );
      if (updated === newContent) {
        updated = updated.replace(
          new RegExp(`(import\\s*\\{[^}]*),\\s*\\b${name}\\b([^}]*\\})`, ""),
          "$1$2"
        );
      }

      // Check if the import is now empty: import { } from "..."
      updated = updated.replace(
        /import\s*\{\s*\}\s*from\s*["'][^"']*["'];?\n?/g,
        ""
      );

      newContent = updated;
    }
  }

  return newContent;
}

// ─── Main ───

function main() {
  console.log("=== Replace Constants with i18n t() calls ===\n");
  console.log(DRY_RUN ? "MODE: DRY RUN (no files will be modified)\n" : "MODE: APPLY CHANGES\n");

  // Step 1: Parse getter mappings from ui.constants.ts
  console.log("Step 1: Parsing getter mappings from ui.constants.ts...");
  const directMappings = parseGetterMappings();
  console.log(`  Found ${directMappings.size} getter → t() mappings\n`);

  if (VERBOSE) {
    console.log("  Direct mappings:");
    for (const [key, val] of [...directMappings.entries()].slice(0, 10)) {
      console.log(`    ${key} → t("${val}")`);
    }
    if (directMappings.size > 10) console.log(`    ... and ${directMappings.size - 10} more`);
    console.log();
  }

  // Step 2: Parse CONSTANTS aliases
  console.log("Step 2: Parsing CONSTANTS backward-compat aliases...");
  const aliases = parseConstantsAliases(directMappings);
  console.log(`  Found ${aliases.size} CONSTANTS.* aliases\n`);

  // Merge all mappings
  const allMappings = new Map([...directMappings, ...aliases]);
  console.log(`  Total mappings: ${allMappings.size}\n`);

  // Step 3: Collect all TS files
  console.log("Step 3: Collecting TypeScript files...");
  const files = collectTsFiles(APP_DIR);
  // Exclude ui.constants.ts and index.ts from consumer files
  const consumerFiles = files.filter((f) => {
    const rel = path.relative(ROOT, f);
    return !rel.includes("constants/ui.constants.ts") && !rel.includes("constants/index.ts");
  });
  console.log(`  Found ${files.length} .ts files (${consumerFiles.length} consumer files)\n`);

  // Step 4: Replace in files
  console.log("Step 4: Replacing constant usages with t() calls...\n");
  let totalReplacements = 0;
  let filesModified = 0;

  const report = [];

  for (const file of consumerFiles) {
    const { replacementCount, replacements } = replaceInFile(file, allMappings);
    if (replacementCount > 0) {
      const rel = path.relative(ROOT, file);
      filesModified++;
      totalReplacements += replacementCount;
      report.push({ file: rel, count: replacementCount, replacements });

      if (VERBOSE) {
        console.log(`  ${rel}: ${replacementCount} replacements`);
        for (const r of replacements.slice(0, 5)) {
          console.log(`    L${r.line}: ${r.original} → ${r.replacement}`);
        }
        if (replacements.length > 5) {
          console.log(`    ... and ${replacements.length - 5} more`);
        }
      }
    }
  }

  // Step 5: Remove fully-replaced getters from ui.constants.ts
  console.log("\nStep 5: Removing migrated getters from ui.constants.ts...");
  const removed = removeReplacedGetters(allMappings, consumerFiles);
  console.log(`  Removed ${removed} getter(s) from ui.constants.ts\n`);

  // Summary
  console.log("\n=== Summary ===");
  console.log(`  Files modified: ${filesModified}`);
  console.log(`  Total replacements: ${totalReplacements}`);
  console.log(`  Getters removed from ui.constants.ts: ${removed}`);

  if (report.length > 0) {
    console.log("\n  Files changed:");
    for (const entry of report.sort((a, b) => b.count - a.count)) {
      console.log(`    ${entry.file}: ${entry.count} replacements`);
    }
  }

  // Save report
  const reportPath = path.join(ROOT, "i18n-replacement-report.json");
  fs.writeFileSync(reportPath, JSON.stringify({
    dryRun: DRY_RUN,
    timestamp: new Date().toISOString(),
    totalMappings: allMappings.size,
    filesModified,
    totalReplacements,
    gettersRemovedFromConstants: removed,
    mappings: Object.fromEntries(allMappings),
    files: report.map((r) => ({ file: r.file, count: r.count })),
  }, null, 2));
  console.log(`\n  Report saved to: ${reportPath}`);

  if (DRY_RUN) {
    console.log("\n  This was a DRY RUN. No files were modified.");
    console.log("  Run without --dry-run to apply changes.");
  }
}

// ─── Step 5: Remove fully-replaced getters from ui.constants.ts ───

/**
 * Checks if a given constPath (e.g. "MODAL_UI.TITLES.CREATE_LOG") still has
 * any usages in the consumer files (after replacements have been applied).
 */
function isStillUsedInConsumers(constPath, consumerFiles) {
  const escapedPath = constPath.replace(/\./g, "\\.");
  const regex = new RegExp(`\\b${escapedPath}\\b`);
  for (const filePath of consumerFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    if (regex.test(content)) return true;
  }
  return false;
}

/**
 * Removes a specific getter from the ui.constants.ts content,
 * identified by its full dot-separated path (e.g. "MODAL_UI.TITLES.CREATE_LOG").
 * This navigates to the correct parent block before removing, avoiding
 * collisions when the same property name exists in multiple sections.
 *
 * Strategy:
 * 1. Locate the root export const block (e.g. MODAL_UI)
 * 2. Navigate into nested sub-objects following the path parts
 * 3. Remove only the getter inside the correct sub-block
 */
function removeGetterFromContent(content, constPath) {
  const parts = constPath.split(".");
  const rootName = parts[0];       // e.g. "MODAL_UI"
  const propName = parts[parts.length - 1]; // e.g. "CREATE_LOG"

  // Find the root export const block
  const rootRegex = new RegExp(`export\\s+const\\s+${rootName}\\s*=\\s*\\{`);
  const rootMatch = rootRegex.exec(content);
  if (!rootMatch) return { content, removed: false };

  const rootBlockStart = rootMatch.index + rootMatch[0].length - 1;
  const rootBlockEnd = findMatchingBrace(content, rootBlockStart);
  if (rootBlockEnd === -1) return { content, removed: false };

  // Navigate into nested blocks following intermediate path parts
  // e.g. for MODAL_UI.TITLES.CREATE_LOG, navigate into TITLES: {
  let searchStart = rootBlockStart;
  let searchEnd = rootBlockEnd;

  for (let i = 1; i < parts.length - 1; i++) {
    const nestedName = parts[i];
    // Find NESTED_NAME: { within [searchStart, searchEnd]
    const nestedRegex = new RegExp(`\\b${nestedName}\\s*:\\s*\\{`);
    const segment = content.substring(searchStart, searchEnd + 1);
    const nestedMatch = nestedRegex.exec(segment);
    if (!nestedMatch) return { content, removed: false };

    const nestedOpenPos = searchStart + nestedMatch.index + nestedMatch[0].length - 1;
    const nestedClosePos = findMatchingBrace(content, nestedOpenPos);
    if (nestedClosePos === -1) return { content, removed: false };

    searchStart = nestedOpenPos;
    searchEnd = nestedClosePos;
  }

  // Now find and remove the getter for propName within [searchStart, searchEnd]
  // Pattern: optional whitespace + get PROP_NAME() { ... },
  const getterPattern = new RegExp(
    `[ \\t]*get ${propName}\\(\\)\\s*\\{[^}]*\\},?\\r?\\n?`
  );
  const segment = content.substring(searchStart, searchEnd + 1);
  const newSegment = segment.replace(getterPattern, "");

  if (newSegment === segment) return { content, removed: false };

  const updated = content.substring(0, searchStart) + newSegment + content.substring(searchEnd + 1);
  return { content: updated, removed: true };
}

/**
 * Removes empty nested objects from ui.constants.ts content.
 * E.g.: TITLES: {\n  },  becomes nothing.
 * Repeats until stable (handles multiple nesting levels).
 */
function removeEmptyBlocks(content) {
  let prev;
  do {
    prev = content;
    // Match: PROP_NAME: {\n   (only whitespace)  },
    content = content.replace(
      /[ \t]*\w+\s*:\s*\{\s*\},?\r?\n?/g,
      ""
    );
  } while (content !== prev);
  return content;
}

/**
 * Main function for Step 5: iterates over all directMappings, checks which
 * getters are no longer used in consumer files, removes them from
 * ui.constants.ts, and then cleans up any empty blocks.
 */
function removeReplacedGetters(allMappings, consumerFiles) {
  const uiConstantsPath = path.join(APP_DIR, "constants", "ui.constants.ts");
  let content = fs.readFileSync(uiConstantsPath, "utf-8");
  let removedCount = 0;

  for (const [constPath] of allMappings) {
    // Only handle direct paths (MODAL_UI.*, TABLE_UI.*, etc.), not CONSTANTS.* aliases
    if (constPath.startsWith("CONSTANTS.")) continue;

    // Check if still used in any consumer file
    if (isStillUsedInConsumers(constPath, consumerFiles)) {
      if (VERBOSE) {
        console.log(`  Keeping ${constPath} (still used in consumers)`);
      }
      continue;
    }

    // Also check if used in index.ts (through aliases)
    const indexPath = path.join(APP_DIR, "constants", "index.ts");
    const indexContent = fs.readFileSync(indexPath, "utf-8");
    const escapedPath = constPath.replace(/\./g, "\\.");
    const indexRegex = new RegExp(`\\b${escapedPath}\\b`);
    if (indexRegex.test(indexContent)) {
      if (VERBOSE) {
        console.log(`  Keeping ${constPath} (referenced in index.ts)`);
      }
      continue;
    }

    const { content: updated, removed } = removeGetterFromContent(content, constPath);
    if (removed) {
      content = updated;
      removedCount++;
      if (VERBOSE) {
        console.log(`  Removed getter: ${constPath}`);
      }
    }
  }

  // Clean up empty nested blocks
  content = removeEmptyBlocks(content);

  if (!DRY_RUN && removedCount > 0) {
    fs.writeFileSync(uiConstantsPath, content, "utf-8");
    console.log(`  ui.constants.ts updated.`);
  } else if (DRY_RUN && removedCount > 0) {
    console.log(`  DRY RUN: would remove ${removedCount} getter(s) from ui.constants.ts`);
  }

  return removedCount;
}

main();
