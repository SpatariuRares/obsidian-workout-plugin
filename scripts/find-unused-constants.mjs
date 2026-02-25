#!/usr/bin/env node

/**
 * Find Unused Constants Script
 *
 * Scans all exported constants from app/constants/ and checks if they are
 * used anywhere in the codebase (excluding constant files themselves and tests).
 *
 * Analyzes:
 * - Top-level exports (e.g., MODAL_UI, ERROR_MESSAGES)
 * - Nested keys (e.g., MODAL_UI.TITLES, ERROR_MESSAGES.CSV_NOT_FOUND)
 * - Exported functions (e.g., getUnitsMap, getColumnLabels)
 * - CONSTANTS.WORKOUT.* backward-compatible paths
 * - Cross-references barrel-only constants with CONSTANTS.WORKOUT.* usage
 *
 * Usage: node scripts/find-unused-constants.mjs [--verbose] [--json]
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, relative, resolve } from "path";

// ─── Configuration ──────────────────────────────────────────────────────────

const ROOT = resolve(process.cwd());
const CONSTANTS_DIR = join(ROOT, "app/constants");
const APP_DIR = join(ROOT, "app");

const CONSTANT_FILES = [
  "ui.constants.ts",
  "defaults.constants.ts",
  "muscles.constants.ts",
  "validation.constants.ts",
  "exerciseTypes.constants.ts",
];

// Directories/patterns to skip when searching for usages
const SKIP_PATTERNS = [
  "app/constants/",
  "__tests__/",
  "__mocks__/",
  "node_modules/",
  ".git/",
  "dist/",
  "scripts/find-unused-constants",
];

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const verbose = args.includes("--verbose") || args.includes("-v");
const jsonOutput = args.includes("--json");

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Collect all .ts files under a directory, excluding skip patterns */
function collectTsFiles(dir, skipPatterns) {
  const results = [];
  function walk(currentDir) {
    let entries;
    try {
      entries = readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relPath = relative(ROOT, fullPath);
      if (skipPatterns.some((p) => relPath.includes(p))) continue;
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        results.push(fullPath);
      }
    }
  }
  walk(dir);
  return results;
}

