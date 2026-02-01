import os, re, sys, hashlib
from collections import defaultdict

# Set scope to current directory by default if no argument provided
scope = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1].strip() else "."
exts = (".ts", ".tsx", ".js", ".jsx", ".html", ".scss", ".css", ".java", ".kt", ".py", ".go", ".rs", ".cs")
skip_markers = ("/node_modules/", "/dist/", "/build/", "/.git/", "/coverage/")

def norm(line: str) -> str:
    line = line.rstrip("\n")
    if not line.strip(): return ""
    line = re.sub(r"\s+", " ", line.strip())
    return line

paths = []
abs_scope = os.path.abspath(scope)
print(f"Scanning directory: {abs_scope}")

for root, _, files in os.walk(scope):
    if any(m in root for m in skip_markers):
        continue
    for f in files:
        if f.endswith(exts):
            paths.append(os.path.join(root, f))

print(f"Found {len(paths)} files to scan.")

hmap = defaultdict(list)

for p in paths:
    try:
        with open(p, "r", encoding="utf-8", errors="ignore") as fh:
            lines = [norm(l) for l in fh.readlines()]
    except Exception as e:
        print(f"Error reading {p}: {e}")
        continue

    buf = []
    for i, l in enumerate(lines, 1):
        if l: buf.append((i, l))

    # sliding window of 8 non-empty normalized lines
    for j in range(0, max(0, len(buf) - 7)):
        chunk = buf[j:j + 8]
        text = "\n".join(l for _, l in chunk)
        h = hashlib.sha1(text.encode("utf-8")).hexdigest()[:10]
        hmap[h].append((p, chunk[0][0], chunk[-1][0], text))

dups = [(h, v) for h, v in hmap.items() if len(v) >= 2]
dups.sort(key=lambda x: len(x[1]), reverse=True)

print(f"Duplicate 8-line windows found: {len(dups)}")
for h, v in dups[:25]:
    print("\n==", h, "occurrences:", len(v))
    for (p, a, b, _) in v[:8]:
        print(f" - {p}:{a}-{b}")
