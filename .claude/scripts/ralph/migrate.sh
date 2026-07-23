#!/bin/bash
# .claude/scripts/ralph/migrate.sh
# Headless Ralph Wiggum loop for codebase migrations
#
# Usage: ./.claude/scripts/ralph/migrate.sh "<description>" [file-pattern] [-n max-iterations]
# Example: ./.claude/scripts/ralph/migrate.sh "Convert to async/await" "src/**/*.ts" -n 60

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

show_help() {
    cat << EOF
Usage: $(basename "$0") "<description>" [file-pattern] [options]

Systematically migrate/refactor codebase patterns.

Arguments:
    description         Description of the migration (required)
    file-pattern        Optional glob pattern for files to migrate

Options:
    -n, --max-iterations    Maximum iterations (default: 60)
    -h, --help              Show this help message

Examples:
    $(basename "$0") "Convert callbacks to async/await"
    $(basename "$0") "Migrate to React hooks" "src/components/**/*.tsx"
    $(basename "$0") "Update API v1 to v2" "src/api/**/*.ts" -n 100

Notes:
    - One file migrated per iteration
    - All tests must pass before each commit
    - Progress logged to activity.md
    - Exit codes: 0=complete, 1=max iterations, 2=breaking changes, 3=stuck
EOF
}

DESCRIPTION=""
FILE_PATTERN=""
MAX_ITERATIONS=60

while [[ $# -gt 0 ]]; do
    case $1 in
        -n|--max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [ -z "$DESCRIPTION" ]; then
                DESCRIPTION="$1"
            elif [ -z "$FILE_PATTERN" ]; then
                FILE_PATTERN="$1"
            fi
            shift
            ;;
    esac
done

if [ -z "$DESCRIPTION" ]; then
    log_error "Migration description is required"
    show_help
    exit 1
fi

log_info "Migration: $DESCRIPTION"
[ -n "$FILE_PATTERN" ] && log_info "File pattern: $FILE_PATTERN"
log_info "Max iterations: $MAX_ITERATIONS"

if [ -n "$FILE_PATTERN" ]; then
    SCOPE_FILTER="matching pattern $FILE_PATTERN"
    SCOPE_INSTRUCTION="Only migrate files matching: $FILE_PATTERN"
else
    SCOPE_FILTER="in the codebase"
    SCOPE_INSTRUCTION="Scan the entire codebase for files needing migration"
fi

PROMPT="Codebase Migration: $DESCRIPTION

## Context
Systematic migration/refactoring: $DESCRIPTION
Scope: Files $SCOPE_FILTER
This is a HEADLESS session - be methodical and document everything in activity.md.

## Workflow (Each Iteration)
1. $SCOPE_INSTRUCTION
2. Identify the next unmigrated file (check git log to see what's already done)
3. If no files remain -> <promise>MIGRATION_COMPLETE</promise>
4. Migrate the file:
   - Read the file carefully
   - Apply migration pattern consistently
   - Update imports/references in other files if needed
   - Preserve all existing functionality
5. Verify:
   - Run: go build ./... (if Go)
   - Run: go test ./...
   - Run linter if available
6. If tests fail:
   - Try to fix
   - If unfixable, revert: git checkout -- <file>
   - Log the issue in activity.md
   - Move to next file
7. If tests pass:
   - Commit: git add . && git commit -m \"refactor: migrate <file> - $DESCRIPTION\"
   - Log success in activity.md

## Migration Quality Checklist
Before committing each file:
- [ ] File follows new pattern completely (no partial migration)
- [ ] All references updated
- [ ] Code compiles
- [ ] All tests pass
- [ ] No new linter warnings
- [ ] Functionality preserved exactly

## Exit Conditions
- <promise>MIGRATION_COMPLETE</promise> when all files have been migrated
- <promise>BREAKING_CHANGES</promise> if migration requires API changes needing review
- <promise>BLOCKED</promise> if pattern unclear or need human guidance
- <promise>STUCK</promise> after 5 iterations without migrating any file

## Important
- ONE file per iteration (atomic changes)
- Never change functionality, only structure
- Always leave code compiling and tests passing
- Document any deviations in activity.md
"

run_ralph_loop "$PROMPT" "MIGRATION_COMPLETE" "$MAX_ITERATIONS"
exit_code=$?

case $exit_code in
    0)
        log_success "Migration complete: $DESCRIPTION"
        ;;
    1)
        log_warning "Max iterations reached. Check activity.md for remaining files."
        ;;
    2)
        log_warning "Migration blocked. Breaking changes may need review."
        ;;
    3)
        log_error "Migration stuck. Manual intervention needed."
        ;;
esac

exit $exit_code