/** Extract `export const NAME` and `export function NAME` from file content */
function extractTopLevelExports(content) {
  const exports = [];
  let match;

  const constRegex = /^export\s+const\s+(\w+)\s*[=:]/gm;
  while ((match = constRegex.exec(content)) !== null) {
    exports.push({ name: match[1], type: "const" });
  }

  const funcRegex = /^export\s+function\s+(\w+)\s*\(/gm;
  while ((match = funcRegex.exec(content)) !== null) {
    exports.push({ name: match[1], type: "function" });
  }

  return exports;
}

/**
 * Extract top-level keys from an object literal using a state-machine parser.
 * Correctly handles strings, comments, and nested braces.
 */
function extractObjectKeys(content, constName) {
  const startPattern = new RegExp(
    `(?:export\\s+)?const\\s+${escapeRegex(constName)}\\s*(?::[^=]*)?=\\s*\\{`
  );
  const startMatch = startPattern.exec(content);
  if (!startMatch) return [];

  const startIdx = startMatch.index + startMatch[0].length;
  const keys = [];
  let depth = 1;
  let i = startIdx;
  let inString = false;
  let stringChar = "";
  let inLineComment = false;
  let inBlockComment = false;
  let currentLine = "";

  while (i < content.length && depth > 0) {
    const ch = content[i];
    const next = i + 1 < content.length ? content[i + 1] : "";

    // Handle strings
    if (!inLineComment && !inBlockComment) {
      if (inString) {
        if (ch === stringChar && content[i - 1] !== "\\") inString = false;
        i++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        inString = true;
        stringChar = ch;
        i++;
        continue;
      }
    }

    // Handle comments
    if (!inString && !inBlockComment && ch === "/" && next === "/") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (!inString && !inLineComment && ch === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (inLineComment && ch === "\n") {
      inLineComment = false;
      if (depth === 1) {
        tryExtractKey(currentLine, keys);
        currentLine = "";
      }
      i++;
      continue;
    }
    if (inBlockComment && ch === "*" && next === "/") {
      inBlockComment = false;
      i += 2;
      continue;
    }
    if (inLineComment || inBlockComment) {
      i++;
      continue;
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }

    if (depth === 1) {
      if (ch === "\n") {
        tryExtractKey(currentLine, keys);
        currentLine = "";
      } else {
        currentLine += ch;
      }
    }

    i++;
  }

  if (currentLine.trim()) tryExtractKey(currentLine, keys);
  return [...new Set(keys)];
}

const RESERVED = new Set([
  "return", "const", "let", "var", "if", "else", "export", "import", "function",
]);

function tryExtractKey(line, keys) {
  const trimmed = line.trim();
  if (!trimmed) return;
  const m = trimmed.match(/^(?:get\s+)?([A-Z_][A-Z0-9_a-z]*)\s*(?:\(|:|,\s*$)/);
  if (m && !RESERVED.has(m[1])) {
    keys.push(m[1]);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── File Content Cache ─────────────────────────────────────────────────────

/** Cache file contents to avoid repeated disk reads */
const fileContentCache = new Map();

function getFileContent(filePath) {
  if (!fileContentCache.has(filePath)) {
    fileContentCache.set(filePath, readFileSync(filePath, "utf-8"));
  }
  return fileContentCache.get(filePath);
}

/** Count occurrences of a pattern (word-boundary) in cached source files */
function countUsages(pattern, sourceFiles) {
  let count = 0;
  const usageFiles = [];
  const regex = new RegExp(`\\b${escapeRegex(pattern)}\\b`, "g");

  for (const file of sourceFiles) {
    const content = getFileContent(file);
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      usageFiles.push({ file: relative(ROOT, file), count: matches.length });
    }
  }
  return { count, files: usageFiles };
}

/** Count occurrences of a dot-path pattern (e.g., MODAL_UI.TITLES) */
function countDotPathUsages(dotPath, sourceFiles) {
  let count = 0;
  const usageFiles = [];
  const regex = new RegExp(escapeRegex(dotPath), "g");

  for (const file of sourceFiles) {
    const content = getFileContent(file);
    const matches = content.match(regex);
    if (matches) {
      count += matches.length;
      usageFiles.push({ file: relative(ROOT, file), count: matches.length });
    }
  }
  return { count, files: usageFiles };
}

// ─── CONSTANTS.WORKOUT Mapping ──────────────────────────────────────────────

/**
 * Build a mapping from modular constant names to their CONSTANTS.WORKOUT.* paths.
 * This allows detecting if a "barrel-only" constant is actually used via
 * the backward-compatible CONSTANTS object.
 */
function buildConstantsWorkoutMapping(indexContent) {
  // Manual mapping based on known structure in index.ts
  // Format: modularName -> CONSTANTS.WORKOUT path(s) that reference it
  const mapping = new Map();

  // Parse the CONSTANTS object to find references like `MODAL: MODAL_UI`
  // or `LABELS: FORMS_UI.LABELS`
  const refRegex = /(\w+):\s*(\w+)(?:\.(\w+))?/g;
  let match;

  // Extract the CONSTANTS.WORKOUT block
  const workoutIdx = indexContent.indexOf("WORKOUT: {");
  if (workoutIdx === -1) return mapping;

  const workoutStart = workoutIdx + "WORKOUT: {".length;
  let braces = 1;
  let wi = workoutStart;
  while (wi < indexContent.length && braces > 0) {
    if (indexContent[wi] === "{") braces++;
    else if (indexContent[wi] === "}") braces--;
    wi++;
  }

  const workoutBlock = indexContent.slice(workoutStart, wi);

  // Find all references to modular constants within the WORKOUT block
  for (const constFile of CONSTANT_FILES) {
    const filePath = join(CONSTANTS_DIR, constFile);
    if (!existsSync(filePath)) continue;
    const content = readFileSync(filePath, "utf-8");
    const exports = extractTopLevelExports(content);

    for (const exp of exports) {
      if (exp.type !== "const") continue;
      // Check if this export name appears in the WORKOUT block
      const nameRegex = new RegExp(`\\b${exp.name}\\b`, "g");
      if (nameRegex.test(workoutBlock)) {
        if (!mapping.has(exp.name)) mapping.set(exp.name, []);
        mapping.get(exp.name).push("CONSTANTS.WORKOUT.*");
      }
    }
  }

  return mapping;
}

// ─── Main ───────────────────────────────────────────────────────────────────

function main() {
  const BLUE = "\x1b[34m";
  const GREEN = "\x1b[32m";
  const YELLOW = "\x1b[33m";
  const RED = "\x1b[31m";
  const DIM = "\x1b[2m";
  const BOLD = "\x1b[1m";
  const RESET = "\x1b[0m";

  console.log();
  console.log(`${BOLD}${"=".repeat(70)}${RESET}`);
  console.log(`${BOLD}  UNUSED CONSTANTS FINDER${RESET}`);
  console.log(`${BOLD}${"=".repeat(70)}${RESET}`);
  console.log(`${DIM}  Root: ${ROOT}${RESET}`);
  console.log();

  // 1. Collect source files
  const sourceFiles = collectTsFiles(APP_DIR, SKIP_PATTERNS);
  const rootTsFiles = readdirSync(ROOT)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .map((f) => join(ROOT, f));
  const allSourceFiles = [...sourceFiles, ...rootTsFiles];
  console.log(`${DIM}  Scanning ${allSourceFiles.length} source files...${RESET}\n`);

  const indexContent = getFileContent(join(CONSTANTS_DIR, "index.ts"));
  const constantsMapping = buildConstantsWorkoutMapping(indexContent);

  // 2. Results accumulator
  const results = {
    unused: [],       // Completely unused (not in source, not in barrel)
    barrelOnly: [],   // Only in barrel/index.ts, but CONSTANTS.WORKOUT.* IS used
    deadNested: [],   // Nested keys never accessed
    unusedFunctions: [], // Exported functions never called
    stats: { totalExports: 0, totalKeys: 0 },
  };

  // 3. Analyze each constant file
  for (const fileName of CONSTANT_FILES) {
    const filePath = join(CONSTANTS_DIR, fileName);
    if (!existsSync(filePath)) continue;

    console.log(`${BOLD}  ${fileName}${RESET}`);

    const content = getFileContent(filePath);
    const exports = extractTopLevelExports(content);

    for (const exp of exports) {
      results.stats.totalExports++;
      const usage = countUsages(exp.name, allSourceFiles);
      const indexUsageCount = (indexContent.match(new RegExp(`\\b${exp.name}\\b`, "g")) || []).length;
      const isUsedInSource = usage.count > 0;
      const isInBarrel = indexUsageCount > 0;

      if (exp.type === "function") {
        if (!isUsedInSource) {
          results.unusedFunctions.push({ file: fileName, name: exp.name });
          console.log(`    ${RED}UNUSED${RESET} fn ${exp.name}()`);
        } else if (verbose) {
          console.log(`    ${GREEN}OK${RESET}     fn ${exp.name}() ${DIM}(${usage.count} refs)${RESET}`);
        }
        continue;
      }

      // For const exports
      if (isUsedInSource) {
        if (verbose) {
          console.log(`    ${GREEN}OK${RESET}     ${exp.name} ${DIM}(${usage.count} refs in ${usage.files.length} files)${RESET}`);
        }
      } else if (isInBarrel) {
        // Barrel-only: check if used via CONSTANTS.WORKOUT.*
        const isUsedViaConstants = constantsMapping.has(exp.name);
        if (isUsedViaConstants) {
          results.barrelOnly.push({ file: fileName, name: exp.name, viaConstants: true });
          if (verbose) {
            console.log(`    ${YELLOW}COMPAT${RESET}  ${exp.name} ${DIM}(only via CONSTANTS.WORKOUT.*)${RESET}`);
          }
        } else {
          results.unused.push({ file: fileName, name: exp.name, type: exp.type });
          console.log(`    ${RED}UNUSED${RESET} ${exp.name} ${DIM}(in barrel but never imported)${RESET}`);
        }
      } else {
        results.unused.push({ file: fileName, name: exp.name, type: exp.type });
        console.log(`    ${RED}UNUSED${RESET} ${exp.name}`);
      }

      // Nested keys analysis
      const nestedKeys = extractObjectKeys(content, exp.name);
      for (const key of nestedKeys) {
        results.stats.totalKeys++;
        const nestedUsage = countDotPathUsages(`${exp.name}.${key}`, allSourceFiles);
        const nestedInIndex = indexContent.includes(`${exp.name}.${key}`);

        if (nestedUsage.count === 0 && !nestedInIndex) {
          results.deadNested.push({
            file: fileName,
            parent: exp.name,
            key,
            path: `${exp.name}.${key}`,
          });
          console.log(`    ${RED}UNUSED${RESET}   .${key}`);
        } else if (nestedUsage.count === 0 && nestedInIndex) {
          // In barrel only - might be used via CONSTANTS.WORKOUT.*
          if (verbose) {
            console.log(`    ${YELLOW}COMPAT${RESET}   .${key} ${DIM}(barrel-only → CONSTANTS.WORKOUT.*)${RESET}`);
          }
        } else if (verbose) {
          console.log(`    ${GREEN}OK${RESET}       .${key} ${DIM}(${nestedUsage.count} refs)${RESET}`);
        }
      }
    }
    console.log();
  }

  // 4. Analyze CONSTANTS.WORKOUT.* paths directly
  console.log(`${BOLD}  CONSTANTS.WORKOUT.* (backward-compat paths)${RESET}`);

  const workoutIdx = indexContent.indexOf("WORKOUT: {");
  if (workoutIdx !== -1) {
    const workoutStart = workoutIdx + "WORKOUT: {".length;
    let braces = 1;
    let wi = workoutStart;
    let workoutBody = "";
    while (wi < indexContent.length && braces > 0) {
      if (indexContent[wi] === "{") braces++;
      else if (indexContent[wi] === "}") braces--;
      if (braces > 0) workoutBody += indexContent[wi];
      wi++;
    }

    // Extract depth-1 keys of WORKOUT
    const workoutKeys = [];
    let wd = 0;
    for (const line of workoutBody.split("\n")) {
      const trimmed = line.trim();
      for (const ch of trimmed) {
        if (ch === "{") wd++;
        else if (ch === "}") wd--;
      }
      if (wd === 0) {
        const km = trimmed.match(/^([A-Z_][A-Z0-9_]*)\s*(?::|,)/);
        if (km) workoutKeys.push(km[1]);
      }
    }

    let usedPaths = 0;
    let unusedPaths = 0;

    for (const wKey of workoutKeys) {
      const path = `CONSTANTS.WORKOUT.${wKey}`;
      const usage = countUsages(path, allSourceFiles);
      results.stats.totalKeys++;

      if (usage.count === 0) {
        unusedPaths++;
        results.deadNested.push({
          file: "index.ts",
          parent: "CONSTANTS.WORKOUT",
          key: wKey,
          path,
        });
        console.log(`    ${RED}UNUSED${RESET} ${path}`);
      } else {
        usedPaths++;
        if (verbose) {
          console.log(`    ${GREEN}OK${RESET}     ${path} ${DIM}(${usage.count} refs)${RESET}`);
        }
      }
    }

    if (!verbose && usedPaths > 0) {
      console.log(`    ${DIM}...${usedPaths} paths in use (use --verbose to see all)${RESET}`);
    }
    if (unusedPaths === 0) {
      console.log(`    ${GREEN}All CONSTANTS.WORKOUT.* paths are in use${RESET}`);
    }
  }

  // ─── Final Report ─────────────────────────────────────────────────

  console.log();
  console.log(`${BOLD}${"=".repeat(70)}${RESET}`);
  console.log(`${BOLD}  REPORT${RESET}`);
  console.log(`${BOLD}${"=".repeat(70)}${RESET}`);
  console.log();
  console.log(`  ${DIM}Scanned: ${results.stats.totalExports} exports, ${results.stats.totalKeys} nested keys${RESET}`);
  console.log();

  // Completely unused top-level exports
  if (results.unused.length > 0) {
    console.log(`  ${RED}${BOLD}Completely unused exports (safe to remove):${RESET}`);
    for (const e of results.unused) {
      console.log(`    ${RED}-${RESET} ${e.name} ${DIM}(${e.type}) in ${e.file}${RESET}`);
    }
    console.log();
  }

  // Unused functions
  if (results.unusedFunctions.length > 0) {
    console.log(`  ${RED}${BOLD}Unused exported functions:${RESET}`);
    for (const e of results.unusedFunctions) {
      console.log(`    ${RED}-${RESET} ${e.name}() ${DIM}in ${e.file}${RESET}`);
    }
    console.log();
  }

  // Dead nested keys (grouped by file)
  if (results.deadNested.length > 0) {
    console.log(`  ${YELLOW}${BOLD}Unused nested keys:${RESET}`);
    const byFile = {};
    for (const k of results.deadNested) {
      if (!byFile[k.file]) byFile[k.file] = [];
      byFile[k.file].push(k);
    }
    for (const [file, keys] of Object.entries(byFile)) {
      console.log(`    ${DIM}${file}:${RESET}`);
      for (const k of keys) {
        console.log(`      ${YELLOW}-${RESET} ${k.path}`);
      }
    }
    console.log();
  }

  // Barrel-only / backward-compat summary
  if (results.barrelOnly.length > 0) {
    console.log(`  ${BLUE}${BOLD}Used only via CONSTANTS.WORKOUT.* (backward-compat):${RESET}`);
    console.log(`  ${DIM}These are not directly imported but accessed via the CONSTANTS object.${RESET}`);
    console.log(`  ${DIM}Consider migrating consumers to direct imports.${RESET}`);
    for (const e of results.barrelOnly) {
      console.log(`    ${BLUE}-${RESET} ${e.name} ${DIM}in ${e.file}${RESET}`);
    }
    console.log();
  }

  // Totals
  const totalUnused = results.unused.length + results.unusedFunctions.length;
  const totalDeadKeys = results.deadNested.length;

  console.log(`${BOLD}${"─".repeat(70)}${RESET}`);
  console.log(
    `  ${totalUnused > 0 ? RED : GREEN}${BOLD}${totalUnused}${RESET} unused exports  |  ` +
    `${totalDeadKeys > 0 ? YELLOW : GREEN}${BOLD}${totalDeadKeys}${RESET} unused nested keys  |  ` +
    `${BLUE}${BOLD}${results.barrelOnly.length}${RESET} barrel-only`
  );
  console.log(`${BOLD}${"─".repeat(70)}${RESET}`);
  console.log();

  // JSON output
  if (jsonOutput) {
    const outPath = join(ROOT, "unused-constants-report.json");
    writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`  JSON report: ${outPath}\n`);
  }

  // Exit code: 1 if completely unused exports exist
  if (totalUnused > 0) {
    process.exit(1);
  }
}

main();
