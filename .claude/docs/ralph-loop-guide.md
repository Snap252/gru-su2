# Ralph Loop User Guide

Ralph Loop enables autonomous, multi-iteration task execution. It comes in two modes: **Interactive** and **Headless**.

## Quick Start

```bash
# Interactive: Generate a command to run in your current session
/ralph/epic bd-abc123

# Headless: Run overnight with fresh context each iteration
/headless/epic bd-abc123 -n 50
# Or run the script directly:
./.claude/scripts/ralph/epic.sh bd-abc123 -n 50
```

---

## Understanding the Two Modes

### Interactive Mode (`/ralph/*`)

**What it does:** Generates a `/ralph-loop` command that you copy and run in your current Claude Code session.

**How it works:**
1. You run `/ralph/epic bd-abc123`
2. Claude generates a command block
3. You copy and paste the command to start the loop
4. The loop runs in your current session until completion or exit condition

**Best for:**
- Monitoring progress in real-time
- Tasks you want to supervise
- Debugging workflow issues
- Shorter tasks (< 10 iterations)

**Commands:**
| Command | Purpose |
|---------|---------|
| `/ralph/epic <id>` | Execute all tasks under a Beads epic |
| `/ralph/bugfix [id]` | Fix bugs in priority order |
| `/ralph/tdd <id>` | Test-driven development workflow |
| `/ralph/migrate "<desc>"` | Codebase migration/refactoring |

### Headless Mode (`/headless/*` or `.claude/scripts/ralph/*.sh`)

**What it does:** Runs a bash script that spawns fresh Claude sessions for each iteration.

**How it works:**
1. You run `/headless/epic bd-abc123` (or the script directly from terminal)
2. Each iteration gets a fresh context window
3. Progress is logged to `activity.md`
4. Runs until completion, blocked, stuck, or max iterations

**Best for:**
- Overnight/unattended execution
- Large tasks (50+ iterations)
- Tasks that need fresh context (to avoid context window limits)
- Running multiple tasks in parallel (different terminals)

**Slash Commands:**
| Command | Purpose |
|---------|---------|
| `/headless/epic <id>` | Execute Beads epic tasks |
| `/headless/bugfix [id]` | Fix bugs in priority order |
| `/headless/migrate "<desc>" [pattern]` | Codebase migration |
| `/headless/security-review <path>` | Security analysis |
| `/headless/code-quality <path>` | Code quality review |
| `/headless/research <folder>` | Document processing |

**Or run scripts directly:**
| Script | Purpose |
|--------|---------|
| `epic.sh <id>` | Execute Beads epic tasks |
| `bugfix.sh [id]` | Fix bugs in priority order |
| `migrate.sh "<desc>" [pattern]` | Codebase migration |
| `security-review.sh <path>` | Security analysis |
| `code-quality.sh <path>` | Code quality review |
| `research.sh <folder>` | Document processing |

---

## Choosing the Right Mode

| Scenario | Recommended Mode | Why |
|----------|------------------|-----|
| "I want to watch it work" | Interactive | Real-time visibility |
| "Run while I sleep" | Headless | Unattended execution |
| "Small epic (5-10 tasks)" | Interactive | Quick, easy monitoring |
| "Large epic (50+ tasks)" | Headless | Fresh context prevents confusion |
| "Debug a workflow" | Interactive | See exactly what's happening |
| "Multiple tasks in parallel" | Headless | Run in separate terminals |
| "Context getting long" | Headless | Fresh context each iteration |

---

## Running Headless Mode

### Basic Usage

**Using slash commands (recommended):**
```bash
# In Claude Code session
/headless/epic bd-abc123 -n 50
/headless/bugfix -n 30
/headless/migrate "Convert to async/await" "src/**/*.ts"
```

**Or run scripts directly from terminal:**
```bash
# From project root
./.claude/scripts/ralph/epic.sh <epic-id> [-n max-iterations]

# Examples
./.claude/scripts/ralph/epic.sh bd-abc123
./.claude/scripts/ralph/epic.sh bd-abc123 -n 100
./.claude/scripts/ralph/bugfix.sh -n 30
./.claude/scripts/ralph/migrate.sh "Convert to async/await" "src/**/*.ts"
```

### Monitoring Progress

While the script runs:

```bash
# Watch activity log (in another terminal)
tail -f activity.md

# See recent commits
git log --oneline -20
```

### Stopping a Headless Loop

Press `Ctrl+C` in the terminal running the script. The current iteration will complete before stopping.

### After Running

```bash
# See detailed log
cat activity.md

# Check what was committed
git log --oneline -20
```

---

## Running Interactive Mode

