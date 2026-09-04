import type { MatchController } from "../../domain/chess/match-controller";
import { createAgentActions } from "../../domain/chess/agent-actions";
import { requestCloudAnalysis } from "../analysis/cloud-analysis";
import { identifyOpening } from "../openings/opening-library";

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: object;
  readOnly?: boolean;
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
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
      name: "identify_opening",
      description: "Resolve the exact current move history against Zentic's full CC0 Lichess opening-name library. Use this instead of guessing an opening or variation name.",
      inputSchema: versionSchema,
      execute: async (input) => {
        const expectedVersion = number(input.expectedVersion);
        const state = actions.readMatch();
        if (state.positionVersion !== expectedVersion) return { error: "stale_position", message: `Read position v${state.positionVersion} before identifying the opening.` };
        return identifyOpening({ positionVersion: expectedVersion, history: state.history });
      },
    },
    {
      name: "get_agent_capabilities",
      description: "Read the exact coaching actions currently available, including whether a move can be proposed or committed and which actions require human confirmation.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getCapabilities,
    },
    {
      name: "prepare_agent_turn",
      description: "Read the exact board, current charter, allowed agent actions, and structured legal moves in one read-only preflight command. Use this before making an official move proposal.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.prepareAgentTurn,
    },
    {
      name: "get_play_charter",
      description: "Read the player's current objective, constraints, and granted level of agent authority. Respect this before proposing or committing a move.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getPlayCharter,
    },
    {
      name: "update_play_charter",
      description: "Update the player's visible chess objective, up to three constraints, and authority level. Use this only when the player explicitly states or revises their intent.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: {
          expectedVersion: { type: "number" },
          objective: { type: "string" },
          constraints: { type: "array", items: { type: "string" } },
          authority: { type: "string", enum: ["explain", "propose", "one_move"] },
        },
        required: ["expectedVersion", "objective", "authority"],
        additionalProperties: false,
      },
      execute: (input) => actions.updatePlayCharter(number(input.expectedVersion), { objective: string(input.objective), constraints: optionalStringArray(input.constraints), authority: authority(input.authority) }),
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
      name: "get_cloud_analysis",
      description: "Request cached Lichess cloud analysis for the exact current position. Returns depth and UCI principal variations when available, otherwise a truthful unavailable result. This never changes the board.",
      inputSchema: versionSchema,
      execute: async (input) => {
        const expectedVersion = number(input.expectedVersion);
        const state = actions.readMatch();
        if (state.positionVersion !== expectedVersion) return { error: "stale_position", message: `Read position v${state.positionVersion} before requesting analysis.` };
        return { positionVersion: expectedVersion, analysis: await requestCloudAnalysis(state.fen) };
      },
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
      name: "create_decision_receipt",
      description: "Turn the current agent proposal into a visible decision receipt. It records the player's charter, the move rationale, and actual successful WebMCP tools used on this position. Create this before asking the player to apply or consent to a move.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { expectedVersion: { type: "number" }, proposalId: { type: "string" }, rationale: { type: "string" } },
        required: ["expectedVersion", "proposalId"],
        additionalProperties: false,
      },
      execute: (input) => actions.createDecisionReceipt({ expectedVersion: number(input.expectedVersion), proposalId: string(input.proposalId), rationale: optionalString(input.rationale) }),
    },
    {
      name: "get_decision_receipts",
      description: "Read the visible, position-bound decision receipts and their consent status. This is the reviewable record of why an agent action was requested.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getDecisionReceipts,
    },
    {
      name: "grant_move_consent",
      description: "Grant the agent authority to apply one exact, receipt-backed proposal. This requires the player's charter authority to be one_move and never grants future moves.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { proposalId: { type: "string" }, expectedVersion: { type: "number" } },
        required: ["proposalId", "expectedVersion"],
        additionalProperties: false,
      },
      execute: (input) => actions.grantMoveConsent(string(input.proposalId), number(input.expectedVersion)),
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
      name: "get_training_state",
      description: "Read the active lesson objective, visible prompt, current hint level, and completion state. Returns null when no lesson is active.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      execute: actions.getTrainingState,
    },
    {
      name: "reveal_training_hint",
      description: "Reveal exactly one progressive hint for the current lesson after the learner asks for help. The hint is recorded visibly in the match activity.",
      readOnly: false,
      inputSchema: versionSchema,
      execute: (input) => actions.revealTrainingHint(number(input.expectedVersion)),
    },
    {
      name: "start_training_scenario",
      description: "Start a curated chess training position only after the user asks to begin it. This replaces the current board, so first explain the scenario and obtain confirmation in conversation.",
      readOnly: false,
      inputSchema: {
        type: "object",
        properties: { scenarioId: { type: "string", enum: ["scandinavian-queen-chase", "italian-central-break", "knight-fork", "mate-net"] } },
        required: ["scenarioId"],
        additionalProperties: false,
      },
      execute: (input) => actions.startTrainingScenario(trainingScenarioId(input.scenarioId)),
    },
  ];

  onStatus("registering");
  void Promise.all(tools.map((tool) => document.modelContext!.registerTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    annotations: { readOnlyHint: tool.readOnly ?? true },
    execute: async (input: Record<string, unknown>) => {
      try {
        const output = await tool.execute(input);
        controller.recordMcpTool(tool.name, "complete");
        return JSON.stringify(output);
      } catch (error) {
        controller.recordMcpTool(tool.name, "failed");
        throw error;
      }
    },
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

function optionalStringArray(value: unknown) {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error("Expected an array of text constraints.");
  return value;
}

function authority(value: unknown) {
  if (value === "explain" || value === "propose" || value === "one_move") return value;
  throw new Error("Expected a valid play charter authority.");
}

function trainingScenarioId(value: unknown) {
  if (value === "scandinavian-queen-chase" || value === "italian-central-break" || value === "knight-fork" || value === "mate-net") return value;
  throw new Error("Expected an available training scenario.");
}
