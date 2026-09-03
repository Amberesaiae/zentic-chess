# Hackathon Demo

## One-sentence pitch

**Zentic is a chess table where an agent can see the real board, teach from the
position, and act only through visible, rule-checked commands.**

## Three-minute run

1. Open Zentic and choose **Browser agent**.
2. Start an untimed game as White with **Suggest moves** selected.
3. Make `e4`.
4. In a compatible browser agent client, ask the agent to play Black and
   explain its move.
5. Show the agent calling `read_match` and `list_legal_moves`.
6. Show its note and proposal appear in Zentic.
7. Apply the proposal as the human. Point out that the board and record change
   together.
8. Make another move, then show an old-version proposal being rejected.
9. Ask: “Teach me the Scandinavian Defence and put me under pressure.”
10. The agent explains that the board will be replaced, receives confirmation,
    and starts the curated queen-chase training position.

## What judges should notice

- WebMCP is essential, not decorative: it gives the agent legal, versioned
  board state instead of pixels.
- The agent cannot make an illegal or stale move.
- The player controls commitment under the default policy.
- Voice is an optional interface to the same action layer, not a separate fake
  chat demo.

## Demo fallback

If no compatible browser-agent host is available, use **Practice computer** to
demonstrate a complete legal game, then explain the WebMCP contract from
`docs/WEBMCP.md`. Do not simulate an external agent connection or claim the
local practice opponent is a language model.
