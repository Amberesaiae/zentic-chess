# Contributing to Zentic

## Setup

```bash
pnpm install
pnpm dev
```

Run all checks before opening a pull request:

```bash
pnpm lint
pnpm test
pnpm build
```

## Engineering rules

- Do not add a chess mutation outside `MatchController`.
- Add a test for every controller state transition or permission rule.
- Keep agent actions in `agent-actions.ts`; adapters must not duplicate policy.
- Do not add provider keys, fake online state, or scripted agent messages.
- Preserve the proposal-first default for agent moves.
- Update the matching guide in `docs/` when changing a public tool, voice
  behavior, setup step, or demo flow.

## Pull requests

Describe the user-facing change, validation performed, and any new provider or
security requirement. Include screenshots for meaningful visual changes.
