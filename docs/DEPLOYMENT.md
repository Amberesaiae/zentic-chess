# Deployment

## Production server

After `pnpm build`, `pnpm start` serves the React single-page application and
the `/api` routes from one Node process. The default local port is `8787`; set
`VOICE_PORT` to change it. Hosted platforms can supply the conventional
`PORT` variable, which takes precedence.

```bash
pnpm install --frozen-lockfile
pnpm build
export OPENAI_API_KEY="your_key" # needed for realtime voice
export GROQ_API_KEY="your_key"   # primary coach/chat provider
export AGENT_PROVIDER="groq"
pnpm start
```

Cloud analysis works without an OpenAI key. Voice returns a safe unavailable
response until `OPENAI_API_KEY` is present.

## Docker

```bash
docker build -t zentic-chess .
docker run --rm -p 8787:8787 -e OPENAI_API_KEY="your_key" zentic-chess
```

## Render

`render.yaml` defines the `zentic-chess` web service. Import the repository as
a Render Blueprint or create a web service from the repository. Set the
secrets exposed by the Blueprint in Render's environment settings; their
values are intentionally not stored in Git:

- `GROQ_API_KEY` for the primary coach/chat path.
- `OPENAI_API_KEY` for browser voice sessions.
- `OPENROUTER_API_KEY` and `GEMINI_API_KEY` as optional provider fallbacks.

`AGENT_PROVIDER=groq` is set as a non-secret default. Render supplies `PORT`
automatically.

## Production checklist

- Set provider API keys only in the deployment secret manager.
- Confirm `GROQ_API_KEY` is present before demoing the coach or WebMCP agent
  flows; without it, those requests return an explicit configuration error.
- Use HTTPS; browser microphone access requires a secure context outside local
  development.
- Set a stable, privacy-preserving user identifier for Realtime sessions before
  introducing accounts.
- Add server-owned match persistence and authorization before allowing
  multi-user voice sessions.
- Respect Lichess API limits. Zentic already serializes cloud-evaluation
  requests and caches each FEN for 60 seconds.
