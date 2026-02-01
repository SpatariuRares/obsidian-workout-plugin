---
name: find-duplicate-logic
description: Find duplicate business logic (copy/paste blocks + structurally similar functions). Works best on TS/JS projects. Produces a proof-based refactor report.
allowed-tools: Read, Grep, Glob, Bash(rg *), Bash(git *), Bash(node *), Bash(python3 *), Bash(find *), Bash(ls *), Bash(sed *), Bash(awk *), Bash(sort *), Bash(uniq *), Bash(wc *), Bash(test *)
disable-model-invocation: false
---

# Find Duplicate Logic

## How to select the folder

**Preferred usage:** `/find-duplicate-logic <path>`

Examples:

- `/find-duplicate-logic .`
- `/find-duplicate-logic src`
- `/find-duplicate-logic libs/shared`
- `/find-duplicate-logic apps/web`

### If no argument is provided

1. List top-level folders.
2. Ask the user which one to scan.
3. Stop and wait for the user to re-run the command with the chosen path.

---

## 0) Resolve scope (folder selection)

If `$ARGUMENTS` is empty or blank:

- Run: !`ls -1`
- Show a short list of likely project folders (`src`, `apps`, `libs`, `packages`, `backend`, etc.)
- Ask: “Which folder should I scan? Re-run: `/find-duplicate-logic <folder>`”
- Do **not** proceed.

Otherwise:

- Set `SCOPE = $ARGUMENTS`
- Verify the folder exists:
  - !`test -e "$ARGUMENTS" && echo "OK: $ARGUMENTS" || echo "ERROR: path not found: $ARGUMENTS"`

If path is missing:

- Ask the user to provide a valid folder path (examples included).
- Stop.

---

## 1) Rules

- Do **not** modify files.
- Provide **proof** for every duplicate: file path + line ranges and/or a reproducible command.
- Focus on **logic**, not generated boilerplate.
- Ignore noise folders by default: `node_modules`, `dist`, `build`, `.git`, `coverage`.

---

## 2) Quick repo context

- Repo root: !`git rev-parse --show-toplevel 2>/dev/null || pwd`
- Working tree summary: !`git status --porcelain=v1 | head -n 50`

---

## 3) Pass A — Exact-ish duplicates (copy/paste)

Goal: find identical (or near-identical) repeated blocks.

Run a lightweight 8-line window fingerprint over common code files:
!`python3 .claude/scripts/find_duplicates.py "$ARGUMENTS"`

Next:

- Pick the most meaningful hits (not boilerplate).
- Open the relevant files and extract a short snippet (max ~20 lines) as proof.

---

## 4) Pass B — Structural duplicates (similar logic, not identical)

Goal: spot “same algorithm, different names/constants”.

### 4.1 Hotspot searches (heuristics)

Run these and look for repeated patterns in different places:

- Collections / transforms:
  - !`rg -n "(map\\(|reduce\\(|filter\\(|flatMap\\()" "$ARGUMENTS" | head -n 150`
- Error handling:
  - !`rg -n "(try\\s*\\{|catch\\s*\\(|throw\\s+new\\s+Error)" "$ARGUMENTS" | head -n 150`
- HTTP / API calls:
  - !`rg -n "(fetch\\(|axios\\.|HttpClient|http\\.(get|post|put|delete))" "$ARGUMENTS" | head -n 150`
- Formatting / normalization:
  - !`rg -n "(format|formatter|parse|sanitize|normalize|trim\\(|replace\\()" "$ARGUMENTS" | head -n 150`
- Validation:
  - !`rg -n "(validate|validation|schema|zod|yup|joi)" "$ARGUMENTS" | head -n 150`

### 4.2 Function candidates (TS/JS-centric)

Find function declarations / arrow funcs:

- !`rg -n "export\\s+function\\s+\\w+\\(|function\\s+\\w+\\(|const\\s+\\w+\\s*=\\s*\\(.*\\)\\s*=>\\s*\\{" -S "$ARGUMENTS" | head -n 250`

Then:

1. Identify clusters where bodies “feel the same” (same sequence of steps).
2. Read each function body and compare.
3. Mark as **Probable duplicate** when >60% of structure matches.

---

## 5) Output format (final report)

Produce a report with these sections:

### A) Confirmed duplicates (copy/paste)

For each item:

- **Title:** what the logic does
- **Occurrences:** `path:lineStart-lineEnd` list
- **Proof:** short snippet or “how to reproduce” command
- **Risk:** bugfix divergence / inconsistent behavior / extra maintenance
- **Refactor plan:** where to extract (shared util/service), suggested API

### B) Probable duplicates (structural similarity)

For each cluster:

- Files involved
- What differs (constants, small branches, naming)
- Best refactor strategy:
  - parameterized helper
  - shared utility module
  - strategy pattern / adapter
  - shared service with injected config
- Minimal test checklist after refactor

### C) Top 3 quick wins

Pick 3 highest ROI refactors:

- small extraction
- removes most duplication
- lowest risk

---

## 6) Noise control

When you suspect boilerplate/generated code:

- Label it as **Boilerplate / ignore**
- Do not include it in Top 3 quick wins
