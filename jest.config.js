module.exports = {
  // Use Node environment for testing utilities
  // (Obsidian environment not needed for pure utility functions)
  testEnvironment: 'node',

  // Use ts-jest for TypeScript support
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Test file patterns
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage configuration
  collectCoverageFrom: [
    'app/utils/**/*.ts',
    'app/constants/**/*.ts',
    'app/components/data/**/*.ts',
    'app/components/dashboard/DashboardCalculations.ts',
    '!app/**/*.d.ts',
    '!app/**/__tests__/**',
    '!app/**/index.ts',
  ],
   coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },

  // Coverage output
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // TypeScript configuration for ts-jest
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true,
      }
    }
  },

  // Module path aliases (if needed)
  moduleNameMapper: {
    '^obsidian$': '<rootDir>/node_modules/obsidian',
    '^@app/(.*)$': '<rootDir>/app/$1',
  },
};
