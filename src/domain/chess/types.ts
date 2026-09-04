import type { Color, Square } from "chess.js";

export type MatchStatus = "awaiting_human" | "awaiting_agent" | "agent_proposed" | "finished" | "error";
export type SessionPolicy = "propose_only" | "agent_may_play";
export type MatchMode = "computer" | "agent";
export type ComputerDifficulty = "casual" | "club" | "tactical";
export type TimeControl = "untimed" | "rapid_10" | "blitz_5";
export type ActivityKind = "human_move" | "agent_note" | "agent_proposal" | "agent_move" | "decision_receipt" | "consent" | "system";

export type MoveRecord = {
  id: string;
  ply: number;
  number: number;
  color: Color;
  san: string;
  from: Square;
  to: Square;
  promotion?: string;
  captured?: string;
};

export type LegalMove = Pick<MoveRecord, "san" | "from" | "to" | "promotion" | "captured"> & {
  givesCheck: boolean;
};

export type AgentProposal = {
  id: string;
  move: LegalMove;
  explanation: string;
  positionVersion: number;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  actor: "human" | "agent" | "system";
  kind: ActivityKind;
  positionVersion: number;
  createdAt: string;
  title: string;
  detail?: string;
  move?: Pick<MoveRecord, "san" | "from" | "to">;
};

export type McpTraceEntry = {
  id: string;
  tool: string;
  positionVersion: number;
  status: "complete" | "failed";
  createdAt: string;
};

export type CharterAuthority = "explain" | "propose" | "one_move";

export type PlayCharter = {
  objective: string;
  constraints: string[];
  authority: CharterAuthority;
  updatedAt: string;
};

export type DecisionReceipt = {
  id: string;
  proposalId: string;
  positionVersion: number;
  objective: string;
  constraints: string[];
  rationale: string;
  toolEvidence: string[];
  status: "proposed" | "consented" | "applied" | "withdrawn";
  createdAt: string;
};

export type MoveConsent = {
  proposalId: string;
  positionVersion: number;
  grantedAt: string;
};

export type MatchResult = { label: string; detail: string };

export type TrainingScenarioId = "scandinavian-queen-chase" | "italian-central-break" | "knight-fork" | "mate-net";

export type TrainingScenario = {
  id: TrainingScenarioId;
  title: string;
  summary: string;
  category: "opening" | "tactics" | "checkmate";
  prompt: string;
  fen: string;
  humanColor: Color;
  objective: string;
  hints: string[];
  solution: { from: Square; to: Square; san: string };
  success: string;
};

export type TrainingProgress = Pick<TrainingScenario, "id" | "title" | "summary" | "category" | "prompt" | "objective"> & {
  hintLevel: number;
  completed: boolean;
};

export type MatchState = {
  id: string;
  fen: string;
  history: MoveRecord[];
  positionVersion: number;
  humanColor: Color;
  agentColor: Color;
  mode: MatchMode;
  difficulty: ComputerDifficulty;
  timeControl: TimeControl;
  clocks: { w: number | null; b: number | null };
  turn: Color;
  status: MatchStatus;
  sessionPolicy: SessionPolicy;
  proposedMove?: AgentProposal;
  playCharter: PlayCharter;
  decisionReceipts: DecisionReceipt[];
  activeConsent?: MoveConsent;
  activity: ActivityEntry[];
  mcpTrace: McpTraceEntry[];
  result?: MatchResult;
  training?: TrainingProgress;
};

export type MatchConfig = {
  mode: MatchMode;
  humanColor: Color;
  difficulty: ComputerDifficulty;
  timeControl: TimeControl;
  sessionPolicy: SessionPolicy;
};

export const TIME_CONTROLS: Record<TimeControl, { label: string; seconds: number | null; detail: string }> = {
  untimed: { label: "No clock", seconds: null, detail: "Practice without a timer" },
  rapid_10: { label: "10 min", seconds: 600, detail: "10 minutes each" },
  blitz_5: { label: "5 min", seconds: 300, detail: "5 minutes each" },
};

export type MatchErrorCode = "stale_position" | "wrong_turn" | "illegal_move" | "proposal_missing" | "policy_denied";

export class MatchError extends Error {
  constructor(public readonly code: MatchErrorCode, message: string) {
    super(message);
    this.name = "MatchError";
  }
}
