---
name: compare-branches-report
description: Compare two git branches and produce a structured change report (no merge strategy). Includes file/commit summaries, key diffs, and risk hotspots.
allowed-tools: Read, Grep, Glob, Bash(git *), Bash(rg *), Bash(ls *), Bash(sed *), Bash(awk *), Bash(sort *), Bash(uniq *), Bash(wc *)
disable-model-invocation: false
---

# Compare Branches Report (No Merge Strategy)

## Usage

Run:

- `/compare-branches-report <base_branch> <target_branch>`
  Examples:
- `/compare-branches-report main feature/login-refactor`
- `/compare-branches-report develop release/1.9.0`

### If arguments are missing

1. List local branches.
2. Ask the user to re-run with two branch names.
3. Stop.

---

## 0) Resolve inputs

Parse `$ARGUMENTS` into:

- `BASE`
- `TARGET`

If `BASE` or `TARGET` is missing:

- Show branches:
  - !`git branch --format="%(refname:short)" | head -n 40`
  - !`git branch -r --format="%(refname:short)" | head -n 40`
- Ask: “Re-run: `/compare-branches-report <base_branch> <target_branch>`”
- Stop.

Verify branches exist (local or remote):

- !`git show-ref --verify --quiet "refs/heads/$BASE" && echo "OK local: $BASE" || echo "Not local: $BASE"`
- !`git show-ref --verify --quiet "refs/heads/$TARGET" && echo "OK local: $TARGET" || echo "Not local: $TARGET"`
- !`git rev-parse --verify --quiet "$BASE" >/dev/null && echo "OK resolvable: $BASE" || echo "ERROR: cannot resolve $BASE"`
- !`git rev-parse --verify --quiet "$TARGET" >/dev/null && echo "OK resolvable: $TARGET" || echo "ERROR: cannot resolve $TARGET"`

If resolution fails:

- Ask user to fetch or provide correct names.
- Stop.

Optional (safe) fetch:

- !`git fetch --all --prune 2>/dev/null || true`

Define comparison range as:

- `RANGE = $BASE..$TARGET`
  and common ancestor:
- !`git merge-base "$BASE" "$TARGET"`

---

## 1) Rules

- Do not modify files.
- Do not propose or discuss merge strategies (no merge/rebase/squash guidance).
- Focus on “what changed”, “where”, “risk”, and “how to validate”.

---

## 2) High-level summary

- Repo root:
  - !`git rev-parse --show-toplevel 2>/dev/null || pwd`
- Current HEAD:
  - !`git rev-parse --abbrev-ref HEAD`
- Compare:
  - Base: `$BASE`
  - Target: `$TARGET`

---

## 3) File-level impact

### 3.1 Diff stats

- !`git diff --stat "$BASE..$TARGET"`
- !`git diff --shortstat "$BASE..$TARGET"`
- !`git diff --numstat "$BASE..$TARGET" | head -n 200`

### 3.2 Changed files (by status)

- !`git diff --name-status "$BASE..$TARGET" | head -n 300`

### 3.3 Categorize by file type / area

Generate a quick breakdown (frontend/backend/config/tests/docs):

- !`git diff --name-only "$BASE..$TARGET" | awk -F/ '{print $1}' | sort | uniq -c | sort -nr | head -n 30`

Also highlight common important folders if present:

- !`git diff --name-only "$BASE..$TARGET" | rg -n "^(src|apps|libs|packages|server|backend|api|infra|.github|docker|k8s|helm|migrations|test|tests|docs)/" | head -n 200 || true`

---

## 4) Commit-level summary

### 4.1 Commits in target not in base

- !`git log --oneline --decorate "$BASE..$TARGET" --max-count=80`

### 4.2 Grouped commit messages (optional signal)

- !`git log --pretty=format:"%s" "$BASE..$TARGET" | head -n 120`

### 4.3 Authors (useful for coordination)

- !`git log --format="%an" "$BASE..$TARGET" | sort | uniq -c | sort -nr | head -n 20`

---

## 5) Key diffs (content)

Pick the most important files to open and summarize:

- Prioritize:
  - config changes: package.json, lockfiles, tsconfig, eslint, env, CI
  - routing/auth/security layers
  - shared libraries/utilities
  - API contracts / DTOs / schemas
  - database migrations

Helpful commands:

- Show patch for a specific file:
  - `git diff "$BASE..$TARGET" -- <path>`
- Show only function-level context:
  - `git diff "$BASE..$TARGET" -U3 -- <path>`

If too large:

- Focus on “what changed” bullets per file rather than full diff reproduction.

---

## 6) Hotspot detection (risk areas)

Scan changed files for typical risky patterns (only within changed files list):

1. Collect changed file list:

- !`git diff --name-only "$BASE..$TARGET" > /tmp/changed_files.txt && wc -l /tmp/changed_files.txt`

2. Search for risk keywords:

- auth/security:
  - !`cat /tmp/changed_files.txt | xargs -I{} sh -c 'test -f "{}" && rg -n "(auth|token|jwt|csrf|cors|oauth|role|permission)" "{}" || true' | head -n 120 || true`
- API/HTTP:
  - !`cat /tmp/changed_files.txt | xargs -I{} sh -c 'test -f "{}" && rg -n "(fetch\\(|axios\\.|HttpClient|http\\.(get|post|put|delete)|endpoint|route)" "{}" || true' | head -n 120 || true`
- breaking change hints:
  - !`cat /tmp/changed_files.txt | xargs -I{} sh -c 'test -f "{}" && rg -n "(BREAKING|deprecated|remove|rename|migration)" "{}" || true' | head -n 120 || true`

(If xargs fails due to spaces, re-run with a safer approach or summarize without it.)

---

## 7) Output format (final report)

Produce a report with these sections:

### 1) Executive Summary

- What changed overall (size, areas touched)
- High-level intent (from commit messages + diffs)

### 2) Change Overview

- Total files changed + shortstat
- Top folders impacted
- Notable file types (config, code, tests, docs)

### 3) Detailed Changes by Area

For each area (e.g., Frontend, Backend, Shared, Infra/CI, Docs):

- List key files and what changed
- Note any API/contract changes
- Note any behavior changes

### 4) Risk & Attention Points

- Potential breaking changes
- Security/auth implications
- Config/dependency changes
- Migration concerns

### 5) Suggested Validation Checklist (No merge strategy)

- What to run / verify (tests, build, lint, e2e, smoke checks)
- Any manual QA scenarios inferred from changes

### 6) Appendices

- Commit list
- Changed file list

Important: Do not mention merge strategy. Do not recommend rebase/merge/squash.
