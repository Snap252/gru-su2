# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Workflow

1. Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
2. Run tests and linting before committing
3. Keep changes focused and atomic

## Code Quality

- Write tests for new functionality
- Follow existing patterns in the codebase
- Avoid introducing security vulnerabilities (OWASP Top 10)

## Git Discipline

- Use conventional commits
- Never force push to main/master
- Never commit secrets or credentials
- Run quality checks before committing

## Session Close Protocol

Before ending a session:
1. Run tests and linting
2. Commit and push changes
3. Provide handoff context for next session

@.claude/rules/git-safety.md
@.claude/rules/security.md
