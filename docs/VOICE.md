# Voice Coach

## Scope

The voice coach is an optional, live conversation surface for Browser agent
matches. It is designed to be conservative: it can inspect the board, explain
briefly, write a visible coaching note, and start the curated Scandinavian
scenario after confirmation. It cannot silently play a move.

## Architecture

```text
Browser microphone
  -> WebRTC connection to OpenAI Realtime
  -> browser receives tool call
  -> shared Zentic agent actions
  -> MatchController validates and renders result
```

`server.mjs` creates a short-lived client secret. The browser never receives
the permanent `OPENAI_API_KEY`.

## Local setup

1. Set an OpenAI key in the shell that starts the voice server.
2. Start the voice server.
3. Start Vite.
4. Start a Browser agent game and select **Talk** in the activity rail.

```bash
export OPENAI_API_KEY="your_key"
pnpm dev:voice
pnpm dev
```

The default ports are Vite `4174` and voice server `8787`. Set `VOICE_PORT` to
change the latter, and update the Vite proxy if you do.

## Speech behavior

- Browser microphone permission is requested only after the person presses
  `Talk`.
- The session uses noise suppression and echo cancellation from
  `getUserMedia`.
- The Realtime configuration includes chess vocabulary such as `Scandinavian
  Defense`, `Qxd5`, `FEN`, and `en passant` to reduce transcription errors.
- The interface shows the last transcript or coach response; it does not hide
  voice-triggered board actions.

## Development limits

- The checked-in configuration targets OpenAI Realtime, not OpenRouter.
- A provider key is not included in this repository.
- Realtime behavior and provider billing must be tested with a real key before
  a demo. Keep the no-key `503` response as the expected local fallback.
