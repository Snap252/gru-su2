# Claude Code Commands

The architecture creation pipeline takes source documents, requirements, and research
through a structured process to produce consistent, traceable arc42 architecture documentation.

---

## Pipeline 1 — Architecture Creation

Takes source documents, requirements, and research through a structured process
to produce consistent, traceable arc42 architecture documentation.

### Overview

```
/architecture:ingest-sources [folder]
     │
     ▼  docs/arc42/00-source-inventory.md
/architecture:discover-architecture-questions [sections]
     │
     ▼  architecture/questions/open-questions.md
/architecture:resolve-architecture-questions [question-ids]
     │
     ▼  architecture/questions/resolved-questions.md
/architecture:draft-adrs [adr-numbers | question-ids]
     │
     ▼  SourceDocuments/adr/NNN-*.md
/architecture:review-adr-consistency [adr-numbers]
     │
     ▼  architecture/adr-consistency-review.md
/architecture:draft-arc42-section [section-numbers | all]
     │
     ▼  docs/arc42/NN-*.md
/architecture:review-arc42-consistency [section-numbers]
     │
     ▼  architecture/arc42-consistency-review.md
/architecture:resolve-arc42-gaps [finding-ids]
     │                    ╭─── may loop back to
     │                    │    /architecture:discover-architecture-questions
     │                    │    /architecture:draft-adrs
     ▼  fixes applied + architecture/arc42-gap-remedies.md
/architecture:finalize-arc42
     │
     ▼  Branch + PR (or blocker report)
/architecture:review-arc42-pr [pr-number]
     │
     ▼  Review verdict
```

### Commands

#### Step 1 — `/architecture:ingest-sources [folder]`

Catalog all source documents with arc42 section mapping and contradiction detection.

- **Input:** Folder path (default: `SourceDocuments/`)
- **Reads:** All documents in the specified folder(s)
- **Output:** `docs/arc42/00-source-inventory.md`
- **Produces:** Document catalog, arc42 coverage map, contradictions, gaps,
  supersession chain
- **Mode:** Planning with ultrathink

#### Step 2 — `/architecture:discover-architecture-questions [sections]`

Identify open questions, ambiguities, and contradictions that must be resolved.

- **Input:** Arc42 section numbers (default: all §01–§12)
- **Reads:** Source inventory, source documents
- **Output:** `architecture/questions/open-questions.md`
- **Uses context7:** Validates library assumptions against current documentation
- **Produces:** Questions classified as blocking / important / clarification /
  auto-resolved
- **Mode:** Planning with ultrathink

#### Step 3 — `/architecture:resolve-architecture-questions [question-ids]`

Resolve open questions using sources, context7, and architectural derivation.

- **Input:** Question IDs (default: all open questions)
- **Reads:** Open questions, source inventory, source documents, ADRs
- **Output:** `architecture/questions/resolved-questions.md` (updates open-questions.md)
- **Uses context7:** Verifies technology-related answers
- **Produces:** Resolved decisions with evidence, ADR candidates, still-open items
  needing human input
- **Mode:** Ultrathink

#### Step 4 — `/architecture:draft-adrs [adr-numbers | question-ids]`

Create or update ADRs based on resolved questions.

- **Input:** ADR numbers, question IDs, or omit for all candidates
- **Reads:** Resolved questions, existing ADRs, source documents
- **Output:** `SourceDocuments/adr/NNN-*.md`
- **Uses context7:** Validates technology choices against current library docs
- **Mode:** Ultrathink

#### Step 5 — `/architecture:review-adr-consistency [adr-numbers]`

Multi-agent review of ADR set for contradictions, source alignment, and
library accuracy.

- **Input:** ADR numbers (default: all ADRs)
- **Reads:** All ADRs, source documents, resolved questions
- **Output:** `architecture/adr-consistency-review.md`
- **Uses context7:** Verifies every technology-specific ADR claim
- **Agents:** Contradiction Detector, Source Alignment Checker, Library
  Validation Agent (context7), Completeness Checker
- **Mode:** Spawns 4 parallel specialist agents

#### Step 6 — `/architecture:draft-arc42-section [section-numbers | all]`

Write arc42 sections from source documents, ADRs, and resolved questions.

