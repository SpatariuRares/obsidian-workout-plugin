import obsidianmd from "eslint-plugin-obsidianmd";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import importPlugin from "eslint-plugin-import";

export default [
  // Ignore build output and dependencies
  {
    ignores: [
      "main.js",
      "*.js", // Ignore built JS files in root
      "node_modules/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.mjs",
      "build-css.mjs",
      "esbuild.config.mjs",
      "version-bump.mjs",
      "**/__tests__/**", // Ignore test files for now
    ]
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      }
    },

    plugins: {
      obsidianmd,
      import: importPlugin
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        }
      }
    },

    rules: {
      // Import rules - Enforce @app/* alias usage
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["../*", "./*"],
            message: "Use @app/* path aliases instead of relative imports across directories. Example: import { MyClass } from '@app/components/MyClass'"
          }
        ]
      }],

      // Additional TypeScript/JavaScript best practices
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
    }
  }
];
