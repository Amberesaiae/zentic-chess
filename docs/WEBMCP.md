# WebMCP Contract

Zentic exposes tools only in **Browser agent** match mode. The tools operate on
the live controller state and return structured data; agents should not infer
the board from pixels.

Opening identity is resolved from the [Lichess chess-openings corpus](https://github.com/lichess-org/chess-openings), a CC0 dataset. The service loads and caches the five ECO volumes on the server; no player moves or credentials are sent to GitHub.

## Required agent behavior

1. Call `read_match` and `get_play_charter` before acting.
2. For an opening, repertoire, or history-grounded lesson question, call
   `identify_opening` with that same `positionVersion`; do not guess an opening
   name from the board or from model memory.
3. Use `list_legal_moves` with the returned `positionVersion` before choosing a
   move.
3. Respect `explain` authority; do not propose a move in that mode.
4. Keep explanations concise and factual.
5. Propose a move, then create a decision receipt before asking for consent or
   attempting to commit it.
6. Treat `stale_position` as a signal to read the board again.

## Tools

| Tool | Effect | Guard |
| --- | --- | --- |
| `read_match` | Reads the exact match snapshot | Read-only |
| `identify_opening` | Resolves the move history against 3,800+ CC0 Lichess opening names | Requires `expectedVersion`; read-only |
| `get_agent_capabilities` | Shows the actions presently permitted by the match | Read-only |
| `get_play_charter` | Reads the player's objective, guardrails, and authority | Read-only |
| `update_play_charter` | Records an explicitly stated player intent | Requires version |
| `list_legal_moves` | Reads structured legal moves | Requires `expectedVersion` |
| `list_match_activity` | Returns new visible events after a board version | Read-only |
| `export_match_pgn` | Returns the portable PGN move record | Read-only |
| `get_cloud_analysis` | Requests cached, external engine analysis for a position | Requires `expectedVersion`; may be unavailable |
| `post_agent_note` | Adds a visible note | Requires `expectedVersion` |
| `propose_agent_move` | Creates a visible move proposal | Legal move and version required |
| `create_decision_receipt` | Binds a proposal to the charter, rationale, and recorded tools | Current proposal and version required |
| `get_decision_receipts` | Reads the visible decision record | Read-only |
| `grant_move_consent` | Grants one exact receipt-backed agent move | `one_move` charter authority required |
| `commit_agent_move` | Applies an existing proposal | Allowed only under `agent_may_play` |
| `withdraw_agent_proposal` | Withdraws the agent's pending proposal | Does not alter the board |
| `list_training_scenarios` | Lists curated lessons before suggesting one | Read-only |
| `get_training_state` | Reads active lesson objective and completion state | Read-only |
| `reveal_training_hint` | Reveals one learner-requested progressive hint | Requires `expectedVersion` |
| `start_training_scenario` | Replaces the board with a curated drill | Explicit user confirmation required |

## Error contract

| Error | Meaning | Agent recovery |
| --- | --- | --- |
| `stale_position` | The board changed after the agent read it | Call `read_match` again |
| `wrong_turn` | The action is not available for the active side | Wait or re-read state |
| `illegal_move` | The proposed move is not legal | Use `list_legal_moves` again |
| `proposal_missing` | The proposal was dismissed or replaced | Read the match |
| `policy_denied` | Session permissions do not allow the action | Propose instead of committing |

`get_cloud_analysis` may also return an unavailable result when Lichess has no
cached evaluation for a position or the shared endpoint is rate-limited. Agents
must not invent an engine score in either case.

## Example: proposal-first move

```text
1. read_match() -> positionVersion: 12, status: awaiting_agent
2. list_legal_moves({ expectedVersion: 12 })
3. propose_agent_move({ expectedVersion: 12, from: "g8", to: "f6", explanation: "Develops while attacking e4." })
4. create_decision_receipt({ expectedVersion: 12, proposalId: "..." })
5. Human reviews the charter and receipt, then either applies the proposal or grants one-move consent.
```

## Scenario use

When a user asks to study the Scandinavian Defence, explain that the current
board will be replaced and ask for a clear confirmation. Only then call:

```json
{ "scenarioId": "scandinavian-queen-chase" }
```
