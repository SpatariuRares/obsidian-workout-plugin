---
name: translate
description: Translate the plugin on this PC with Claude Haiku, one subagent per language. Adds the keys of en.json missing from each locale, and creates or updates every README.<LANG>.md from README.md. Run it before a release: the release skill calls it, and a hook blocks the release commit until translations are up to date. Argument `commit` commits the result; `review` also reviews every existing locale value.
model: haiku
---

# Translate

The plugin ships 23 locales (`app/i18n/locales/<code>.json`, English is `en.json`) and one README per locale (`README.<CODE>.md`, code in upper case: `README.IT.md`, `README.PT-BR.md`, `README.ZH-TW.md`). This skill brings them up to date with `en.json` and `README.md` on this PC, with one Haiku subagent per language.

Work from the repo root (`cd "$(git rev-parse --show-toplevel)"`). Other sessions may share this working tree: touch only locale files and `README.<CODE>.md` files, never `en.json` or `README.md`.

## Steps

1. **What is out of date**: `node scripts/translations-status.mjs --json`. It lists, per locale, the `en.json` keys it misses (`missingKeys`) and the READMEs that are `missing` or `stale` (README.md changed since the translation's last commit, in `since`). If both are empty and `$ARGUMENTS` has no `review`, say so and stop.

2. **One subagent per language**, `model: "haiku"`, `subagent_type: "general-purpose"`. Give each its brief, filled in from the table below:
   - a locale with missing keys (or every locale with `review`): [locale-brief.md](locale-brief.md)
   - a missing or stale README: [readme-brief.md](readme-brief.md); for a stale one include the output of `git diff <since> -- README.md`
   - a language that needs both gets both jobs in one subagent (two briefs, one prompt)

   At most 20 subagents run at once: launch the first 20 in one message, the rest when slots free up. A launch refused for the limit is not retried in the same message.

3. **New locale**: when a README is created for a locale whose name is not yet in the language line under the title, add `[Name](README.<CODE>.md)` to that line in **every** README (README.md included), in the same position everywhere, the current language without a link.

4. **Verify**, and fix before going on:
   - `npx jest app/i18n` passes (placeholders, `**bold**`, `code` spans, no extra keys)
   - `node scripts/check-readme.mjs` passes (same headings, code blocks and images as README.md; every `#anchor` resolves)
   - `node scripts/translations-status.mjs` exits 0

5. **Commit** (only with `commit` in `$ARGUMENTS`; otherwise list the changed files and stop). Commit only the translation files, so changes already staged by someone else (such as the release's version bump) stay out of it:
   ```bash
   git add app/i18n/locales README.*.md
   git commit -m "chore(i18n): update translations" -- app/i18n/locales README.*.md
   ```
   End the message with the attribution trailer.

6. **Report** in the user's language: per language what was added or changed, and the terms each subagent was unsure about (they come back in their final answers). Don't paste whole files.

## Languages

| Code | Language | README | Notes |
| --- | --- | --- | --- |
| ar | Arabic | README.AR.md | |
| cz | Czech | README.CZ.md | |
| da | Danish | README.DA.md | |
| de | German | README.DE.md | |
| es | Spanish | README.ES.md | |
| fr | French | README.FR.md | |
| hi | Hindi | README.HI.md | anchors with Devanagari need an explicit ASCII `<a id>` (see readme-brief) |
| id | Indonesian | README.ID.md | |
| it | Italian | README.IT.md | |
| ja | Japanese | README.JA.md | |
| ko | Korean | README.KO.md | |
| nl | Dutch | README.NL.md | |
| no | Norwegian (Bokmål) | README.NO.md | |
| pl | Polish | README.PL.md | |
| pt-BR | Brazilian Portuguese | README.PT-BR.md | Brazilian vocabulary, "você" |
| pt | European Portuguese | README.PT.md | European vocabulary ("ecrã", "registo", "guardar") |
| ro | Romanian | README.RO.md | comma-below ș ț, not cedilla |
| ru | Russian | README.RU.md | |
| sq | Albanian | README.SQ.md | |
| tr | Turkish | README.TR.md | |
| uk | Ukrainian | README.UK.md | Ukrainian, not Russian forms |
| zh | Simplified Chinese | README.ZH.md | Mainland terms, simplified characters |
| zh-TW | Traditional Chinese | README.ZH-TW.md | Taiwan terms, traditional characters |

A locale file not in this table is still translated: use its code to name the language and the README.
