"""
JSON helper utilities for the AI Translation Tool.

Functions for flattening, unflattening, and chunking JSON structures
used in the translation pipeline.
"""


def flatten_json(obj: dict, prefix: str = "") -> dict[str, str]:
    """Flatten nested JSON into dot-notation key-value pairs.

    Example:
        {"modal": {"titles": {"create": "Create"}}}
        => {"modal.titles.create": "Create"}
    """
    items: dict[str, str] = {}
    for key, value in obj.items():
        full_key = f"{prefix}.{key}" if prefix else key
        if isinstance(value, dict):
            items.update(flatten_json(value, full_key))
        else:
            items[full_key] = str(value)
    return items


def unflatten_json(flat: dict[str, str]) -> dict:
    """Reconstruct nested JSON from dot-notation key-value pairs."""
    result: dict = {}
    for key, value in flat.items():
        parts = key.split(".")
        current = result
        for part in parts[:-1]:
            current = current.setdefault(part, {})
        current[parts[-1]] = value
    return result


def chunk_dict(d: dict[str, str], size: int) -> list[dict[str, str]]:
    """Split a dictionary into chunks of given size."""
    items = list(d.items())
    return [dict(items[i : i + size]) for i in range(0, len(items), size)]
