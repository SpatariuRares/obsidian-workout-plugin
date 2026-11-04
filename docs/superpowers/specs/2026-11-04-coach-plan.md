# Coach mode: a long-term plan

Status: idea and plan, nothing implemented. Date: 2026-11-04.

A coach uses Workout Planner to follow their paying clients: sees their
training, writes their programs, comments on their sessions. The client's data
stays on the client's side: their vault is the only source of truth, and
nobody else (not even the plugin's author) can read it.

Related: `2026-11-04-achievements-plan.md` (coaches will reuse its declarative
challenges and medals).

---

## 1. The story

> Marco trains with his phone, as always: open the note, log, rest, log. On
> Sunday evening his coach, Giulia, opens her vault: a folder per client,
> Marco's charts already updated, his squat moving up, one missed session.
> She edits next week's "Lower Body A" (squat target 105 × 5) and sends it.
> Monday at the gym, Marco's note has the new targets. He never exported a
> file, and his log never left his phone unencrypted.

### User stories

- As a client, I connect to my coach with a code they give me, and I choose
  what they see (all, or only some exercises, from a date).
- As a client, I can stop sharing at any moment; the coach keeps nothing new.
- As a client, I receive programs from my coach as workout notes and accept
  them into my vault; nothing changes in my vault without my approval.
- As a coach, I see each client in my vault with the usual blocks (tables,
  charts, dashboards, achievements) on their data, read-only.
- As a coach, I see at a glance who trained this week, who missed, who hit a
  target or a PR.
- As a coach, I write a program once and send it to one or more clients.
- As a coach, I leave a comment on a client's session; they see it in their
  note.

---

## 2. Rules that never change

1. **The client owns the data.** The log is written only by the client's
   plugin. The coach never writes the client's log; the coach only *proposes*
   notes, the client accepts.
2. **Nothing readable leaves the device.** Everything sent between client and
   coach is end-to-end encrypted on the device (Web Crypto, available on
   desktop and mobile). Any server in the middle is a mailbox of ciphertext:
   it cannot read logs, names or programs.
3. **The client chooses and can revoke.** Shares have a scope (exercises, from
   date) and can be stopped; stopping deletes pending messages on the relay.
4. **The coach's copy is a copy.** In the coach's vault a client's data is a
   read-only mirror, replaced at each sync, clearly marked as the client's.
5. **Same blocks, same meanings.** The coach sees a client through the existing
   views and deep modules (`WorkoutLogFile`, `TrainingHistory`...), pointed at
   the client's mirror. No second implementation of PRs, sessions, trends.
6. **Money between coach and client is not the plugin's business** (at least
   until phase C5): the coach bills their clients as they do today.

---

## 3. How the data travels

### Option 1 — Files, no server (phase C0)

The client runs "Share with coach": the plugin writes a package (the log rows in
scope + the workout notes it uses) and the client sends it by any channel
(email, WhatsApp, Drive). The coach runs "Import client package" and gets
`Clients/Marco/`. Programs go back the same way.

- Pros: no server, no account, works today, private by construction.
- Cons: manual, every week. Good to validate the workflow with real coaches
  before building a service.

A variant without a plugin server: a folder synced by a tool the two already
use (Syncthing, Dropbox, an Obsidian Sync shared vault used only for the
exchange). The plugin reads/writes packages there. Less manual, but depends on
setup the plugin can't control.

### Option 2 — Encrypted relay (phase C2, recommended target)

A small service (Cloudflare Worker + R2/D1, like the community backend of the
achievements plan) that only stores and forwards encrypted messages.

**Pairing.**
1. The coach's plugin creates a key pair (ECDH P-256) once; the private key
   stays in the coach's vault settings (device keychain later).
2. The coach creates an invite: a short code / QR containing the coach's
   public key and a relay mailbox id.
3. The client enters the code; the client's plugin creates its own key pair,
   derives a shared key (ECDH → HKDF → AES-GCM), and sends a "hello" with its
   public key. Both show a 6-character safety code to compare (against a
   tampered relay).

**Sync.**
- Client → coach: after a session (debounced, e.g. 10 minutes after the last
  `log:added`) the plugin sends the *changes* since the last sync for the rows
  in scope, encrypted. Full resync on demand. The relay deletes a message once
  the coach's plugin acknowledges it, and anything older than 30 days.
- Coach → client: programs (workout notes), comments, challenges, same
  envelope. They arrive in an "Inbox from coach" modal; the client accepts or
  rejects each one.
- Message envelope: `{ to, from, seq, nonce, ciphertext }`. The relay sees only
  mailbox ids, sizes and times (that metadata goes in the privacy policy).

**Revoking.** The client presses "Stop sharing": the plugin sends a final
"revoked" message, deletes its keys for that coach and asks the relay to drop
the mailbox. The coach's mirror stays as it was at that moment (it is a copy
they already had), marked "sharing stopped".

