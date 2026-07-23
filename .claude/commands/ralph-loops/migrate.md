---
description: Run headless codebase migration
argument-hint: "<description>" [file-pattern] [-n max-iterations]
allowed-tools: Bash(.claude/scripts/ralph/migrate.sh:*)
---

# Headless Migration

Running headless ralph-loop for migration: **$ARGUMENTS**

Execute:
```bash
./.claude/scripts/ralph/migrate.sh $ARGUMENTS
```

## What This Does

Systematically migrates/refactors codebase patterns:

1. **One file per iteration** - Atomic, safe changes
2. **Tests required** - All tests must pass before committing
3. **Tracks progress** - via activity.md

## Arguments

- `"<description>"`: Description of the migration (required)
- `[file-pattern]`: Optional glob pattern for files (e.g., `"src/**/*.ts"`)
- `-n <N>`: Maximum iterations (default: 60)

## Examples

```bash
# Migrate all applicable files
./.claude/scripts/ralph/migrate.sh "Convert callbacks to async/await"

# Migrate specific file pattern
./.claude/scripts/ralph/migrate.sh "Migrate to React hooks" "src/components/**/*.tsx"

# With iteration limit
./.claude/scripts/ralph/migrate.sh "Update API v1 to v2" "src/api/**/*.ts" -n 100
```

## Workflow

Each iteration:
1. Find the next file matching the pattern that needs migration
2. Migrate the file
3. Run tests
4. Commit
5. Log progress to activity.md

Completes when all matching files have been migrated or max iterations reached.

## Monitoring

- `activity.md` - Detailed migration log
- `git log --oneline` - See migration commits

## Exit Codes

- `0`: Migration complete
- `1`: Max iterations reached
- `2`: Blocked (breaking changes need review)
- `3`: Stuck (file can't be migrated)
