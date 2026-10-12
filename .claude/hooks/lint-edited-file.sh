#!/bin/sh
# PostToolUse (Edit|Write): lint the TypeScript file just edited, so a
# warning shows up now instead of at the next full `npm run lint`.
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  *.ts) ;;
  *) exit 0 ;;
esac
[ -f "$file" ] || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
case "$file" in
  "$PWD"/*) ;;
  *) exit 0 ;;  # outside this repo
esac
if ! out=$(npx --no-install eslint --max-warnings 0 "$file" 2>&1); then
  echo "ESLint on $file:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
