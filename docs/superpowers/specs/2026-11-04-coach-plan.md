# Coach mode: a long-term plan

Status: idea and plan, nothing implemented. Date: 2026-11-04.
Revised the same day: the coach works outside Obsidian, and can write into the
client's vault.

A coach follows their paying clients from a **web app made for coaches**. The
client keeps training in Obsidian, as today; the plugin connects their vault to
the coach. The coach sees the client's training and **sends new programs
straight into the client's vault**. Chat comes in V2.

Related: `2026-11-04-achievements-plan.md` (coaches will reuse its declarative
challenges and medals).

---

## 1. The story

> Marco trains with his phone, as always: open the note, log, rest, log. On
> Sunday evening his coach, Giulia, opens the coach app in her browser: every
> client on one page, Marco's squat moving up, one missed session. She drags
> next week's program together (squat 4 × 5 at 105 kg, 2 min rest) and presses
> Send. Monday at the gym Marco opens Obsidian: "Giulia updated Lower Body A".
> The note is already there, with the tables, targets and timers.

### User stories

**Client (in Obsidian)**
- I connect to my coach with an invite code, and choose what they see (all, or
  some exercises, from a date; set notes on or off).
- My sets reach my coach by themselves; I don't export anything.
- My coach's programs appear in my vault as workout notes. I choose: written
  automatically, or I approve each one.
- When my coach changes a note, I'm told what changed and I can undo it.
- I can disconnect at any time and ask for my data to be deleted.

**Coach (in the web app)**
- I invite clients by email or link; I see all my clients on one page: last
  session, sessions this week, adherence to the program, PRs, notes.
- I open a client and see the same charts and numbers the client sees in
  Obsidian (same PR, session, trend definitions).
- I build a program (days, exercises, sets, reps, weight, rest, notes) once,
  reuse it as a template, and send it to one or more clients.
- V2: I chat with each client.

---

## 2. Decisions

1. **The coach side is not in Obsidian.** A web app (desktop and phone
   browser). Coaches don't need Obsidian, a vault or our plugin.
2. **The client's data can leave the vault**, with explicit consent and a
   chosen scope. The vault stays the client's source of truth; the server holds
   a copy for the coach.
3. **The coach can write into the client's vault**, only inside what the client
   allowed (a `Coach/` folder, and target updates in notes the coach sent).
   Every write is announced and can be undone.
4. **The coach never writes the client's log.** Logged sets are the client's
   facts. The coach writes programs (notes), not results.
5. **One definition of training, two places.** Sessions, PRs, trends, e1RM,
   streaks are computed by the same code in the plugin and in the web app: the
   pure modules (`TrainingHistory`, `ProtocolCatalog` ids, `CsvCodec`,
   `WeightUnitUtils`) move to a shared package (see section 6).
6. **Programs travel as data, not Markdown.** The coach app sends a structured
   program; the plugin turns it into notes with its own generators
   (`schema.serialize`), so the note format stays owned by the plugin and the
   coach app doesn't need to know Markdown or block syntax.
7. **Money**: coaches pay a subscription to the coach app (outside Obsidian,
   outside the plugin). Coach ↔ client payments stay with the coach's own tools
   at first; billing clients through the app is a later, separate decision.

---

## 3. Architecture

```
 Client's Obsidian (plugin)              Server                    Coach web app
 ─────────────────────────              ──────                    ─────────────
 log CSV ── sync up (scoped) ───────▶  API + DB  ◀──── reads ───── dashboard, client page
 vault   ◀── writes programs ───────   (EU)      ◀──── writes ──── program builder
 inbox   ◀── V2 chat ──────────────▶   realtime  ◀───────────────▶ V2 chat
```

**Server.** Auth (coach accounts; client devices get a token from the invite),
a database with row-level access (a coach reads only their clients, a client
only their own rows), realtime for V2 chat. Candidate: Supabase (Postgres +
auth + row-level security + realtime) in an EU region; alternative Cloudflare
Workers + D1 + Durable Objects. Choose in phase K0.

**Coach web app.** Separate repository (e.g. `workout-planner-coach`),
TypeScript, using the shared package for every training number.

**Plugin side: the connector.** A new service in the plugin,
`app/services/coach/`:

