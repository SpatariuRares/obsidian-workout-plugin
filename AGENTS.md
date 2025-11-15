# Repository Guidelines

## Project Structure & Module Organization
Core logic lives in `app/`, split into `business` (calculations), `components`, `features`, `modals`, `services`, `settings`, `types`, `utils`, and `views`. `main.ts` boots these modules inside Obsidian. Styling sits in `styles/`; `styles.source.css` feeds the generated `styles.css`. Top-level build helpers (`esbuild.config.mjs`, `build-css.mjs`, `version-bump.mjs`) and manifest files stay at the repo root. Tests are colocated with the code they cover under `__tests__/`.

## Build, Test, and Development Commands
- `npm run dev` - build CSS and start esbuild in watch mode for live reload inside your vault.
- `npm run build` - run `tsc` for type safety, rebuild CSS, and emit optimized JS for release.
- `npm run test` / `npm run test:watch` - execute the Jest suite once or interactively.
- `npm run test:coverage` - enforce the 80% coverage thresholds defined in `jest.config.js`.
- `npm run lint` / `npm run lint:fix` - apply ESLint's rules (including the `@app/*` import guard) and auto-fix safe issues.
- `npm run version` - bump `manifest.json` plus `versions.json` prior to tagging builds.

## Coding Style & Naming Conventions
Implement features in TypeScript and prefer the `@app/...` alias over deep relative imports. ESLint adds guardrails like `no-floating-promises`, `prefer-const`, and `no-console` warnings: keep the tree lint-clean before opening a PR. Format code with Prettier's two-space indentation, LF endings, and trailing newlines. Favor PascalCase for classes, camelCase for functions, and SCREAMING_SNAKE_CASE for entries in `app/constants`. Keep DOM and Obsidian APIs inside `components` or `views`; share pure logic via `business`, `services`, or `utils`.

## Testing Guidelines
Jest targets `.test.ts` files or any spec under `__tests__/`. Mirror the module path for new suites (example: `app/utils/__tests__/DateFormatter.test.ts`) and rely on `ts-jest` for TypeScript support. Run `npm run test:coverage` before reviews to confirm the global 80% statement/branch/function/line targets. Mock Obsidian primitives with `jest-environment-obsidian` helpers and await async work before assertions. Keep fixtures light; reference `data.json` only when workflows truly need sample content.

## Commit & Pull Request Guidelines
The history favors Conventional-Commit prefixes such as `feat:` and `refactor:` with an imperative summary (`git log --oneline` shows recent examples). Match that tone, keep unrelated concerns out of the same commit, and describe migrations clearly. Pull requests should describe scope, list the verification commands you ran (tests, lint, build), link relevant issues, and include before/after screenshots for UI-facing work like dashboards or modals so reviewers can validate behavior quickly.
