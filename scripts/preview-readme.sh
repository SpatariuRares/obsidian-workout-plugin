#!/bin/sh
# Render README.md the way GitHub does (GitHub's markdown API + its dark CSS) and serve it.
# Run in the background; open the printed URL. Images load from assets/ next to it.
# Usage: sh scripts/preview-readme.sh [port]   (needs gh and python3)
set -e
cd "$(dirname "$0")/.."
PORT="${1:-8765}"
mkdir -p .shots
BODY=$(gh api markdown -f text="$(cat README.md)" -f mode=gfm -f context=SpatariuRares/obsidian-workout-plugin)
cat > .shots/readme-preview.html <<EOF
<!doctype html><html><head><meta charset="utf-8"><base href="../">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.5.1/github-markdown-dark.min.css">
<style>body{background:#0d1117;margin:0}.markdown-body{box-sizing:border-box;max-width:1012px;margin:32px auto;padding:32px 45px;border:1px solid #30363d;border-radius:6px}</style>
</head><body><article class="markdown-body">$BODY</article></body></html>
EOF
echo "http://127.0.0.1:$PORT/.shots/readme-preview.html"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
