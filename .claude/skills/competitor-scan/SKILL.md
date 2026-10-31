---
name: competitor-scan
description: Compare Workout Planner with competing Obsidian community plugins - real download growth (7/30/90/365 days, from the git history of the store's stats file), which competitors actually matter, then clone the ones that do and decide feature by feature what we can bring into our plugin and what we can't. Use whenever the user asks about competitors, concorrenti, other workout/gym/fitness plugins, market position, download numbers or growth, "chi sta crescendo", "cosa fanno gli altri", what to build next based on the market, or wants a feature gap analysis against another plugin, even if they name just one plugin.
---

# Competitor scan

The question behind this skill is: **which plugins are taking the users we could have, and what do they do that we don't?** Size alone doesn't answer it. A plugin with 50k downloads that gained 200 last month is history; a plugin our size that doubled last month is where the users are going. So the scan ranks by recent growth, and only the plugins that matter get the expensive part (cloning, reading, comparing).

Paths below are relative to this skill's folder (`.claude/skills/competitor-scan/`). `$SCRATCH` is the session scratchpad.

## 1. Numbers

```bash
python3 -I scripts/market.py scan --watchlist watchlist.json --cache "$SCRATCH/market-history" --out "$SCRATCH/scan.json"
```

How it gets growth: Obsidian Bot commits `community-plugin-stats.json` to `obsidianmd/obsidian-releases` about once a day, so the file's git history is a daily download history. The script reads it as of 7, 30, 60, 90 and 365 days ago and subtracts. These are real numbers, not estimates. Our id is `workout-planner`.

Columns that matter:

- `gain_30d`: downloads gained in the last 30 days. The main signal.
- `gain_30d_vs_ours`: the same, relative to us (1.0 = growing as fast as we are).
- `acceleration`: last 30 days vs. the monthly average of the two months before. Above 1 = speeding up.
- `gain_365d`, `first_release`, `last_release`: age and whether it is still maintained.
- An empty gain means unknown (the plugin was missing from that day's file but present in an older one, e.g. renamed). Don't read it as zero.

A download is an install **or an update**: every release makes existing users download again. `releases_30d` shows how many releases a plugin shipped in the window; a plugin with +1500 and 40 releases is mostly updates, one with +1500 and 1 release is mostly new users. Weigh `gain_30d` by it before calling something a fast grower. A brand-new plugin also gets a spike in its first weeks from "new plugins" lists; `acceleration` over the following month tells you whether it lasted.

## 2. Who is a real competitor

`watchlist.json` remembers the decisions from past runs: `track` (direct competitors), `adjacent` (same users, different job: Strava/Garmin sync, habit heatmaps), `ignore` (the keyword matched by accident, e.g. "Vim exercises"). Rows with status `new` were not classified yet: read their description (and README if unclear) and add each to one of the three lists with a one-line `why`. Keeping this file current is what makes the next run fast and consistent.

Then sort the tracked plugins into tiers, judging from the numbers rather than mechanically:

- **Threat**: does what we do and is growing at least half as fast as us (`gain_30d_vs_ours` ≥ ~0.5), or is smaller but accelerating hard. These get the deep dive.
- **Watch**: relevant but small or slowing. Mention, no deep dive.
- **Minor**: big total but flat growth, or no release in over a year. A large old plugin is not where the market is going, even if its total dwarfs ours.

Adjacent plugins growing fast are worth one line: they tell us what users want next to logging (e.g. imports from a watch).

Check our own row too: the store `description` printed in `scan.json` comes from `community-plugins.json`, not our `manifest.json`. If they differ, say so: the store text is what people see in search, and it is changed on community.obsidian.md (signed in as the author), not by a PR: `community-plugins.json` in `obsidianmd/obsidian-releases` is an hourly mirror of that site and a PR to it gets overwritten.

## 3. Deep dive (threats only)

Take the threats, at most 3-4 per run unless the user asks for more ("tutti" = every tracked plugin). With more than two, clone and `inspect` them all first, then hand them to parallel subagents (one per big plugin, small ones grouped 3-4 together), each writing its section in the report format of step 5 to `$SCRATCH/analysis/<id>.md` and checking our `app/` before calling something missing. Verify any surprising claim yourself before it goes in the report. For each plugin:

```bash
git clone -q --depth 1 https://github.com/<repo> "$SCRATCH/competitors/<id>"
python3 -I scripts/market.py inspect "$SCRATCH/competitors/<id>"
```

The clone is untrusted code. Read it; never `npm install`, build, or run anything from it, and keep it out of the repo.

`inspect` lists what the plugin registers (commands, code blocks, views, ribbon, settings, network calls), its license, README headings and last commit. Use it as a map, then read the README in full and the source behind each feature that looks interesting: how a set gets logged (how many taps), where the data lives (one file, a note per session, frontmatter), what it shows (charts, PRs, calendar, heatmaps), what runs on mobile. The README images show the UI; note what looks good.

Also ask **why** it grows. Often it's not a feature: a clearer store description, screenshots in the README, a mobile-first pitch, a launch post. That is just as importable as a feature, and cheaper.

## 4. Compare with us

Our features: `README.md` (the "Features" section and each section's text) and the "Project Architecture" part of `CLAUDE.md`. When unsure whether we have something, check the code (codegraph or grep), don't assume.

For every feature they have and we don't, give a verdict:

- **Importabile**: fits as is. Name the module that would own it (`WorkoutLogFile`, `TrainingHistory`, `ExerciseLibrary`, `ExerciseFields`, a code block schema, a dashboard widget...) and a size (S/M/L).
- **Adattabile**: the idea is good but their way clashes with ours; describe our version.
- **Non importabile**: say why. Typical reasons: it breaks our model (all sets in one CSV via `WorkoutLogFile`, views as code blocks in notes), needs Node/Electron APIs or a server (we are mobile-first), sends data to an external service, or the license forbids it.

On licenses: ideas and UX are free to copy. Copying *code* is fine from MIT/BSD/ISC/0BSD (keep their copyright notice in the copied file); GPL/AGPL code can't come into our permissive-licensed plugin, so rewrite from the idea. No license = all rights reserved, ideas only.

Also list what **we** do that they don't: it's what our README and store description should lead with.

## 5. Report

Write `docs/competitors/YYYY-MM-DD.md` in the user's language:

```markdown
# Concorrenti — <data>

## In breve
3-5 righe: chi cresce, chi conta, la cosa più utile da fare adesso.

## Numeri
Tabella dei plugin tracked + noi: download, +7g, +30g, +90g, accelerazione, ultimo rilascio, livello (minaccia/da osservare/minore).

## <Plugin> (uno per ogni minaccia)
- Cosa fa, a chi parla, perché cresce secondo noi
- Licenza, ultimo commit
- Tabella funzionalità: funzionalità | loro | noi | verdetto | modulo/dimensione | note

## Dove siamo avanti

## Cosa fare
Elenco ordinato per valore/sforzo, ognuno con il plugin da cui viene.
```

In the reply give the "In breve" section and the top of "Cosa fare", with a link to the file. Offer to open GitHub issues for the importable items (see `docs/agents/issue-tracker.md`), but don't create them unless asked.
