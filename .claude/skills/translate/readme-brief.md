# README brief

Fill in `{LANGUAGE}`, `{CODE}`, `{README}`, `{NOTES}` (from the table in SKILL.md). For a stale README replace `{JOB}` with the "Update" part and paste the `git diff <since> -- README.md` output into `{DIFF}`; for a missing one use the "Create" part. Then pass the text below as the subagent's prompt.

---

You are translating the README of an Obsidian workout-tracking plugin into {LANGUAGE}. {NOTES}

Repo root: the current git repository (`cd "$(git rev-parse --show-toplevel)"`).
Source, never edit: `README.md` (English). File you own: `{README}`. UI terminology: `app/i18n/locales/{CODE}.json`. Touch no other file. Write helper scripts in a temp dir (`mktemp -d`), never in the repo; run Python as `python3 -I`.

{JOB}

**Create**: translate the whole of README.md into `{README}`.

**Update**: `{README}` is a translation of an older README.md. These are the changes to README.md since then:

```diff
{DIFF}
```

Apply the same changes to `{README}`, translated, in the matching places. Leave the rest of the translation as it is.

## Rules

- Same structure as README.md: the same headings in the same order, the same fenced code blocks, `<details>`/`<summary>` blocks and tables, and the same images in the same order. Keep each image in its form: an `<img>` tag stays an `<img>` tag with the same `src` and `width`, a Markdown `![…](…)` stays Markdown. Translate only alt text and prose.
- Fenced code blocks (```` ```workout-log ````, ```` ```yaml ````, ```` ```csv ````, ```` ```dataviewjs ````, ```` ````markdown ````) are byte-identical to README.md. Translate nothing inside them.
- Keep "Workout Planner", product names (Obsidian, Dataview, Templater, Chart.js, Strong, Hevy, iOS, Android, Epley), file and column names, parameter names in backticks, kg/lb.
- The language line under the title (`English · [العربية](README.AR.md) · …`) is copied from README.md unchanged, except that {LANGUAGE}'s own entry has no link and English links to `README.md`.
- UI labels (settings sections, buttons, commands, tour buttons like Back, Next, Skip, Show me, Take the tour, Create examples) use the exact text of `{CODE}.json` for the same thing (`settings.*`, `commands.*`, `tour.*`, `modal.*`, `session.*`). When there is no match, translate naturally and say so in your answer.
- Internal links (`](#anchor)`) point at the slug of the translated heading: lower case, punctuation removed except `-` and `_`, spaces to `-`. If the heading has combining marks (Devanagari matras, for example) the repo's checker drops them, so put `<a id="ascii-name"></a>` and a blank line before that heading and link to `#ascii-name`.
- Natural, native prose, not word for word.

## Verify before you finish

With a script, against README.md: identical fenced blocks (count and content); same `<img>` and Markdown image paths in the same order; same number of headings, `<details>`, `<summary>` and table rows; every `#anchor` resolves to a heading slug or an `id` in your file; external links and `LICENSE` unchanged. Then run `node scripts/check-readme.mjs` and fix anything it reports for `{README}`.

## Final answer

In Italian, at most 6 lines: the file, the verification result, and the UI labels you could not match to `{CODE}.json`.
