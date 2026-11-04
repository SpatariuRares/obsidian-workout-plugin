# Achievements: a long-term plan for gamification

Status: plan, nothing implemented yet. Date: 2026-11-04.

This is a living document. The achievement system is meant to grow for years:
new families, new tiers, new surfaces. This file says what it is, which rules
never change (so growth never breaks what users already earned), and the order
we build it in. Update the roadmap section as phases land.

---

## 1. The story

> You log a set in the gym, phone in hand, between two breaths. Nothing
> special. Then, one evening, a small medal slides in: **"Iron Week, bronze:
> four weeks in a row without missing your goal."** You didn't know you were
> counting. Now you are.

The plugin already knows a lot about the user's training: every set, every
record, every streak, every target in a `workout-log` block. Today it shows
those numbers. Achievements turn them into **moments**: something you earn,
remember, and want to collect.

The theme is **"The Iron Path"**: training is a long road, and achievements are
the milestones along it. Every family of achievements is a road (consistency,
strength, volume, endurance, exploration), and every road has tiers that go far
beyond what a beginner can see, so there is always a next stone.

Principles of the story:

1. **Reward showing up, not only being strong.** A beginner must earn the first
   medal in the first week. Consistency is the main road; raw strength is one of
   many.
2. **Never punish.** Nothing is "failed" or "lost" in the UI. A broken streak
   just means the next one starts.
3. **Small and proud, not loud.** The gym flow (scroll, log, timer, rest) must
   not be interrupted. One discreet notice when something is earned; the
   celebration lives in the trophy case, where the user goes when they want it.
4. **Honest.** Every achievement is computed from the log. No fake progress, no
   achievements for opening the app.
5. **Optional.** One switch in settings turns the whole thing off.

### User stories

- As a lifter, when I log a set that earns an achievement, I see a short notice
  with its medal, name and why, without leaving my workout note.
- As a lifter, I open a trophy case (dashboard widget or code block) and see
  what I earned, when, and how close I am to the next tier of each road.
- As a lifter who reached the target in a `workout-log` block (`targetWeight` x
  `targetReps`), that counts: "goal reached" is itself an achievement road.
- As a user importing years of Strong/Hevy history, I get my past achievements
  with their real dates, in one summary, not forty notices.
- As a long-time user, every update can bring new achievements, and the ones I
  already have never disappear or change meaning.
- As a Dataview user, I can read my achievements from `WorkoutPlannerAPI`.
- As someone who doesn't like games, I turn it off and see nothing of it.

---

## 2. Domain

Add these to `CONTEXT.md` ("Training History" section) when phase 1 lands.

**Achievement**:
A milestone computed from the workout log. It has a stable id, a road, an
ordered list of tiers, and for each tier a threshold. An achievement is
**earned** at a tier on the training day of the set that first crossed that
tier's threshold (in set order).
_Avoid_: badge (taken by protocol badges), trophy (that is the UI collection)

**Road** (family):
A group of achievements about one quality: consistency, strength, volume,
endurance, exploration, goals, habits. Used for grouping in the UI.

**Tier**:
The levels of one achievement: bronze, silver, gold, platinum, diamond (more can
be appended, never inserted). A tier threshold never changes once released.

**Progress**:
For an achievement not yet at its last tier: current value and the next tier's
threshold (e.g. 11 / 25 sessions).

**Seen**:
An earned tier the user was already told about. The only achievement state
stored outside the log.

### Naming collision to fix

`app/features/tables/ui/AchievementBadge` today is the "target reached" banner
of a `workout-log` block (with `settings.achievedTargets` to dismiss it). In
phase 1 rename it `TargetReachedBadge` (keep the settings key, it is user data),
so "achievement" means only the new system.

---

## 3. Rules that never change

These are the contract that lets the system grow for years.

1. **Derived, not stored.** Earned tiers are computed from the log every time,
   by a pure module over `TrainingHistory`. Editing or deleting sets, importing,
   switching log file: achievements follow the data. The only stored state is
   the set of seen `(id, tier)` pairs, used to decide what to announce.
2. **Ids are forever.** An achievement id (`consistency.streak-weeks`) is never
   renamed, reused or deleted. A retired achievement stays in the catalog,
   marked `retired`, still earnable by history, hidden from progress.
