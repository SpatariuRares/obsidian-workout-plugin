#!/bin/sh
# PreToolUse (Bash): a release ships the tagged commit as is, so every
# translation must be in it. Before Claude makes the release commit
# ("chore: release X.Y.Z") or pushes a version tag, check that every locale has
# every en.json key and every README.<LANG>.md is up to date with README.md.
# If not, block the command and ask for the translate skill, which translates
# on this PC with Haiku and commits only the translation files.

cmd=$(jq -r '.tool_input.command // empty')

case "$cmd" in
  *"git commit"*"chore: release"*) ;;
  *"git push"*)
    printf '%s\n' "$cmd" | grep -Eq '(^|[[:space:]/])[0-9]+\.[0-9]+\.[0-9]+([[:space:]]|$)|--tags' || exit 0
    ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
command -v node >/dev/null 2>&1 || exit 0
report=$(node scripts/translations-status.mjs 2>&1) && exit 0

cat >&2 <<EOF
Translations are not ready for this release:
$report
Run the translate skill with the argument "commit" first (Haiku subagents, one per language; it commits only the locale and README files, so a staged version bump stays staged). Then retry this command.
EOF
exit 2
