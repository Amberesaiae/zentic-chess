# Zentic Match Table Design System

## Design Read

Zentic is a high-trust game workspace for a player working with a browser
agent. It should feel like a modern tournament analysis board and score sheet,
not an AI landing page, content dashboard, or Chess.com imitation.

## Design Dials

| Dial | Value | Reason |
| --- | --- | --- |
| Design variance | 4/10 | Chess rules and notation need calm, repeatable structure. |
| Motion intensity | 2/10 | Moves should be tactile; decoration must not compete with thinking. |
| Visual density | 8/10 | The user needs board, move context, proposal, and activity at once. |

## Design Principles

1. **The position is primary.** The board is the largest object and receives
   the strongest contrast.
2. **Every signal has a factual source.** Never show "live", a clock, rating,
   connected agent, or thinking state unless it is true in the session.
3. **Activity is evidence.** Agent behavior appears as time-ordered events,
   not persuasive personality copy.
4. **Square geometry rules.** Use square corners, thin rules, and spacing
   derived from board increments. Avoid floating rounded-card collections.
5. **One accent, several meanings through form.** The accent identifies an
   actionable proposal. Different board highlights use patterns and labels,
   not color alone.
6. **Motion confirms state change.** Piece movement, a proposal appearing, and
   a completed move can animate. No ambient movement or fake thinking loops.

## Foundations

### Typography

- Interface and notation: `Manrope` initially, then self-host before release.
- Fixed-width notation and timestamps: `DM Mono` initially, then self-host.
- No display serif headline in the match workspace.
- Numeric game notation uses tabular numerals.

### Palette

The current forest, bone, and amber palette can stay but becomes semantic:

| Token | Value | Use |
| --- | --- | --- |
| `--surface-canvas` | `#17211c` | Application background |
| `--surface-board-dark` | `#315a50` | Dark chess square |
| `--surface-board-light` | `#dce3d7` | Light chess square |
| `--surface-rail` | `#f2f0e9` | Activity rail |
| `--ink-primary` | `#16211c` | Primary light-surface text |
| `--ink-inverse` | `#f5f3ec` | Primary dark-surface text |
| `--accent-action` | `#d7803e` | Proposal and primary action |
| `--status-error` | `#ba4f3c` | Rejected action |
| `--rule-subtle` | `rgba(245,243,236,.18)` | Dark surface dividers |

Do not use gradients as atmosphere. Do not add a second accent color. Status
must always include text, icon, or pattern in addition to color.

### Spacing and shape

- Base spacing: 4px.
- Match grid: 8px.
- Major gutters: 24px or 32px.
- Corners: 0px across the table, rails, buttons, and controls.
- Shadows: none by default. Use a 1px rule or an inset edge to establish
  separation.

## Information Architecture

```text
Top strip
  Match identity | current turn | policy | real actions

Main table
  Board field (dominant) | activity rail (supporting)

Bottom strip
  Move navigator | selected-move details | connection diagnostics in dev only
```

The board and activity rail stack at narrow widths. The activity rail becomes a
collapsed but keyboard-accessible event list after the board, never a floating
modal over active play.

## Component Contracts

### `MatchHeader`

Displays only active facts: match name, side to move, session policy, new match,
and board flip. All actions must work and have a 24px minimum pointer target.

### `ChessBoard`

- Supports pointer and keyboard move selection.
- Announces selected square, legal destinations, check, proposal, and result.
- Uses separate visual treatments for selected square, legal target, last move,
  agent proposal, and check.
- Does not duplicate coordinate notation supplied by the chessboard primitive.

### `MoveTimeline`

- Shows numbered move pairs and allows navigation through history.
- Makes the current move explicit with text and shape, not color only.
- Supports an empty match, active match, and completed match.

### `ActivityRail`

- Uses a semantic ordered list.
- Shows actor, event type, position version, local time, and detail.
- Provides `aria-live="polite"` for new agent and move events.
- Never presents a canned suggestion as if it came from an agent.

### `MoveProposal`

- Binds to a real `proposalId` and position version.
- Shows SAN, origin/target squares, explanation, and a visible stale/rejected
  state.
- Offers only actions allowed by session policy.

### `Button`

- Variants: `primary`, `quiet`, `danger`.
- All variants have focus-visible state, disabled state, and active feedback.
- Icon-only buttons have an accessible name and a 32px target minimum.

## Accessible Interaction Requirements

- Keyboard users can select a piece and a legal target without drag.
- The board has a concise accessible position description.
- Game and agent status changes are announced without stealing focus.
- Focus is visible against every surface and remains logical after a move.
- Inputs have visible labels. A message form appears only if it connects to a
  real agent service.
- The interface reflows without horizontal loss at 320px and at 400% zoom.
- Contrast meets WCAG 2.2 AA for text and interactive boundaries.

## Motion Specification

- Piece move: 160ms to 220ms ease-out.
- Proposal marker: one 120ms fade/scale-in when created.
- Activity entry: one 160ms slide-in from the rail edge.
- Reduced motion: all nonessential transitions reduce to 0ms.

## Explicit Rejections

- No big marketing headline in the active match view.
- No brain avatars, sparkle icons, generic status pills, or chat bubbles.
- No decorative gradients, glass cards, or untethered shadows.
- No hidden behavior behind static settings controls.
- No fake agent text or prewritten "thinking" status.