3. **Thresholds are forever.** A released tier's threshold never changes. To
   make something harder, add a tier on top.
4. **One definition per concept.** Achievements read sessions, training days,
   PRs, streaks, trends and e1RM only from `TrainingHistory`; fields from
   `ExerciseFields`; protocols from `ProtocolCatalog`; muscles from
   `MuscleTagService`. Never re-derive them (`architecture-guardian` checks).
5. **Units.** Weight thresholds are defined in kg and compared in the log's
   converted unit (`WeightUnitUtils`); a lb user sees lb thresholds rounded to
   the plate. Distances in km, shown in the user's unit when one exists.
6. **Retroactive and silent.** When a new release adds achievements, or on first
   run, everything already earned is marked seen and announced at most once, as
   a single summary ("You already earned 23 achievements").
7. **Translated.** Every name, description and flavour line is an `en.json` key
   (`achievements.<id>.name`, `.description`, `.tiers.<tier>`); ids are not text.

---

## 4. Architecture

```
app/services/achievements/
├── AchievementCatalog.ts    # all definitions: id, road, tiers, icon, evaluate()
├── Achievements.ts          # pure: new Achievements(history, settings).all() / earned() / progress()
├── achievementTypes.ts      # AchievementDefinition, EarnedTier, AchievementProgress
├── AchievementTracker.ts    # listens to log:added / log:bulk-changed, diffs against seen, announces
└── __tests__/               # pure tests with TrainingHistory rows, no vault
```

- **Definition** (`AchievementDefinition`): `{ id, road, icon (lucide), tiers:
  [{ tier, threshold }], hidden?, retired?, value(history, ctx) }`. Most
  achievements are "a number that only grows over set order" (sessions, total
  volume, weeks streak, distinct exercises): the module walks history once in
  set order and records the day each threshold is crossed, so definitions only
  give the value function. Others (streak, which can go down) use the best value
  so far: "best streak ever" never decreases, so tiers stay earned.
- **`Achievements`** is pure, like `TrainingHistory`: given rows and settings
  (weekly goal, unit) it returns every achievement with earned tiers (and their
  dates) and progress. Tested with plain rows.
- **`AchievementTracker`** is the only impure part: on `log:added` it evaluates,
  compares with `settings.achievementsSeen`, shows a notice for new tiers, saves
  seen. On `log:bulk-changed` with source `import` it marks silently and shows
  one summary notice. Registered in `main.ts`, cleaned up in `onunload()`. It
  sits next to the existing new-record notice in `WorkoutLogFile.add` and must
  not duplicate it (a PR notice and a "10 PRs" achievement notice are different
  things; when both fire, show the achievement only, mentioning the PR).
- **Settings**: `achievementsEnabled: boolean` (default true),
  `achievementsSeen: string[]` (`"<id>:<tier>"`), `achievementsBaselined:
  boolean` (first run done). A section "Achievements" in settings via
  `definitions()`: the switch, "Show trophy case", "Reset seen" (re-announce).
- **Performance**: evaluation is one pass over the log. The PR notice already
  builds a `TrainingHistory` on every add; measure with 10k and 50k rows in a
  test, and if needed evaluate only the roads the new set can affect.
- **Mobile**: no new APIs; notices and CSS only; the medal is CSS + `setIcon`.

### Surfaces

1. **Notice on unlock** (phase 1): medal icon + "Silver: Iron Week" + one line.
   Tapping it opens the achievement detail.
2. **Trophy case** (phase 2): dashboard widget `achievements` (registry entry in
   `DASHBOARD_WIDGETS`, `minColumns` 2) and a `workout-achievements` code block
   (schema with `roads`, `show: earned|all|next`, `limit`), rendered by an
   `EmbeddedAchievementsView extends BaseView`. Medals by road, greyed next
   tier with a progress bar, hidden ones as "?".
3. **Detail modal** (phase 2): the medal large, every tier with its date, the
   set that earned it (link to the note via `origine`).
4. **Celebration** (phase 3): short CSS animation in the detail modal, optional
   sound/vibration reusing the timer's audio and `vibrateOnCompletion` settings.
5. **API** (phase 3): `WorkoutPlannerAPI.getAchievements()`, additive, returns
   `{ id, road, name, tiers: [{ tier, threshold, earnedOn? }], progress? }`.
