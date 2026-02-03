
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "--------------------------------"
  # Modified to print output live
  output_file=$(mktemp)
  docker sandbox run claude --permission-mode acceptEdits  -p "@.claude/skills/ralph/prd.json @progress.txt \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first in the list. \
2. Check that the types check via npm run typecheck and that the tests pass via npm run test. \
3. use the MCP obsidian to check the codebase and the PRD in real vault \
4. Update the PRD with the work that was done. \
5. Append your progress to the progress.txt file. Use this to leave a note for the next person working in the codebase. \
6. Make a git commit of that feature. ONLY WORK ON A SINGLE FEATURE. If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>." | tee "$output_file"

  result=$(cat "$output_file")
  rm "$output_file"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "PRD complete, exiting."
    tt notify "CVM PRD complete after $i iterations"
    exit 0
  fi
done


# @.claude/skills/ralph/prd.json @progress.txt 1. Find the highest-priority feature to work on and work only on that feature. This should be the one YOU decide has the highest priority - not necessarily the first in the list. 2. don't do the tests ask me to do to save token. 3. Update the PRD with the work that was done. 4. Append your progress to the progress.txt file. Use this to leave a note for the next person working in the codebase. 5. ONLY WORK ON A SINGLE FEATURE. If, while implementing the feature, you notice the PRD is complete, output <promise>COMPLETE</promise>