**Multi-device.** A client logs on phone and desktop with the same vault
(Obsidian Sync etc.): only one device should send. The share's keys live in
the vault settings, so every device has them; `seq` numbers + the log's own
rows (diffed by timestamp) keep it idempotent, so two devices sending the same
change is harmless.

---

## 4. In the coach's vault

```
Clients/
├── Marco/
│   ├── log.csv              # read-only mirror, replaced by sync
│   ├── Marco.md             # coach's own notes, dashboard of Marco
│   └── Programs/            # notes written for Marco, sent from here
└── Sara/ ...
Coach dashboard.md           # all clients at a glance
```

- **Multiple logs.** Today the plugin has one log (`csvLogFilePath`).
  `LogStorage` is already the seam: a `ClientLogStorage` reads a client's
  mirror. Blocks get one new parameter, `client: Marco`, in every schema
  (`chartBlock`, `tableBlock`, `dashboardBlock`, achievements block): with it
  the view reads that client's log. The client's mirror is read-only
  (`WorkoutLogFile` refuses writes, the table hides "Add log").
- **Coach dashboard.** A new widget/block over all clients: last session,
  sessions this week vs `weeklyGoal`, adherence to the program (planned sets
  from `sets`/`targetReps` vs logged, same logic as `workout-session`), new
  PRs, targets reached, notes left by the client.
- **Programs.** A program is an ordinary workout note (blocks via
  `schema.serialize`). "Send to client" packs the note; on the client it is
  written into a `Coach/` folder, never overwriting a note the client changed
  (if it did, the client sees both and chooses).
- **Comments.** A comment is attached to a session (training day + workout) and
  shown on the client's `workout-session` / table as a small callout.
- **Coach challenges.** The coach can send a client a challenge in the
  declarative achievements format ("November: 12 sessions"), with its medal.

---

## 5. Accounts, payments, policies

Obsidian's [developer policies](https://docs.obsidian.md/Community+directory/Developer+policies)
allow, if clearly stated in the README: network use (which services and why),
"An account is required for full access", "Payment is required for full
access". Client-side telemetry stays forbidden, and coach mode never sends
anything outside the encrypted share.

- **Accounts.** None needed for clients: a key pair and a mailbox id are
  enough. The coach may need an account only for paying (phase C5).
- **Who pays what.**
  - Coach ↔ client money: outside the plugin. Coaches use their usual tools.
  - Coach → plugin: a possible "Coach" subscription covering the relay, with a
    free limit (e.g. 2 clients). The plugin is MIT and open source, so a
    client-side paywall can be removed by anyone; the enforceable part is the
    relay (it accepts more than N mailboxes per coach only with an active
    subscription). License via a provider such as Lemon Squeezy / Stripe.
  - A marketplace where clients pay coaches *through* the plugin (Stripe
    Connect) is out of scope: tax, refunds and disputes are a business, not a
    plugin feature.
- **GDPR.** The coach becomes controller of their clients' training data
  (health-related): they need the client's consent, which the pairing screen
  asks for explicitly. The relay only holds ciphertext, which keeps the
  plugin's author as close as possible to "no access". Get a legal opinion
  before launching the relay or any paid plan.

---

## 6. Roadmap

Each phase is useful on its own and only adds.

**C0 — Packages by hand (no server)**
- "Share with coach" (scope: exercises, from date) → package file; "Import
  client package" → `Clients/<name>/`. Validate with 2–3 real coaches.

**C1 — Multi-log in the coach's vault**
- `ClientLogStorage`, `client:` parameter in every block schema, read-only
  mirror, the coach's client notes. Coach dashboard (first version).

**C2 — Encrypted relay**
- Worker + storage in `community/relay/` (open source), pairing with invite
  code + safety code, automatic sync, revoke, README + `PRIVACY.md`.

**C3 — Programs and comments back to the client**
- Send a note, client inbox with accept/reject, comments on sessions, coach
  challenges (achievements format).

**C4 — Coach tools**
- Program templates sent to several clients, adherence reports, weekly summary
  note per client, achievements of each client.

**C5 — Business**
- Coach subscription for more clients, license check on the relay. Only if
  C2–C4 are used by real coaches.

---

## 7. Open questions

1. One coach per client, or several (e.g. a coach and a physio)? (Proposal:
   several shares, each with its own scope.)
2. Should the coach see the client's free-text notes on sets? (Proposal: a
   switch in the share scope, off by default.)
3. Can a coach-sent program change targets in notes the client already has, or
   only add new notes? (Proposal: new notes in C3; patching targets in existing
   blocks, through `CodeBlockEditorService`, with the client's approval, in C4.)
4. Where does the coach's private key live safely on mobile? (Settings in the
   vault for C2; anyone with the vault can read it, so say so in the docs.)
5. Is C0 (files) enough for many coaches? If yes, C2 can wait.
