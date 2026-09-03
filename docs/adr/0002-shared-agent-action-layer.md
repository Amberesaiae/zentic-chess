# ADR 0002: Share Agent Actions Across WebMCP and Voice

## Status

Accepted

## Context

Zentic began as an external browser-agent experience. Voice coaching adds a
second agent-facing transport. If each transport calls the match controller in
its own way, policy and validation drift becomes likely.

## Decision

Create `agent-actions.ts` as the shared capability layer. WebMCP and voice call
this layer, which delegates to `MatchController`. It exposes reads, legal move
inspection, visible notes, proposal lifecycle operations, and curated training
scenarios.

Voice receives fewer capabilities than the full WebMCP surface: it cannot
commit an agent move. This keeps coaching conservative and makes human approval
the default.

## Consequences

- Every adapter returns the same versioned state and receives the same rule
  validation.
- New agent features have one permission boundary to review.
- The agent transport can change without reimplementing chess rules.
- Production voice will still need server-side authorization; client execution
  is an intentionally small local-development integration.
