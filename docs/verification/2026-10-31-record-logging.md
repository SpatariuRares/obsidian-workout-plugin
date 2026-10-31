# Record logging acceptance — 2026-10-31

Scope: #23 text only; #22 store description; #24 excludes warm-up and drop sets only from records; #25 last set / PR and saved-record feedback; #28 one pending set, no `targetSets`.

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
