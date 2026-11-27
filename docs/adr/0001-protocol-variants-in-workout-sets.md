# Protocol variants in workout-sets without new CSV columns

Status: accepted

We are extending `workout-sets` to support protocol-specific training flows without breaking backwards compatibility or inflating the CSV schema. Structural changes are introduced only where the flat single-exercise model genuinely breaks — **Supersets** (`exercises: [A, B, ...]`, round-based layout in strict declared order, `restBetween` + `rest`, reusing the existing `blockId` CSV column) and **Warm-ups** (separated from working set counts, **Last time** hints, and working rest, with optional `warmups: N`) — while **21s**, **Drop Set**, **Myo-Reps**, and **Rest-Pause** remain lightweight via an optional block-level `protocol:` default and row `notes`, shipping directly without a Beta feature toggle.

## Considered Options

- **Adding a `setGroup` / `parentSet` CSV column**: Rejected because `exercise + blockId` already isolates sets and **Last time** hints inside a multi-exercise block, and adding new CSV columns for compound sets is premature before Drop Set / Myo-Reps / Rest-Pause UX is validated by users.
- **Creating a separate `workout-superset` code block or insert modal**: Rejected because it fragments `workout-sets`, `workout-session`, and `workout-duration`, and prevents converting a single-exercise block into a superset inside `EditSetsModal` through one adaptive `ProtocolPicker`-driven modal.
- **Building dedicated sub-row Drop Set and cluster/micro-timer UI for Myo-Reps and Rest-Pause upfront**: Deferred until community feedback confirms whether lightweight `protocol:` + `notes` is sufficient or dedicated intra-set UX is needed.

## Consequences

- Zero CSV schema changes; 100% backwards compatibility with existing `workout-sets` blocks, Strong/Hevy imports, and `WorkoutPlannerAPI`.
- Drop Sets logged as a single row with weight drops in `notes` do not include those drops in automatic CSV `volume` (surfaced explicitly in the community feedback issue).
- `myo_reps` and `rest_pause` share one underlying activation-set + micro-rest cluster mechanic; if feedback justifies dedicated UX later, one shared primitive can serve both.
- Superset blocks omit `targetWeight`/`targetReps` (`TargetSection`) in V1, support mixed exercise types, and follow strict declared exercise order.
- Row protocol precedence is: manual pick on row > last time's non-standard protocol for that set > block `protocol:` (modals write `protocol: superset` explicitly for `exercises:`) > `standard`.
- Release reminder: when preparing the release that ships these variants, add a feedback prompt linking to [issue #106](https://github.com/SpatariuRares/obsidian-workout-plugin/issues/106) inside `whatsNew.releases.vX_Y_Z`.
