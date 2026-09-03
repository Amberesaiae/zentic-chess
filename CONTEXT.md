# Zentic Domain Context

## Purpose

Zentic is a shared chess table where a human and a browser agent participate in
the same verifiable match. This file defines product language only; technical
details belong in implementation documents and ADRs.

## Glossary

### Match

One bounded game of chess, including its board position, move history,
participants, status, and result.

### Human player

The person interacting directly with the Zentic match table.

### Agent

An external browser agent that can inspect and act on a match through WebMCP.
Zentic does not imply that the agent is a model owned or hosted by Zentic.

### Activity entry

A visible, immutable record of a meaningful match action. Examples include a
human move, an agent position read, an agent note, an agent proposal, and an
applied move.

### Proposal

An agent-selected legal move that is visible to the human but has not yet been
applied to the match. A proposal has an explanation and belongs to one exact
match position.

### Session policy

The permission mode for agent moves in a match. `propose_only` requires the
human to apply an agent proposal. `agent_may_play` permits a valid agent
proposal to be committed through the agent action.

### Position version

A monotonically increasing identity for a match position. It distinguishes a
move proposal made for one board from a proposal made for a later board.

### Stale action

An agent action based on an earlier position version. A stale action never
changes the match.

### Match table

The primary Zentic workspace containing the chessboard, match controls, and
agent activity record. It is not a marketing landing page or chat screen.

## Invariants

- A move is only applied when it is legal for the active side in the current
  match position.
- An agent proposal belongs to exactly one position version.
- The visible activity record does not misrepresent scripted behavior as a
  connected agent action.
- A session policy never grants more authority than it states.
