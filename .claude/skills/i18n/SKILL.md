---
name: i18n
description: Clean and manage i18n locale files. Validates keys, finds missing/unused translations, syncs locales, removes dead keys, checks parameter consistency, finds hardcoded strings in code, and triggers AI translation via Ollama. Use when working with translations, cleaning locale files, auditing i18n coverage, or finding untranslated hardcoded strings. Triggers on requests to check translations, clean i18n, sync locales, translate, audit i18n, find missing keys, remove unused keys, or find hardcoded strings.
allowed-tools: Read, Grep, Glob, Bash
---

# i18n Manager

Manage, validate, clean, and translate the project's internationalization files.

## Paths

- **Project root**: `$PROJECT_ROOT` (detected via `git rev-parse --show-toplevel`)
- **Scripts dir**: `$PROJECT_ROOT/scripts/`
- **AI translate dir**: `$PROJECT_ROOT/AI translate/`
- **Locales dir**: `$PROJECT_ROOT/app/i18n/locales/`
- **Source locale**: `$PROJECT_ROOT/app/i18n/locales/en.json`

**IMPORTANT**: Every Bash command MUST be prefixed with `cd "$(git rev-parse --show-toplevel)" &&`
to ensure correct working directory. The shell CWD may NOT be the project root.

## Subcommands

Parse `$ARGUMENTS` to determine which action to run. If no argument or an unrecognized argument is given, show the help menu and ask the user to pick.

| Argument | Action |
|---|---|
| `audit` | Full audit: run all validation checks (missing, unused, params, hardcoded) |
| `missing` | Find keys used in code but missing from locale JSON |
| `unused` | Find keys in locale JSON that are never used in code |
| `params` | Check parameter consistency between code and locale values |
| `hardcoded` | Find hardcoded user-facing strings that should use t() |
| `clean` | Remove unused keys from all locale files |
| `sync` | Add missing keys to all locale files |
| `translate` | Translate locale files using AI (Ollama) |
| `translate LANG` | Translate a specific locale (e.g., `translate it`) |
| (empty) | Show help menu with available subcommands |

---

## 0) Help Menu (no arguments)

If `$ARGUMENTS` is empty or unrecognized, display:

```
i18n Manager - Available commands:

  /i18n audit              Full audit (missing + unused + params + hardcoded)
  /i18n missing            Find missing i18n keys
  /i18n unused             Find unused i18n keys
  /i18n params             Check parameter consistency
  /i18n hardcoded          Find hardcoded strings that need t()
  /i18n clean              Remove unused keys from all locales
  /i18n sync               Add missing keys to all locales
  /i18n translate          Translate all locales via AI (Ollama)
  /i18n translate LANG     Translate a specific locale (e.g., fr, de, it)
```

Ask the user which command to run. Do **not** proceed until they choose.

---

## 1) `audit` - Full i18n Audit

Run all four validation checks sequentially and produce a unified report.

### Steps

1. **Find missing keys:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-missing-i18n-keys.mjs`
   - Capture output. Note any missing keys with file locations.

2. **Find unused keys:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-unused-i18n-keys.mjs`
   - Capture output. Note any dead keys in locale files.

3. **Check parameter consistency:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/check-i18n-params.mjs`
   - Capture output. Note any parameter mismatches.

4. **Find hardcoded strings:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-hardcoded-strings.mjs`
   - Capture output. Note confirmed and likely hardcoded strings.

### Report Format

Present a unified summary:

```
## i18n Audit Report

### Missing Keys (used in code, not in en.json)
- N missing keys found
- [list top keys grouped by section]

### Unused Keys (in en.json, not used in code)
- N unused keys found
- [list keys grouped by section]

### Parameter Issues
- N issues found
- [list issues: missing params, extra params, mismatches]

### Hardcoded Strings
- N confirmed user-facing (in setText/text:/Notice/etc.)
- N likely hardcoded (need review)
- [list top items by file]

### Recommended Actions
- [specific actionable steps based on findings]
```

If everything is clean, say so clearly.

---

## 2) `missing` - Find Missing Keys

Run the missing keys scanner and present results.

### Steps

1. !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-missing-i18n-keys.mjs`
2. Parse and present results grouped by section/file.
3. If missing keys are found, ask the user if they want to run `/i18n sync` to add them.

---

## 3) `unused` - Find Unused Keys

Run the unused keys scanner and present results.

### Steps

1. !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-unused-i18n-keys.mjs`
2. Parse and present results grouped by section.
3. If unused keys are found, ask the user if they want to run `/i18n clean` to remove them.

---

## 4) `params` - Check Parameter Consistency

Run the parameter checker and present results.

### Steps

1. !`cd "$(git rev-parse --show-toplevel)" && node scripts/check-i18n-params.mjs`
2. Parse and present results grouped by issue type:
   - **Missing all params**: `t()` call expects params but none provided
   - **Missing params**: Some params missing from the call
   - **Extra params**: Params passed but key has no placeholders
3. For each issue, show file, line, key, and what's wrong.

---

