import { Chess, type Move, type Square } from "chess.js";
import { MatchError, TIME_CONTROLS, type ActivityEntry, type AgentProposal, type LegalMove, type MatchConfig, type MatchResult, type MatchState, type MoveRecord, type SessionPolicy, type TrainingScenario } from "./types";
import { TRAINING_SCENARIOS } from "./training-scenarios";

type Listener = () => void;
type MoveInput = { from: Square; to: Square; promotion?: string };

export class MatchController {
  private chess = new Chess();
  private state: MatchState;
  private listeners = new Set<Listener>();

  constructor() {
    this.state = this.createInitialState({ mode: "computer", humanColor: "w", difficulty: "club", timeControl: "rapid_10", sessionPolicy: "propose_only" });
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot = () => this.state;

  getPgn() {
    return this.chess.pgn();
  }

  listActivity(afterPositionVersion = -1) {
    return this.state.activity.filter((entry) => entry.positionVersion > afterPositionVersion);
  }

  reset(config: MatchConfig = this.configFromState()) {
    this.chess = new Chess();
    this.state = this.createInitialState(config);
    this.emit();
  }

  startTrainingScenario(id: TrainingScenario["id"]) {
    const scenario = TRAINING_SCENARIOS[id];
    if (!scenario) throw new MatchError("illegal_move", "That training scenario is not available.");
    this.chess = new Chess(scenario.fen);
    const seconds = TIME_CONTROLS[this.state.timeControl].seconds;
    const agentColor = scenario.humanColor === "w" ? "b" : "w";
    this.state = {
      ...this.state,
      id: `training-${scenario.id}-${Date.now()}`,
      fen: this.chess.fen(),
      history: [],
      positionVersion: 0,
      humanColor: scenario.humanColor,
      agentColor,
      clocks: { w: seconds, b: seconds },
      turn: this.chess.turn(),
      status: this.chess.turn() === scenario.humanColor ? "awaiting_human" : "awaiting_agent",
      proposedMove: undefined,
      result: undefined,
      training: { id: scenario.id, title: scenario.title, summary: scenario.summary, prompt: scenario.prompt },
      activity: [{
        id: "training-start",
        actor: "system",
        kind: "system",
        positionVersion: 0,
        createdAt: new Date().toISOString(),
        title: scenario.title,
        detail: scenario.prompt,
      }],
    };
    this.emit();
  }

  setSessionPolicy(sessionPolicy: SessionPolicy) {
    if (this.state.history.length > 0) {
      throw new MatchError("policy_denied", "Start a new match before changing the agent permission policy.");
    }
    this.state = { ...this.state, sessionPolicy };
    this.emit();
  }

  tick() {
    if (this.state.timeControl === "untimed" || this.state.status === "finished" || this.state.status === "agent_proposed") return;
    const color = this.chess.turn();
    const remaining = this.state.clocks[color];
    if (remaining === null) return;
    if (remaining <= 1) {
      const winner = color === "w" ? "Black" : "White";
      this.state = { ...this.state, clocks: { ...this.state.clocks, [color]: 0 }, status: "finished", result: { label: "Time", detail: `${winner} wins on time.` } };
      this.appendActivity({ actor: "system", kind: "system", title: "Clock expired", detail: `${winner} wins on time.` });
      this.emit();
      return;
    }
    this.state = { ...this.state, clocks: { ...this.state.clocks, [color]: remaining - 1 } };
    this.emit();
  }

  submitHumanMove(input: MoveInput) {
    this.assertStatus("awaiting_human");
    this.assertTurn(this.state.humanColor);
    const move = this.applyMove(input);
    this.completeMove(move, "human", "human_move", `You played ${move.san}.`);
  }

  playComputerMove() {
    if (this.state.mode !== "computer") throw new MatchError("policy_denied", "Only a computer match can use the local practice opponent.");
    this.assertStatus("awaiting_agent");
    this.assertTurn(this.state.agentColor);
    const legal = this.listLegalMoves();
    const centre = ["e5", "d5", "f5", "c5"];
    const move = this.state.difficulty === "casual"
      ? legal.find((candidate) => centre.includes(candidate.to)) ?? legal[0]
      : legal.find((candidate) => candidate.captured) ?? legal.find((candidate) => centre.includes(candidate.to)) ?? legal[0];
    if (!move) throw new MatchError("illegal_move", "The practice computer has no legal move.");
    const applied = this.applyMove(move);
    const detail = this.state.difficulty === "tactical" ? "Local practice engine chose its strongest available tactical priority." : "Local practice computer replied from the current legal move set.";
    this.completeMove(applied, "agent", "agent_move", `Computer played ${applied.san}.`, detail);
  }

  listLegalMoves(expectedVersion?: number): LegalMove[] {
    if (expectedVersion !== undefined) this.assertVersion(expectedVersion);
    return this.chess.moves({ verbose: true }).map((move) => ({
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      captured: move.captured,
      givesCheck: move.san.includes("+"),
    }));
  }

  postAgentNote(expectedVersion: number, text: string, kind: "analysis" | "status") {
    this.assertVersion(expectedVersion);
    const detail = text.trim();
    if (!detail) throw new MatchError("illegal_move", "An agent note cannot be empty.");
    this.appendActivity({
      actor: "agent",
      kind: "agent_note",
      title: kind === "analysis" ? "Agent analysis" : "Agent status",
      detail,
    });
  }

  proposeAgentMove(input: MoveInput & { expectedVersion: number; explanation: string }): AgentProposal {
    if (this.state.mode !== "agent") throw new MatchError("policy_denied", "Switch to an agent match before submitting an agent proposal.");
    this.assertVersion(input.expectedVersion);
    this.assertStatus("awaiting_agent");
    this.assertTurn(this.state.agentColor);
    const candidate = this.listLegalMoves().find((move) => move.from === input.from && move.to === input.to && (move.promotion ?? "") === (input.promotion ?? ""));
    if (!candidate) throw new MatchError("illegal_move", "The proposed move is not legal in the live position.");
    const explanation = input.explanation.trim();
    if (!explanation) throw new MatchError("illegal_move", "A proposed move needs a short explanation.");
    const proposal: AgentProposal = {
      id: `proposal-${this.state.positionVersion}-${candidate.from}-${candidate.to}`,
      move: candidate,
      explanation,
      positionVersion: this.state.positionVersion,
      createdAt: new Date().toISOString(),
    };
    this.state = { ...this.state, status: "agent_proposed", proposedMove: proposal };
    this.appendActivity({ actor: "agent", kind: "agent_proposal", title: `Proposed ${candidate.san}`, detail: explanation, move: candidate });
    this.emit();
    return proposal;
  }

  applyProposal(proposalId: string, expectedVersion: number, actor: "human" | "agent") {
    this.assertVersion(expectedVersion);
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== proposalId) throw new MatchError("proposal_missing", "That move proposal is no longer available.");
    if (proposal.positionVersion !== this.state.positionVersion) throw new MatchError("stale_position", "That proposal belongs to an earlier board position.");
    if (actor === "agent" && this.state.sessionPolicy !== "agent_may_play") {
      throw new MatchError("policy_denied", "This match requires the human to apply agent proposals.");
    }
    const move = this.applyMove(proposal.move);
    this.completeMove(move, "agent", "agent_move", `Agent played ${move.san}.`, proposal.explanation);
  }

