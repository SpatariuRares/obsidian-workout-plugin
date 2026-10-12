#!/bin/sh
# PreToolUse (Edit|Write): refuse build outputs and user data.
# main.js / styles.css are rebuilt by `npm run build`; CSV files are the
# user's workout log and tag mappings (read and write them through the
# plugin's modules, never by hand).
file=$(jq -r '.tool_input.file_path // empty')
case "$file" in
  */main.js|*/styles.css)
    echo "Blocked: $file is a build output. Edit the source (main.ts, app/**, styles.source.scss) and run npm run build." >&2
    exit 2 ;;
  *.csv)
    echo "Blocked: $file is user data (workout log or muscle tags). Change it through the plugin, or ask the user to edit it." >&2
    exit 2 ;;
esac
exit 0