- **Input:** Section numbers (e.g., `01`, `05 06`, `all`)
- **Reads:** Source inventory, resolved questions, ADRs, existing arc42 content
- **Output:** `docs/arc42/NN-*.md`
- **Uses context7:** Validates technology descriptions in §04–§08
- **Key behavior:** Every claim cites its source. Inferences are flagged.
  Uncovered areas get TODO markers.
- **Mode:** Planning with ultrathink

#### Step 7 — `/architecture:review-arc42-consistency [section-numbers]`

Multi-agent review of arc42 sections for cross-section consistency, traceability,
library accuracy, and terminology coherence.

- **Input:** Section numbers (default: all sections)
- **Reads:** All arc42 sections, source inventory, ADRs, resolved questions
- **Output:** `architecture/arc42-consistency-review.md`
- **Uses context7:** Verifies every technology claim in arc42 sections
- **Agents:** Cross-Reference Validator, Source Traceability Auditor, Library
  Alignment Agent (context7), Terminology Consistency Agent
- **Mode:** Spawns 4 parallel specialist agents

#### Step 8 — `/architecture:resolve-arc42-gaps [finding-ids]`

Apply fixes for consistency review findings. May loop back to earlier steps.

- **Input:** Finding IDs (default: all findings)
- **Reads:** Consistency review, arc42 sections, source documents, ADRs
- **Output:** `architecture/arc42-gap-remedies.md` + direct edits to arc42 sections
- **Uses context7:** Updates outdated library claims
- **Key behavior:** Applies direct fixes to section files. Findings requiring
  new questions or ADRs are flagged as workflow loops.
- **Mode:** Ultrathink

#### Step 9 — `/architecture:finalize-arc42`

Final verification, traceability summary, and PR creation.

- **Input:** Section numbers (default: all)
- **Reads:** All arc42 sections, all architecture workflow artifacts
- **Output:** Branch + PR (if ready) or blocker report
- **Checks:** No blocking questions, no critical findings, cross-references,
  Mermaid syntax, terminology, ADR alignment
- **Mode:** Ultrathink

#### Step 10 — `/architecture:review-arc42-pr [pr-number]`

Review the arc42 PR against source material, ADRs, and library documentation.

- **Input:** PR number, branch name, or auto-detect
- **Reads:** PR diff, all changed files in full, source documents, ADRs,
  resolved questions
- **Output:** Review verdict (APPROVED / CHANGES REQUESTED / NEEDS DISCUSSION)
- **Uses context7:** Verifies every technology claim in changed sections
- **Checks:** Source traceability, resolved question incorporation, library
  accuracy, cross-section consistency, diagram validity, terminology
- **Mode:** Ultrathink


---

## Typical Workflow

### Architecture Creation (new project or major rework)

```bash
# Catalog sources
/architecture:ingest-sources SourceDocuments/

# Discover and resolve questions
/architecture:discover-architecture-questions
/architecture:resolve-architecture-questions
# Answer any "needs-human-decision" items, then re-run if needed

# Formalize decisions
/architecture:draft-adrs
/architecture:review-adr-consistency
# Fix critical findings, then re-run review if needed

# Write arc42 sections
/architecture:draft-arc42-section all
# Or incrementally: /architecture:draft-arc42-section 12 01 02 03 ...

# Review and fix
/architecture:review-arc42-consistency
/architecture:resolve-arc42-gaps
# May loop back to /architecture:discover-architecture-questions or /architecture:draft-adrs

# Finalize and review
/architecture:finalize-arc42
/architecture:review-arc42-pr
```

---

## File Locations

| Artifact | Path |
|----------|------|
| Source inventory | `docs/arc42/00-source-inventory.md` |
| Open questions | `architecture/questions/open-questions.md` |
| Resolved questions | `architecture/questions/resolved-questions.md` |
| ADRs | `SourceDocuments/adr/NNN-*.md` |
| ADR consistency review | `architecture/adr-consistency-review.md` |
| Arc42 sections | `docs/arc42/NN-*.md` |
| Arc42 consistency review | `architecture/arc42-consistency-review.md` |
| Arc42 gap remedies | `architecture/arc42-gap-remedies.md` |
