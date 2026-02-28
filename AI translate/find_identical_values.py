#!/usr/bin/env python3
"""
AI Translation Tool — Identical Values Identifier

Finds keys in target locales that have the exact same value as in the English base locale (en.json).
It suggests whether to keep or delete them based on heuristics (numbers, symbols, known acronyms).
Provides an interactive prompt to delete untranslated strings.

Usage:
    python find_identical_values.py                          # Check all locales
    python find_identical_values.py --locale it              # Check specific locale
    python find_identical_values.py --auto-delete-suggested  # Automatically delete values suggested for deletion
"""

import argparse
import sys
import re

from orchestrator import (
    get_project_root,
    get_target_locales,
    load_json,
    save_json,
)
from json_helpers import flatten_json, unflatten_json
from config import LOCALES_DIR

KNOWN_IDENTICAL_TERMS = {
    "ok", "ai", "rpe", "1rm", "ui", "csv", "json", "obsidian", 
    "pdf", "url", "id", "api", "pro", "beta"
}

def is_ignored(value: str) -> bool:
    """
    Returns True if the value is purely numbers, symbols, icons, or empty string.
    Such values don't need translation and shouldn't be identified as 'identical'.
    """
    val_stripped = value.strip()
    
    # Empty strings
    if not val_stripped:
        return True
        
    # Only numbers and symbols/punctuation/icons (no letters at all)
    if not re.search(r'[a-zA-Z]', val_stripped):
        return True
        
    return False

def should_keep(value: str) -> bool:
    """
    Heuristic to suggest whether an identical string should be KEPT.
    Returns True if it seems correctly identical (e.g. known acronyms).
    Returns False if it seems like an untranslated word.
    """
    val_stripped = value.strip().lower()
    
    # Known universal terms/acronyms (case-insensitive)
    if val_stripped in KNOWN_IDENTICAL_TERMS:
        return True
        
    # Suggest DELETE (likely untranslated)
    return False

def process_locale(locale: str, source_flat: dict, locales_dir, auto_delete: bool):
    target_file = locales_dir / f"{locale}.json"
    if not target_file.exists():
        print(f"❌ Locale file not found: {target_file}")
        return

    target = load_json(target_file)
    target_flat = flatten_json(target)
    
    identical_keys = []
    for k, v in target_flat.items():
        if k in source_flat and target_flat[k] == source_flat[k]:
            if not is_ignored(v):
                identical_keys.append((k, v))
            
    if not identical_keys:
        print(f"✅ [{locale}] No identical values found.")
        return

    print(f"\n🌍 [{locale}] Found {len(identical_keys)} keys with identical values to English:")
    
    keys_to_delete = []
    
    for k, v in identical_keys:
        keep_suggestion = should_keep(v)
        suggestion_text = "KEEP" if keep_suggestion else "DELETE"
        color = "\033[92m" if keep_suggestion else "\033[91m"  # Green for keep, Red for delete
        reset = "\033[0m"
        
        print(f"  🔑 {k}: \"{v}\"")
        print(f"     Suggestion: {color}{suggestion_text}{reset}")
        
        if auto_delete and not keep_suggestion:
            print("     -> Auto-deleted.")
            keys_to_delete.append(k)
            continue
        elif auto_delete and keep_suggestion:
            print("     -> Auto-kept.")
            continue
            
        # Interactive prompt
        while True:
            default_choice = "k" if keep_suggestion else "d"
            prompt_text = f"     Action? [k/d/a (do all)] (default: {default_choice}): "
            choice = input(prompt_text).strip().lower()
            
            if not choice:
                choice = default_choice
                
            if choice == 'k':
                print("     -> Kept.")
                break
            elif choice == 'd':
                print("     -> Deleted.")
                keys_to_delete.append(k)
                break
            elif choice == 'a':
                auto_delete = True
                if not keep_suggestion:
                    print("     -> Deleted (and auto-deleting rest).")
                    keys_to_delete.append(k)
                else:
                    print("     -> Kept (and auto-deleting rest).")
                break
            else:
                print("     Invalid choice. Use 'k' to keep, 'd' to delete, or 'a' to auto-delete the rest.")
                
    if keys_to_delete:
        print(f"\n💾 [{locale}] Deleting {len(keys_to_delete)} keys...")
        for k in keys_to_delete:
            del target_flat[k]
            
        # Unflatten and save
        updated_target = unflatten_json(target_flat)
        save_json(target_file, updated_target)
        print(f"✅ [{locale}] Saved changes.")
    else:
        print(f"\n✅ [{locale}] No changes made.")

def main():
    parser = argparse.ArgumentParser(
        description="Identifies values identical to English and suggests whether to delete them or not."
    )
    parser.add_argument(
        "--locale", "-l",
        type=str,
        default=None,
        help="Check a specific locale (e.g., 'sq', 'it'). Default: all non-English locales.",
    )
    parser.add_argument(
        "--auto-delete-suggested",
        action="store_true",
        help="Automatically delete values that the heuristic suggests deleting without prompting.",
    )
    
    args = parser.parse_args()

    project_root = get_project_root()
    locales_dir = project_root / LOCALES_DIR

    source_file = locales_dir / "en.json"
    if not source_file.exists():
        print(f"❌ Source locale file not found: {source_file}")
        sys.exit(1)

    source = load_json(source_file)
    source_flat = flatten_json(source)
    
    locales = get_target_locales(locales_dir, args.locale)
    
    print(f"🎯 Checking locales: {', '.join(locales)}")
    
    for locale in locales:
        process_locale(locale, source_flat, locales_dir, args.auto_delete_suggested)
        
    print("\n🎉 Done!")

if __name__ == "__main__":
    main()
