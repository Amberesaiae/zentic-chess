# Practice Engine Contract

Zentic separates chess rules, practical opponent strength, and user-visible
turn pacing. The `MatchController` remains the sole authority that can apply a
move.

## Source order

1. **Learn** uses the local development-first selector. It is deliberately
   forgiving and does not claim engine strength.
2. **Club** and **Tactical** first request a cached Lichess cloud evaluation.
   Those positions are evaluated by the Lichess Stockfish infrastructure.
3. The first UCI move in the returned principal variation is accepted only if
   it is legal for the exact live position.
4. A cloud miss, malformed variation, timeout, or stale response falls back to
   Zentic's local search. The match remains playable without a network.

## Local fallback profiles

| Level | Local fallback |
| --- | --- |
| Learn | Development-first move selection |
| Club | Two-ply minimax with material and mobility scoring |
| Tactical | Three-ply minimax, ordered around checks, captures, promotions, and central play |

The fallback does not call itself Stockfish. It is a bounded, deterministic
practice engine for continuity when external analysis is unavailable.

## Pacing and latency

Agent-chat acknowledgement is independent of board cadence. Practice games
preserve a minimum visible reply cadence: 1.25 seconds untimed, 1.05 seconds
rapid, and 0.26 seconds blitz. An engine may take longer than the minimum; the
board never applies a move before a response source has been selected.

Cloud analysis has a 2.4 second client timeout. The server validates FEN before
forwarding it and bounds upstream requests to 12 seconds.

## Invariants and tests

- A cloud move is matched against `listLegalMoves()` before application.
- An invalid engine candidate cannot mutate the board and triggers fallback.
- All resulting moves still pass `chess.js` validation in `MatchController`.
- Unit tests cover valid external candidates, invalid-candidate fallback, and
  standard legal computer play.
- Live checks cover the Lichess cloud endpoint, a Club reply after `e4`, and
  invalid FEN/API input handling.

## Future self-hosted engine

An optional Stockfish WASM adapter can be added as a lazy-loaded analysis
feature. It should not replace the controller or make every browser download a
large engine. Because Stockfish WASM distributions are GPLv3, bundling one
requires an explicit third-party notice and source-distribution plan.
