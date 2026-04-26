#!/usr/bin/env python3
"""
Reorder NON-X_PAIM_SessionHistory.md to reverse chronological order.

This script:
1. Preserves the header and format instructions (lines 1-14)
2. Reverses the order of session entries (newest first, oldest last)
3. Maintains all content, formatting, and separators
4. Creates a backup before modifying the file

Usage:
    python3 reorder_sessions.py [--dry-run] [--backup]

Options:
    --dry-run   Show what would be changed without modifying file
    --backup    Create backup file before modifying (default: True)
"""

import re
import sys
import shutil
from pathlib import Path
from datetime import datetime

def create_backup(file_path):
    """Create timestamped backup of the file."""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = file_path.parent / f"{file_path.stem}_backup_{timestamp}{file_path.suffix}"
    shutil.copy2(file_path, backup_path)
    return backup_path

def extract_entry_date(entry_text):
    """Extract date from entry header for validation."""
    match = re.search(r'### ([A-Z][a-z]+ \d+, \d{4})', entry_text)
    if match:
        return match.group(1)
    return None

def reorder_session_history(file_path, dry_run=False, backup=True):
    """Reorder session entries from chronological to reverse chronological."""

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split into header and entries section
    # Header ends at the first '---' separator after the format template
    parts = content.split('\n---\n', 1)
    if len(parts) != 2:
        raise ValueError("Could not find header separator (---)")

    header = parts[0]
    entries_section = parts[1]

    # Split entries by '---' separator
    entries = entries_section.split('\n---\n')

    # Remove empty entries and strip whitespace
    entries = [e.strip() for e in entries if e.strip()]

    print(f"Found {len(entries)} session entries")

    # Extract dates for verification
    print("\nCurrent order:")
    for i, entry in enumerate(entries, 1):
        date = extract_entry_date(entry)
        project = re.search(r'Project: ([^\n]+)', entry)
        project_name = project.group(1) if project else "Unknown"
        print(f"  {i}. {date} — {project_name[:50]}")

    # Reverse the order (newest first)
    entries.reverse()

    print("\nNew order (reverse chronological):")
    for i, entry in enumerate(entries, 1):
        date = extract_entry_date(entry)
        project = re.search(r'Project: ([^\n]+)', entry)
        project_name = project.group(1) if project else "Unknown"
        print(f"  {i}. {date} — {project_name[:50]}")

    # Rebuild the file
    new_content = header + '\n\n---\n\n' + '\n\n---\n\n'.join(entries) + '\n'

    if dry_run:
        print("\n[DRY RUN] No changes made to file")
        return len(entries)

    # Create backup if requested
    if backup:
        backup_path = create_backup(file_path)
        print(f"\n✅ Backup created: {backup_path}")

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return len(entries)

def main():
    """Main entry point."""
    # Parse arguments
    dry_run = '--dry-run' in sys.argv
    backup = '--no-backup' not in sys.argv

    # Get file path
    file_path = Path(__file__).parent / 'NON-X_PAIM_SessionHistory.md'

    if not file_path.exists():
        print(f"❌ Error: File not found: {file_path}")
        sys.exit(1)

    print(f"Reordering {file_path.name}...")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Backup: {'Enabled' if backup else 'Disabled'}")
    print()

    try:
        num_entries = reorder_session_history(file_path, dry_run=dry_run, backup=backup)

        if not dry_run:
            print(f"\n✅ Successfully reordered {num_entries} entries to reverse chronological order")
            print("   Newest entries now appear first")
            print("\nNext steps:")
            print("1. Review the changes: git diff docs/NON-X_PAIM_SessionHistory.md")
            print("2. Verify all entries are present and correctly ordered")
            print("3. Stage changes: git add docs/NON-X_PAIM_SessionHistory.md")
            print("4. Commit: git commit -m 'docs: reorder session history to reverse chronological'")
        else:
            print(f"\n✅ Dry run complete. Run without --dry-run to apply changes.")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()