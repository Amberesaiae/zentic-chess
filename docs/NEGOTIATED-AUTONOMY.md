# Negotiated Autonomy

Zentic is not a chess chatbot that happens to sit next to a board. It is a
shared decision surface where a person gives an agent explicit intent and
bounded authority over a live, rule-checked task.

## The play charter

Every Browser agent match owns one visible play charter:

- **Objective** — what the player is trying to accomplish.
- **Constraints** — up to three guardrails, such as “avoid queen trades” or
  “keep my king safe.”
- **Authority** — `explain`, `propose`, or `one_move`.

The charter is part of `MatchState`, versioned with the live board, and can be
read or updated through WebMCP. `explain` prevents an agent from proposing a
move. `propose` keeps every move human-applied. `one_move` permits a player to
grant consent for exactly one proposal; it does not grant future authority.

## Decision receipts

An agent proposal is not actionable by itself. The agent must create a
decision receipt before a move can be applied. A receipt binds:

1. the exact proposal and position version;
2. the current objective and constraints;
3. the agent's concise rationale; and
4. the successful WebMCP tools already recorded for that position.

The player can then either play the move directly, dismiss it, or—when the
charter allows it—grant one-move consent for the agent to commit that exact
proposal. Applying a move, dismissing a proposal, or changing the board makes
the receipt non-transferable to any other position.

## Why WebMCP matters

Without WebMCP, an agent would need to infer pieces from pixels and remember
the player's intent only in a free-form transcript. Zentic instead gives the
agent structured, policy-aware access to the exact board and lets the player
inspect a receipt for every consequential action.

```text
Player intent
  -> update_play_charter
  -> read_match + list_legal_moves
  -> propose_agent_move
  -> create_decision_receipt
  -> human applies OR grants one-move consent
  -> commit_agent_move
```

This pattern generalizes beyond chess: a person can state an objective, give a
software agent narrow authority, and retain a reviewable record of how that
authority was used.

## Safety invariants

- Only `MatchController` changes a chess position.
- A proposal and consent are tied to the current `positionVersion`.
- A receipt is required before an agent proposal can be applied.
- One-move consent applies only to its recorded proposal.
- The agent never receives an unrestricted “make moves” capability.
- Tool evidence reflects only successful recorded calls; Zentic never claims
  hidden reasoning is available for review.
