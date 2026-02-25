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
    """Split a dictionary into chunks, trying to group keys by prefix for context.
    
    It tries to keep keys that share the same first two parts (e.g., 'modal.titles.')
    in the same chunk, as long as it doesn't exceed 2x the target size.
    """
    if not d:
        return []

    items = list(d.items())
    chunks = []
    current_chunk = {}
    
    def get_prefix(key: str) -> str:
        parts = key.split(".")
        return ".".join(parts[:2]) if len(parts) >= 2 else parts[0]

    for key, value in items:
        # If current chunk is empty, just add
        if not current_chunk:
            current_chunk[key] = value
            continue
            
        # If adding this would exceed the target size
        if len(current_chunk) >= size:
            # Check if this key shares prefix with the last key in chunk
            last_key = list(current_chunk.keys())[-1]
            if get_prefix(key) == get_prefix(last_key) and len(current_chunk) < size * 2:
                # Keep grouping if they share prefix and we aren't way over size
                current_chunk[key] = value
            else:
                # Start new chunk
                chunks.append(current_chunk)
                current_chunk = {key: value}
        else:
            current_chunk[key] = value
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks
