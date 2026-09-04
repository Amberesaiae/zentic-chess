# Hackathon Demo

## One-sentence pitch

**Zentic is a negotiated-autonomy chess table: a player gives an agent intent
and bounded authority, then receives a visible receipt before any move happens.**

## Three-minute run

1. Open Zentic and choose **Browser agent**.
2. Start an untimed **Browser agent** game as White.
3. Set the play charter: “Attack the king; avoid queen trades; ask before every move.”
4. Make `e4`.
5. In a compatible browser agent client, ask the agent to play Black.
6. Show `read_match`, `get_play_charter`, and `list_legal_moves`.
7. Show the proposal and its decision receipt: objective, guardrails, reason,
   and real tool evidence.
8. Change the charter to **Allow one approved move**, then grant one-move
   consent for the exact proposal. Show the agent commit that move.
9. Make another move and show that the old receipt and consent cannot apply to
   the new position.

## What judges should notice

- WebMCP is essential, not decorative: it gives the agent legal, versioned
  board state instead of pixels.
- The agent cannot make an illegal or stale move.
- The player controls objective, guardrails, and exactly how much authority is granted.
- A decision receipt makes each consequential agent action reviewable.
- Voice is an optional interface to the same action layer, not a separate fake
  chat demo.

## Demo fallback

If no compatible browser-agent host is available, use **Practice computer** to
demonstrate a complete legal game, then explain the WebMCP contract from
`docs/WEBMCP.md`. Do not simulate an external agent connection or claim the
local practice opponent is a language model.
