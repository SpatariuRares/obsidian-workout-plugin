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
    "app/utils/**/*.ts",
    "app/api/**/*.ts",
    "app/constants/**/*.ts",
    "app/components/**/*.ts",
    "app/services/**/*.ts",
    "app/features/charts/**/*.ts",
    "app/features/tables/**/*.ts",
    "!app/**/*.d.ts",
    "!app/**/__tests__/**",
    "!app/**/index.ts",
  ],
  coverageThreshold: {
    global: {
      statements: 90,
      branches: 90,
      functions: 90,
      lines: 90,
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
