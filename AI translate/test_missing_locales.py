import json
import tempfile
import unittest
from pathlib import Path

from missing_locales import missing_locales


class MissingLocalesTest(unittest.TestCase):
    def write(self, folder: Path, name: str, data: dict) -> None:
        (folder / f"{name}.json").write_text(json.dumps(data), encoding="utf-8")

    def test_lists_locales_missing_any_nested_key(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            self.write(folder, "en", {"a": "A", "b": {"c": "C"}})
            self.write(folder, "it", {"a": "A", "b": {"c": "C"}})
            self.write(folder, "fr", {"a": "A"})
            self.write(folder, "de", {"b": {"c": "C"}})

            self.assertEqual(missing_locales(folder), ["de", "fr"])

    def test_extra_keys_are_not_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            self.write(folder, "en", {"a": "A"})
            self.write(folder, "it", {"a": "A", "old": "x"})

            self.assertEqual(missing_locales(folder), [])


if __name__ == "__main__":
    unittest.main()
