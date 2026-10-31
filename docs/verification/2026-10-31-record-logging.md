# Record logging acceptance — 2026-10-31

Scope: #23 text only; #22 store description; #24 excludes warm-up and drop sets only from records; #25 last set / PR and saved-record feedback; #28 one pending set, no `targetSets`.

Technical checks: production build (including TypeScript), ESLint and README asset/anchor checks passed. Impeccable's focused detector reported no findings. No synthetic tests were run, as required by AGENTS.md and obsidian-verify.

## External listing

Author access was available. Saved a 196-character short description (the store limit is 200; the manifest text is 230). The public listing visibly shows the new text. The long description already matched the manifest. Evidence: `/private/tmp/workout-implementation/store.png`. The hourly GitHub mirror has not been verified.

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
| Open table without a single exercise or exact prior set | Use existing modal flow; no guessed next set |

Cleanup: both plugin settings profiles and the original plugin directory were restored; the disposable note, CSV, empty folder and newly created empty note were moved to trash. Compared original CSV text before and after: identical. Returned to the original Getting Started note. The new build is not installed in the normal protected plugin directory.

README additions have been inspected in source and passed asset/anchor validation; the updated rendered GitHub/store README remains unverified until pushed.
