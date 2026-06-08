#!/bin/bash
# Claude Code Hook: Auto-sync completed tasks from HANDOFF_SUMMARY.md to PRIORITIES.md
# Triggered on file save for HANDOFF_SUMMARY.md or PRIORITIES.md

# This hook launches a Haiku agent to:
# 1. Scan HANDOFF_SUMMARY.md for completed tasks (✅ or [x])
# 2. Check if task exists in PRIORITIES.md Pending section
# 3. Move completed task to top of Completed section with date
# 4. Update "Last Updated" timestamp

echo "🔄 Syncing priorities..."

# Launch Claude Code with Haiku agent to perform sync
claude-code task --agent=haiku --prompt="
Sync completed tasks between HANDOFF_SUMMARY.md and PRIORITIES.md:

1. Read docs/HANDOFF_SUMMARY.md - scan for completed tasks (marked with ✅ or [x])
2. Read docs/PRIORITIES.md - check Pending Tasks section
3. For each completed task in Handoff Summary:
   - If task exists in Priorities Pending section:
     - Remove from Pending section
     - Add to top of Completed section
     - Add completion date
     - Preserve all task details
4. Update 'Last Updated' timestamp in PRIORITIES.md
5. Save changes

Be careful to preserve exact task formatting and details.
" --model=haiku

echo "✅ Sync complete"