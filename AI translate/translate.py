#!/usr/bin/env python3
"""
AI Translation Tool using LlamaIndex + Ollama.

Translates the English i18n locale file (en.json) into all other
supported languages using a local Ollama model via LlamaIndex.

Usage:
    python translate.py                          # Translate all empty locales
    python translate.py --locale fr              # Translate specific locale
    python translate.py --model qwen3:32b        # Use a different model
    python translate.py --locale it --merge      # Only fill missing keys
    python translate.py --dry-run                # Preview without writing
    python translate.py --locale fr --force      # Overwrite existing translations
"""

import argparse
import sys
import time

from config import CHUNK_SIZE, DEFAULT_MODEL, LOCALES_DIR, PARALLEL_WORKERS
from json_helpers import flatten_json
from orchestrator import (
    get_project_root,
    get_target_locales,
    load_json,
    translate_locale,
)
from translator import Translator


def main():
    parser = argparse.ArgumentParser(
        description="AI Translation Tool — Translate i18n files using Ollama + LlamaIndex"
    )
    parser.add_argument(
        "--locale", "-l",
        type=str,
        default=None,
        help="Translate a specific locale (e.g., 'fr', 'ro'). Default: all empty locales.",
    )
    parser.add_argument(
        "--model", "-m",
        type=str,
        default=DEFAULT_MODEL,
        help=f"Ollama model to use (default: {DEFAULT_MODEL})",
    )
    parser.add_argument(
        "--no-merge",
        action="store_true",
        help="Overwrite existing translations instead of merging (default: merge)",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Force re-translation of all keys (overwrite existing)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview what would be translated without writing files",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=CHUNK_SIZE,
        help=f"Number of keys per translation chunk (default: {CHUNK_SIZE})",
    )
    parser.add_argument(
        "--workers", "-w",
        type=int,
        default=PARALLEL_WORKERS,
        help=f"Number of parallel translation threads (default: {PARALLEL_WORKERS}, 1=sequential)",
    )

    args = parser.parse_args()

    # Resolve paths
    project_root = get_project_root()
    locales_dir = project_root / LOCALES_DIR

    if not locales_dir.exists():
        print(f"❌ Locales directory not found: {locales_dir}")
        sys.exit(1)

    # Load source translations
    source_file = locales_dir / f"en.json"
    if not source_file.exists():
        print(f"❌ Source locale file not found: {source_file}")
        sys.exit(1)

    source = load_json(source_file)
    source_flat = flatten_json(source)

    print(f"🔑 Source: {source_file.name} ({len(source_flat)} keys)")
    print(f"🤖 Model: {args.model}")

    if args.dry_run:
        print("🔍 DRY RUN MODE — no files will be written")

    # Initialize translator
    translator = Translator(model=args.model)

    # Get target locales
    locales = get_target_locales(locales_dir, args.locale)
    print(f"🎯 Target locales: {', '.join(locales)}")

    # Translate each locale
    start_time = time.time()

    for locale in locales:
        translate_locale(
            translator=translator,
            source_flat=source_flat,
            locales_dir=locales_dir,
            locale=locale,
            merge=not args.no_merge,
            dry_run=args.dry_run,
            force=args.force,
            chunk_size=args.chunk_size,
            workers=args.workers,
        )

    elapsed = time.time() - start_time
    minutes = int(elapsed // 60)
    seconds = int(elapsed % 60)

    print(f"\n{'='*60}")
    print(f"🎉 Done! Processed {len(locales)} locale(s) in {minutes}m {seconds}s")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
