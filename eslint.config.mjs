import obsidianmd from "eslint-plugin-obsidianmd";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import importPlugin from "eslint-plugin-import";
import i18nextPlugin from "eslint-plugin-i18next";

export default [
  // Ignore build output and dependencies
  {
    ignores: [
      "main.js",
      "*.js", // Ignore built JS files in root
      "node_modules/**",
      "dist/**",
      "build/**",
      "scripts/**",
      "AI translate/**",
      "*.config.js",
      "*.config.mjs",
      "build-css.mjs",
      "esbuild.config.mjs",
      "version-bump.mjs",
      "**/__tests__/**", // Ignore test files for now
    ],
  },

  // Jest mock files — allow jest globals (jest.fn(), jest.spyOn(), etc.)
  {
    files: ["__mocks__/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ["**/*.ts", "**/*.tsx"],

    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    plugins: {
      obsidianmd,
      import: importPlugin,
      "@typescript-eslint": tsPlugin,
      i18next: i18nextPlugin,
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },

    rules: {
      // Obsidian Plugin Rules
      ...obsidianmd.configs.recommended,

      // Import rules - Enforce @app/* alias usage
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "./*"],
              message:
                "Use @app/* path aliases instead of relative imports across directories. Example: import { MyClass } from '@app/components/MyClass'",
            },
          ],
        },
      ],

      // TypeScript-specific rules
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-enum-comparison": "error",

      // Additional TypeScript/JavaScript best practices
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // i18next/no-literal-string rule removed from here and moved to a targeted block below
    },
  },

  // Targeted rules for UI components (features and components)
  {
    files: [
      "app/features/**/*.ts",
      "app/features/**/*.tsx",
      "app/components/**/*.ts",
      "app/components/**/*.tsx",
    ],
    rules: {
      // i18n - Enforce usage of LocalizationService instead of hardcoded strings in UI code
      "i18next/no-literal-string": [
        "warn",
        {
          mode: "all",
          "should-validate-template": true,
          message: "Use LocalizationService.t() instead of hardcoded strings",
          callees: {
            exclude: [
              "t",
              "i18n(ext)?",
              "require",
              "addEventListener",
              "removeEventListener",
              "getElementById",
              "querySelector(All)?",
              "setAttribute",
              "getAttribute",
              "hasAttribute",
              "removeAttribute",
              "createElement",
              "createDiv",
              "createSpan",
              "addClass",
              "removeClass",
              "toggleClass",
              "hasClass",
              "setCssProps",
              "registerMarkdownCodeBlockProcessor",
              "registerView",
              "addCommand",
              "addRibbonIcon",
              "console\\.(log|warn|error|info|debug)",
              "includes",
              "indexOf",
              "endsWith",
              "startsWith",
              "split",
              "replace",
              "match",
              "join",
              "trim",
              "Error",
              "TypeError",
              "RangeError",
              // Obsidian-specific: icon names, events, paths
              "setIcon",
              "normalizePath",
              "TextDecoder",
              "AgentConfigError",
              "PermissionError",
              ".*\\.trigger",
              ".*\\.on",
              ".*\\.classList\\.contains",
              ".*\\.getAbstractFileByPath",
              ".*\\.getFileByPath",
              ".*\\.getFolderByPath",
              ".*\\.classList\\.(add|remove|toggle)",
            ],
          },
          words: {
            exclude: [
              "[0-9!-/:-@\\[-`{-~]+",
              "[A-Z_-]+",
              // Ignore template strings starting with class variables or general paths
              ".*\\$\\{[A-Z_a-z]+\\}.*",
              // Specifically ignore ${CLS}__something styling variables
              "\\$\\{CLS\\}.*",
              "^(md|txt|json|csv|yaml|yml|xml|html|css|js|ts|py|sh|cfg|ini|toml|log)$",
              "workout-*",
            ],
          },
          "object-properties": {
            exclude: [".*"],
          },
          "class-properties": {
            exclude: [".*"],
          },
        },
      ],
    },
  },
];
