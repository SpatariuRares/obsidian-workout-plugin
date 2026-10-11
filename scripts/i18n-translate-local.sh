#!/bin/sh
# pre-commit: when en.json is part of the commit and Ollama runs on this
# machine, translate the new strings here (fast on Apple silicon) and add the
# locales to the same commit. Without Ollama nothing happens: the pre-push
# hook asks GitHub to translate the branch instead.
#
# One-time setup: brew install ollama && ollama serve && ollama pull translategemma

git diff --cached --name-only | grep -qx 'app/i18n/locales/en.json' || exit 0

cd "AI translate" || exit 0
PY=venv/bin/python
MODEL=translategemma

if [ ! -x "$PY" ]; then
  echo "i18n: no AI translate/venv here; GitHub will translate after push"
  exit 0
fi
if ! curl -sf -m 2 http://localhost:11434/api/tags | grep -q "\"$MODEL"; then
  echo "i18n: Ollama with $MODEL is not running here; GitHub will translate after push"
  exit 0
fi

MISSING=$("$PY" missing_locales.py)
[ -z "$MISSING" ] && exit 0

echo "i18n: translating new strings locally for: $MISSING"
for locale in $MISSING; do
  "$PY" translate.py --locale "$locale" || exit 1
done
"$PY" check_locales.py || exit 1

cd .. && git add app/i18n/locales/*.json
