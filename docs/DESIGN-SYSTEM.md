# Zentic Design System

## Product read

Zentic is a focused chess client for a person thinking with an agent. It should
feel welcoming and serious, not like a dark developer console, a generic setup
wizard, or a Chess.com clone.

## Visual language

- **Palette:** porcelain canvas, white surfaces, deep mineral-blue structure,
  and a single vermilion action accent. Blue is environmental, never an
  indiscriminate "AI glow."
- **Board:** pale slate and mineral-blue squares; board state has stronger
  visual priority than all side information.
- **Type:** Manrope is the interface face; DM Mono is restricted to notation
  and compact metadata. Headlines use an editorial rhythm only on setup.
- **Shape:** 8px to 16px rounded structural surfaces, with borders used before
  shadows. Buttons, cards, and board frame share this scale.
- **Density:** the landing screen is spacious and art-directed; game setup is
  calm; the match screen becomes denser only where live information is useful.

## Landing art direction

The landing surface uses a local, original 3D chess scene in an
aquarium-gallery setting (`public/assets/zentic-aquarium-chess.png`). It is a
product introduction, not a replacement for the game board. The visual role is
to establish materiality, focus, and calm before a player makes a decision.

- Keep the art framed on large screens and stacked below the product story on
  small screens.
- Crop the image to the chess objects only. Generated placeholder UI must never
  become visible in the shipped scene.
- Use slow water-light motion only as a reduced-motion-safe atmospheric layer.
- Do not add fish, game neon, floating particles, or decorative metrics; the
  aquarium reference is about glass, light, and depth rather than a theme.

## Hierarchy rules

1. Give each screen one real heading. Setup uses `New game`; a match names the
   active game and whose turn it is.
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
| `LobbyIntro` | Landing story, value proposition, and direct path to configuration |
| `LobbyScene` | Isolated 3D chess art and reduced-motion-safe water-light layer |
| Setup selectors | Choose a concrete game configuration with visible selected state |
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
