---
name: release
description: Cut a plugin release by bumping the version in a commit on main, tagging that commit and pushing the tag, which triggers the Build and Release workflow (verify, build, attest, GitHub release). Optional argument is the version (e.g. 1.4.7) or patch/minor/major.
disable-model-invocation: true
model: haiku
---

# Release

Releases are driven by a `X.Y.Z` tag on a commit of `main` that already has `manifest.json` `version` = `X.Y.Z`. The release is built from exactly that commit, so the tagged source, the released `manifest.json` and the assets match (Obsidian's scanner builds the tagged commit and compares). `.github/workflows/main.yml` then:

1. Runs lint + tests on the tag
2. Verifies the tag equals `manifest.json` `version` and that no locale misses keys of `en.json`; fails otherwise (it never translates or commits)
3. Builds from the tag, attests build provenance for `main.js`, `styles.css`, `manifest.json`, and publishes a GitHub release with them
4. Prunes old releases

This skill bumps `manifest.json`, `package.json` and `package-lock.json` to the new version in a `chore: release X.Y.Z` commit on `main`. Leave `versions.json` alone, and don't use `npm version` (its `version` script runs `version-bump.mjs`, which edits `versions.json`).

## Steps

1. **Preflight**: run each check and stop with the reason if one fails:
   - `git branch --show-current` is `main`
   - `git status --porcelain` is empty
   - `git fetch origin && git status -sb` shows the branch is not behind `origin/main`. Being **ahead** is fine: step 6 pushes `main` (those commits plus the release commit) before the tag. List the unpushed commits in the changelog preview.
   - `cd "AI translate" && python3 missing_locales.py` prints nothing. If it lists locales, the Translate workflow is still running or failed: check `gh run list --workflow=translate.yml --limit 3`, wait for it (`gh run watch <id> --exit-status` in the background), `git pull`, and check again. Don't skip this: the release run no longer translates, it fails when a locale misses keys.
   - If Translate **failed**: a locale job failing at "Start Ollama and pull model" is the runner failing to start Ollama or download the model, not our strings; and because one locale failed, "Check and commit locales" was skipped, so *no* locale was committed. Rerun only the failed jobs (their dependents rerun too): `gh run rerun <id> --failed`, wait, `git pull`, recheck. A failure at "Check translated locales" is a real placeholder problem: show the log (`gh run view <id> --log-failed`) to the user instead of rerunning.
2. **Pick the version**:
   - Latest tag: `git tag --sort=-v:refname | head -1`
   - If `$ARGUMENTS` is an explicit `X.Y.Z`, use it. If it is `patch`/`minor`/`major`, or empty (defaults to `patch`), bump the latest tag.
   - Refuse if the tag already exists.
3. **Changelog preview**: `git log <latest-tag>..HEAD --oneline --no-merges`. Show it grouped by conventional-commit prefix (feat / fix / refactor / other).
   - **Release notes**: draft a short user-facing text (English, like the README) from those commits: "What changed" in plain words, and a **"Public API (Dataview)"** section whenever the range touches `app/api/` or the commits mention `getExerciseStats`, `getExercises`, `getWorkoutLogs` (return shapes are a contract; say which values can change). Skip refactor-only commits with no visible effect.
4. **Local verification**: `npm run typecheck && npm run lint && npm test && npm run build`. Stop on failure.
5. **Confirm**: show the version, the changelog and the drafted release notes, then ask the user to confirm before anything leaves the machine. Suggest `minor` instead of `patch` when the range has `feat` commits or visible behavior changes.
6. **Bump, commit, push, tag** (only after the user confirmed):
   - Set the version in the three files (jq keeps the rest of each file as is):
     ```bash
     V=<version>
     jq --arg v "$V" '.version = $v' manifest.json > manifest.tmp && mv manifest.tmp manifest.json
     jq --arg v "$V" '.version = $v' package.json > package.tmp && mv package.tmp package.json
     jq --arg v "$V" '.version = $v | .packages[""].version = $v' package-lock.json > package-lock.tmp && mv package-lock.tmp package-lock.json
     ```
   - `git diff --stat` must show only those three files. Then `git add manifest.json package.json package-lock.json && git commit -m "chore: release $V"` (with the attribution trailer).
   - `git push origin main` (the husky pre-push hook re-runs the checks). If it is rejected because `origin/main` moved, `git pull --rebase`, rerun the preflight and step 4, and push again.
   - Only once `main` is pushed: `git tag $V && git push origin $V`. The tag must point at the release commit (`git rev-parse $V^{commit}` = `git rev-parse HEAD`). If the workflow then fails at "Tag matches manifest.json version", the tag is on the wrong commit: delete it (`git push origin :refs/tags/$V && git tag -d $V`) and tag the release commit.
7. **Follow up**: give the Actions URL (`gh run list --workflow=main.yml --limit 1`) and wait for it in the background. When it succeeds:
   - Put the approved notes on the release: write them to a file and `gh release edit <version> --notes-file <file>` (the workflow publishes only the "Full Changelog" link). Keep that link at the end.
   - Give the release URL (`gh release view <version> --json url --jq .url`).
