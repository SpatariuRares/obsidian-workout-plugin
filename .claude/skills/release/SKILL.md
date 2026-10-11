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
   - `git fetch origin && git status -sb` shows the branch is not behind `origin/main`
   - `cd "AI translate" && python3 missing_locales.py` prints nothing. If it lists locales, the Translate workflow is still running or failed: check `gh run list --workflow=translate.yml --limit 3`, wait for it, `git pull`, and check again. (The release would translate them itself, but slower and as part of the tag's run.)
2. **Pick the version**:
   - Latest tag: `git tag --sort=-v:refname | head -1`
   - If `$ARGUMENTS` is an explicit `X.Y.Z`, use it. If it is `patch`/`minor`/`major`, or empty (defaults to `patch`), bump the latest tag.
   - Refuse if the tag already exists.
3. **Changelog preview**: `git log <latest-tag>..HEAD --oneline --no-merges`. Show it grouped by conventional-commit prefix (feat / fix / refactor / other).
4. **Local verification**: `npm run typecheck && npm run lint && npm test && npm run build`. Stop on failure.
5. **Confirm**: show the version and changelog, then ask the user to confirm before anything leaves the machine.
6. **Tag and push**: `git tag <version> && git push origin <version>` (the husky pre-push hook re-runs the checks).
7. **Follow up**: give the Actions URL (`gh run list --workflow=main.yml --limit 1`). Remind the user that CI will push a `chore: release` commit (and possibly `chore(i18n)` translations) to `main`, so they should `git pull` before their next change.
