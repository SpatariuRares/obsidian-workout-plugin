# Timer mobile feasibility — 1 November 2026

Historical pre-implementation investigation for [issue #26](https://github.com/SpatariuRares/obsidian-workout-plugin/issues/26). At the time of this report no timer feature had been added. The user subsequently authorized implementation of the recommendations below; see the [implementation verification](../verification/2026-11-01-timer-device-cues.md) for the resulting build and evidence. Android and iOS devices remain unavailable; all physical-device acceptance remains **not verified**.

Published [feasibility comment](https://github.com/SpatariuRares/obsidian-workout-plugin/issues/26#issuecomment-6550870585). The issue remains open for device checks. No vault data, settings, or workspace state was changed; no fixtures required cleanup. Documentation/source review and `git diff --check` are the technical proof for this investigation; build and synthetic tests were not run for a documentation-only change.

## Decision

The standard APIs are a reasonable basis for a small, best-effort foreground feature: screen wake lock where available, plus completion vibration on Android. Keep the existing beep on iOS. Do not promise background alarms or universal iOS support. Browser compatibility establishes a candidate implementation, not that Obsidian's embedded runtime grants or honours it.

## Documented platform support

| Capability | Android embedded WebView | iOS embedded WebView | Obsidian device result |
| --- | --- | --- | --- |
| `navigator.wakeLock.request("screen")` | BCD mirrors Chrome support from 84. | BCD mirrors Safari iOS: partial 16.4–18.3, full from 18.4; the partial-support note concerns Home Screen web apps. | **Not verified** on either platform. |
| `navigator.vibrate(...)` | BCD lists support from 4.4.3; user interaction required from WebView 60. | BCD lists no support, via Safari inheritance. | **Not verified** on Android; do not offer an iOS web-vibration guarantee. |

Sources: MDN's machine-readable [WakeLock compatibility](https://github.com/mdn/browser-compat-data/blob/main/api/WakeLock.json), [Navigator compatibility](https://github.com/mdn/browser-compat-data/blob/main/api/Navigator.json), and [iOS WebView upstream definition](https://github.com/mdn/browser-compat-data/blob/main/browsers/webview_ios.json). These are engine compatibility records, not Obsidian certification.

The issue's “iOS 16.4?” assumption needs qualification. WebKit documents the Home Screen wake-lock fix in [Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/#web-api). Neither Safari availability nor this Home Screen fix independently proves Obsidian's WKWebView behaviour. Test its actual origin, `isSecureContext`, API presence, request outcome, and whether the physical display stays awake.

## API constraints

Wake lock requires a secure context and an active, visible document. A request can reject because of system power policy; a granted lock can later be released. A released sentinel cannot be reused. Re-request on return to visible only if a timer still needs the lock; handle release and rejection without breaking the timer. This is screen-idle prevention, not permission to keep JavaScript or notifications running while the app is suspended. [MDN Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API), [WakeLockSentinel](https://developer.mozilla.org/en-US/docs/Web/API/WakeLockSentinel).

Vibration requires sticky user activation, so manual Start and `autoStart` need separate coverage. The specification rejects vibration in a hidden document and cancels an ongoing pattern on visibility change. A successful return does not prove the device physically vibrated; absent hardware or system policy may make it ineffective. Treat it as an additional foreground cue. [W3C Vibration API](https://www.w3.org/TR/vibration/), [MDN `vibrate()`](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate).

## iOS haptics route

No documented public plugin haptics route was found: the current official [Obsidian API declarations](https://github.com/obsidianmd/obsidian-api/blob/master/obsidian.d.ts) contain no haptic or vibration entry, and the Context7 query for this public API returned no matching documentation. This is a bounded finding, not proof that Obsidian has no internal native bridge. Obsidian itself uses native vibration in its mobile UI, as shown in the [1.15.0 mobile changelog](https://obsidian.md/changelog/2026-10-22-mobile-v1.15.0/); that does not establish an API contract for community plugins.

Recommendation: retain the existing audio cue on iOS. Adding a JavaScript package cannot supply native haptics without a bridge provided by the host app. An undocumented internal bridge would introduce a separate compatibility commitment and needs its own investigation and device proof.

## Proposed settings, pending implementation

Use two independent global timer preferences: “Keep screen awake while a timer runs” enabled by default, and “Vibrate when a timer completes” disabled by default so users can opt into the additional cue. Explain best-effort behaviour and the battery effect in the setting descriptions. Keep vibration independent of `sound`; disabling audio should allow a tactile cue. Unsupported APIs must leave timing and audio usable.

Start with global preferences: the benefit applies across timers and this avoids expanding every preset, block schema, insert/edit form, and serializer for this small feature. Add per-block overrides only if a concrete requirement emerges. These are recommendations, not settings already shipped.

## Existing timer ownership and implementation constraints

Source inspection at repository HEAD `2f70fc3`:

- [`TimerCore`](../../app/features/timer/business/TimerCore.ts) owns start, pause (`stop`), reset, completion, and destruction. Countdown audio can play up to two seconds before zero; `handleTimerComplete` can then skip audio. Attach completion vibration to actual completion independently of `playSound`, so an early beep cannot advance or suppress the tactile cue.
- [`EmbeddedTimerView`](../../app/features/timer/views/EmbeddedTimerView.ts) owns a core per view, supports `autoStart`, preserves running state during compatible rerenders, and delegates destruction to the core. Foreground wake-lock ownership must survive a harmless rerender and end on destruction.
- [`timerBlock`](../../app/features/timer/timerBlock.ts) currently defaults `sound` to true and `autoStart` to false, with no wake-lock or vibration fields. [`resolveTimer`](../../app/features/timer/business/resolveTimer.ts) resolves block values over preset/default-preset values over schema defaults. Global preferences would not require changing that precedence.

If implemented, use one shared wake-lock owner for the plugin's running timers, rather than an independent lock per rendered block. Track timer ownership idempotently; stopping one of two active timers must not release the other's screen protection. Release on the final pause, reset, completion, destruction, or plugin unload. A pending request that resolves after the last owner stops must release its sentinel immediately; a stale release event must not clear a newer sentinel. Avoid overlapping requests and remove visibility/release listeners at teardown. Reacquisition must check current ownership and visibility, rather than blindly retrying every release (which could loop under system denial). These are future implementation invariants, not verified runtime behaviour.

## Required physical-device proof

Use a disposable note in a scratch vault and record Obsidian version, OS version, Android WebView version where applicable, power mode, secure-context status, and API availability. [Obsidian mobile development](https://docs.obsidian.md/Plugins/Getting%20started/Mobile%20development) documents Android USB remote inspection and iOS Web Inspector; desktop mobile emulation cannot establish either hardware behaviour.

| Action | Expected result | Status |
| --- | --- | --- |
| Set screen timeout below 90 seconds, tap Start on a 90-second countdown, stop touching the device. | Display stays awake through the rest and Android vibrates at zero; existing beep remains available. | **Not verified** — no Android or iOS device. |
| Pause, reset, complete, remove the timer view, or disable the plugin. | No unnecessary lock survives; idle screen behaviour returns when no timer needs it. | **Not verified**. |
| Run two timers, stop one, then the other. | First stop preserves the remaining timer's lock; final stop releases it. | **Not verified**. |
| Background and foreground while running, then repeat after stopping in the meantime. | Reacquire only for a still-running timer; no background delivery promise. | **Not verified**. |
| Deny/revoke lock, use power-saving mode, or run without either API. | Timing and existing audio continue; no unhandled errors. | **Not verified**. |
| Disable audio, disable vibration, and use `autoStart` before any user interaction. | Preferences remain independent; activation restrictions fail gracefully. | **Not verified**. |

No synthetic acceptance tests were created or run. The competitor implementations named by the issue were not inspected in this investigation; this report does not use their existence as proof of platform support. No third-party implementation was copied, so no third-party copyright notice was introduced.
