# Deployment

## Production server

After `pnpm build`, `pnpm start` serves the React single-page application and
the `/api` routes from one Node process. The default port is `8787`; set
`VOICE_PORT` to change it.

```bash
pnpm install --frozen-lockfile
pnpm build
export OPENAI_API_KEY="your_key"
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
a Render Blueprint or create a web service from the repository, then add a
secret `OPENAI_API_KEY` in the Render dashboard environment settings. The key
is intentionally not stored in the Blueprint.

## Production checklist

- Set `OPENAI_API_KEY` only in the deployment secret manager.
- Use HTTPS; browser microphone access requires a secure context outside local
  development.
- Set a stable, privacy-preserving user identifier for Realtime sessions before
  introducing accounts.
- Add server-owned match persistence and authorization before allowing
  multi-user voice sessions.
- Respect Lichess API limits. Zentic already serializes cloud-evaluation
  requests and caches each FEN for 60 seconds.
