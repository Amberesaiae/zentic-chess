# Zentic

**Conversational chess, built for agents that can see the actual board.**

Zentic is a WebMCP-native chess game where a browser agent receives the live
position, can explain the position in context, highlights legal moves, and only
makes rule-validated moves when it is Black's turn.

The implementation uses a versioned match controller, a proposal-first agent
workflow, and a visible activity record. The architecture, WebMCP contract,
and acceptance criteria are in [the foundation plan](docs/FOUNDATION-PLAN.md).

The product language is captured in [CONTEXT.md](CONTEXT.md). The externally
connected-agent decision is recorded in [ADR 0001](docs/adr/0001-external-agent-first.md),
and the reusable game-workspace rules are in [the design system](docs/DESIGN-SYSTEM.md).

## Run locally

```bash
pnpm install
./node_modules/.bin/vite --host 127.0.0.1 --port 4175
```

## WebMCP surface

- `read_match` returns the exact versioned match snapshot.
- `list_legal_moves` returns structured legal move objects for one version.
- `post_agent_note` records an agent's visible analysis or status note.
- `propose_agent_move` records an exact move and explanation without applying it.
- `commit_agent_move` applies a proposal only under the `agent_may_play` policy.

The UI remains playable without an agent. A compatible browser agent can
participate using the same versioned board state rather than visual guesswork.

## Product Flow

- **Practice computer:** a self-contained, local practice match with selectable
  side, time control, and difficulty. It never claims to be a connected agent.
- **Browser agent:** a WebMCP match with selectable side, time control, and
  move policy. The agent can read the board, write visible notes, propose a
  move, and optionally commit a validated proposal.

Every match displays player slots, clocks where selected, captured pieces, a
move record, and a setup route for starting a new configured game.

## Verify

```bash
./node_modules/.bin/vitest run
./node_modules/.bin/eslint .
./node_modules/.bin/vite build
```
