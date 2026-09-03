# Zentic Foundation Plan

## 1. Product Decision

Zentic is a shared chess table where a person plays chess and a browser agent
can inspect, discuss, propose, and play moves through WebMCP.

It is not an in-app chatbot pretending to be a model. The person talks to
their agent in Codex, ChatGPT, or another compatible client. Zentic is the
trusted game surface both participants share.

### The problem

Browser agents can see a visual chessboard but cannot reliably infer the exact
position, legal moves, or result from pixels. Human players also cannot tell
whether an agent understood the live board or why it made a move.

### The promise

Zentic turns the chessboard into an inspectable interface:

- The agent reads the exact live position and legal move set.
- The agent proposes a move and explains it in the context of that position.
- Zentic validates the move, prevents stale writes, then applies it visibly.
- The human sees an audit trail of what the agent read, proposed, and played.

### Non-goals for the first release

- Build a general-purpose chat application.
- Claim that Zentic itself runs a language model.
- Simulate thinking with a local keyword responder.
- Clone Chess.com, Lichess, or their visual identities.
- Add matchmaking, accounts, ratings, or multiplayer networking.

## 2. Primary User Flow

### Human and external agent

1. A person opens Zentic and starts a match as White.
2. The person opens a compatible agent client and asks: "Play Black in this
   Zentic match. Explain your moves before committing them."
3. The agent calls `read_match` and `list_legal_moves` through WebMCP.
4. The person plays a White move directly on Zentic.
5. Zentic records the move, increments the position version, and changes match
   status to `awaiting_agent`.
6. The agent reads the new state, posts a short note, and submits a proposed
   Black move with its expected position version.
7. Zentic displays the proposal on the board and in the activity rail.
8. The human can accept the proposal, or the agent can commit it only where
   the session policy permits automatic agent moves.
9. Zentic validates the version, side to move, and chess legality before the
   move is applied.

### Honest fallback without an external agent

The app remains a functional local chessboard. It can offer a clearly labeled
"practice opponent" adapter later, but must never display that adapter as a
connected conversational agent.

## 3. Product Surfaces

### Match table

The board is the product. It should occupy the main visual field and support:

- click-to-move and drag-to-move;
- selected-square and legal-target affordances;
- last move, agent proposal, check, and analysis highlights with distinct
  visual meanings;
- board orientation and accessibility labels;
- promotion selection;
- match result and restart flow.

### Match rail

The secondary rail is not a chatbot. It is a chronological activity surface.
Each item identifies actor, action, position version, timestamp, and optional
reasoning:

```text
ORION  READ POSITION     v12
        32 legal replies found.

ORION  PROPOSED ...c5    v12
        Challenges your centre before development locks in.

YOU    PLAYED Nf3        v13
```

The proposed move is visually tied to board squares and has explicit controls:
`Apply move`, `Ask in agent client`, and `Dismiss`.

### Compact match control strip

Only controls with real behavior appear:

- player colour;
- turn and game result;
- move count;
- new match;
- board flip;
- session policy: `agent proposes` or `agent may play`.

Clocks, rating, settings, and live indicators are omitted until implemented.

## 4. UX Direction

### Design principle

Make Zentic feel like a physical analysis table, not an AI landing page.
Chess creates the visual language: square geometry, move notation, thin rules,
paper analysis slips, and a visible record of decisions.

### Remove from the current concept

- Marketing headline inside the match view.
- "Not a screenshot" and tool-count copy aimed at judges.
- A generic brain avatar and fake "LIVE" status.
- Static 10-minute controls, settings icon, ratings, and player chips.
- Canned action buttons that imply an actual conversation.

### Keep and evolve

- Forest, paper, and amber can remain, but use them structurally rather than
  decoratively.
- The move ledger becomes a useful navigable move timeline.
- The cream panel becomes an activity rail, with proposals that bind directly
  to board state.
- Typography should favor legible game notation and compact analysis over a
  large editorial campaign headline.

### State-specific interaction design

| Match state | Board behavior | Activity rail behavior |
| --- | --- | --- |
| `awaiting_human` | White's legal targets are available | Shows latest agent move and reason |
| `awaiting_agent` | Board is read-only | Shows "agent can read vN" instruction |
| `agent_proposed` | Proposed origin and target are marked | Shows proposal, explanation, apply/dismiss |
| `applying_move` | Board is briefly locked | Shows mutation in progress |
| `finished` | Board remains inspectable | Shows result, final sequence, new match |
| `error` | Last valid board remains available | Shows a recoverable plain-language error |

## 5. Architecture

### Layering

```text
React features
  Board | Match rail | Controls | Activity timeline
        |
Application layer
  Match controller | Commands | State machine | Session policy
        |
Domain layer
  Match state | Chess engine port | Events | Validation | Versioning
        |
Adapters
  chess.js engine | WebMCP transport | Local storage | Optional opponent
```

### Directory structure

```text
src/
  domain/
    chess/
      types.ts
      chess-engine.ts
      chessjs-engine.ts
      match-reducer.ts
      match-events.ts
      match-selectors.ts
  application/
    match-controller.ts
    match-commands.ts
    session-policy.ts
  integrations/
    webmcp/
      schemas.ts
      register-tools.ts
      tool-handlers.ts
  features/
    board/
    activity/
    match-controls/
  components/ui/
  hooks/
  lib/
```

### Serializable match state