### Basic Usage

```bash
# In Claude Code session
/ralph/epic bd-abc123
```

This generates a command block. Copy the entire block and paste it to start the loop.

### Example Output

```
/ralph-loop "Execute the migration:
...workflow instructions...
" --max-iterations 50 --completion-promise "COMPLETE"
```

### Monitoring

Watch the Claude Code session directly. Each iteration shows:
- Which task is being worked on
- Progress updates
- Exit conditions when reached

---

## Exit Conditions

Both modes use the same exit conditions:

| Promise | Meaning | Action |
|---------|---------|--------|
| `COMPLETE` / `EPIC_COMPLETE` | All work done | Success! |
| `BLOCKED` | Human decision needed | Review `activity.md`, make decision, re-run |
| `STUCK` | No progress after attempts | Manual intervention needed |
| `MAX_ITERATIONS` | Hit iteration limit | Re-run with higher `-n` or check progress |

### Handling BLOCKED

1. Check `activity.md` for the blocker reason
2. Make the required decision
3. Re-run the command (it will pick up where it left off)

### Handling STUCK

1. Check `activity.md` for what was attempted
2. Manually investigate the problematic task
3. Either fix it manually or clarify requirements
4. Re-run the command

---

## Activity Log

All ralph sessions log to `activity.md` at the project root.

### Log Format

```markdown
## [2024-01-15 14:30:22] Headless Ralph
Started headless loop. Target: EPIC_COMPLETE, Max iterations: 50

## [2024-01-15 14:35:18] Headless Ralph
Completed successfully after 12 iterations.
```

### Using the Log

- **Resume context:** Read `activity.md` to understand what was done
- **Debug issues:** Find which iteration had problems
- **Track progress:** See completion rate across sessions

---

## Tips & Best Practices

### 1. Start Small
For new workflows, use interactive mode first to validate the process works correctly.

### 2. Set Reasonable Limits
Use `-n` to set appropriate iteration limits:
- Bug fixes: 20-30 iterations
- Epic execution: 50-100 iterations
- Migrations: 60+ iterations (depends on file count)

### 3. Use Fresh Context for Long Tasks
If a task has many iterations, prefer headless mode to avoid context window limits.

### 5. Parallel Execution
Run multiple headless scripts in different terminals for parallel work on independent epics.

### 6. Review Activity Log Regularly
For long-running headless tasks, periodically check `activity.md` to catch issues early.

---

## Troubleshooting

### "Script not found" or "Permission denied"
Ensure you're in the project root with proper permissions:
```bash
chmod +x .claude/scripts/ralph/*.sh
./.claude/scripts/ralph/migrate.sh "my migration"
```

### "Loop keeps restarting on same task"
The task may be too complex or have unclear requirements. Check:
1. Activity log for what was attempted
2. Consider breaking the work into smaller pieces

### "Max iterations reached but work incomplete"
Re-run with a higher limit:
```bash
/headless/epic bd-abc123 -n 200
# Or directly:
./.claude/scripts/ralph/epic.sh bd-abc123 -n 200
```

---

## Command Reference

### Interactive Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/ralph/epic` | `<epic-id> [max-iterations]` | Execute epic tasks |
| `/ralph/bugfix` | `[epic-id] [max-iterations]` | Fix bugs |
| `/ralph/tdd` | `<feature-id> [max-iterations]` | TDD development |
| `/ralph/migrate` | `"<description>" [pattern] [max-iterations]` | Codebase migration |

### Headless Commands

| Command | Arguments | Default Iterations |
|---------|-----------|-------------------|
| `/headless/epic` | `<epic-id> [-n N]` | 50 |
| `/headless/bugfix` | `[epic-id] [-n N]` | 30 |
| `/headless/migrate` | `"<desc>" [pattern] [-n N]` | 60 |
| `/headless/security-review` | `<path> [--scope] [--compliance] [-n N]` | 30 |
| `/headless/code-quality` | `<path> [--scope] [-n N]` | 50 |
| `/headless/research` | `<folder> [--output] [-n N]` | 30 |

### Headless Scripts (Direct Execution)

| Script | Arguments | Default Iterations |
|--------|-----------|-------------------|
| `epic.sh` | `<epic-id> [-n N]` | 50 |
| `bugfix.sh` | `[epic-id] [-n N]` | 30 |
| `migrate.sh` | `"<desc>" [pattern] [-n N]` | 60 |
| `security-review.sh` | `<path> [--scope] [--compliance] [-n N]` | 30 |
| `code-quality.sh` | `<path> [--scope] [-n N]` | 50 |
| `research.sh` | `<folder> [--output] [-n N]` | 30 |
