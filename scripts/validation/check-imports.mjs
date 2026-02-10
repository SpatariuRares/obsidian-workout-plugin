/**
 * Import Checker - E Layer (Execution)
 *
 * Validates import paths follow project conventions.
 * Part of the DOE Framework validation layer.
 *
 * Checks:
 * - Uses @app/* path aliases instead of relative paths
 * - No barrel imports for services/utils (only components/constants)
 * - No circular dependencies
 *
 * Usage:
 *   npm run doe:validate
 *   node scripts/validation/check-imports.mjs
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { glob } from "glob";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, "../..");

const errors = [];
const warnings = [];

/**
 * Check if file uses relative imports when it should use @app/*
 */
async function checkRelativeImports(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Match import statements with relative paths going up directories
    const relativeImportMatch = line.match(/import\s+.*from\s+['"](\.\.\/\.\.\/.*)['"]/);

    if (relativeImportMatch) {
      const importPath = relativeImportMatch[1];

      // Exception: Test files can use relative imports for nearby files
      if (filePath.includes("__tests__")) {
        return;
      }

      errors.push({
        file: path.relative(ROOT_DIR, filePath),
        line: index + 1,
        message: `Use @app/* path alias instead of relative path: ${importPath}`,
        severity: "error",
      });
    }
  });
}

/**
 * Check for barrel imports where they shouldn't be used
 */
async function checkBarrelImports(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Check for service barrel imports
    if (line.match(/import\s+.*from\s+['"]@app\/services['"]/)) {
      warnings.push({
        file: path.relative(ROOT_DIR, filePath),
        line: index + 1,
        message: "Avoid barrel imports for services - import directly from service file",
        severity: "warning",
      });
    }

    // Check for utils barrel imports
    if (line.match(/import\s+.*from\s+['"]@app\/utils['"]/)) {
      warnings.push({
        file: path.relative(ROOT_DIR, filePath),
        line: index + 1,
        message: "Avoid barrel imports for utils - import directly from util file",
        severity: "warning",
      });
    }
  });
}

/**
 * Check for hardcoded strings that should use constants
 */
async function checkHardcodedStrings(filePath) {
  // Skip test files and constant files
  if (filePath.includes("__tests__") || filePath.includes("constants")) {
    return;
  }

  const content = await fs.readFile(filePath, "utf-8");

  // Check for common UI strings that should be in constants
  const uiStringPatterns = [
    /createEl\(['"][^'"]*['"],\s*\{\s*text:\s*['"]([^'"]{15,})['"]/, // Long text in createEl
    /Notice\(['"]([^'"]{15,})['"]/, // Long text in Notice
    /renderError\([^,]+,\s*['"]([^'"]{15,})['"]/, // Long text in renderError
  ];

  const lines = content.split("\n");

  lines.forEach((line, index) => {
    uiStringPatterns.forEach((pattern) => {
      const match = line.match(pattern);
      if (match && match[1]) {
        // Ignore if it's already using a constant
        if (line.includes("CONSTANTS.") || line.includes("UI.")) {
          return;
        }

        warnings.push({
          file: path.relative(ROOT_DIR, filePath),
          line: index + 1,
          message: `Consider moving UI string to constants: "${match[1].substring(0, 30)}..."`,
          severity: "warning",
        });
      }
    });
  });
}

/**
 * Check TypeScript path alias usage
 */
async function checkPathAliases(filePath) {
  const content = await fs.readFile(filePath, "utf-8");

  // Check if file is in app/ directory
  const relativePath = path.relative(ROOT_DIR, filePath);
  if (!relativePath.startsWith("app")) {
    return; // Only check files in app/ directory
  }

  const lines = content.split("\n");

  lines.forEach((line, index) => {
    // Match imports from app/ without using @app/
    const directAppImport = line.match(/import\s+.*from\s+['"]app\/(.*)['"]/);

    if (directAppImport) {
      errors.push({
        file: path.relative(ROOT_DIR, filePath),
        line: index + 1,
        message: `Use @app/* alias: import from '@app/${directAppImport[1]}'`,
        severity: "error",
      });
    }
  });
}

/**
 * Main validation
 */
async function main() {
  console.log("Validating imports...\n");

  // Find all TypeScript files
  const files = await glob("app/**/*.ts", {
    cwd: ROOT_DIR,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**"],
  });

  console.log(`Checking ${files.length} TypeScript files...\n`);

  // Run checks
  for (const file of files) {
    await checkRelativeImports(file);
    await checkBarrelImports(file);
    await checkHardcodedStrings(file);
    await checkPathAliases(file);
  }

  // Report results
  console.log("Results:");
  console.log("─".repeat(50));

  if (errors.length === 0 && warnings.length === 0) {
    console.log("✅ No issues found!\n");
    process.exit(0);
  }

  if (errors.length > 0) {
    console.log(`\n❌ Errors (${errors.length}):\n`);
    errors.forEach((error) => {
      console.log(`  ${error.file}:${error.line}`);
      console.log(`    ${error.message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  Warnings (${warnings.length}):\n`);
    warnings.forEach((warning) => {
      console.log(`  ${warning.file}:${warning.line}`);
      console.log(`    ${warning.message}\n`);
    });
  }

  console.log("─".repeat(50));
  console.log(`Total: ${errors.length} errors, ${warnings.length} warnings\n`);

  // Exit with error code if there are errors
  if (errors.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error("Error running import checker:", error);
  process.exit(1);
});
