# Zentic

Zentic is a shared chess table for a human and an agent that can inspect the
actual game state. It is built to make agent chess assistance observable,
bounded, and useful: the agent reads the live position, sees legal moves,
leaves a concise note, proposes a move, and cannot bypass the game rules.

## What is working

- A playable local chess match with legal move validation, clocks, board
  orientation, move history, and a deterministic practice opponent.
- Browser-agent mode using WebMCP tools for exact game-state access.
- Versioned agent proposals: a move is tied to one board position and becomes
  invalid if the position changes.
- A curated Scandinavian Defence training scenario.
- An optional voice-coach integration boundary using OpenAI Realtime over
  WebRTC. It is disabled safely until a server-side key is configured.

## What Zentic is not

- A chess engine or a claim that its local practice opponent is Stockfish.
- A general chatbot placed beside a chessboard.
- A production multiplayer service, account system, or matchmaking platform.

## Quick start

```bash
pnpm install
pnpm dev
```

Open the URL reported by Vite, usually `http://127.0.0.1:4174/`.

## Voice coach

Voice is optional and requires an OpenAI API key. Keep the key on the server;
never put it in `VITE_*` variables or browser code.

```bash
export OPENAI_API_KEY="your_key"
pnpm dev:voice
pnpm dev
```

The Vite server proxies `/api` to the voice server at port `8787`. See
[Voice setup](docs/VOICE.md) and [Security](docs/SECURITY.md) before deploying.

## Project guides

- [Architecture](docs/ARCHITECTURE.md)
- [WebMCP contract](docs/WEBMCP.md)
- [Voice integration](docs/VOICE.md)
- [Demo script](docs/DEMO.md)
- [Design system](docs/DESIGN-SYSTEM.md)
- [Contributing](CONTRIBUTING.md)
- [Domain glossary](CONTEXT.md)

## Verify

```bash
pnpm lint
pnpm test
pnpm build
```

If the `pnpm` wrapper reports an ignored `esbuild` build-script policy on this
machine, use the checked-in local binaries instead:

```bash
./node_modules/.bin/eslint .
./node_modules/.bin/vitest run
./node_modules/.bin/tsc -b && ./node_modules/.bin/vite build
```

## License

Zentic is available under the [MIT License](LICENSE).
