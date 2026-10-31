#!/usr/bin/env python3
"""Market numbers for Obsidian community plugins, and a static inspector for a cloned plugin.

  market.py scan    [--watchlist F] [--cache DIR] [--out F] [--extra-keyword K ...]
  market.py inspect <cloned-plugin-dir>

scan: downloads community-plugins.json + community-plugin-stats.json from obsidianmd/obsidian-releases,
picks candidates (keyword match on name/description + watchlist "track" ids, minus "ignore" ids),
reads the same stats file as Obsidian Bot committed it 7/30/60/90/365 days ago (its git history
is a daily download history) to get real growth, and each candidate's GitHub release dates.

inspect: reads (never runs) a cloned plugin and lists what it registers: commands, code blocks,
views, settings, ribbon icons, plus README headings and license.

Stdlib only. Uses `gh api` when available (5000 req/h), plain HTTPS otherwise (60 req/h).
"""
import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request

RELEASES = "https://raw.githubusercontent.com/obsidianmd/obsidian-releases/master/"
OURS = "workout-planner"
DEFAULT_KEYWORDS = [
    "workout", "fitness", "gym", "exercise", "lifting", "weightlifting", "strength training",
    "training log", "personal record", "reps", "cardio", "running log", "sport", "calisthenics",
    "strava", "garmin", "bodybuilding", "powerlifting", "hypertrophy",
]
NOW = dt.datetime.now(dt.timezone.utc)


def fetch_json(url):
    with urllib.request.urlopen(url, timeout=60) as r:
        return json.load(r)


def releases_of(repo):
    """[(version, published_at datetime)] oldest first; [] if the repo has none or is unreachable."""
    raw = None
    if shutil.which("gh"):
        p = subprocess.run(
            ["gh", "api", "--paginate", f"repos/{repo}/releases?per_page=100",
             "--jq", ".[] | [.tag_name, .published_at] | @tsv"],
            capture_output=True, text=True)
        if p.returncode == 0:
            raw = [line.split("\t") for line in p.stdout.splitlines() if "\t" in line]
    if raw is None:
        try:
            raw = [[r["tag_name"], r["published_at"]]
                   for r in fetch_json(f"https://api.github.com/repos/{repo}/releases?per_page=100")]
        except Exception:
            return []
    out = []
    for tag, published in raw:
        if published:
            out.append((tag.lstrip("vV"), dt.datetime.fromisoformat(published.replace("Z", "+00:00"))))
    return sorted(out, key=lambda x: x[1])


HISTORY_DAYS = (7, 30, 60, 90, 365)


def stats_as_of(days_ago, cache_dir):
    """community-plugin-stats.json as Obsidian Bot committed it `days_ago` days ago ({} if none).

    The bot commits the file about once a day, so its git history is a daily download history.
    """
    until = (NOW - dt.timedelta(days=days_ago)).strftime("%Y-%m-%dT%H:%M:%SZ")
    query = f"repos/obsidianmd/obsidian-releases/commits?path=community-plugin-stats.json&until={until}&per_page=1"
    sha = None
    if shutil.which("gh"):
        p = subprocess.run(["gh", "api", query, "--jq", ".[0].sha"], capture_output=True, text=True)
        sha = p.stdout.strip() or None
    if not sha:
        try:
            sha = fetch_json("https://api.github.com/" + query)[0]["sha"]
        except Exception:
            return {}
    cached = os.path.join(cache_dir, sha + ".json") if cache_dir else None
    if cached and os.path.exists(cached):
        with open(cached) as fh:
            return json.load(fh)
    data = fetch_json(f"https://raw.githubusercontent.com/obsidianmd/obsidian-releases/{sha}/community-plugin-stats.json")
    if cached:
        os.makedirs(cache_dir, exist_ok=True)
        with open(cached, "w") as fh:
            json.dump(data, fh)
    return data


def keyword_hit(text, keywords):
    text = text.lower()
    return [k for k in keywords if re.search(r"\b" + re.escape(k) + r"(e?s)?\b", text)]


