"""Run with: python -m unittest test_placeholders (from "AI translate/")."""

import json
import tempfile
import unittest
from pathlib import Path

from check_locales import find_broken
from placeholders import fix_placeholders


class FixPlaceholdersTest(unittest.TestCase):
    def test_keeps_a_correct_translation(self):
        self.assertEqual(
            fix_placeholders("Saved {count} logs", "Salvati {count} log"),
            "Salvati {count} log",
        )

    def test_removes_braces_the_model_added_around_a_placeholder(self):
        # {count} -> [VAR_0] -> model answers {[VAR_0]} -> {{count}}
        self.assertEqual(
            fix_placeholders(
                "Saved the weight unit on {count} older logs",
                "Salvou a unidade de peso em {{count}} registros mais antigos.",
            ),
            "Salvou a unidade de peso em {count} registros mais antigos.",
        )

    def test_keeps_double_braces_when_the_source_has_them(self):
        self.assertEqual(
            fix_placeholders("Hi {{name}}", "Ciao {{name}}"), "Ciao {{name}}"
        )

    def test_rejects_a_translated_placeholder(self):
        self.assertIsNone(fix_placeholders("{duration} min", "{doba} min"))

    def test_rejects_a_dropped_placeholder(self):
        self.assertIsNone(fix_placeholders("{count} logs", "log"))

    def test_rejects_changed_code_span_or_bold(self):
        self.assertIsNone(fix_placeholders("Use `exercise`", "Usa `esercizio`"))
        self.assertIsNone(fix_placeholders("**Run all**", "Esegui tutto"))


class FindBrokenTest(unittest.TestCase):
    def test_reports_locales_with_broken_placeholders(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            files = {
                "en.json": {"a": {"b": "Saved {count} logs"}},
                "it.json": {"a": {"b": "Salvati {count} log"}},
                "pt.json": {"a": {"b": "Salvo {{count}} registros"}},
            }
            for name, data in files.items():
                (folder / name).write_text(json.dumps(data), encoding="utf-8")

            self.assertEqual(find_broken(folder), {"pt.json": ["a.b"]})


if __name__ == "__main__":
    unittest.main()
