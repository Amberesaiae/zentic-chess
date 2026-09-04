import { Chess, type Move, type Square } from "chess.js";
import { MatchError, TIME_CONTROLS, type ActivityEntry, type AgentProposal, type CharterAuthority, type DecisionReceipt, type LegalMove, type MatchConfig, type MatchResult, type MatchState, type McpTraceEntry, type MoveRecord, type PlayCharter, type SessionPolicy, type TrainingScenario } from "./types";
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

  undo(plies = this.state.mode === "computer" ? 2 : 1) {
    if (this.state.history.length === 0) throw new MatchError("illegal_move", "There are no moves to undo.");
    const history = this.state.history.slice(0, Math.max(0, this.state.history.length - plies));
    this.chess = new Chess();
    history.forEach((move) => this.chess.move(move.san));
    this.state = {
      ...this.state,
      fen: this.chess.fen(),
      history,
      positionVersion: this.state.positionVersion + 1,
      turn: this.chess.turn(),
      status: this.chess.turn() === this.state.humanColor ? "awaiting_human" : "awaiting_agent",
      proposedMove: undefined,
      result: undefined,
    };
    this.appendActivity({ actor: "system", kind: "system", title: "Moves undone", detail: `Returned to move ${history.length || 0}.` });
    this.emit();
  }

  saveLocal(slot = 1) {
    localStorage.setItem(`zentic-match-${slot}`, JSON.stringify({ config: this.configFromState(), history: this.state.history.map((move) => move.san) }));
    this.appendActivity({ actor: "system", kind: "system", title: "Match saved", detail: `Saved to browser slot ${slot}.` });
    this.emit();
  }

  loadLocal(slot = 1) {
    const saved = localStorage.getItem(`zentic-match-${slot}`);
    if (!saved) throw new MatchError("illegal_move", `No saved Zentic match was found in browser slot ${slot}.`);
    const parsed = JSON.parse(saved) as { config: MatchConfig; history: string[] };
    this.chess = new Chess();
    this.state = this.createInitialState(parsed.config);
    parsed.history.forEach((san) => {
      const move = this.chess.move(san);
      if (!move) throw new MatchError("illegal_move", "The saved game could not be restored.");
      const record = this.toMoveRecord(move);
      this.state = { ...this.state, fen: this.chess.fen(), history: [...this.state.history, record], positionVersion: this.state.positionVersion + 1, turn: this.chess.turn() };
    });
    this.state = { ...this.state, status: this.chess.turn() === this.state.humanColor ? "awaiting_human" : "awaiting_agent" };
    this.appendActivity({ actor: "system", kind: "system", title: "Match restored", detail: `Restored from browser slot ${slot}.` });
    this.emit();
  }

  importPgn(pgn: string) {
    const imported = new Chess();
    try {
      imported.loadPgn(pgn);
    } catch {
      throw new MatchError("illegal_move", "That file is not a valid chess PGN.");
    }
    const verboseHistory = imported.history({ verbose: true });
    this.chess = new Chess();
    this.state = this.createInitialState(this.configFromState());
    verboseHistory.forEach((move) => {
      const applied = this.chess.move(move.san);
      if (!applied) throw new MatchError("illegal_move", "The PGN contains a move Zentic could not restore.");
      this.state = { ...this.state, fen: this.chess.fen(), history: [...this.state.history, this.toMoveRecord(applied)], positionVersion: this.state.positionVersion + 1, turn: this.chess.turn() };
    });
    this.state = { ...this.state, status: this.chess.turn() === this.state.humanColor ? "awaiting_human" : "awaiting_agent", result: this.getResult() };
    this.appendActivity({ actor: "system", kind: "system", title: "PGN imported", detail: `Restored ${verboseHistory.length} ply from a portable game record.` });
    this.emit();
  }

  getHint() {
    const move = this.listLegalMoves()[0];
    if (!move) throw new MatchError("illegal_move", "There is no legal move to hint.");
    this.appendActivity({ actor: "system", kind: "agent_note", title: "Position hint", detail: `Consider ${move.san}. It is a legal continuation from the live position.`, move });
    this.emit();
    return move;
  }

  listActivity(afterPositionVersion = -1) {
    return this.state.activity.filter((entry) => entry.positionVersion > afterPositionVersion);
  }

  recordMcpTool(tool: string, status: McpTraceEntry["status"]) {
    const entry: McpTraceEntry = { id: `mcp-${Date.now()}-${tool}`, tool, status, positionVersion: this.state.positionVersion, createdAt: new Date().toISOString() };
    this.state = { ...this.state, mcpTrace: [...this.state.mcpTrace, entry].slice(-24) };
    this.emit();
  }

  updatePlayCharter(expectedVersion: number, input: { objective: string; constraints?: string[]; authority: CharterAuthority }) {
    this.assertVersion(expectedVersion);
    if (this.state.mode !== "agent") throw new MatchError("policy_denied", "A play charter is available in Browser agent matches.");
    const objective = input.objective.trim();
    if (!objective) throw new MatchError("illegal_move", "A play charter needs a clear objective.");
    const constraints = [...new Set((input.constraints ?? []).map((constraint) => constraint.trim()).filter(Boolean))].slice(0, 3);
    const playCharter: PlayCharter = { objective, constraints, authority: input.authority, updatedAt: new Date().toISOString() };
    const invalidatesCurrentReceipt = this.state.proposedMove?.positionVersion === this.state.positionVersion;
    this.state = {
      ...this.state,
      playCharter,
      activeConsent: undefined,
      decisionReceipts: invalidatesCurrentReceipt ? this.state.decisionReceipts.map((receipt) => receipt.positionVersion === this.state.positionVersion && receipt.status !== "applied" ? { ...receipt, status: "withdrawn" } : receipt) : this.state.decisionReceipts,
    };
    this.appendActivity({ actor: "human", kind: "system", title: "Play charter updated", detail: objective });
    this.emit();
    return playCharter;
  }

  createDecisionReceipt(input: { expectedVersion: number; proposalId: string; rationale?: string }) {
    this.assertVersion(input.expectedVersion);
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== input.proposalId) throw new MatchError("proposal_missing", "Create a receipt for the current proposal.");
    if (proposal.positionVersion !== this.state.positionVersion) throw new MatchError("stale_position", "That proposal belongs to an earlier board position.");
    const existing = this.state.decisionReceipts.find((receipt) => receipt.proposalId === proposal.id && receipt.positionVersion === this.state.positionVersion && receipt.status !== "withdrawn");
    if (existing) return existing;
    const rationale = input.rationale?.trim() || proposal.explanation;
    if (!rationale) throw new MatchError("illegal_move", "A decision receipt needs a concise rationale.");
    const toolEvidence = [...new Set(this.state.mcpTrace.filter((entry) => entry.positionVersion === this.state.positionVersion && entry.status === "complete").map((entry) => entry.tool))];
    const receipt: DecisionReceipt = {
      id: `receipt-${this.state.positionVersion}-${proposal.id}`,
      proposalId: proposal.id,
      positionVersion: this.state.positionVersion,
      objective: this.state.playCharter.objective,
      constraints: this.state.playCharter.constraints,
      rationale,
      toolEvidence,
      status: "proposed",
      createdAt: new Date().toISOString(),
    };
    this.state = { ...this.state, decisionReceipts: [...this.state.decisionReceipts, receipt].slice(-48) };
    this.appendActivity({ actor: "agent", kind: "decision_receipt", title: "Decision receipt ready", detail: rationale, move: proposal.move });
    this.emit();
    return receipt;
  }

  grantMoveConsent(proposalId: string, expectedVersion: number) {
    this.assertVersion(expectedVersion);
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== proposalId) throw new MatchError("proposal_missing", "That proposal is no longer available.");
    const receipt = this.receiptFor(proposal);
    if (!receipt) throw new MatchError("policy_denied", "Review the decision receipt before granting move consent.");
    if (this.state.playCharter.authority !== "one_move") throw new MatchError("policy_denied", "Set the play charter to allow one approved move before granting consent.");
    this.state = {
      ...this.state,
      activeConsent: { proposalId, positionVersion: expectedVersion, grantedAt: new Date().toISOString() },
      decisionReceipts: this.updateReceipt(receipt.id, "consented"),
    };
    this.appendActivity({ actor: "human", kind: "consent", title: `One-move consent granted for ${proposal.move.san}`, detail: "The agent may apply this exact proposal and no other move." });
    this.emit();
    return this.state.activeConsent;
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
      training: { id: scenario.id, title: scenario.title, summary: scenario.summary, category: scenario.category, prompt: scenario.prompt, objective: scenario.objective, hintLevel: 0, completed: false },
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
    this.completeTrainingIfSolved(input);
  }

  revealTrainingHint(expectedVersion: number) {
    this.assertVersion(expectedVersion);
    const training = this.state.training;
    if (!training || training.completed) throw new MatchError("policy_denied", "There is no active training objective to hint.");
    const scenario = TRAINING_SCENARIOS[training.id];
    const hint = scenario.hints[training.hintLevel];
    if (!hint) throw new MatchError("policy_denied", "All available hints have already been revealed.");
    const hintLevel = training.hintLevel + 1;
    this.state = { ...this.state, training: { ...training, hintLevel } };
    this.appendActivity({ actor: "agent", kind: "agent_note", title: `Hint ${hintLevel}`, detail: hint });
    this.emit();
    return { positionVersion: this.state.positionVersion, hintLevel, hint };
  }

  playComputerMove(engineCandidate?: MoveInput) {
    if (this.state.mode !== "computer") throw new MatchError("policy_denied", "Only a computer match can use the local practice opponent.");
    this.assertStatus("awaiting_agent");
    this.assertTurn(this.state.agentColor);
    const move = engineCandidate
      ? this.listLegalMoves().find((candidate) => candidate.from === engineCandidate.from && candidate.to === engineCandidate.to && (candidate.promotion ?? "") === (engineCandidate.promotion ?? ""))
      : undefined;
    const selectedMove = move ?? this.choosePracticeMove();
    if (!selectedMove) throw new MatchError("illegal_move", "The practice computer has no legal move.");
    const applied = this.applyMove(selectedMove);
    const detail = move
      ? "Validated reply from Lichess cloud evaluation."
      : this.state.difficulty === "casual"
      ? "Development-first practice reply."
      : this.state.difficulty === "club"
        ? "Two-ply club search: checks material and the immediate reply."
        : "Three-ply tactical search: prioritises forcing moves and loose material.";
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
    if (this.state.playCharter.authority === "explain") throw new MatchError("policy_denied", "The player has asked for explanation only. Update the play charter before proposing a move.");
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
    this.state = { ...this.state, status: "agent_proposed", proposedMove: proposal, activeConsent: undefined };
    this.appendActivity({ actor: "agent", kind: "agent_proposal", title: `Proposed ${candidate.san}`, detail: explanation, move: candidate });
    this.emit();
    return proposal;
  }

  applyProposal(proposalId: string, expectedVersion: number, actor: "human" | "agent") {
    this.assertVersion(expectedVersion);
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== proposalId) throw new MatchError("proposal_missing", "That move proposal is no longer available.");
    if (proposal.positionVersion !== this.state.positionVersion) throw new MatchError("stale_position", "That proposal belongs to an earlier board position.");
    const receipt = this.receiptFor(proposal);
    if (!receipt) throw new MatchError("policy_denied", "The agent must create a decision receipt before this move can be applied.");
    const hasScopedConsent = this.state.activeConsent?.proposalId === proposal.id && this.state.activeConsent.positionVersion === this.state.positionVersion;
    if (actor === "agent" && this.state.sessionPolicy !== "agent_may_play" && !hasScopedConsent) {
      throw new MatchError("policy_denied", "This match requires human confirmation or one-move consent before the agent can play.");
    }
    const move = this.applyMove(proposal.move);
    this.state = { ...this.state, decisionReceipts: this.updateReceipt(receipt.id, "applied"), activeConsent: undefined };
    this.completeMove(move, "agent", "agent_move", `Agent played ${move.san}.`, proposal.explanation);
  }

  dismissProposal(proposalId: string) {
    const proposal = this.state.proposedMove;
    if (!proposal || proposal.id !== proposalId) throw new MatchError("proposal_missing", "That move proposal is no longer available.");
    const receipt = this.receiptFor(proposal);
    this.state = { ...this.state, status: "awaiting_agent", proposedMove: undefined, activeConsent: undefined, decisionReceipts: receipt ? this.updateReceipt(receipt.id, "withdrawn") : this.state.decisionReceipts };
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
      playCharter: { objective: "Play a clear, principled game.", constraints: [], authority: "propose", updatedAt: new Date().toISOString() },
      decisionReceipts: [],
      activeConsent: undefined,
      activity: [{
        id: "system-start",
        actor: "system",
        kind: "system",
        positionVersion: 0,
        createdAt: new Date().toISOString(),
        title: "Match ready",
        detail: config.mode === "computer" ? "Practice computer match ready." : "Open a compatible agent client to read and propose the opponent's move.",
      }],
      mcpTrace: [],
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

  private choosePracticeMove(): LegalMove | undefined {
    const legal = this.orderPracticeMoves(this.listLegalMoves());
    if (!legal.length) return undefined;

    if (this.state.difficulty === "casual") {
      const quietDevelopment = legal.filter((move) => !move.captured && !move.givesCheck && /^(N|B|[a-h])/.test(move.san));
      const pool = quietDevelopment.length ? quietDevelopment.slice(0, Math.min(5, quietDevelopment.length)) : legal.slice(0, Math.min(5, legal.length));
      return pool[this.state.history.length % pool.length];
    }

    const depth = this.state.difficulty === "club" ? 2 : 3;
    let bestMove = legal[0];
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    for (const move of legal) {
      this.chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const score = this.searchPracticePosition(depth - 1, alpha, beta);
      this.chess.undo();
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, bestScore);
    }
    return bestMove;
  }

  private searchPracticePosition(depth: number, alpha: number, beta: number): number {
    if (depth === 0 || this.chess.isGameOver()) return this.scorePracticePosition();
    const maximizing = this.chess.turn() === this.state.agentColor;
    const legal = this.orderPracticeMoves(this.listLegalMoves());
    let best = maximizing ? -Infinity : Infinity;
    for (const move of legal) {
      this.chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const score = this.searchPracticePosition(depth - 1, alpha, beta);
      this.chess.undo();
      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, best);
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  private scorePracticePosition(): number {
    if (this.chess.isCheckmate()) return this.chess.turn() === this.state.agentColor ? -100_000 : 100_000;
    if (this.chess.isDraw()) return 0;
    const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let whiteMaterial = 0;
    let blackMaterial = 0;
    this.chess.board().flat().forEach((piece) => {
      if (!piece) return;
      if (piece.color === "w") whiteMaterial += values[piece.type];
      else blackMaterial += values[piece.type];
    });
    const perspective = this.state.agentColor === "w" ? 1 : -1;
    const material = (whiteMaterial - blackMaterial) * perspective;
    const mobility = this.chess.moves().length * (this.chess.turn() === this.state.agentColor ? 2 : -2);
    return material + mobility;
  }

  private orderPracticeMoves(moves: LegalMove[]) {
    return [...moves].sort((left, right) => this.practiceMovePriority(right) - this.practiceMovePriority(left));
  }

  private practiceMovePriority(move: LegalMove) {
    const centralSquare = ["c4", "d4", "e4", "f4", "c5", "d5", "e5", "f5"].includes(move.to) ? 12 : 0;
    return (move.captured ? 80 : 0) + (move.givesCheck ? 55 : 0) + (move.promotion ? 70 : 0) + centralSquare;
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
      activeConsent: undefined,
      result,
    };
    this.appendActivity({ actor, kind, title, detail, move: record, positionVersion: nextVersion });
    this.emit();
  }

  private completeTrainingIfSolved(input: MoveInput) {
    const training = this.state.training;
    if (!training || training.completed) return;
    const scenario = TRAINING_SCENARIOS[training.id];
    if (scenario.solution.from !== input.from || scenario.solution.to !== input.to) return;
    this.state = { ...this.state, training: { ...training, completed: true } };
    this.appendActivity({ actor: "system", kind: "system", title: "Objective met", detail: scenario.success });
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

  private receiptFor(proposal: AgentProposal) {
    return this.state.decisionReceipts.find((receipt) => receipt.proposalId === proposal.id && receipt.positionVersion === this.state.positionVersion && receipt.status !== "withdrawn");
  }

  private updateReceipt(receiptId: string, status: DecisionReceipt["status"]) {
    return this.state.decisionReceipts.map((receipt) => receipt.id === receiptId ? { ...receipt, status } : receipt);
  }

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}
