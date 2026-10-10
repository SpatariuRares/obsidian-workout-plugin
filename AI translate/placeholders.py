"""
Placeholder checks for translated strings.

Mirrors app/i18n/__tests__/locales.consistency.test.ts, so a translation the
test would reject is never written to a locale file.
"""

import re

PLACEHOLDER = re.compile(r"\{\{?\s*[\w.]+\s*\}?\}")
CODE_SPAN = re.compile(r"`[^`]*`")


def _placeholders(text: str) -> list[str]:
    return sorted(re.sub(r"\s", "", p) for p in PLACEHOLDER.findall(text))


def _matches(source: str, translated: str) -> bool:
    return (
        _placeholders(source) == _placeholders(translated)
        and CODE_SPAN.findall(source) == CODE_SPAN.findall(translated)
        and source.count("**") == translated.count("**")
    )


def fix_placeholders(source: str, translated: str) -> str | None:
    """
    Return the translation with placeholders matching the English source.

    Repairs the common model mistake of wrapping a placeholder in extra
    braces ({count} -> {{count}}). Returns None when placeholders, code spans
    or bold markers still differ, so the caller can keep the English text.
    """
    if _matches(source, translated):
        return translated

    repaired = translated
    for single in set(re.findall(r"(?<!\{)\{[\w.]+\}(?!\})", source)):
        repaired = repaired.replace("{" + single + "}", single)

    return repaired if _matches(source, repaired) else None
