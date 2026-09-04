# Zentic Design System

## Product read

Zentic is a focused chess client for a person thinking with an agent. It should
feel welcoming and serious, not like a dark developer console, a generic setup
wizard, or a Chess.com clone.

## Visual language

- **Palette:** porcelain canvas, white surfaces, deep mineral-blue structure,
  and a single vermilion action accent used for every primary action on the
  page. Blue is environmental, never an indiscriminate "AI glow."
- **Board:** pale slate and mineral-blue squares; board state has stronger
  visual priority than all side information.
- **Type:** Manrope is the interface face; DM Mono is restricted to notation
  and compact metadata. Headlines use an editorial rhythm only on setup.
- **Shape:** 8px to 16px rounded structural surfaces, with borders used before
  shadows. Buttons, cards, and board frame share this scale.
- **Density:** the landing screen is spacious and art-directed; game setup is
  calm; the match screen becomes denser only where live information is useful.
- **Theme:** one locked light theme. No section inverts, and `color-scheme` is
  declared so native controls follow.

## Landing art direction

The landing surface leads with the product itself: a real, rule-backed board
showing a position an agent has just read, next to the proposal it made. The
visitor sees what a proposal is, approves or declines it, and watches the board
change before deciding to start anything.

- The board is the first object on the page, on the left, at full weight. The
  message and the primary action sit to its right.
- The demonstration is labelled as a demonstration. Its position and its
  resulting move are validated by `chess.js`, never drawn.
- One still image is used, `public/assets/zentic-queen-study.png`, and only to
  carry the section that states what Zentic is not.
- No fake product screenshots built from `div` elements, and no 3D art inside a
  playable board.

## Hierarchy rules

1. Give each screen one real heading. The landing states the product claim once
   in an `h1`; a match names the active game and whose turn it is.
2. Never use build numbers, hashes, version labels, move counts, or all-caps
   slashes as decorative hierarchy.
3. Labels describe a decision (`Opponent`, `Your pieces`, `Time control`), not
   a generic numbered wizard step.
4. Icons earn their place by representing an action; icon-only controls need
   an accessible name and tooltip.
5. The board is primary. The activity rail records evidence and conversation;
   it must not compete with the position.

## Components

| Component | Purpose |
| --- | --- |
| `Button` | Shared semantic action surface, including a Radix `Slot` composition path |
| `SiteNav` | Single-line landing navigation and the one primary action |
| `Hero` | The claim, the primary action, and the live demonstration beside them |
| `ProposalDemo` | Real board plus a working apply and decline review step |
| `MoveFlow` | The three moments of a move, on one rule |
| `AgentLimits` | What an agent may and may not do, stated as two columns |
| `HonestScope` | What Zentic is not, paired with the queen study image |
| `SetupPanel` | Choose a concrete game configuration with visible selected state |
| `LiveBoard` | Rule-backed board with selection, legal destinations, last move, and proposal overlays |
| `PlayerSlot` | Human and opponent identity, captures, and clock state |
| `ActivityRail` | Ordered game record, proposal review, and agent connection surface |
| `VoiceCoach` | Explicit opt-in microphone control with visible transcript status |

## Accessibility

- Keyboard move selection and click-to-move are both supported.
- Interactive controls receive high-contrast focus rings.
- Voice never requests microphone permission until the user presses `Talk`.
- State changes are exposed through concise live regions.
- Layouts stack below the desktop breakpoint without horizontal scrolling.

## Explicit rejections

- No generic AI sparkles, fake thinking indicators, gradient atmosphere, or
  anonymous statistics.
- No dark hacker aesthetic or technical metadata posed as product hierarchy.
- No agent action presented as real unless it reached the validated controller.
- No 3D art inside the playable board: gameplay needs legible coordinates,
  stable interaction, and rule-backed move state above visual spectacle.