6. **Example notes and tour** (phase 2): a trophy case in the Feature Showcase
   via the generator (`schema.serialize`), one tour step at most.

### The medal

A round medal: tier ring colour (bronze/silver/gold/platinum/diamond as CSS
custom properties on `body`, contrast-checked against `--background-secondary`)
and the road's lucide icon in the centre. Not earned: outline only, faint. No
images shipped, so it themes with Obsidian and stays tiny.

---

## 5. The first catalog (phase 1)

Thresholds are proposals; tune them in review, then they are frozen.

| Road | Id | Tiers (bronze → diamond) | Value |
| --- | --- | --- | --- |
| Consistency | `consistency.first-session` | 1 | sessions ever (single tier: "First step") |
| Consistency | `consistency.sessions` | 10, 50, 100, 250, 500 | sessions |
| Consistency | `consistency.streak-weeks` | 4, 12, 26, 52, 104 | best streak (weeks meeting `weeklyGoal`) |
| Consistency | `consistency.training-days-year` | 50, 100, 150, 200 | best calendar year's training days |
| Strength | `strength.records` | 1, 10, 50, 100, 250 | new PR sets (`newRecordSets`) |
| Strength | `strength.e1rm-club` | 60, 100, 140, 180, 220 kg | best e1RM of any exercise |
| Volume | `volume.total` | 10 t, 100 t, 500 t, 1 000 t, 5 000 t | total volume (flavour: "a car", "a blue whale"...) |
| Volume | `volume.session` | 5 t, 10 t, 20 t, 30 t | heaviest session volume |
| Endurance | `endurance.distance` | 10, 100, 500, 1 000, 5 000 km | cumulative distance (cardio fields) |
| Endurance | `endurance.time` | 10, 50, 200, 500 h | cumulative session duration (plausible ones) |
| Exploration | `exploration.exercises` | 5, 15, 30, 60 | distinct exercises |
| Exploration | `exploration.protocols` | 2, 4, all built-in | distinct protocols used |
| Exploration | `exploration.muscles` | 5, all canonical | muscle groups trained in one week |
| Goals | `goals.targets-reached` | 1, 5, 20, 50 | `workout-log` targets reached (TargetCalculator) |
| Goals | `goals.weekly-goal` | 1, 10, 52 | weeks that met `weeklyGoal` |
| Habits (hidden) | `habits.early-bird` | 10 | sessions started before 7:00 |
| Habits (hidden) | `habits.night-owl` | 10 | sessions started after 22:00 |
| Habits (hidden) | `habits.new-year` | 1 | a session on 1 January |

"Goals reached" needs the targets of every `workout-log` block, which live in
notes, not in the log: phase 1 counts reached targets when the table renders
(as `achievedTargets` does today) and stores them in settings; a later phase can
scan notes with `readWorkoutNote`. Decide in phase 1 review whether to ship it
or move it to phase 2.

---

## 6. Roadmap (growing over the years)

Each phase is a release on its own; each one only adds.

**Phase 1 — Foundations (next release)**
- `Achievements` pure module + catalog above, tests (incl. 50k-row timing).
- `AchievementTracker`: notices, seen state, silent baseline and import summary.
- Settings section, rename `AchievementBadge` → `TargetReachedBadge`, en.json keys,
  `CONTEXT.md` glossary, this file updated.

- Catalog in the declarative format of section 7 (metric registry + windows),
  so community challenges need no engine change later.

**Phase 1.5 — Community challenges (level A of section 7)**
- `community/challenges.json` in the repo, fetched with `requestUrl`, cached in
  settings, README "Network use" paragraph, a setting to turn the fetch off.
- First challenge: the month after the release.

**Phase 1.6 — Collective goal ("500 t together", section 7)**
- Cloudflare Worker + D1 in `community/worker/`, `PRIVACY.md`, README disclosure.
- Challenge card with the shared bar, Join / Leave and delete, hourly sync of
  the user's total, *Contributor* and *We did it* medals.
- First collective month: 500 t.

**Phase 2 — Trophy case**
- Dashboard widget, `workout-achievements` block (schema, insert/edit modals,
  command `insert-workout-achievements`), detail modal, example notes, README.

