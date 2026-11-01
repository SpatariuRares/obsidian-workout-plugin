# Timer device cues — implementation verification, 1 November 2026

Implements the recommendations from the [issue #26 feasibility investigation](../research/2026-11-01-timer-mobile-feasibility.md), after the user authorized development. The original issue report was published before implementation. Device support remains best effort and physical Android/iOS acceptance remains **not verified**.

## Implemented behavior

- Global `keepScreenAwake` defaults to true; global `vibrateOnCompletion` defaults to false. Both appear in Timer device cues settings and take effect for existing running timers.
- One plugin-owned `TimerDeviceEffects` tracks running timer views idempotently. The final stop/pause, reset, completion, destruction or plugin unload releases its wake lock. Pending grants from an obsolete ownership/visibility cycle are released; a new cycle can then request its own lock. Returning to a visible document reacquires only while needed. System rejection/release does not trigger an automatic retry loop or interrupt timing/audio.
- Vibration is a single 200 ms pulse at actual timer completion, independent of audio and its existing two-second early beep. Missing APIs, hidden documents and missing user activation leave timing/audio usable. No native iOS bridge or dependency was added.
- Existing persistent-ID timers keep running across note switches; temporary timers are destroyed with their view. This behavior is preserved and documented in the README.

## Technical checks

| Check | Result |
| --- | --- |
| `npm run typecheck` (baseline and after implementation) | Passed. |
| `npm run build` | Passed; production bundle generated. |
| Focused ESLint on changed TypeScript files | Passed, zero warnings. |
| `npm run lint` | Passed, including README checks. |
| Existing `EmbeddedTimerView.test.ts` and `ListSettings.test.ts` | 2 suites / 16 tests passed. |
| `npm test -- --runInBand` | 134 suites passed, 3 failed; 1,797 tests passed, 6 failed; 10 snapshots passed. |
| Baseline comparison of the three failing files at `2f70fc3` | Same 6 failures reproduced: 3 suites failed, 46 tests passed. No new failing test identified. |
| Two-axis code review | Standards: 0 material findings. Spec: 0 substantive findings. Historical research note clarified following review. |
| `git diff --check` | Passed. |

The pre-existing failures are one protocol-list expectation in `ProtocolCatalog.test.ts`, one protocol-coverage expectation in `exampleDataGenerator.test.ts`, and four table/add-log expectations in `EmbeddedTableView.test.ts`. Existing tests were preserved; the timer-view plugin fixture gained the required device-effects collaborator. These tests are technical regression checks requested by the implementation skill; they do not replace live acceptance.

## Actual app evidence and limits

Session: Obsidian 1.14.5 on macOS, vault `the-gym-test-plugin`. The app already had a responsive 567 × 844 DevTools viewport configured; this is desktop emulation, not a physical phone. The active plugin directory was `workout-planner`, separate from the source checkout. The new bundle was copied there and the plugin was reloaded without restarting Obsidian.

| Action | Expected result | Observed result | Status |
| --- | --- | --- | --- |
| Inspect active vault/plugin through Obsidian's console after reload. | Intended vault and newly built plugin instance loaded. | Vault name matched; `timerDeviceEffects` existed. Active and local bundle SHA-256 both `fe8eff12daf78a8f566dec320b3fdc185499da2e23be51fdabbeba3383c1428c`. | Passed — loaded-build check only. |
| Inspect newly loaded default settings. | Wake lock enabled, vibration disabled when saved settings lack these fields. | Console returned `{"effects":true,"keep":true,"vibrate":false}`. | Passed — initialization check only. |
| Inspect desktop API capabilities. | Determine API presence without claiming hardware support. | Secure context true, wake lock present, vibration function present. | Observed; no physical behavior established. |
| Toggle preferences in real settings, reopen/reload, exercise concurrent timers, pause/reset and completion. | Visible controls persist preferences and timers continue normally, with appropriate device effects. | Native control became unreliable: input did not reach fields and coordinate actions returned `noWindowsAvailable`; rebinding/resetting control did not resolve it. No completed timer scenario was observed. | **Not verified** — desktop acceptance incomplete. |
| Keep a physical phone awake beyond its idle timeout; feel Android completion vibration; background/foreground, denied/revoked lock, unavailable APIs, auto-start. | Behavior matches the feasibility checklist on actual devices. | User confirmed no Android/iOS devices are available. | **Not verified**. |

The visible DevTools console showed no errors at the last inspected state, but no completed timer flow was available to establish an error-free acceptance result. No synthetic device behavior was substituted for unavailable hardware.

## Cleanup and restoration

The temporary empty `Untitled 1.md` created during the unsuccessful UI setup was removed from the vault and retained recoverably under the source checkout's ignored `.tmp/`. No populated QA note or fixture CSV was created. The active plugin's saved settings still matched their pre-test backup; no workout CSV was changed. The new plugin build remains installed and enabled. Complete workspace restoration was not confirmed after the native-control failure; DevTools may remain open.

The user subsequently clarified the ongoing testing policy: use existing example notes and their example CSV in this test vault, with CSV test writes authorized. This is recorded in `AGENTS.md`; future sessions do not need separate disposable fixtures for these example-data scenarios.