## 5) `hardcoded` - Find Hardcoded Strings

Find user-facing strings in UI code that are hardcoded instead of using `t()`.

This uses `scripts/find-hardcoded-strings.mjs` — a custom scanner smarter than
the ESLint `i18next/no-literal-string` rule. It filters out false positives:
CSS classes, colors, SVG data, DOM attributes, technical identifiers, etc.

### Steps

1. !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-hardcoded-strings.mjs`
2. Present results in two tiers:
   - **Confirmed user-facing**: Strings found in `setText()`, `text:`, `new Notice()`,
     `.setName()`, `.setDesc()`, `.setTooltip()`, `.setPlaceholder()`, `.textContent =`.
     These are definitely hardcoded and must be migrated to `t()`.
   - **Likely hardcoded**: Strings that passed all false-positive filters but are not
     in a confirmed user-facing context. These need manual review — some may be
     technical identifiers, some may be real user-facing strings.
3. Group results by file for easy navigation.

### Flags

- `--json` — Machine-readable JSON output
- `--verbose` — Also show filtered false positives (for debugging filters)
- `--fix-hints` — Show suggested `t()` key names for each string

### After Review

If the user wants to migrate confirmed strings, they can:
1. Replace each string with `t("suggested.key")` manually
2. Add the key to en.json via `/i18n sync`
3. Translate via `/i18n translate`

---

## 6) `clean` - Remove Unused Keys

Remove unused keys from all locale files.

### Steps

1. **Dry run first:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-unused-i18n-keys.mjs --fix --dry-run --sync-locales`
   - Show what would be removed. Ask the user to confirm.

2. **If user confirms**, apply changes:
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-unused-i18n-keys.mjs --fix --sync-locales`
   - Show summary of removed keys.

3. **Verify:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-unused-i18n-keys.mjs`
   - Confirm no unused keys remain.

**Important:** Always show the dry run first and wait for confirmation before deleting keys.

---

## 7) `sync` - Add Missing Keys

Add missing keys to all locale files.

### Steps

1. **Find missing keys first:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-missing-i18n-keys.mjs`
   - Show what's missing.

2. **Add missing keys:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/add-missing-i18n-keys.mjs`
   - This adds English values to en.json and "TODO" placeholders for other locales.

3. **Verify:**
   - !`cd "$(git rev-parse --show-toplevel)" && node scripts/find-missing-i18n-keys.mjs`
   - Confirm no missing keys remain.

4. **Suggest next step:** Ask if the user wants to run `/i18n translate` to translate the newly added keys.

---

## 8) `translate` - AI Translation

Translate locale files using Ollama with the configured translation model.

### Prerequisites Check

Before translating, verify prerequisites **in order**. If any check fails, tell
the user what is missing and how to fix it, then **stop** (do not attempt translation).

1. **Ollama is running:**
   - !`curl -s --max-time 5 http://localhost:11434/api/tags`
   - If it fails or times out: "Ollama is not running. Start it with `ollama serve` and ensure the translation model is pulled."

2. **Python venv exists:**
   - !`cd "$(git rev-parse --show-toplevel)" && test -d "AI translate/venv" && echo "venv OK" || echo "venv MISSING"`
   - If missing, create it:
     - !`cd "$(git rev-parse --show-toplevel)" && python3 -m venv "AI translate/venv"`
     - !`cd "$(git rev-parse --show-toplevel)" && "AI translate/venv/bin/pip" install -r "AI translate/requirements.txt"`

3. **Python dependencies installed in venv:**
   - !`cd "$(git rev-parse --show-toplevel)" && "AI translate/venv/bin/pip" show llama-index-core`
   - If missing: !`cd "$(git rev-parse --show-toplevel)" && "AI translate/venv/bin/pip" install -r "AI translate/requirements.txt"`

### Steps

All Python commands use the venv interpreter at `AI translate/venv/bin/python3`.

**Translate all locales:**
- !`cd "$(git rev-parse --show-toplevel)" && "AI translate/venv/bin/python3" "AI translate/translate.py" --merge`

**Translate specific locale** (when `$ARGUMENTS` contains a locale code after `translate`, e.g. `translate fr`):
- Extract the locale code from `$ARGUMENTS` (the word after `translate`)
- !`cd "$(git rev-parse --show-toplevel)" && "AI translate/venv/bin/python3" "AI translate/translate.py" --locale fr --merge`
  (replace `fr` with the actual locale code)

The `--merge` flag preserves existing translations and only translates new/missing keys.

### After Translation

1. Show the translation summary (languages translated, keys translated, time elapsed).
2. Suggest running `/i18n audit` to verify the result.

---

## General Rules

- **Never modify code files** — this skill only manages locale JSON files and runs scripts.
- **Always show dry runs** before destructive operations (key removal).
- **Preserve existing translations** — use `--merge` mode for AI translation by default.
- **Report clearly** — group results by section, show counts, highlight actionable items.
- **Every Bash command** must start with `cd "$(git rev-parse --show-toplevel)" &&` to guarantee correct CWD.
