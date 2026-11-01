## Since release 2.6.0: regression scenarios

Baseline: release **2.6.0**, published 31 October 2026. These examples cover user-facing changes after that tag, plus the estimated 1RM work in progress. Existing examples stay intact. Next set was withdrawn and is excluded.

| Feature | Example | Expected result |
| --- | --- | --- |
| Native onboarding | Guide and lesson links below | Native notes, eight lessons, no welcome choice modal |
| Record eligibility | Record Demo Press; Record Demo Warmup Only | Warm-up/drop sets stay visible but cannot establish a PR |
| Last set and PR | Add log for Record Demo Press | Last set 77.5 kg × 8; PR 80 kg × 8 before manual saves |
| Save feedback | Save standard 82.5 kg × 8 | Record increase of 2.5 kg; first/equal/lower sets do not celebrate |
| Estimated 1RM | Estimated 1RM regression examples above | Daily maxima, excluded invalid days, additive API field |
| Timer device cues | Short and concurrent timers below | Normal timing; global settings and platform-dependent effects |

### Native onboarding and getting started

Open [[The gym examples/Getting Started/Getting Started|Getting started]]. Follow each lesson and its Back, Getting started and Next links; Finish returns to the index. These open native notes without a spotlight overlay.

- [[The gym examples/Getting Started/01 Tables|01 Tables]]
- [[The gym examples/Getting Started/02 Strength charts|02 Strength charts]]
- [[The gym examples/Getting Started/03 Cardio charts|03 Cardio charts]]
- [[The gym examples/Getting Started/04 Timed charts|04 Timed charts]]
- [[The gym examples/Getting Started/05 Statistics|05 Statistics]]
- [[The gym examples/Getting Started/06 Rest timer|06 Rest timer]]
- [[The gym examples/Getting Started/07 Interval timer|07 Interval timer]]
- [[The gym examples/Getting Started/08 Workout duration|08 Workout duration]]

Repeat through Command palette → Workout Planner: Open getting started guide, Settings → Workout Planner → Getting started, and the retained Start the tour command. Each opens the native guide. Reopening preserves existing notes and CSV rows.

Fresh-install check: use a separate new test vault/profile with no saved plugin data and no workout CSV. The guide opens automatically once and stays quiet on reload. Do not erase this vault's settings or CSV to simulate first run.

### Warm-up, drop sets, last set and weight PR

Seeded Record Demo Press history: standard 80 kg × 8, warm-up 100 kg × 8, drop set 95 kg × 8, latest standard 77.5 kg × 8. Expected: four rows, **2820 kg volume**, warm-up/drop badges, and **80 kg × 8 PR** despite the heavier excluded sets.

```workout-log
exercise: Record Demo Press
exactMatch: true
dateRange: 0
limit: 20
showProtocol: true
```

Open Add log: last set 77.5 kg × 8, PR 80 kg × 8, latest reps/weight prefilled, and today selected. Cancel leaves the CSV unchanged; missing/invalid required values show validation without saving.

Save standard 82.5 kg × 8: exactly one row and a new-record notice with **2.5 kg increase**. Reopen: last set and PR are both 82.5 kg × 8. Equal 82.5 or lower 80 gives ordinary saved feedback. A heavier warm-up/drop set changes last set but not PR. Saving starts a stopped matching rest timer; it does not reset an already running timer.

```workout-timer
id: showcase-record-rest
exercise: Record Demo Press
duration: 90
sound: false
```

Optional mixed-unit check, before changing this baseline: save 160 lb × 8 through the real form. About 72.57 kg does not beat the 80 kg PR. Reopening retains the entered lb unit; PR comparison uses the settings unit. Let the logging UI write per-entry units to the CSV.

After manual saves these values evolve. To replay the baseline, delete only your new rows for this demo exercise through the table; retain the four seeded rows.

### First record and warm-up-only history

Record Demo First Set intentionally has no seeded rows. Open Command palette → Workout Planner: Create workout log and enter that exercise name. Its first standard 80 kg × 8 establishes a baseline without celebration; the next heavier eligible set is a new record. Delete only manually added demo rows before replaying.

```workout-log
exercise: Record Demo First Set
exactMatch: true
dateRange: 0
showProtocol: true
```

Record Demo Warmup Only has 100 kg warm-up and 95 kg drop sets: two visible rows, **1560 kg volume**, **no eligible PR**. Its first standard set establishes a baseline without celebration even when lighter than those rows.

```workout-log
exercise: Record Demo Warmup Only
exactMatch: true
dateRange: 0
showProtocol: true
```

### History outside the visible date filter

Record Demo Historical has standard 80 kg × 8 on 20 October, then warm-up 100 and drop set 95, ending with standard 77.5 kg × 8 on 23 October 2026. In November its one-day table is empty. Use Command palette → Workout Planner: Create workout log and enter Record Demo Historical: last set 77.5 kg × 8 and PR 80 kg × 8 come from full history despite the table filter. The empty table currently has no Add log button. There is no inline Next set control.

```workout-log
exercise: Record Demo Historical
exactMatch: true
dateRange: 1
showProtocol: true
```

### Timer device cues: short completions

Settings → Workout Planner → Timer device cues: **Keep screen awake while a timer runs** defaults on; **Vibrate when a timer completes** defaults off. These are global settings, not block parameters. Record your starting values and restore them after testing.

Silent five-second timer: with vibration enabled on a supported physical device, expect a pulse at zero despite disabled sound. Start/pause/resume/reset remain usable when an API is unavailable or refuses access.

```workout-timer
id: showcase-device-silent
duration: 5
sound: false
showControls: true
```

Audible ten-second timer: tap Start to unlock audio. The existing early audio cue is around two seconds remaining; enabled/supported vibration happens at actual completion.

```workout-timer
id: showcase-device-audio
duration: 10
sound: true
showControls: true
```

### Timer device cues: concurrent timers and note changes

On a physical device with a short idle timeout, start A and B. With screen protection enabled and the app visible, the screen stays awake where supported. Pause/reset A: B still needs protection. Stop/reset/finish B: the last timer releases it. Turning the setting off releases it immediately; turning it on with a running timer requests it again.

Timer A:

```workout-timer
id: showcase-device-a
duration: 90
sound: false
```

Timer B:

```workout-timer
id: showcase-device-b
duration: 120
sound: false
```

These have persistent IDs: switch to [[The gym examples/Dashboard|Dashboard]] and back; timing continues. Background and return: foreground protection is requested only while needed. No background alarm is promised. Reset all timers after testing.

Physical acceptance is separate from desktop/narrow-view emulation. Android vibration needs support; iOS web vibration is unavailable, so use audio. Missing/denied APIs must not break timing. A desktop screenshot does not verify physical wake lock, vibration or background behavior.

### Presentation, listing and removed functionality

At 375 × 667 mobile emulation, inspect Add log, history, protocol selection, validation, saved rows and chart tables. Check wrapping and usable controls. Physical keyboard/device behavior needs a real phone.

The post-release store description and Workout Block conflict warning are text/listing changes: inspect README and the public listing separately. Avoid running both plugins that register workout-log against the same CSV.

Summary retains its four statistic cards without an appended strength-record list. A dedicated record widget is deferred. Next set was withdrawn; use Add log.

### Replay notes

Permanent rows use explicit demo exercise names and identifying notes. Keep pre-existing CSV and note content intact. Seeded dates are fixed in October/November 2026; if date-limited examples age out, move those demo dates together and update expected dates. Never reset unrelated workouts to replay a scenario.
