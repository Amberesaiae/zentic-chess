import type { Color, Square } from "chess.js";

export type MatchStatus = "awaiting_human" | "awaiting_agent" | "agent_proposed" | "finished" | "error";
export type SessionPolicy = "propose_only" | "agent_may_play";
export type MatchMode = "computer" | "agent";
export type ComputerDifficulty = "casual" | "club" | "tactical";
export type TimeControl = "untimed" | "rapid_10" | "blitz_5";
export type ActivityKind = "human_move" | "agent_note" | "agent_proposal" | "agent_move" | "system";

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

export type MatchResult = { label: string; detail: string };

export type TrainingScenario = {
  id: "scandinavian-queen-chase";
  title: string;
  summary: string;
  prompt: string;
  fen: string;
  humanColor: Color;
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
  activity: ActivityEntry[];
  result?: MatchResult;
  training?: Pick<TrainingScenario, "id" | "title" | "summary" | "prompt">;
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
