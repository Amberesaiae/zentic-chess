# Architecture

## Principle

Chess rules, user interface, WebMCP, and voice are separate concerns. Every
agent-facing adapter uses the same validated chess actions; no adapter writes
directly to React state.

```text
React match table                 Browser agent
       |                                |
       +---------- WebMCP adapter ------+
                    |
              Agent action layer
                    |
              MatchController
                    |
             chess.js rule engine
                    |
     versioned MatchState and activity record

Optional voice client -> OpenAI Realtime -> same agent action layer

Optional cloud analysis -> local API cache -> Lichess cloud evaluation
```

## Source map

| Area | Source | Responsibility |
| --- | --- | --- |
| Chess domain | `src/domain/chess/` | State types, legal moves, versioning, scenarios, controller |
| Agent boundary | `src/domain/chess/agent-actions.ts` | Shared, safe operations available to adapters |
| WebMCP | `src/integrations/webmcp/` | Browser-agent tool registration |
| Voice | `src/integrations/voice/`, `server.mjs` | WebRTC session and temporary server credentials |
| Cloud analysis | `src/integrations/analysis/`, `server.mjs` | Cached external engine variations with truthful cache misses |
| Application state | `src/hooks/use-match.ts` | Subscribes React to the controller and runs local computer replies |
| UI | `src/components/` | Lobby, board, players, match header, activity rail, voice control |

## Match invariants

1. Only `MatchController` may change a chess position.
2. Moves must be legal for the active side in the current `chess.js` position.
3. Agent mutations require the expected position version.
4. A proposal belongs to one position version and is invalid after any move.
5. `propose_only` requires a human to apply the proposal.
6. Voice and WebMCP are capability adapters, not rule engines.

## State lifecycle

```text
awaiting_human -> awaiting_agent -> agent_proposed -> awaiting_human
       |                                |
       +------------- finished <--------+
```

In a practice-computer match, `awaiting_agent` triggers the local deterministic
practice response. In agent mode, an external browser agent or configured voice
coach reads the position and chooses a bounded action.

## Training scenarios

Scenarios are curated definitions in `training-scenarios.ts`, not arbitrary
language-model FEN generation. `startTrainingScenario` replaces the board only
after an agent has received explicit user confirmation. The initial scenario is
the Scandinavian queen-chase position after `1. e4 d5 2. exd5 Qxd5`.

## Extension rules

- Add new user-visible chess mutations to `MatchController` first.
- Expose a mutation through `agent-actions.ts` only after defining its policy.
- Register the same action in WebMCP and voice only when the capability is
  appropriate for both.
- Keep engine analysis separate from legality. A future Stockfish adapter may
  evaluate a move, but it must not become the authoritative source of legal
  state.
