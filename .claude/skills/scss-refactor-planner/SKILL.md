---
name: scss-refactor-planner
description: Analyze SCSS folders and propose a complete refactor plan (architecture, tokens, conventions, migration steps). Read-only: no file edits.
allowed-tools: Read, Grep, Glob, Bash(rg *), Bash(find *), Bash(ls *), Bash(wc *), Bash(sort *), Bash(uniq *), Bash(awk *), Bash(sed *), Bash(git *)
disable-model-invocation: false
---

# SCSS Refactor Planner

## Usage (folder selection)

Run:

- `/scss-refactor-planner <path>`
  Examples:
- `/scss-refactor-planner src/styles`
- `/scss-refactor-planner apps/web/src/styles`
- `/scss-refactor-planner .` (not recommended if repo is huge)

If no argument is provided:

1. List top-level folders (`ls -1`)
2. Suggest likely style folders
3. Ask the user to re-run with a folder path
4. Stop

---

## 0) Resolve scope

If `$ARGUMENTS` is empty:

- !`ls -1`
- Say: "Which folder should I analyze? Re-run: /scss-refactor-planner <path>"
- Stop.

Verify path exists:

- !`test -e "$ARGUMENTS" && echo "OK: $ARGUMENTS" || echo "ERROR: path not found: $ARGUMENTS"`

If missing:

- Ask for a valid folder path (include examples)
- Stop.

Define `SCOPE = $ARGUMENTS`.

---

## 1) Rules

- Do not modify files.
- Provide proof for claims (file counts, grep hits, examples of patterns).
- Focus on long-term maintainability and a realistic migration plan.
- Ignore noise by default: `node_modules`, `dist`, `build`, `.git`, `coverage`.

---

## 2) Inventory & map the current SCSS system

### 2.1 Find SCSS files

- !`find "$ARGUMENTS" -type f -name "*.scss" | wc -l`
- !`find "$ARGUMENTS" -type f -name "*.scss" | head -n 80`

### 2.2 Identify entry points and import style

Look for:

- `@use` / `@forward` (modern Sass modules)
- `@import` (legacy)

Commands:

- !`rg -n "@use\\b|@forward\\b|@import\\b" "$ARGUMENTS" | head -n 200`
- !`rg -n "@import\\b" "$ARGUMENTS" | head -n 200`
- !`rg -n "@use\\b|@forward\\b" "$ARGUMENTS" | head -n 200`

### 2.3 Detect “global” files and patterns

- Variables/tokens: `$color`, `$space`, `$font`, `$z-`
- Mixins/placeholders: `@mixin`, `%placeholder`
- Resets/base: `reset`, `normalize`, `base`, `typography`
- Utilities: `.u-`, `.is-`, `.has-`

Commands:

- !`rg -n "\\$[a-zA-Z0-9_-]+" "$ARGUMENTS" | head -n 200`
- !`rg -n "@mixin\\b|@include\\b" "$ARGUMENTS" | head -n 200`
- !`rg -n "^%[a-zA-Z0-9_-]+" "$ARGUMENTS" | head -n 200`
- !`rg -n "\\.(u-|is-|has-)" "$ARGUMENTS" | head -n 200`

---

## 3) Quality checks / anti-pattern scan

### 3.1 Nesting depth hotspots

Find deeply nested selectors (rough signal: many `{` before `}`).

- !`rg -n "\\{" "$ARGUMENTS" | head -n 1` (sanity)

Heuristic: search for selectors with many spaces + `&` or long chains:

- !`rg -n "(&\\.|\\s{2,}\\.[a-zA-Z0-9_-]+\\s+\\.[a-zA-Z0-9_-]+\\s+\\.[a-zA-Z0-9_-]+)" "$ARGUMENTS" | head -n 200`

### 3.2 Specificity, !important, IDs, inline overrides

- !`rg -n "!important" "$ARGUMENTS" | head -n 200`
- !`rg -n "#[a-zA-Z0-9_-]+" "$ARGUMENTS" | head -n 120`

### 3.3 Duplicate raw values (token candidates)

- Colors (hex/rgb/hsl):
  - !`rg -n "#[0-9a-fA-F]{3,8}\\b|rgb\\(|rgba\\(|hsl\\(|hsla\\(" "$ARGUMENTS" | head -n 200`
- Spacing numbers (common duplication):
  - !`rg -n "(:|\\s)([0-9]+)(px|rem|em)\\b" "$ARGUMENTS" | head -n 200`
- z-index:
  - !`rg -n "z-index\\s*:\\s*[0-9]+" "$ARGUMENTS" | head -n 120`

### 3.4 Duplicated selectors/components (signal)

- !`rg -n "^\\.[a-zA-Z0-9_-]+" "$ARGUMENTS" | head -n 200`

---

## 4) Produce a COMPLETE refactor plan (output requirements)

### A) Current State Summary

- Total SCSS files, key folders, import style (`@import` vs `@use`)
- Main entrypoints (global, theme, components)
- Key problems (with evidence): repeated values, deep nesting, !important, inconsistent naming, legacy imports

### B) Target Architecture (choose one and justify)

Pick the best fit for the repo and explain tradeoffs:

1. **ITCSS** (settings/tools/generic/elements/objects/components/utilities)
2. **7-1 pattern** (abstracts/base/components/layout/pages/themes/vendors)
3. **Component-first** (co-located styles per component + shared tokens)

Provide a proposed folder tree and naming conventions.

### C) Design Tokens & Theming Strategy

- Which tokens to extract: colors, spacing, typography, radii, shadows, z-index, breakpoints
- Recommended structure: `_tokens.scss`, `_mixins.scss`, `_functions.scss`
- Theme approach: CSS variables for runtime theming + Sass tokens for compile-time

Include example token naming rules (no need to rewrite the whole codebase, just show the pattern).

### D) Conventions & Rules

Define:

- Naming scheme (BEM-like, or component namespace)
- Max nesting depth recommendation
- When to use mixins vs placeholders vs utilities
- How to handle responsive rules (breakpoint mixins)
- Linting strategy (stylelint) — only as a recommendation (no installation)

### E) Migration Plan (step-by-step, safe)

Must be incremental:

1. Create tokens + base layer
2. Convert entrypoint to `@use/@forward` strategy (if needed)
3. Migrate highest-duplication modules first
4. Replace raw values with tokens
5. Reduce nesting and remove !important where possible
6. Add regression checks (visual smoke, storybook/pages, etc.)

Each step should include:

- What to change
- Expected impact
- Risk
- How to validate

### F) “Top 10 Refactor Targets”

List the highest ROI targets with evidence:

- Files/folders with most duplicates / highest risk patterns
- Suggested extraction or redesign

### G) Appendix

- File list summary
- Key grep hits summary (counts + representative examples)

---

## 5) Important constraint

Do NOT implement changes. Only plan, examples, and guidance.
