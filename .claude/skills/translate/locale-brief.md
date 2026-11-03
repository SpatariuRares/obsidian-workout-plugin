# Locale brief

Fill in `{LANGUAGE}`, `{CODE}`, `{NOTES}` (from the table in SKILL.md) and `{KEYS}` (the missing keys from `translations-status.mjs --json`, with their English values), then pass the text below as the subagent's prompt. Drop the "Review" part unless `review` was asked.

---

You are translating ONE locale file of an Obsidian workout-tracking plugin (UI text: buttons, labels, notices, settings).

Repo root: the current git repository (`cd "$(git rev-parse --show-toplevel)"`).
Language: {LANGUAGE}. {NOTES}
File you own and may edit: `app/i18n/locales/{CODE}.json`. Source of truth, never edit: `app/i18n/locales/en.json`. Touch no other file. Write helper scripts in a temp dir (`mktemp -d`), never in the repo; run Python as `python3 -I`.

## Add the missing keys

These keys of en.json are missing from `{CODE}.json`:

{KEYS}

Add each one, translated, at the position it has in en.json (create the parent object if needed). Change no existing key, value, key order or formatting.

## Review (only when asked)

Compare every value of `{CODE}.json` with en.json and fix what is wrong: wrong meaning, unnatural or literal phrasing, wrong fitness terms (set, reps, volume, protocol, streak, PR, rest, timer), grammar, agreement, orthography and diacritics, leftover English, machine-translation artifacts. Don't reword values that are already correct.

## Rules

- Placeholders stay byte-identical: `{count}`, `{{name}}`, etc. Keep `**bold**` markers and `` `code` `` spans exactly as in en.json, and leading/trailing spaces (some values are appended to a number by the code).
- Keep technical and brand terms when that is the norm in the language: Tabata, EMOM, CSV, Markdown, Obsidian, Dataview, kg, lb, API.
- Reuse the file's own terminology: before translating, find how `{CODE}.json` already says set, rest, streak, workout, next, previous, done, guided session, and use the same words.
- Natural, concise UI text in sentence case. Some values equal English on purpose (brand words, units); leave those.
- Preserve the file's formatting: read its indent and trailing newline, write it back with `ensure_ascii=False` and the same indent.

## Verify before you finish

With a script: the JSON is valid; its leaf keys are exactly en.json's; for every key the placeholders, `**` count and `` `code` `` spans equal en.json's; existing values are unchanged except the ones you fixed on purpose. Don't run jest.

## Final answer

In Italian, at most 8 lines: keys added, values changed (key: old → new, only the notable ones), and the terms you were unsure about.