```ts
type MatchStatus =
  | "awaiting_human"
  | "awaiting_agent"
  | "agent_proposed"
  | "applying_move"
  | "finished"
  | "error";

type MatchState = {
  id: string;
  fen: string;
  history: MoveRecord[];
  positionVersion: number;
  humanColor: "w" | "b";
  agentColor: "w" | "b";
  status: MatchStatus;
  proposedMove?: MoveProposal;
  activity: ActivityEntry[];
  result?: MatchResult;
  sessionPolicy: "propose_only" | "agent_may_play";
};
```

The React view must render this state. It must not hold a second, competing
history or message state.

### Match commands

Commands are the only allowed mutations:

- `submitHumanMove({ from, to, promotion })`
- `proposeAgentMove({ from, to, promotion, expectedVersion, explanation })`
- `commitProposedMove({ proposalId, expectedVersion })`
- `dismissProposal({ proposalId })`
- `postAgentNote({ expectedVersion, text, kind })`
- `resetMatch({ humanColor, sessionPolicy })`

Each command validates turn, expected position version, active session policy,
and chess legality before emitting an immutable domain event.

### Why versioning matters

An agent can read position version 12, while the human makes a move and moves
the match to version 13. A delayed agent proposal for version 12 must fail
without changing the board. The activity rail records the stale proposal and
asks the agent to read the new state.

## 6. WebMCP Contract

WebMCP tools describe and mutate the same match controller used by the React
UI. They do not reach into component state or call `setState` directly.

### Read tools

```ts
read_match() => {
  matchId,
  fen,
  positionVersion,
  status,
  turn,
  humanColor,
  agentColor,
  history,
  proposedMove,
  result
}

list_legal_moves({ expectedVersion }) => {
  positionVersion,
  moves: [{ san, from, to, promotion?, isCapture, givesCheck }]
}
```

### Agent communication tools

```ts
post_agent_note({ expectedVersion, text, kind }) => {
  activityId,
  positionVersion
}

propose_agent_move({
  expectedVersion,
  from,
  to,
  promotion?,
  explanation
}) => {
  proposalId,
  san,
  positionVersion,
  status: "agent_proposed"
}
```

### Mutation tools

```ts
commit_agent_move({ proposalId, expectedVersion }) => {
  appliedMove,
  positionVersion,
  status
}
```

`commit_agent_move` is marked non-read-only. It is unavailable under
`propose_only` policy; the human applies the visible proposal using the UI.

### Contract rules

- Every action uses `expectedVersion`.
- Every mutation returns the resulting version and status.
- Legal moves are structured objects, never display-only strings.
- Tool errors are typed: `stale_position`, `wrong_turn`, `illegal_move`,
  `proposal_missing`, and `policy_denied`.
- The app visibly records successful agent reads, notes, proposals, and moves.

## 7. Agent Integration Strategy

### Phase one: external browser agent

This is the hackathon release. The page exposes WebMCP. The person holds the
conversation with the external agent client. Zentic visualizes its verified
actions and explanations.

### Phase two: optional in-app model provider

If we add in-app conversation later, it is a separate `OpponentService` that
uses a server-side provider adapter. It receives a `MatchSnapshot` and returns
`AgentNote` or `MoveProposal`. It never bypasses the match controller.

```ts
interface OpponentService {
  respond(input: MatchSnapshot, request: AgentRequest): Promise<AgentResponse>;
}
```

This prevents a model integration from contaminating chess rules, UI state, or
WebMCP behavior.

## 8. Implementation Plan

### Phase 0: establish quality gates

- Add ESLint flat configuration and formatting rules.
- Add Vitest and tests for chess rules, reducer transitions, and tool schemas.
- Add Playwright smoke coverage for a human move, agent proposal, and stale
  proposal rejection.
- Replace the current monolithic hook only after domain tests exist.

### Phase 1: domain and application core

- Introduce `MatchState`, events, reducer, selectors, and controller.
- Wrap `chess.js` behind a small engine port.
- Replace independent `fen`, move ledger, highlights, and agent message state
  with a single state source.
- Implement proposal and version validation.

### Phase 2: real WebMCP boundary

- Implement JSON schemas and explicit result/error types.
- Register typed tools through a dedicated integration module.
- Surface WebMCP connection status for development, not as permanent marketing
  copy.
- Record tool-originated actions in the activity timeline.

### Phase 3: rebuild match UX

- Replace the landing-page layout with board, compact controls, and timeline.
- Add board affordances and proposal overlays.
- Add activity states, empty states, failures, and finished-match state.
- Delete any control or status that is not backed by behavior.

### Phase 4: demo polish

- Add a guided first-match script in documentation, not fake in-product chat.
- Record a video: agent reads board, explains a move, proposes it, user
  approves, move applies, stale proposal is rejected.
- Add deployment, public repository, and licensing checks.

## 9. Acceptance Criteria

The rebuilt foundation is ready when:

- A person can play a legal move with click or drag interaction.
- The app has one serializable match state and no duplicated move history.
- An external agent can read a structured position and structured legal moves.
- The agent can submit an exact move of its own choosing.
- Stale, illegal, and out-of-turn agent mutations are rejected safely.
- Every agent note, proposal, and applied move is visible in the timeline.
- The UI never claims an agent is connected, thinking, or conversational when
  that is not true.
- Unit, integration, and browser smoke tests cover the primary flow.
- The board remains functional and legible on desktop and mobile.

## 10. Current Decision Log

| Decision | Reason |
| --- | --- |
| External agent first | It makes WebMCP central and avoids dishonest fake chat. |
| Proposal before mutation | It creates human trust and an excellent demo moment. |
| Position version on every command | It prevents stale agent actions. |
| Activity rail, not chat panel | It makes agent actions inspectable and product-real. |
| `chess.js` behind an engine port | It keeps rules replaceable and testable. |
| No static game controls | A control only exists when its behavior exists. |
