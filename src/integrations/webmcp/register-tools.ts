import type { MatchController } from "../../domain/chess/match-controller";
import { createAgentActions } from "../../domain/chess/agent-actions";

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
  readOnly?: boolean;
  execute: (input: Record<string, unknown>) => unknown;
};

type ModelContext = {
  registerTool: (tool: unknown, options?: { signal?: AbortSignal }) => Promise<void>;
};

declare global {
  interface Document {
    modelContext?: ModelContext;
  }
}

const versionSchema = {
  type: "object",
  properties: { expectedVersion: { type: "number" } },
  required: ["expectedVersion"],
  additionalProperties: false,
};

export function registerMatchTools(controller: MatchController, onStatus: (status: "unavailable" | "registering" | "ready" | "error") => void) {
  if (!document.modelContext) {
    onStatus("unavailable");
    return () => undefined;
  }

  const abortController = new AbortController();
  const actions = createAgentActions(controller);
  const tools: ToolDefinition[] = [
    {
      name: "read_match",
      description: "Read the exact live Zentic match, including FEN, position version, turn, policy, history, proposal, and result.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.readMatch,
    },
    {
      name: "get_agent_capabilities",
      description: "Read the exact coaching actions currently available, including whether a move can be proposed or committed and which actions require human confirmation.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getCapabilities,
    },
    {
      name: "list_legal_moves",
      description: "List structured legal moves for the exact match position version. Read the match first, then pass that version.",
      inputSchema: versionSchema,
      execute: (input) => actions.listLegalMoves(number(input.expectedVersion)),
    },
    {
      name: "list_match_activity",
      description: "Read the visible game and coaching events that occurred after a position version. Use this to catch up without reinterpreting the board history.",
      inputSchema: {
        type: "object",
        properties: { afterPositionVersion: { type: "number" } },
        additionalProperties: false,
      },
      execute: (input) => actions.listActivity(optionalNumber(input.afterPositionVersion)),
    },
    {
      name: "export_match_pgn",
      description: "Return the current portable PGN move record. This is read-only and does not alter the match.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getPgn,
    },
    {
      name: "post_agent_note",
      description: "Add a concise, visible analysis or status note to the shared match activity rail for the current position.",
      inputSchema: {
        type: "object",
        properties: {
          expectedVersion: { type: "number" },
          text: { type: "string" },
          kind: { type: "string", enum: ["analysis", "status"] },
        },
        required: ["expectedVersion", "text", "kind"],
        additionalProperties: false,
      },
      execute: (input) => {
        return actions.addNote(number(input.expectedVersion), string(input.text), input.kind === "status" ? "status" : "analysis");
      },
    },
    {
      name: "propose_agent_move",
      description: "Propose the agent's chosen legal move for the exact live position. Include a concise explanation. This does not apply the move.",
      inputSchema: {
        type: "object",
        properties: {
          expectedVersion: { type: "number" },
          from: { type: "string" },
          to: { type: "string" },
          promotion: { type: "string" },
          explanation: { type: "string" },
        },
        required: ["expectedVersion", "from", "to", "explanation"],
        additionalProperties: false,
      },
      execute: (input) => actions.proposeMove({
        expectedVersion: number(input.expectedVersion),
        from: string(input.from) as never,
        to: string(input.to) as never,
        promotion: optionalString(input.promotion),
        explanation: string(input.explanation),
      }),
    },
    {
      name: "commit_agent_move",
      description: "Apply a previously proposed agent move only when this match policy permits agent commits and the proposal still matches the live position.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { proposalId: { type: "string" }, expectedVersion: { type: "number" } },
        required: ["proposalId", "expectedVersion"],
        additionalProperties: false,
      },
      execute: (input) => {
        return actions.commitProposedMove(string(input.proposalId), number(input.expectedVersion));
      },
    },
    {
      name: "withdraw_agent_proposal",
      description: "Withdraw the currently pending agent proposal when it is no longer appropriate. This does not change the board and lets the agent propose a better move.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { proposalId: { type: "string" } },
        required: ["proposalId"],
        additionalProperties: false,
      },
      execute: (input) => actions.withdrawProposal(string(input.proposalId)),
    },
    {
      name: "list_training_scenarios",
      description: "List the curated chess lessons that Zentic can safely place on the board. Use this before suggesting a lesson.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.availableTraining,
    },
    {
      name: "start_training_scenario",
      description: "Start a curated chess training position only after the user asks to begin it. This replaces the current board, so first explain the scenario and obtain confirmation in conversation.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { scenarioId: { type: "string", enum: ["scandinavian-queen-chase"] } },
        required: ["scenarioId"],
        additionalProperties: false,
      },
      execute: (input) => actions.startTrainingScenario(string(input.scenarioId) as "scandinavian-queen-chase"),
    },
  ];

  onStatus("registering");
  void Promise.all(tools.map((tool) => document.modelContext!.registerTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: { readOnlyHint: tool.readOnly ?? true },
    execute: async (input: Record<string, unknown>) => JSON.stringify(tool.execute(input)),
  }, { signal: abortController.signal }))).then(
    () => onStatus("ready"),
    () => onStatus("error"),
  );

  return () => abortController.abort();
}

function string(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected a string input.");
  return value;
}

function optionalString(value: unknown) {
  return value === undefined ? undefined : string(value);
}

function number(value: unknown) {
  if (typeof value !== "number") throw new Error("Expected a numeric input.");
  return value;
}

function optionalNumber(value: unknown) {
  return value === undefined ? undefined : number(value);
}
