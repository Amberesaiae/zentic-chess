# ADR 0001: Treat the Browser Agent as an External Participant

## Status

Accepted

## Context

Zentic needs a credible WebMCP-native interaction. The initial prototype used
an in-page opponent panel with scripted answers and a local move heuristic.
That made the product look conversational without providing a model-backed
conversation or an agent-selected move.

There are two possible directions:

1. Build an in-app model chat experience first.
2. Treat a compatible browser agent as the first-class agent participant.

The first option requires provider credentials, a backend, streaming UX, and
clear disclosure of model ownership. It would also make WebMCP secondary to an
internal integration. The second option makes the hackathon technology central
and lets the product demonstrate a precise, inspectable agent boundary.

## Decision

Zentic will first treat a browser agent as an external participant. The human
talks to the agent in a compatible client. Zentic exposes a live WebMCP match
surface and records the agent's verified actions in the match table.

The primary product UI will use an activity rail and proposal workflow, not an
in-app chat pane that pretends to connect to a model.

## Consequences

### Positive

- WebMCP is necessary to the primary experience.
- The product does not make false claims about model capability or connection.
- Agent reads, notes, proposals, and moves can be made visible and auditable.
- The chess domain stays independent of any one model provider.

### Negative

- The person needs a compatible agent client beside the Zentic tab.
- The first release does not offer an all-in-one chat experience.
- The activity rail must clearly guide users who have not connected an agent.

## Follow-up

An in-app provider may be added later only as an `OpponentService` adapter that
uses the same proposal and match-command boundaries.
