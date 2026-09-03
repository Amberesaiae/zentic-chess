# Security and Privacy

## Secrets

- Never commit `.env`, permanent provider keys, or browser-accessible secrets.
- `OPENAI_API_KEY` belongs only in the environment of `server.mjs`.
- Do not prefix provider secrets with `VITE_`; Vite exposes those values to the
  browser bundle.
- Rotate a key immediately if it is pasted into a public issue, chat, commit,
  screenshot, or log.

## Voice data

- Audio leaves the browser only after the player presses `Talk` and grants
  microphone permission.
- The optional voice integration sends audio to the configured provider for
  real-time processing.
- Zentic currently stores no accounts, user profiles, or persistent cloud
  match history.

## Agent permissions

- Agents receive only the registered WebMCP or voice tools.
- `propose_only` is the default and requires the human to apply an agent move.
- Every mutation validates chess legality, active turn, and position version.
- Training scenarios replace the current board only after confirmation.

## Reporting a vulnerability

Do not open a public issue for a credential leak or exploitable security flaw.
Contact the repository owner privately with reproduction steps and affected
version details.
