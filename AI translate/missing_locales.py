"""
Locales that miss keys of en.json, so the translator has work to do.

Shared by the Translate workflow (which locales to translate), the release
(it must not ship untranslated keys) and the local git hooks.

    python missing_locales.py          # space-separated list, e.g. "de fr"
    python missing_locales.py --json   # JSON array, for a GitHub Actions matrix

Standard library only, so it runs without the translator's dependencies.
"""

import json
import sys
from pathlib import Path

from json_helpers import flatten_json

LOCALES_DIR = Path(__file__).parent.parent / "app" / "i18n" / "locales"


def missing_locales(locales_dir: Path = LOCALES_DIR) -> list[str]:
    def keys(path: Path) -> set[str]:
        return set(flatten_json(json.loads(path.read_text(encoding="utf-8"))))

    source = keys(locales_dir / "en.json")
    return sorted(
        path.stem
        for path in locales_dir.glob("*.json")
        if path.stem != "en" and source - keys(path)
    )


if __name__ == "__main__":
    locales = missing_locales()
    print(json.dumps(locales) if "--json" in sys.argv else " ".join(locales))
