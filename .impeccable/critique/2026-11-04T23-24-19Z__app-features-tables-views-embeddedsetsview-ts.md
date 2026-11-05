---
target: workout-sets block
total_score: 22
max_score: 36
na_heuristics: 10
p0_count: 1
p1_count: 2
target_identity: "file:/Users/raresspatariu/Documents/obsidian/the-gym-test-plugin/.obsidian/plugins/obsidian-workout-plugin/app/features/tables/views/EmbeddedSetsView.ts"
target_fingerprint: "sha256:9e354f66a1749aaf636f768b677ca34b23ef9f65faf5af389f9f88633aa726e5"
target_path: /Users/raresspatariu/Documents/obsidian/the-gym-test-plugin/.obsidian/plugins/obsidian-workout-plugin/app/features/tables/views/EmbeddedSetsView.ts
timestamp: 2026-11-04T23-24-19Z
slug: app-features-tables-views-embeddedsetsview-ts
---
Method: dual-agent (A: design review · B: detector + browser, sequential on Obsidian's single window)

## Design Health Score
| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | Log/untick give only a redraw; logged-set protocol/notes save silently |
| 2 | Match System / Real World | 3 | Set/Reps/Weight/tick/Last time clear; WU/SS jargon acceptable |
| 3 | User Control and Freedom | 2 | Untick restores values but renumbers, new timestamp on re-log, rest keeps running |
| 4 | Consistency and Standards | 2 | Same check = log (empty) / delete (filled); logged values offset ~8px from inputs |
| 5 | Error Prevention | 1 | Destructive filled check 8px from chevron, no confirm or undo |
| 6 | Recognition Rather Than Recall | 3 | Last-time placeholders good, but faint placeholder is the value logged |
| 7 | Flexibility and Efficiency | 4 | One tap logs last time, Enter logs, rest auto-starts |
| 8 | Aesthetic and Minimalist Design | 2 | Big timer repeated; Last time duplicates placeholders; 7 scrolling chips |
| 9 | Error Recovery | 3 | Inline role=alert + focus; failed save restores state |
| 10 | Help and Documentation | n/a | Embedded task block |
| Total | | 22/36 | Acceptable (61%) |

## Deterministic scan
Exit 2 in desktop/mobile/logged states; 24/24/22 findings, all in .workout-sets. low-contrast x22: input placeholders #666 on #2e2e2e 2.4:1 (mobile 2.2:1), _sets.scss:136 --text-faint. undersized-ui-text x2: SS badge 10.4px (--workout-font-2xs). Light theme: inputs same background as card, no border (review only).

## Priority Issues
- [P0] Filled check deletes the set, 8px from chevron, no undo. Fix: Notice with Undo restoring original timestamp/protocol/notes, or move "Remove set" into details; separate chevron from check. (/impeccable harden)
- [P1] Rest timer duplicated and ~40% of phone screen. Fix: compact one-line rest strip when shared with section timer id; collapse when idle. (/impeccable layout)
- [P1] Placeholder is the logged value but 2.2:1 and light-theme inputs invisible. Fix: visible input surface in both themes, suggestion >=4.5:1 with distinct treatment. (/impeccable colorize or polish)
- [P2] Untick breaks row order (renumbering, draft in wrong slot, rest not stopped in unlogRow). Fix: untick only last logged set or keep draft in slot; stop rest. (/impeccable harden)
- [P2] Focus lost after log/untick; progress not announced; logged values unnamed; chips ungrouped. (/impeccable audit)

## Persona Red Flags
Casey: delete next to chevron, timer pushes rows off screen, faint placeholders, horizontal chips, no undo. Sam: "Undo set 1 pressed" hides deletion, focus lost, unnamed values, no live progress. Riley: untick middle set, untick beyond plan (extraRows), two blocks same exercise, reopen mid-rest resets timer, set from other device with open drafts.

## Minor Observations
Last time line duplicates placeholders on mobile; details dot outside chevron bounds on mobile; logged values misaligned with input text; Add set bottom-right; SS badge 10.4px.

## Questions to Consider
Should a logged set be removable from the main row? Why show the shared rest twice? Should "repeat last time" be explicit rather than a faint placeholder?
