# WebMCP Contract

Zentic exposes tools only in **Browser agent** match mode. The tools operate on
the live controller state and return structured data; agents should not infer
the board from pixels.

## Required agent behavior

1. Call `read_match` before acting.
2. Use `list_legal_moves` with the returned `positionVersion` before choosing a
   move.
3. Keep explanations concise and factual.
4. Propose a move before attempting to commit it.
5. Treat `stale_position` as a signal to read the board again.

## Tools

| Tool | Effect | Guard |
| --- | --- | --- |
| `read_match` | Reads the exact match snapshot | Read-only |
| `list_legal_moves` | Reads structured legal moves | Requires `expectedVersion` |
| `post_agent_note` | Adds a visible note | Requires `expectedVersion` |
| `propose_agent_move` | Creates a visible move proposal | Legal move and version required |
| `commit_agent_move` | Applies an existing proposal | Allowed only under `agent_may_play` |
| `start_training_scenario` | Replaces the board with a curated drill | Explicit user confirmation required |

## Error contract

| Error | Meaning | Agent recovery |
| --- | --- | --- |
| `stale_position` | The board changed after the agent read it | Call `read_match` again |
| `wrong_turn` | The action is not available for the active side | Wait or re-read state |
| `illegal_move` | The proposed move is not legal | Use `list_legal_moves` again |
| `proposal_missing` | The proposal was dismissed or replaced | Read the match |
| `policy_denied` | Session permissions do not allow the action | Propose instead of committing |

## Example: proposal-first move

```text
1. read_match() -> positionVersion: 12, status: awaiting_agent
2. list_legal_moves({ expectedVersion: 12 })
3. post_agent_note({ expectedVersion: 12, kind: analysis, text: "..." })
4. propose_agent_move({ expectedVersion: 12, from: "g8", to: "f6", explanation: "Develops while attacking e4." })
5. Human reviews and applies the proposal.
```

## Scenario use

When a user asks to study the Scandinavian Defence, explain that the current
board will be replaced and ask for a clear confirmation. Only then call:

```json
{ "scenarioId": "scandinavian-queen-chase" }
```