- `CoachConnection` — invite code → device token (in settings), scope, status,
  disconnect (revokes the token, asks the server to delete the client's data).
- `CoachSync` (up) — after `log:added` / `log:updated` / `log:deleted` /
  `log:bulk-changed` (debounced, e.g. 2 minutes, and on Obsidian start) it reads
  rows through `WorkoutLogFile` and uploads the training days that changed, in
  scope. A day is sent whole, so edits and deletions correct themselves and
  sending twice is harmless. Weight is sent in kg with the entered unit.
- `CoachInbox` (down) — on start, on focus and every few minutes while Obsidian
  is open it fetches pending messages (programs, target changes; V2: chat) and
  applies or queues them. Obsidian can't run in the background, so a program
  sent while the client's app is closed arrives at the next open.
- `ProgramWriter` — turns a program into notes: one note per training day in
  `Coach/<program>/`, each exercise a `## section` with a `workout-log` block
  (`exercise`, `sets`, `targetReps`, `targetWeight`, `id`) and a
  `workout-timer`, plus a `workout-session` block, all via the existing block
  schemas and example generators.

### Writing into the client's vault

- **Mode**, chosen by the client: *Automatic* (applied on arrival, with a
  notice) or *Ask me* (an inbox modal: preview, Accept, Reject).
- **Where**: new notes only under `Coach/` (configurable). Changes to existing
  notes only to notes the coach wrote, and only by patching blocks by `id`
  through `CodeBlockEditorService` (e.g. a new `targetWeight`), so the client's
  own text, comments and extra blocks are kept.
- **Conflicts**: the plugin remembers the hash of what it last wrote. If the
  client changed the note since, it does not overwrite: it writes the coach's
  version next to it (`Lower Body A (coach).md`) and says so.
- **Undo**: before every write the previous version is saved (like the log
  backups); "Undo last coach change" restores it.
- **Several devices** (Obsidian Sync): every message has an id; applied ids are
  kept in settings (synced with the vault) and writes are idempotent, so two
  devices receiving the same program produce one note.
- **Never**: write outside the allowed folder, touch the log, delete a note the
  client created.

### The program format (v1)

```json
{ "id": "prg_123", "version": 3, "name": "Lower Body A",
  "days": [
    { "id": "day_a", "title": "Lower Body A",
      "exercises": [
        { "exercise": "Squat", "sets": 4, "targetReps": 5, "targetWeight": 105,
          "unit": "kg", "restSeconds": 120, "protocol": null,
          "note": "Pause 1 s at the bottom" } ] } ] }
```

Versioned (`version` grows on every send) so the plugin knows whether a note is
up to date; unknown fields are ignored, so the coach app can grow ahead of the
plugin.

---

## 4. Privacy, accounts, policies

Obsidian's [developer policies](https://docs.obsidian.md/Community+directory/Developer+policies)
allow, if clearly stated in the README: network use ("which remote services are
used and why"), "An account is required for full access", payments. Client-side
telemetry stays forbidden: coach sync runs only after the client connects to a
coach, sends only the chosen scope, and never anything else.

- **README "Coach" paragraph**: the server, what is sent, when, why; link to
  the privacy policy. The plugin works fully without it.
- **Consent screen** at connection: what the coach will see, that the data is
  stored on our server in the EU, that the coach can write into `Coach/`.
- **GDPR**: training data is health-related. The coach is the controller of
  their clients' data; we are the processor (data processing agreement with
  coaches, EU hosting, encryption in transit and at rest, deletion on
  disconnect, export on request). Get a legal opinion before launch; it is a
  real product, not a plugin feature.
- **Tokens** live in the vault's plugin settings: anyone with the vault can
  use it, so the client can revoke a device from the plugin and the coach app.

---

## 5. Roadmap

Each phase is usable on its own.

**K0 — Decide and validate (no code in the plugin)**
- Talk to 3–5 coaches: what they use today, what they would pay, what they need
  on day one. Choose the backend. Mock the coach dashboard.

**K1 — Shared core**
- Move `TrainingHistory`, protocol ids, `CsvCodec`, weight units into a package
  with no Obsidian dependency (`packages/core` or a separate npm package), used
  by the plugin unchanged. No user-visible change.

**K2 — See the client (one way: vault → coach)**
- Server + auth, coach app v0 (clients list, client page with sessions, PRs,
  charts), plugin `CoachConnection` + `CoachSync`, README, privacy policy.

**K3 — Programs into the vault (coach → vault)**
- Program builder and templates in the app; plugin `CoachInbox` +
  `ProgramWriter`, Automatic / Ask me, conflicts, undo, target patches.

**K4 — Coach tools**
- Adherence (planned sets vs logged, same rule as `workout-session`), weekly
  summary per client, coach challenges in the achievements format, the client's
  medals in the app.

**V2 — Chat**
- Per-client chat in the app; in Obsidian a side view (`ItemView`) with the
  conversation, messages tied to a session or exercise when sent from there.
  Realtime while Obsidian is open, otherwise at next open; push notifications
  when the app is closed need a channel outside Obsidian (email, or a future
  companion app), to decide then.

**Later**
- Coach billing their clients through the app (Stripe Connect), teams of
  coaches, a client-side web view for clients who don't use Obsidian.

---

## 6. Market and positioning

Input: `docs/research/2026-11-04-coaching-software-market.md` (CoachPlus and
eight competitors; numbers reported, not verified).

### What the market says

- Coaching SaaS is crowded and cheap in Italy: €10–25 a month for 10–100
  clients, NoSpot unlimited at €12.99, Allenio, Apex Coach and FIT Click with
  free tiers, AI or branding at entry level. CoachPlus wins on depth
  (training + nutrition + booking + payments + wearables), not price.
- Their common weak point is **the client in the gym**: rest timer, density of
  the workout screen, notes and history hard to reach between sets. That is
  exactly what this plugin was built around (the note is the workout).
- Data ownership is a gap: CoachPlus's store listing says data can't be deleted;
  only FIT Click advertises export.

### The hard truth for us

1. **Every client would need Obsidian.** Most personal-training clients don't
   use it and won't install it for their coach. A coach app whose only client
   app is our plugin is a niche of a niche. This decides the product more than
   any feature.
2. **We would not beat them on the lock-screen timer either**: a plugin can't
   do Live Activities or background alarms
   (`docs/research/2026-11-01-timer-mobile-feasibility.md`). Our in-gym edge is
   the note-as-workout and fast logging, and fast logging still needs work
   (`docs/competitors/2026-10-31.md`: one tap in LiftOff and others, 2–3 taps
   plus a modal for us).
3. **Feature parity is out of reach** for this project: nutrition, booking,
   payments, photos, questionnaires, branded apps, wearables. Chasing it means
   becoming a worse CoachPlus.
4. "Coach" is already the name of an Obsidian plugin in our competitor list:
   choose another name.

### Proposed positioning

**"The coach app for clients who own their training data."**

- **Who**: online strength coaches (powerlifting, hybrid, calisthenics) with
  tech-savvy clients, and lifters who already log in Obsidian and want a coach.
  Small, but nobody serves it, and they are the people who care about owning
  their data.
- **Training only**: programs, logging, progress, adherence, later check-ins.
  No nutrition, booking or payments; the coach keeps their tools for those.
- **Data ownership as the product**: the client's vault is the original, export
  and deletion are one button, the program format is open and documented.
- **Interoperable from day one**: the coach app also accepts clients who log
  elsewhere (Strong/Hevy CSV exports, which the plugin already reads with
  `readWorkoutExport`), so a coach isn't forced to move every client to
  Obsidian. A light web client for non-Obsidian clients stays in "Later",
  and only if the niche works.
- **Automation without AI hype**: "clients at risk" (missed sessions, falling
  adherence, stalled lifts) computed deterministically from `TrainingHistory`
  in K4, the same need CoachPlus's announced AI assistant targets.
- **Price**: don't open with a price war. Free for a few clients while
  validating (K0–K2); a price only once coaches use it every week.

### What this changes in the roadmap

- K0 must answer one question first: *will 5 real coaches accept clients who log
  in Obsidian or by import?* If not, stop before building a server.
- Fast logging in the plugin (one tap on a prefilled row) becomes a
  prerequisite of K2: it is the in-gym quality the coach product sells.
- Strong/Hevy import as a client source moves into K2.

---

## 7. Open questions

1. Supabase or Cloudflare? (Proposal: Supabase, for auth, row-level security
   and realtime for chat, EU region.)
2. Shared core as a folder in this repo (monorepo) or a published npm package?
   (Proposal: monorepo first, publish when the coach app exists.)
3. Default write mode for new clients: Automatic or Ask me? (Proposal: Ask me,
   the client switches to Automatic once they trust it.)
4. Several coaches per client (coach + physio)? (Proposal: one in K2, several
   later, each with its own scope and folder.)
5. Coach subscription price and the free tier (e.g. 2 clients free).
6. Name of the coach product and whose name is on the privacy policy.
