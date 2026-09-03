# Zentic Foundation Status

This document records the foundation that has been implemented and the work
that remains. It replaces the original speculative implementation plan.

## Implemented

- A single `MatchController` owns legal chess state, history, clocks, status,
  activity, proposals, and results.
- Human, local-practice, WebMCP, and voice actions use the controller rather
  than component-local state.
- Position versions reject stale agent writes.
- Proposal-first agent moves preserve human review by default.
- WebMCP tools register only for Browser agent matches.
- Curated training scenarios are validated `chess.js` positions.
- A WebRTC client and server-side Realtime credential boundary exist for voice.
- Cached Lichess cloud analysis is available to agents for positions already
  covered by the public analysis database.
- Unit tests cover legal human moves, local computer turns, proposals, stale
  writes, policy enforcement, and the Scandinavian scenario.

## Deliberate limits

- The practice opponent is a deterministic heuristic, not Stockfish.
- Voice requires a real provider key and has not been evaluated against a
  production account in this repository.
- There is no persistence, authentication, multiplayer, or matchmaking.
- The only training scenario currently available is the Scandinavian
  queen-chase drill.

## Next foundations

1. Add a local Stockfish WebAssembly fallback for positions missing cloud
   analysis, with licensing and worker-delivery requirements resolved.
2. Add scenario data and tests for additional opening lessons.
3. Add browser-level smoke tests for game setup, proposal review, and responsive
   layout.
4. Add server-side user identity, rate limiting, and audit storage before a
   public voice deployment.
5. Replace direct voice-client tool execution with a server-authorized session
   path for multi-user production use.

## Acceptance bar for new agent features

An agent feature is ready only when it has a narrow capability, a visible UI
consequence, a permission policy, controller-level validation, and test
coverage. “The model can probably do it” is not acceptance criteria.
