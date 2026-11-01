# Workout Planner

<!-- impeccable:product-schema 1 -->

## Platform

web

The interface runs inside Obsidian on desktop and mobile. Mobile use is primary; this is an Obsidian plugin, not a standalone website or native app.

## Users

The primary user logs sets on their phone at the gym, then reviews progress in the same Obsidian notes used to plan training. The user confirmed mobile as the primary context.

## Product Purpose

Make it practical to plan, record, and review workouts within an Obsidian vault. The core job is recording the next set quickly during a workout, with progress available later in tables, charts, and dashboards.

## Positioning

Workout planning notes, interactive logging, rest timers, and progress views share the user's Obsidian environment. Workout records live in a plain CSV file in the vault, with no account or cloud service required by the plugin.

## Operating Context

- At the gym: open a workout note, record a set, use a rest timer, and repeat. Logging can begin from an embedded table, the command palette, or the desktop ribbon.
- Between sessions: review exercise history, trends, personal records, muscle distribution, and workout summaries within notes.
- Markdown code blocks embed tables, charts, timers, dashboards, and workout-duration estimates. Insert commands provide forms so users do not have to author block parameters manually.
- New users can start with example notes and data or their own log, with a guided tour and getting-started lessons.

## Capabilities and Constraints

Repository-documented capabilities:

- Strength, bodyweight, timed, distance, cardio, and custom exercise fields.
- Set logging with previous-set defaults, increment/decrement controls, recent exercises, notes, protocols, and per-set kg/lb selection.
- Editable workout history, progress charts, dashboard statistics, muscle heat maps, and estimated workout duration.
- Countdown, interval, and stopwatch timers with configurable presets.
- Exercise pages and muscle tags; workout records remain accessible to other vault tools through CSV.
- Desktop and mobile support, with mobile-specific presentations such as chart data tables. The README lists 24 languages.

Preserve local data ownership, fast logging, and integration with Obsidian workflows. Use Obsidian's platform conventions and theme variables; keep runtime plugin code compatible with mobile.

## Brand Commitments

The existing product name is Workout Planner. Existing identity assets include `assets/logo.png`. No replacement identity or additional brand claims were requested.

## Evidence on Hand

- `README.md`: documented workflows, capabilities, and product copy.
- `assets/`: existing logo and promotional UI compositions.
- `docs/ui-screenshots/README.md` and `docs/ui-screenshots/manifest.json`: indexed desktop and emulated iPhone SE captures from the running plugin, with build context and limitations.
- `docs/verification/`: recorded live verification evidence.

Screenshots establish observed presentation, not comprehensive functional or accessibility acceptance. Mobile emulation does not establish physical-device behavior.

## Product Principles

1. Optimize the recurring mobile task: recording a set during a workout.
2. Keep workout planning, logging, and review connected within Obsidian notes.
3. Preserve user ownership of readable vault data.
4. Use existing workout context and previous values to reduce repeated entry.

## Open Decisions

- The user requested a UI/UX check, with primary attention to mobile use. Its findings and any implementation scope remain to be established.
- No product-specific accessibility requirement or compliance target has been confirmed. Assess accessibility during review without claiming existing conformance.