def scan(args):
    plugins = fetch_json(RELEASES + "community-plugins.json")
    stats = fetch_json(RELEASES + "community-plugin-stats.json")
    history = {d: stats_as_of(d, args.cache) for d in HISTORY_DAYS}
    watch = {"track": [], "adjacent": [], "ignore": []}
    if args.watchlist and os.path.exists(args.watchlist):
        with open(args.watchlist) as fh:
            watch.update(json.load(fh))
    track = {e["id"] if isinstance(e, dict) else e for e in watch.get("track", [])}
    adjacent = {e["id"] if isinstance(e, dict) else e for e in watch.get("adjacent", [])}
    ignore = {e["id"] if isinstance(e, dict) else e for e in watch.get("ignore", [])}
    keywords = DEFAULT_KEYWORDS + (args.extra_keyword or [])

    by_id = {p["id"]: p for p in plugins}
    rows = []
    for p in plugins:
        pid = p["id"]
        hits = keyword_hit(p["name"] + " " + p["description"], keywords)
        if pid != OURS and pid not in track | adjacent and (pid in ignore or not hits):
            continue
        rows.append({"id": pid, "name": p["name"], "repo": p["repo"], "author": p.get("author"),
                     "description": p["description"], "keywords": hits,
                     "status": "ours" if pid == OURS else "tracked" if pid in track
                     else "adjacent" if pid in adjacent else "new"})
    removed = sorted((track | adjacent) - set(by_id))

    for r in rows:
        now = stats.get(r["id"], {}).get("downloads", 0)
        r["downloads"] = now
        for d in HISTORY_DAYS:
            then = history[d].get(r["id"], {}).get("downloads")
            # absent then = not in the store yet, so everything it has was gained in the window;
            # unless an older file has it (renamed or briefly delisted): then the gain is unknown
            older = any(history[o].get(r["id"]) for o in HISTORY_DAYS if o > d)
            r[f"gain_{d}d"] = None if not history[d] or (then is None and older) else now - (then or 0)
        prev = ((r["gain_90d"] - r["gain_30d"]) / 2
                if r["gain_90d"] is not None and r["gain_30d"] is not None else None)
        # >1: the last 30 days beat the average of the two months before
        r["acceleration"] = round(r["gain_30d"] / prev, 2) if prev else None
        rel = releases_of(r["repo"])
        r["first_release"] = rel[0][1].date().isoformat() if rel else None
        r["last_release"] = rel[-1][1].date().isoformat() if rel else None
        r["age_days"] = (NOW - rel[0][1]).days if rel else None
        r["days_since_release"] = (NOW - rel[-1][1]).days if rel else None
        r["releases"] = len(rel)
        # each release makes existing users download again: many releases inflate gain_30d
        r["releases_30d"] = sum(1 for _, d in rel if d > NOW - dt.timedelta(days=30))
        print(f"  {r['id']}: {now} downloads, +{r['gain_30d']} in 30d", file=sys.stderr)

    ours = next((r for r in rows if r["id"] == OURS), {})
    for r in rows:
        r["gain_30d_vs_ours"] = round((r["gain_30d"] or 0) / max(ours.get("gain_30d") or 1, 1), 2)
        r["size_vs_ours"] = round(r["downloads"] / max(ours.get("downloads", 1), 1), 2)
    rows.sort(key=lambda r: -(r["gain_30d"] or 0))

    result = {"generated": NOW.isoformat(timespec="seconds"), "removed_from_store": removed, "plugins": rows}
    if args.out:
        with open(args.out, "w") as fh:
            json.dump(result, fh, indent=1)

    cols = ["id", "status", "downloads", "gain_7d", "gain_30d", "gain_90d", "gain_365d",
            "acceleration", "gain_30d_vs_ours", "releases_30d", "first_release", "last_release"]
    print("| " + " | ".join(cols) + " |")
    print("|" + "---|" * len(cols))
    for r in rows:
        print("| " + " | ".join("" if r.get(c) is None else str(r.get(c)) for c in cols) + " |")
    if removed:
        print(f"\nTracked but no longer in the store: {', '.join(removed)}")


