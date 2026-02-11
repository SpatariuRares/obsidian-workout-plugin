#!/usr/bin/env node
/**
 * @fileoverview Test script for i18n migration
 *
 * Tests the transformation logic on a small sample before running on real file.
 */

// Test input
const testInput = `
export const MODAL_UI = {
  TITLES: {
    CREATE_LOG: "Create workout log",
    EDIT_LOG: "Edit workout log",
  },
  BUTTONS: {
    CREATE: "Create log",
    UPDATE: "Update log",
    CANCEL: "Cancel",
  },
};
`;

// Expected output
const expectedOutput = `
export const MODAL_UI = {
  TITLES: {
    get CREATE_LOG() {
      return t("modal.titles.createLog");
    },
    get EDIT_LOG() {
      return t("modal.titles.editLog");
    },
  },
  BUTTONS: {
    get CREATE() {
      return t("modal.buttons.create");
    },
    get UPDATE() {
      return t("modal.buttons.update");
    },
    get CANCEL() {
      return t("modal.buttons.cancel");
    },
  },
};
`;

// Simple transformation test
function transformSimple(content) {
  const propertyRegex = /(\s*)(\w+):\s*"([^"]*)",?/g;
  return content.replace(propertyRegex, (match, indent, key, value) => {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    return `${indent}get ${key}() {\n${indent}  return t("test.${snakeKey}");\n${indent}},`;
  });
}

console.log("🧪 Testing i18n migration transformation...\n");
console.log("INPUT:");
console.log(testInput);
console.log("\nTRANSFORMED:");
const result = transformSimple(testInput);
console.log(result);

console.log("\n✅ Transformation test completed!");
console.log("Review the output above to verify the pattern is correct.");
console.log("\nIf this looks good, run: npm run migrate:i18n");
