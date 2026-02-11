"""
Orchestration logic for the AI Translation Tool.

Handles file I/O, locale discovery, and the main translation
workflow that coordinates the Translator with the file system.
"""

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from config import (
    CHUNK_SIZE,
    DELAY_BETWEEN_CHUNKS,
    LANGUAGE_NAMES,
    PARALLEL_WORKERS,
    SOURCE_LOCALE,
)
from json_helpers import chunk_dict, flatten_json, unflatten_json
from translator import Translator


def get_project_root() -> Path:
    """Get the project root (parent of 'AI translate' folder)."""
    return Path(__file__).parent.parent


def load_json(filepath: Path) -> dict:
    """Load a JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(filepath: Path, data: dict) -> None:
    """Save data to a JSON file with pretty formatting."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def get_target_locales(locales_dir: Path, specific_locale: str | None = None) -> list[str]:
    """Get list of target locales to translate."""
    if specific_locale:
        json_file = locales_dir / f"{specific_locale}.json"
        if not json_file.exists():
            print(f"❌ Locale file not found: {json_file}")
            sys.exit(1)
        return [specific_locale]

    # Get all locale files except source
    locales = []
    for f in sorted(locales_dir.glob("*.json")):
        locale = f.stem
        if locale != SOURCE_LOCALE:
            locales.append(locale)
    return locales


def translate_locale(
    translator: Translator,
    source_flat: dict[str, str],
    locales_dir: Path,
    locale: str,
    merge: bool = False,
    dry_run: bool = False,
    force: bool = False,
    chunk_size: int = CHUNK_SIZE,
    workers: int = PARALLEL_WORKERS,
) -> None:
    """Translate the source locale into a target locale."""
    lang_name = LANGUAGE_NAMES.get(locale, locale)
    target_file = locales_dir / f"{locale}.json"

    print(f"\n{'='*60}")
    print(f"🌍 Translating to {lang_name} ({locale})")
    print(f"{'='*60}")

    # Load existing translations
    existing = load_json(target_file) if target_file.exists() else {}
    existing_flat = flatten_json(existing) if existing else {}

    # Determine which keys need translation
    if merge or (existing_flat and not force):
        # Only translate missing keys
        keys_to_translate = {
            k: v for k, v in source_flat.items() if k not in existing_flat
        }
        if not keys_to_translate:
            print(f"  ✅ All {len(source_flat)} keys already translated, skipping.")
            return
        print(f"  📝 {len(keys_to_translate)} missing keys to translate "
              f"({len(existing_flat)} already translated)")
    else:
        keys_to_translate = source_flat.copy()
        print(f"  📝 {len(keys_to_translate)} keys to translate")

    if dry_run:
        print(f"  🔍 DRY RUN — would translate {len(keys_to_translate)} keys")
        sample = dict(list(keys_to_translate.items())[:5])
        for k, v in sample.items():
            print(f"     {k}: \"{v}\"")
        if len(keys_to_translate) > 5:
            print(f"     ... and {len(keys_to_translate) - 5} more")
        return

    # Split into chunks and translate
    chunks = chunk_dict(keys_to_translate, chunk_size)
    translated_flat: dict[str, str] = {}
    total = len(chunks)

    if workers > 1:
        print(f"  ⚡ Parallel mode: {workers} workers")
        _translate_parallel(translator, chunks, lang_name, translated_flat, total,
                            existing_flat, merge, force, target_file)
    else:
        _translate_sequential(translator, chunks, lang_name, translated_flat, total,
                              existing_flat, merge, force, target_file)

    final_count = len(existing_flat) + len(translated_flat) if (merge or existing_flat) else len(translated_flat)
    print(f"  💾 Saved {final_count} keys to {target_file.name}")


def _save_progress(existing_flat, translated_flat, merge, force, target_file):
    """Save current translation progress to disk."""
    if merge or (existing_flat and not force):
        progress_flat = {**existing_flat, **translated_flat}
    else:
        progress_flat = translated_flat
    save_json(target_file, unflatten_json(progress_flat))


def _translate_sequential(translator, chunks, lang_name, translated_flat, total,
                          existing_flat, merge, force, target_file):
    """Translate chunks one at a time."""
    for i, chunk in enumerate(chunks, 1):
        print(f"  🔄 Chunk {i}/{total} ({len(chunk)} keys)...", end=" ", flush=True)
        result = translator.translate_chunk(chunk, lang_name)
        translated_flat.update(result)
        print("✅")
        _save_progress(existing_flat, translated_flat, merge, force, target_file)
        if i < total:
            time.sleep(DELAY_BETWEEN_CHUNKS)


def _translate_parallel(translator, chunks, lang_name, translated_flat, total,
                        existing_flat, merge, force, target_file):
    """Translate chunks in parallel using a thread pool."""
    workers = len(chunks)  # will be capped by ThreadPoolExecutor max_workers caller
    completed = 0

    with ThreadPoolExecutor(max_workers=PARALLEL_WORKERS) as executor:
        # Submit all chunks, keeping track of their index for ordered results
        future_to_idx = {
            executor.submit(translator.translate_chunk, chunk, lang_name): idx
            for idx, chunk in enumerate(chunks)
        }

        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            completed += 1
            try:
                result = future.result()
                translated_flat.update(result)
                print(f"  ✅ Chunk {idx + 1}/{total} done  "
                      f"({completed}/{total} completed)")
            except Exception as e:
                print(f"  ❌ Chunk {idx + 1}/{total} failed: {e}")
                # Use originals for failed chunks
                translated_flat.update(chunks[idx])

            # Save progress after each completed chunk
            _save_progress(existing_flat, translated_flat, merge, force, target_file)