SOURCE_EXT = (".ts", ".tsx", ".js", ".mjs", ".svelte", ".vue", ".jsx")
SKIP_DIRS = {"node_modules", ".git", "dist", "build", "coverage", ".obsidian"}
PATTERNS = {
    "commands": r"addCommand\(\s*\{[^}]*?name\s*:\s*(?:t\()?['\"`]([^'\"`]+)",
    "command_ids": r"addCommand\(\s*\{[^}]*?id\s*:\s*['\"`]([^'\"`]+)",
    "code_blocks": r"registerMarkdownCodeBlockProcessor\(\s*['\"`]([^'\"`]+)",
    "views": r"registerView\(\s*([A-Za-z0-9_.'\"-]+)",
    "ribbon": r"addRibbonIcon\(\s*['\"`]([^'\"`]+)['\"`]\s*,\s*(?:t\()?['\"`]([^'\"`]+)",
    "post_processors": r"(registerMarkdownPostProcessor)\(",
    "editor_extensions": r"(registerEditorExtension)\(",
    "status_bar": r"(addStatusBarItem)\(",
    "file_extensions": r"registerExtensions\(\s*\[([^\]]+)\]",
    "protocol_handlers": r"registerObsidianProtocolHandler\(\s*['\"`]([^'\"`]+)",
    "network": r"\b(requestUrl|fetch)\(\s*['\"`]?([^'\"`,)\s]*)",
}


def inspect(args):
    root = args.dir
    files = []
    for d, dirs, names in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        files += [os.path.join(d, n) for n in names if n.endswith(SOURCE_EXT)]
    has_src = any(not f.endswith(("main.js", ".mjs")) for f in files)
    if has_src:  # main.js is a bundle of the same source; esbuild configs are not features
        files = [f for f in files if os.path.basename(f) not in ("main.js",)
                 and "esbuild" not in os.path.basename(f)]
    found = {k: set() for k in PATTERNS}
    loc = 0
    settings_keys = set()
    for f in files:
        try:
            text = open(f, encoding="utf-8", errors="replace").read()
        except OSError:
            continue
        loc += text.count("\n")
        for key, pat in PATTERNS.items():
            for m in re.finditer(pat, text, re.S):
                found[key].add(" — ".join(g.strip() for g in m.groups() if g) if m.groups() else m.group(0))
        m = re.search(r"DEFAULT_SETTINGS[^=]*=\s*\{(.*?)\n\}", text, re.S)
        if m:
            settings_keys |= set(re.findall(r"^\s{2,4}([A-Za-z_][A-Za-z0-9_]*)\s*:", m.group(1), re.M))

    out = {"dir": root, "source_files": len(files), "lines": loc, "bundle_only": not has_src}
    for name in ("manifest.json", "package.json"):
        path = os.path.join(root, name)
        if os.path.exists(path):
            data = json.load(open(path))
            keep = ("id", "name", "version", "description", "isDesktopOnly", "minAppVersion") \
                if name == "manifest.json" else ("dependencies",)
            out[name] = {k: data[k] for k in keep if k in data}
    for lic in ("LICENSE", "LICENSE.md", "LICENSE.txt", "license"):
        path = os.path.join(root, lic)
        if os.path.exists(path):
            out["license"] = " ".join(open(path, errors="replace").read().split()[:12])
            break
    readme = next((os.path.join(root, n) for n in os.listdir(root) if n.lower() == "readme.md"), None)
    if readme:
        text = open(readme, errors="replace").read()
        out["readme_headings"] = re.findall(r"^#{1,4} .+", text, re.M)
        out["readme_images"] = len(re.findall(r"!\[|<img", text))
    if os.path.isdir(os.path.join(root, ".git")):
        p = subprocess.run(["git", "-C", root, "log", "-1", "--format=%cs"], capture_output=True, text=True)
        out["last_commit"] = p.stdout.strip()
    for k, v in found.items():
        if v:
            out[k] = sorted(v)
    if settings_keys:
        out["settings_keys"] = sorted(settings_keys)
    print(json.dumps(out, indent=1, ensure_ascii=False))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("scan")
    s.add_argument("--watchlist")
    s.add_argument("--cache", help="folder to keep historical stats files between runs")
    s.add_argument("--out")
    s.add_argument("--extra-keyword", action="append")
    i = sub.add_parser("inspect")
    i.add_argument("dir")
    args = ap.parse_args()
    scan(args) if args.cmd == "scan" else inspect(args)


if __name__ == "__main__":
    main()