  dismissProposal(proposalId: string) {
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== proposalId) throw new MatchError("proposal_missing", "That move proposal is no longer available.");
    this.state = { ...this.state, status: "awaiting_agent", proposedMove: undefined };
    this.appendActivity({ actor: "human", kind: "system", title: `Dismissed ${proposal.move.san}`, detail: "The agent can read the position and propose another move." });
    this.emit();
  }

  private createInitialState(config: MatchConfig): MatchState {
    const seconds = TIME_CONTROLS[config.timeControl].seconds;
    const agentColor = config.humanColor === "w" ? "b" : "w";
    const openingStatus = config.humanColor === "w" ? "awaiting_human" : "awaiting_agent";
    return {
      id: `match-${Date.now()}`,
      fen: this.chess.fen(),
      history: [],
      positionVersion: 0,
      humanColor: config.humanColor,
      agentColor,
      mode: config.mode,
      difficulty: config.difficulty,
      timeControl: config.timeControl,
      clocks: { w: seconds, b: seconds },
      turn: "w",
      status: openingStatus,
      sessionPolicy: config.sessionPolicy,
      activity: [{
        id: "system-start",
        actor: "system",
        kind: "system",
        positionVersion: 0,
        createdAt: new Date().toISOString(),
        title: "Match ready",
        detail: config.mode === "computer" ? "Practice computer match ready." : "Open a compatible agent client to read and propose the opponent's move.",
      }],
      training: undefined,
    };
  }

  private applyMove(input: MoveInput): Move {
    try {
      const move = this.chess.move({ from: input.from, to: input.to, promotion: input.promotion ?? "q" });
      if (!move) throw new MatchError("illegal_move", "That move is not legal.");
      return move;
    } catch (error) {
      if (error instanceof MatchError) throw error;
      throw new MatchError("illegal_move", "That move is not legal in the current position.");
    }
  }

  private completeMove(move: Move, actor: "human" | "agent", kind: "human_move" | "agent_move", title: string, detail?: string) {
    const record = this.toMoveRecord(move);
    const result = this.getResult();
    const nextVersion = this.state.positionVersion + 1;
    this.state = {
      ...this.state,
      fen: this.chess.fen(),
      history: [...this.state.history, record],
      positionVersion: nextVersion,
      turn: this.chess.turn(),
      status: result ? "finished" : actor === "human" ? "awaiting_agent" : "awaiting_human",
      proposedMove: undefined,
      result,
    };
    this.appendActivity({ actor, kind, title, detail, move: record, positionVersion: nextVersion });
    this.emit();
  }

  private toMoveRecord(move: Move): MoveRecord {
    return {
      id: `move-${this.chess.history().length}-${move.from}-${move.to}`,
      ply: this.chess.history().length,
      number: Math.ceil(this.chess.history().length / 2),
      color: move.color,
      san: move.san,
      from: move.from,
      to: move.to,
      promotion: move.promotion,
      captured: move.captured,
    };
  }

  private getResult(): MatchResult | undefined {
    if (!this.chess.isGameOver()) return undefined;
    if (this.chess.isCheckmate()) return { label: "Checkmate", detail: this.chess.turn() === "w" ? "Black wins." : "White wins." };
    if (this.chess.isStalemate()) return { label: "Draw", detail: "Stalemate." };
    if (this.chess.isThreefoldRepetition()) return { label: "Draw", detail: "Threefold repetition." };
    if (this.chess.isInsufficientMaterial()) return { label: "Draw", detail: "Insufficient material." };
    return { label: "Draw", detail: "Fifty-move rule." };
  }

  private appendActivity(entry: Omit<ActivityEntry, "id" | "positionVersion" | "createdAt"> & Partial<Pick<ActivityEntry, "positionVersion">>) {
    const activity: ActivityEntry = {
      id: `activity-${this.state.positionVersion}-${this.state.activity.length}`,
      positionVersion: entry.positionVersion ?? this.state.positionVersion,
      createdAt: new Date().toISOString(),
      ...entry,
    };
    this.state = { ...this.state, activity: [...this.state.activity, activity] };
  }

  private assertVersion(expectedVersion: number) {
    if (expectedVersion !== this.state.positionVersion) {
      throw new MatchError("stale_position", `Position v${expectedVersion} is stale. Read v${this.state.positionVersion} before acting.`);
    }
  }

  private assertTurn(color: "w" | "b") {
    if (this.chess.turn() !== color) throw new MatchError("wrong_turn", "It is not that participant's turn.");
  }

  private assertStatus(status: MatchState["status"]) {
    if (this.state.status !== status) throw new MatchError("wrong_turn", "That action is not available in the current match state.");
  }

  private configFromState(): MatchConfig {
    return { mode: this.state.mode, humanColor: this.state.humanColor, difficulty: this.state.difficulty, timeControl: this.state.timeControl, sessionPolicy: this.state.sessionPolicy };
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
