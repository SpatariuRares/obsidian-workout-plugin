#!/bin/sh
# pre-push: for each branch being pushed whose locales miss keys of en.json,
# start the Translate workflow on GitHub for that branch once the push has
# landed (it commits the translations back to the branch; git pull after).
# main is skipped: a push to main that changes en.json starts it by itself,
# while a release only checks that no locale misses keys.
#
# Reads the refs git passes to pre-push on stdin.

command -v gh >/dev/null 2>&1 || exit 0

while read -r local_ref local_sha _remote_ref _remote_sha; do
  case "$local_ref" in refs/heads/*) ;; *) continue ;; esac
  branch=${local_ref#refs/heads/}
  [ "$branch" = "main" ] && continue
  # Only what is checked out can be inspected without a second worktree
  [ "$local_sha" = "$(git rev-parse HEAD)" ] || continue

  missing=$(cd "AI translate" && python3 missing_locales.py 2>/dev/null)
  [ -z "$missing" ] && continue

  echo "i18n: $branch misses translations ($missing); GitHub will translate it after this push"
  # pre-push runs before the push: wait in the background until the branch
  # is on GitHub at this commit, then start the workflow
  (
    i=0
    while [ $i -lt 40 ]; do
      if [ "$(git ls-remote origin "refs/heads/$branch" | cut -f1)" = "$local_sha" ]; then
        gh workflow run translate.yml --ref "$branch"
        exit 0
      fi
      i=$((i + 1))
      sleep 3
    done
  ) >/dev/null 2>&1 &
done
exit 0
