module.exports = {
  // Use Node environment for testing utilities
  // (Obsidian environment not needed for pure utility functions)
  testEnvironment: "node",

  // Use ts-jest for TypeScript support
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },

  // Test file patterns
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.test.ts"],

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  // Coverage configuration
  collectCoverageFrom: [
    "app/**/*.ts",
    "!app/**/*.d.ts",
    "!app/**/__tests__/**",
    "!app/**/index.ts",
  ],
  // Floor at the real whole-app level (measured over all of app/), so
  // coverage cannot drop. Raise these when you add tests; never lower them.
  coverageThreshold: {
    global: {
      statements: 55,
      branches: 56,
      functions: 51,
      lines: 55,
    },
  },

  // Coverage output
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],

  // TypeScript configuration for ts-jest
  globals: {
    "ts-jest": {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
      },
    },
  },

  // Module path aliases (if needed)
  moduleNameMapper: {
    "^obsidian$": "<rootDir>/__mocks__/obsidian.ts",
    "^@app/(.*)$": "<rootDir>/app/$1",
  },
};
