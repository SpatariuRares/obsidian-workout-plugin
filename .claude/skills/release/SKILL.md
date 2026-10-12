---
name: release
description: Cut a plugin release by tagging main and pushing the tag, which triggers the Build and Release workflow (manifest sync, AI translation, build, GitHub release). Optional argument is the version (e.g. 1.4.7) or patch/minor/major.
disable-model-invocation: true
---

# Release

Releases are driven entirely by pushing a `X.Y.Z` tag. `.github/workflows/main.yml` then:

1. Runs lint + tests
2. Runs `.github/workflows/translate.yml` for locales still missing keys (one runner per locale; a no-op when the Translate workflow already ran after the last `en.json` change)
3. Sets `manifest.json` `version` to the tag and commits it back to `main` as `github-actions[bot]`
4. Builds and publishes a GitHub release with `main.js`, `manifest.json`, `styles.css`
5. Prunes old releases

Do **not** bump `manifest.json` by hand. CI owns it. `package.json` and `versions.json` are not kept in sync, so leave them alone unless the user asks.

## Steps

1. **Preflight**: run each check and stop with the reason if one fails:
   - `git branch --show-current` is `main`
   - `git status --porcelain` is empty
   - `git fetch origin && git status -sb` shows the branch is not behind `origin/main`. If it is **ahead**, the release needs those commits on `main` first: a tag on unpushed commits builds them, but CI then commits the version bump onto a remote `main` that lacks them. Ask the user, then `git push origin main` (the pre-push hook runs the checks) and continue once it is pushed.
   - `cd "AI translate" && python3 missing_locales.py` prints nothing. If it lists locales, the Translate workflow is still running or failed: check `gh run list --workflow=translate.yml --limit 3`, wait for it (`gh run watch <id> --exit-status` in the background), `git pull`, and check again. (The release would translate them itself, but slower and as part of the tag's run.)
   - If Translate **failed**: a locale job failing at "Start Ollama and pull model" is the runner failing to start Ollama or download the model, not our strings; and because one locale failed, "Check and commit locales" was skipped, so *no* locale was committed. Rerun only the failed jobs (their dependents rerun too): `gh run rerun <id> --failed`, wait, `git pull`, recheck. A failure at "Check translated locales" is a real placeholder problem: show the log (`gh run view <id> --log-failed`) to the user instead of rerunning.
2. **Pick the version**:
   - Latest tag: `git tag --sort=-v:refname | head -1`
   - If `$ARGUMENTS` is an explicit `X.Y.Z`, use it. If it is `patch`/`minor`/`major`, or empty (defaults to `patch`), bump the latest tag.
   - Refuse if the tag already exists.
3. **Changelog preview**: `git log <latest-tag>..HEAD --oneline --no-merges`. Show it grouped by conventional-commit prefix (feat / fix / refactor / other).
   - **Release notes**: draft a short user-facing text (English, like the README) from those commits: "What changed" in plain words, and a **"Public API (Dataview)"** section whenever the range touches `app/api/` or the commits mention `getExerciseStats`, `getExercises`, `getWorkoutLogs` (return shapes are a contract; say which values can change). Skip refactor-only commits with no visible effect.
4. **Local verification**: `npm run typecheck && npm run lint && npm test && npm run build`. Stop on failure.
5. **Confirm**: show the version, the changelog and the drafted release notes, then ask the user to confirm before anything leaves the machine. Suggest `minor` instead of `patch` when the range has `feat` commits or visible behavior changes.
6. **Tag and push**: `git tag <version> && git push origin <version>` (the husky pre-push hook re-runs the checks).
7. **Follow up**: give the Actions URL (`gh run list --workflow=main.yml --limit 1`) and wait for it in the background. When it succeeds:
   - Put the approved notes on the release: write them to a file and `gh release edit <version> --notes-file <file>` (the workflow publishes only the "Full Changelog" link). Keep that link at the end.
   - `git pull` to get CI's `chore: release` commit (and any `chore(i18n)` one), and check `manifest.json` has the new version.
   - Give the release URL (`gh release view <version> --json url --jq .url`).
