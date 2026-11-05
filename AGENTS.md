# AGENTS.md

[CLAUDE.md](CLAUDE.md) is the guide to this repository: commands, architecture, the deep modules and the patterns to follow. Read it before changing code; this file adds only what applies to other agents.

## Verification

- **Test vault data**: In the `the-gym-test-plugin` vault, always use the existing example notes and their example CSV for live verification. The user authorizes test writes to that CSV; separate disposable notes or CSVs are not required. This permission applies only to example data in this test vault and takes precedence over generic disposable-fixture guidance for these examples.

- **Live acceptance required**: Before verifying plugin changes, read and follow [.agents/skills/obsidian-verify/SKILL.md](.agents/skills/obsidian-verify/SKILL.md). Exercise each relevant user scenario directly in Obsidian and inspect the visible result; use isolated disposable data for write scenarios. Build/type/lint checks do not replace live acceptance. Do not add or run synthetic tests for this workflow; report unavailable live checks as not verified.