**Phase 3 — Celebration and openness**
- Animation, sound/vibration, hidden achievements revealed on unlock, API
  `getAchievements()`, per-exercise milestones (e.g. "Bench 100 kg", for the
  exercises the user trains most, discovered from history).

**Phase 4 — Levels and recap**
- **Athlete level**: XP derived from earned tiers (bronze 10 … diamond 250),
  level curve frozen like thresholds. Shown in the dashboard summary.
- **Year in review** ("Your 2027"): a generated note with the year's numbers,
  achievements earned that year, best month, favourite exercise.

**Phase 5 — Challenges (year 2+)**
- **Yearly challenge**: one road per calendar year (e.g. "2028: 150 training
  days"), with its own medal kept forever as a collectible of that year.
- **Personal goals**: user-defined achievements in a code block (`goal: Squat
  140 kg by June`), evaluated with the same engine.
- **Community aggregates** (level B of section 7), only if level A gets used:
  opt-in rarity and collective goals.
- Ideas parked here, to decide later: seasonal events, shareable medal image
  (canvas export), comparing with a friend's exported log, private groups
  (level C).

---

## 7. Community: global achievements

Goal: achievements that are not only mine, but shared with everyone who uses
the plugin: everyone chasing the same challenge, knowing how rare a medal is,
building something together.

### The constraint: Obsidian developer policies

From the [developer policies](https://docs.obsidian.md/Community+directory/Developer+policies):

- **Not allowed**: "Include client-side telemetry." The plugin must never send
  usage or training data on its own.
- **Allowed if disclosed in the README**: "Network use. Clearly explain which
  remote services are used and why they're needed", "An account is required for
  full access", "Server-side telemetry. Link to a privacy policy that explains
  how the data is handled must be included."

So: reading public data from the network is fine (disclosed). Sending anything
is only acceptable as a feature the user explicitly turns on, off by default,
showing exactly what is sent, with a privacy policy and a way to leave and
delete. The log never leaves the vault.

### Three levels, from cheapest to heaviest

**A. Community challenges, read-only (no data sent).**
The plugin fetches a small public JSON (in this repo, served from GitHub raw,
e.g. `community/challenges.json`) listing time-boxed challenges, the same for
everyone: "November 2026: 12 sessions", "Winter: 50 km of cardio", "2027: 150
training days". Each user's progress is computed locally from their log; the
medal ("November 2026 challenger") is collected forever. Everyone works on the
same thing in the same month: that is the community feeling, at zero privacy
cost and zero server. Discussions/Discord can host "I did it" posts.
Cost: a JSON file and a README paragraph. Fails gracefully offline (cached
last copy, then nothing).

**B. Opt-in anonymous aggregates (small server).**
A user presses "Join the community" in settings. The plugin then sends, only
for them: a random install id and the list of earned `(id, tier)` pairs, plus
optional coarse totals for collective goals (e.g. volume per challenge, capped
per day). Nothing else: no sets, no exercise names, no dates beyond the week.
In return everyone who joined sees:
- **rarity**: "Gold Iron Week: earned by 3% of athletes";
- **collective goals**: "Together this month: 812 / 1 000 tonnes";
- **participation**: "1 240 athletes completed the November challenge".
Backend: one Cloudflare Worker + D1 (free tier is enough for years at this
scale), endpoints `POST /sync`, `GET /stats`, `DELETE /me`. Needs: privacy
policy page, README disclosure, rate limiting, a "Leave and delete my data"
button. Under GDPR training-derived data may count as health data: keep it to
achievement ids and coarse totals, pseudonymous, and get advice before launch.

**C. Leaderboards, profiles, friends (accounts).**
Not recommended. The log is a CSV anyone can edit, so rankings can't be
trusted and will be gamed; they also reward the strongest, against principle 1
("reward showing up"). It needs accounts, moderation and a service to run for
years. Revisit only if B shows real demand (e.g. private groups of friends
comparing consistency, not weight).

### The collective goal: "this month, together, 500 tonnes"

The first community feature to build after level A. It is level B reduced to
one number per user per challenge.

**The challenge** is an entry of `challenges.json` with a collective part:

```json
{ "id": "community.2026-12.volume", "metric": "volume",
  "window": { "from": "2026-12-01", "to": "2026-12-31" },
  "collective": { "target": 500000 },
  "tiers": [{ "tier": "bronze", "threshold": 1 }],
  "name": { "en": "December: 500 tonnes together", "it": "Dicembre: 500 tonnellate insieme" } }
```

`target` is in kg; the author sets it per month from last month's participation
(500 t is about 12 people training regularly; raise it as the community grows).

**Joining.** The challenge card shows the shared progress bar to everyone
(read-only, level A). To add your sets you press "Join", and the card says
exactly what will be sent: *"Your total volume in this challenge (now 12.4 t)
and a random id. Nothing else."* Off by default; one setting ("Community
challenges: share my total") remembers the choice; "Leave and delete" removes
your contribution.

**What is sent.** `PUT /challenges/{id}/contributions/{installId}` with
`{ volumeKg }`: the user's **whole total** for the window, computed locally by
the challenge metric (`TrainingHistory`, converted to kg), not an increment.
The server keeps the latest value per install id, so edits, deletions and
re-imports correct themselves and nothing is counted twice. Sent at most once
an hour after a `log:added`/`log:bulk-changed`, and when the card opens; never
outside the window; never when not joined. `installId` is a random UUID made at
join time, stored in settings, unrelated to anything else.

**What is read.** `GET /challenges/{id}` → `{ totalKg, participants, target,
closed }`, public, cached 15 minutes on both sides. The card: "Together:
312 / 500 t · 41 athletes · you added 12.4 t".

**Medals.**
- *Contributor* (local): you joined and logged at least one session in the
  window.
- *We did it* (community): the total reached the target by the end of the
  window. When the challenge closes the plugin saves the final `{ totalKg,
  participants, reached }` in settings, so the medal stays even offline and
  after the server forgets the challenge (the one exception to "derived from
  the log", because the fact is not in the log).

**Abuse.** Self-reported, so: a per-user cap per challenge on the server (e.g.
the window's days × 50 t), rate limiting per IP, totals rounded to 100 kg. A
cheater can at worst add one capped number to a shared bar; there is no ranking
to win.

**Backend.** One Cloudflare Worker + D1 table `contributions(challenge_id,
install_id, volume_kg, updated_at)`, source in this repo (`community/worker/`)
so anyone can audit it; the free tier covers this for years. Rows older than
the window + 30 days are deleted; only the closed totals are kept.

**Disclosures before release.** README "Network use" paragraph (GitHub raw for
challenges, the worker for the collective goal, what is sent and why), a
`PRIVACY.md` linked from the README and the join dialog, a delete endpoint
(`DELETE /contributions/{installId}`). Data is pseudonymous and coarse; still get
a GDPR opinion, since training volume could be read as health-related data.

### Cheating

Everything is self-reported, so community features are **non-competitive by
design**: rarity, participation and collective goals are barely affected by a
few fake logs (and contributions to collective totals are capped per user per
day). No ranking, no prize.

### What this changes in phase 1

Achievements must be **data, not code**, so a challenge can arrive as JSON:

```ts
{ id: "community.2026-11.sessions", road: "community",
  metric: "sessions", window: { from: "2026-11-01", to: "2026-11-30" },
  tiers: [{ tier: "gold", threshold: 12 }] }
```

`metric` names one entry of a fixed registry of pure functions over
`TrainingHistory` (`sessions`, `trainingDays`, `volume`, `distance`, `records`,
`distinctExercises`, ...) and `window` limits it to a date range. Remote JSON
can only combine known metrics: no code is ever loaded from the network, and
the built-in catalog uses the same format. Names and descriptions of remote
challenges come in the JSON with one text per language (fallback English),
since they can't be in `en.json`.

---

## 8. Open questions

1. Notice only, or a small modal for gold and above? (Proposal: notice for all
   in phase 1; decide after using it in the gym.)
2. Should deleting the sets that earned a tier remove it from the trophy case?
   (Proposal: yes, derived is the truth; the seen list keeps it from being
   announced again if the sets come back.)
3. Thresholds in kg for lb users: round to plates, or define "nice" lb values
   per tier (225, 315, 405)? (Proposal: per-unit thresholds in the catalog for
   strength tiers only.)
4. Do warm-up and drop sets count for volume achievements? (Proposal: yes,
   same as volume elsewhere; PR-based ones exclude them via `TrainingHistory`.)
