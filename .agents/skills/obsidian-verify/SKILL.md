---
name: obsidian-verify
description: Verify workout plugin changes directly in running Obsidian through real user actions and visible results. Use for feature acceptance, bug reproduction, regression checks, and UI verification in this repository.
---

# Verify directly in Obsidian

The user's acceptance criterion is the observed result in Obsidian. Exercise each relevant scenario in the real app and inspect its outcome. A successful build, unit test, mocked DOM, direct service call, or detached render does not establish that the user flow works.

## Choose the proof

- Before editing, identify the user action, expected result, and relevant failure or boundary cases. For a bug, reproduce it in Obsidian first when possible.
- Use the smallest set of real user scenarios that proves the changed behavior and protects the adjacent flow. Do not create or run Jest, mock-based tests, or standalone assertion scripts for acceptance under this workflow. Preserve existing tests.
- Build, type checking, and linting remain technical checks when needed; report them separately from live verification.
- Documentation-only changes require inspection of their actual rendered destination where available. A skill or agent-instruction change requires structural review; do not invent a plugin feature test for it. Report external destinations that were not inspected.

## Connect and load the change

1. Discover available Obsidian app-control or devtools tools. Prefer native UI control for clicks, typing, navigation, and screenshots. Console and DOM inspection may supplement visible observation.
2. Identify the active vault, plugin, and current settings from the session. Do not hardcode a personal vault path. Confirm that the intended plugin build is loaded in that vault.
3. For code or style changes, use the repository build command, then reload the plugin through Obsidian. Avoid restarting the entire app when a plugin reload suffices. Reopen the affected view so cached output cannot masquerade as the new build.
4. If app control or a required device is unavailable, report the affected scenarios as **not verified**, explain the missing access, and request only what is needed to continue. Do not substitute synthetic tests or claim acceptance is complete.

## Isolate writes

- Existing notes, workout CSVs, exercise definitions, and settings are user data, including in a vault named “test”. Use disposable data for saving, editing, deleting, importing, or migration scenarios.
- Prefer a dedicated scratch vault. A uniquely named temporary note and CSV in the current vault are suitable only when every affected write can be directed to them. Record and restore settings temporarily changed to select those files.
- Creating disposable fixtures is part of an authorized live test, subject to tool permissions. If isolation requires changing existing user content or bypassing write protection, stop that scenario and obtain explicit authorization instead.
- Establish expected outcomes from known example values before interacting. Enter and save them through the actual UI. Verify persistence by reopening or refreshing the view; inspect the disposable file as supporting evidence when needed.
- Remove only fixtures created during this run. Restore changed settings and workspace state. For existing files exposed to writes, compare contents or hashes before and after; unchanged row counts alone cannot establish unchanged contents.

## Exercise and observe

- Open the real note, rendered code block, form, or setting that users reach. Perform the clicks, input, save, cancel, or delete actions relevant to the change.
- Inspect a screenshot or live app view after each meaningful transition. Check displayed values, feedback, layout, and resulting state against the expected outcome. Capturing a screenshot without inspecting it is not verification.
- For records and calculations, compare the displayed result with an expectation derived from the known fixture, not another call to the same implementation.
- For forms and persistence, cover the successful operation and relevant validation or cancellation. Run valid saves on isolated fixtures rather than skipping them.
- For mobile-facing changes, inspect a narrow viewport or Obsidian mobile emulation when available, and label that evidence as emulation. Wake lock, vibration, background timing, and platform-specific behavior require the actual target platform; desktop emulation cannot prove device support.
- Check for new console errors when tools expose them. A clean console supplements the visible result; it does not replace it.
- When a scenario fails, fix it and repeat it in Obsidian, plus any adjacent scenario affected by the fix.

## Report evidence

For each scenario, report **action · expected result · observed result · passed/failed/not verified**, with a screenshot reference when captured. Include the tested vault/build and desktop, emulated mobile, or actual device context without exposing unrelated personal content.

Finish with fixture cleanup and settings restoration status. Separate technical checks and unverified scenarios. Mark a feature verified only when all required scenarios pass in Obsidian; never describe an untested platform as working.

For optional legacy devtools snippets and README screenshot framing, consult [recipes.md](../../../.claude/skills/obsidian-verify/recipes.md). They supplement the visible user flow required here. Discover available tools and check current symbols before reusing them.
