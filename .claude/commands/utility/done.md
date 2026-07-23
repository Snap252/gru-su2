---
description: Complete current work, run quality gates, and commit
allowed-tools: Read, Grep, Glob, Bash
---

# Done (Complete Current Work)

Run quality checks and commit current work.

This command follows the GEV pattern for work completion.

## Current State

### Git Status
!git status --short

### Changed Files
!git diff --stat HEAD

### Current Branch
!git branch --show-current

## Gate Phase

### Pre-completion Checks

Before committing:

1. **No Syntax Errors**
   - Code must compile/parse without errors

2. **Tests Pass**
   - All existing tests should pass
   - New tests for new code (if applicable)

3. **Lint Clean** (if linter available)
   - No errors
   - Warnings acceptable but noted

## Execute Phase

### Step 1: Run Quality Checks

```bash
# Run tests
npm test || pytest || cargo test || go test ./... || echo "No test command"

# Run linter
npm run lint || ruff check . || cargo clippy || golangci-lint run || echo "No lint command"
```

### Step 2: Stage and Commit

```bash
# Stage changes
git add -A

# Commit with conventional commit format
git commit -m "<type>(<scope>): <description>"
```

Commit types: feat, fix, refactor, docs, test, chore, perf

## Verify Phase

### Post-completion Verification

```bash
# Verify commit was created
git log -1 --oneline

# Verify working directory is clean
git status --short
```

## Output Format

```
## Work Completed

### Quality Gates
| Gate | Status | Details |
|------|--------|---------|
| Tests | PASS/FAIL | [summary] |
| Lint | PASS/FAIL | [summary] |

### Commit
!git log -1 --stat

### Next Steps
- [ ] Push changes: `git push`
```

## Error Handling

### If Tests Fail
Do not commit. Report failures and fix them first.

### If Nothing to Commit
Report that the working directory is clean and no commit is needed.

## Begin

Start by running quality gates, then stage and commit the changes.
