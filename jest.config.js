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
    "app/constants/MuscleTags.ts", // Only include MuscleTags, exclude Constants.ts (config data)
    "app/components/data/**/*.ts",
    "app/components/dashboard/business/DashboardCalculations.ts",
    "app/services/**/*.ts",
    "app/features/charts/components/ChartRenderer.ts",
    "!app/**/*.d.ts",
    "!app/**/__tests__/**",
    "!app/**/index.ts",
    "!app/utils/FrontmatterParser.ts", // Excluded due to Obsidian API mocking issues
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
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
