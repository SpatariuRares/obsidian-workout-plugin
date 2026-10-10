"""
Fail (exit 1) when a locale breaks a placeholder, code span or bold marker of
en.json. Same rules as app/i18n/__tests__/locales.consistency.test.ts, run in
CI after translating and before the locales are committed.
"""

import json
import sys
from pathlib import Path

from json_helpers import flatten_json
from placeholders import fix_placeholders


def load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_broken(locales_dir: Path) -> dict[str, list[str]]:
    en = flatten_json(load_json(locales_dir / "en.json"))
    broken: dict[str, list[str]] = {}
    for path in sorted(locales_dir.glob("*.json")):
        if path.stem == "en":
            continue
        translated = flatten_json(load_json(path))
        keys = [
            key
            for key, value in translated.items()
            if key in en and fix_placeholders(en[key], value) != value
        ]
        if keys:
            broken[path.name] = keys
    return broken


def main() -> int:
    broken = find_broken(Path(__file__).parent.parent / "app" / "i18n" / "locales")
    for name, keys in broken.items():
        print(f"❌ {name}: {', '.join(keys)}")
    if broken:
        return 1
    print("✅ All locales keep the placeholders of en.json")
    return 0


if __name__ == "__main__":
    sys.exit(main())
