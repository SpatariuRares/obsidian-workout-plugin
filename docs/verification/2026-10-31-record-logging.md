# Record logging acceptance — 2026-10-31

Current scope: #23 text only; #22 store description; #24 excludes warm-up and drop sets only from records; #25 last set / PR and saved-record feedback. The user withdrew #28 on 2026-11-01 after trying Next set; its implementation has been removed. Inline scenarios below are historical, no longer acceptance requirements.

Technical checks: production build (including TypeScript), ESLint and README asset/anchor checks passed. Impeccable's focused detector reported no findings. No synthetic tests were run, as required by AGENTS.md and obsidian-verify.

## External listing

Author access was available. Saved a 196-character short description (the store limit is 200; the manifest text is 230). The public listing visibly shows the new text. The long description already matched the manifest. Evidence: `/private/tmp/workout-implementation/store.png`. Checked the GitHub mirror: it still contains the previous description. Propagation remains pending; the public store listing is already updated.

## Obsidian

Vault: `the-gym-test-plugin`, desktop Obsidian 1.14.5. Confirmed via DevTools that the repository build loaded from `.obsidian/plugins/obsidian-workout-plugin`; the normal installed plugin uses a separate directory. No protected build files were overwritten.

Created a disposable note and header-only CSV, and temporarily selected that CSV. Opened the real log form. Native UI automation then returned stale screenshots and `elementHasNoFrame` for inputs, preventing reliable interaction or visual acceptance. No set was saved. The following scenarios remain **not verified**:

| Action | Expected result |
| --- | --- |
| Save first standard set, 80 kg × 8 | Establish PR; no new-record celebration |
| Open the same exercise's log form | Show last set and PR of 80 kg × 8 |
| Save 100 kg warm-up and 95 kg drop set | Badges appear; PR remains 80 kg; both sets remain in volume/trends |
| Save standard 82.5 kg × 8 | Notice says 82.5 kg, increase 2.5 kg; PR updates |
| Save an equal or lighter set | No new-record celebration |
| Save kg/lb entries and reopen | Pre-fill in entered unit; compare records in settings unit |
| Tap inline save, then reopen note | Exactly one row persists; next set number advances; linked rest timer restarts |
| Enter invalid values or cancel modal | No row saved; validation shown / modal closes |
| Use narrow viewport and keyboard | No overflow; labels, adjustment, protocol and save remain usable |
| Hide all prior sets with a date filter | Next set remains available from full history |
| Open table without a single exercise or exact prior set | Use existing modal flow; no guessed next set |

Cleanup: both plugin settings profiles and the original plugin directory were restored; the disposable note, CSV, empty folder and newly created empty note were moved to trash. Compared original CSV text before and after: identical. Returned to the original Getting Started note. The new build is not installed in the normal protected plugin directory.

README additions passed asset/anchor validation and were inspected in a local preview rendered by the GitHub Markdown API: the introductory paragraph and Workout Block warning are present. The public GitHub/store README remains unchanged until pushed.

## Follow-up: mobile-first acceptance

The user explicitly authorized arbitrary test changes inside `the-gym-test-plugin` and made mobile the primary acceptance target. Required device profile: **iPhone SE, 375 × 667**, with Obsidian mobile emulation (`this.app.emulateMobile(!this.app.isMobile)`), not only responsive CSS. The DevTools device profile and Obsidian's mobile navigation were visibly confirmed in the live screenshot.

A second fixture was prepared at `QA-live-records-1793466900989/Acceptance.md`, with a separate CSV and strength/timed exercise definitions. The repository build was loaded at runtime. Through the real form, entered 8 reps and 80 kg and selected Create log. The live accessibility tree subsequently showed the table row (8 reps, 80 kg, volume 640) and `Next set · 2`, pre-filled with 8 and 80. This is a partial desktop observation; durable persistence and absence of the first-record Notice were not independently verified.

After the mobile-emulation reload, Obsidian loaded the normally installed plugin again. The current-build mobile flow has **not been verified**. Attempts to reload the repository build through the console were not confirmed; copying the build into the installed plugin directory was denied by the filesystem. The native control session also repeatedly returned ScreenCaptureKit capture errors (-3811/-3812), stale frames, and `noWindowsAvailable`, even after reconnecting it. Do not treat the screenshot of mobile chrome as acceptance of the new logging features.

The second fixture remains in the disposable test vault for resumption. The normal plugin directory was not overwritten. Mobile form save/validation/cancel, warm-up/drop record exclusion, PR feedback, inline logging/timer restart, units, and narrow-layout checks all remain required before acceptance can be completed. Restore or deliberately reselect the test CSV when reloading the repository build; the ordinary installed plugin has a separate settings profile.


## 2026-11-01: mobile observations and removal of Next set

Reload restored working control temporarily. Confirmed Obsidian mobile mode (`isMobile: true`), DevTools iPhone SE 375 × 667, and the repository build directory. Actual UI actions against the existing disposable CSV produced these results:

| Action | Expected result | Observed result | Status |
| --- | --- | --- | --- |
| Open Add log for QA Record Press | Last set and PR 80 kg × 8 | Both shown; mobile form screenshot inspected | Passed |
| Save 100 kg × 8 Warm-up | WU badge, volume 800, PR stays 80 | Saved; reopened form shows last 100 / PR 80 | Passed |
| Save 95 kg × 8 Drop set | DROP badge, volume 760, PR stays 80 | Saved; reopened form shows last 95 / PR 80; combined daily volume 1560 | Passed |
| Save standard 82.5 kg × 8 | PR 82.5, increase 2.5 | New-record Notice shown; reopened form shows last and PR 82.5 | Passed on pre-removal build |
| Save equal 82.5 kg × 8 | No record Notice | Success Notice only; one additional row | Passed on pre-removal build |
| Submit missing reps, cancel modal | No write | Required-field Notice, unchanged rows; cancel closes form | Passed on pre-removal build |
| Save while rest timer stopped | Start from configured duration | Timer changes from completed to 01:30 running | Passed on pre-removal build |

The timer preserves its existing behavior: a running timer is not reset by another save. This is intentional in the existing event handler, not a new guarantee of restarting on every save. Screenshots of the modal and inline controls fit the narrow viewport; physical iOS keyboard behavior remains unverified. New-record feedback was observed in the live accessibility tree; no screenshot of the brief Notice was retained. No plugin console errors were shown during these scenarios.

The user then rejected Next set because it duplicates Add log. Removed its component, table integration, next-set counter, strings, styles and release-note promise. Kept the existing Add log entry point, exact-exercise prefill and today's date, form history, record feedback and record eligibility. Reverted the field-reading extraction that existed only to share modal and inline saving.

Production build/TypeScript and lint were rerun for the removal. Both review axes inspected the removal; no code findings. The spec review requested this scope amendment.

The UI control became unreliable again while attempting to reload the simplified build: console focus/Return actions did not produce confirmed execution. Consequently, the final post-removal build's visible table and Add log save are **not verified**. Mixed kg/lb persistence, first-record Notice absence, timed/custom fields, and full cleanup/restoration also remain **not verified**. The disposable fixture remains for resumption; no existing workout CSV was targeted by this run. No files in the normally installed plugin directory were overwritten. Do not claim full feature acceptance from these partial observations.
