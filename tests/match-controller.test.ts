import { describe, expect, it } from "vitest";
import { MatchController } from "../src/domain/chess/match-controller";
import { createAgentActions } from "../src/domain/chess/agent-actions";
import { getMatchInsights } from "../src/domain/chess/match-insights";
import { MatchError } from "../src/domain/chess/types";

describe("MatchController", () => {
  function agentMatch() {
    const match = new MatchController();
    match.reset({ mode: "agent", humanColor: "w", difficulty: "club", timeControl: "untimed", sessionPolicy: "propose_only" });
    return match;
  }

  it("records a legal human move and waits for the agent on a new version", () => {
    const match = agentMatch();

    match.submitHumanMove({ from: "e2", to: "e4" });

    expect(match.getSnapshot()).toMatchObject({ positionVersion: 1, status: "awaiting_agent" });
    expect(match.getSnapshot().history.at(-1)).toMatchObject({ san: "e4", from: "e2", to: "e4" });
  });

  it("keeps a normal computer game separate from agent proposals", () => {
    const match = new MatchController();
    match.reset({ mode: "computer", humanColor: "w", difficulty: "club", timeControl: "untimed", sessionPolicy: "propose_only" });
    match.submitHumanMove({ from: "e2", to: "e4" });
    match.playComputerMove();

    expect(match.getSnapshot()).toMatchObject({ mode: "computer", positionVersion: 2, status: "awaiting_human" });
    expect(match.getSnapshot().history.at(-1)?.color).toBe("b");
  });

  it("accepts an engine candidate only when it is legal in the live position", () => {
    const match = new MatchController();
    match.reset({ mode: "computer", humanColor: "w", difficulty: "club", timeControl: "untimed", sessionPolicy: "propose_only" });
    match.submitHumanMove({ from: "e2", to: "e4" });

    match.playComputerMove({ from: "d7", to: "d5" });

    expect(match.getSnapshot().history.at(-1)).toMatchObject({ san: "d5", from: "d7", to: "d5" });
    expect(match.getSnapshot().activity.at(-1)).toMatchObject({ detail: "Validated reply from Lichess cloud evaluation." });
  });

  it("falls back to the local practice engine when an external candidate is stale or illegal", () => {
    const match = new MatchController();
    match.reset({ mode: "computer", humanColor: "w", difficulty: "club", timeControl: "untimed", sessionPolicy: "propose_only" });
    match.submitHumanMove({ from: "e2", to: "e4" });

    match.playComputerMove({ from: "a7", to: "a3" });

    expect(match.getSnapshot()).toMatchObject({ positionVersion: 2, status: "awaiting_human" });
    expect(match.getSnapshot().history.at(-1)?.color).toBe("b");
    expect(match.getSnapshot().activity.at(-1)?.detail).not.toBe("Validated reply from Lichess cloud evaluation.");
  });

  it("rebuilds a legal position when undoing the last exchange", () => {
    const match = new MatchController();
    match.reset({ mode: "computer", humanColor: "w", difficulty: "club", timeControl: "untimed", sessionPolicy: "propose_only" });
    match.submitHumanMove({ from: "e2", to: "e4" });
    match.playComputerMove();

    match.undo();

    expect(match.getSnapshot()).toMatchObject({ history: [], status: "awaiting_human", turn: "w" });
    expect(match.getSnapshot().fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  });

  it("records a hint from the live legal move set without changing the position", () => {
    const match = agentMatch();
    const fen = match.getSnapshot().fen;

    const hint = match.getHint();

    expect(match.getSnapshot().fen).toBe(fen);
    expect(match.getSnapshot().activity.at(-1)).toMatchObject({ title: "Position hint", move: { san: hint.san } });
  });

  it("imports a portable PGN into the same validated position model", () => {
    const match = agentMatch();

    match.importPgn("1. e4 e5 2. Nf3 Nc6 *");

    expect(match.getSnapshot()).toMatchObject({ positionVersion: 4, turn: "w", status: "awaiting_human" });
    expect(match.getSnapshot().history.map((move) => move.san)).toEqual(["e4", "e5", "Nf3", "Nc6"]);
    expect(match.getSnapshot().activity.at(-1)).toMatchObject({ title: "PGN imported" });
  });

  it("records an agent proposal without mutating the board, then lets the human apply it", () => {
    const match = agentMatch();
    match.submitHumanMove({ from: "e2", to: "e4" });
    const fenBeforeProposal = match.getSnapshot().fen;

    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });

    expect(match.getSnapshot()).toMatchObject({ fen: fenBeforeProposal, status: "agent_proposed", proposedMove: { id: proposal.id } });
    const receipt = match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });
    expect(receipt).toMatchObject({ objective: "Play a clear, principled game.", status: "proposed" });
    match.applyProposal(proposal.id, 1, "human");
    expect(match.getSnapshot()).toMatchObject({ positionVersion: 2, status: "awaiting_human", proposedMove: undefined });
    expect(match.getSnapshot().history.at(-1)).toMatchObject({ san: "e5", from: "e7", to: "e5" });
  });

  it("rejects actions based on a stale position", () => {
    const match = agentMatch();
    match.submitHumanMove({ from: "e2", to: "e4" });

    expect(() => match.proposeAgentMove({ expectedVersion: 0, from: "e7", to: "e5", explanation: "Too late." })).toThrow(MatchError);
    expect(() => match.proposeAgentMove({ expectedVersion: 0, from: "e7", to: "e5", explanation: "Too late." })).toThrow(/stale/i);
  });

  it("does not let an agent commit under a propose-only policy", () => {
    const match = agentMatch();
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });
    match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });

    expect(() => match.applyProposal(proposal.id, 1, "agent")).toThrow(/human confirmation/i);
  });

  it("turns a player's charter into a receipt-bound agent decision", () => {
    const match = agentMatch();
    match.updatePlayCharter(0, { objective: "Attack the king", constraints: ["Avoid queen trades", "Keep my king safe"], authority: "propose" });
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Contest the centre without trading queens." });

    const receipt = match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });

    expect(receipt).toMatchObject({ objective: "Attack the king", constraints: ["Avoid queen trades", "Keep my king safe"], rationale: "Contest the centre without trading queens." });
    expect(match.getSnapshot().activity.at(-1)).toMatchObject({ kind: "decision_receipt", title: "Decision receipt ready" });
  });

  it("prevents an agent from proposing when the charter requests explanation only", () => {
    const match = agentMatch();
    match.updatePlayCharter(0, { objective: "Teach the position", authority: "explain" });
    match.submitHumanMove({ from: "e2", to: "e4" });

    expect(() => match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "A legal reply." })).toThrow(/explanation only/i);
  });

  it("allows a single agent move only after receipt-backed one-move consent", () => {
    const match = agentMatch();
    match.updatePlayCharter(0, { objective: "Keep initiative", authority: "one_move" });
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });
    match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });
    match.grantMoveConsent(proposal.id, 1);

    match.applyProposal(proposal.id, 1, "agent");

    expect(match.getSnapshot()).toMatchObject({ status: "awaiting_human", activeConsent: undefined });
    expect(match.getSnapshot().decisionReceipts.at(-1)).toMatchObject({ status: "applied" });
  });

  it("invalidates a pending receipt and consent when the player changes the charter", () => {
    const match = agentMatch();
    match.updatePlayCharter(0, { objective: "Keep initiative", authority: "one_move" });
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });
    match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });
    match.grantMoveConsent(proposal.id, 1);

    match.updatePlayCharter(1, { objective: "Protect my king", authority: "one_move" });

    expect(match.getSnapshot()).toMatchObject({ activeConsent: undefined });
    expect(match.getSnapshot().decisionReceipts.at(-1)).toMatchObject({ status: "withdrawn" });
    expect(() => match.applyProposal(proposal.id, 1, "human")).toThrow(/decision receipt/i);
  });

  it("loads the curated Scandinavian drill as a legal position for White", () => {
    const match = agentMatch();
    match.startTrainingScenario("scandinavian-queen-chase");

    expect(match.getSnapshot()).toMatchObject({
      fen: "rnb1kbnr/pppp1ppp/8/3q4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3",
      status: "awaiting_human",
      humanColor: "w",
      training: { id: "scandinavian-queen-chase" },
    });
    expect(match.listLegalMoves()).toContainEqual(expect.objectContaining({ san: "Nc3", from: "b1", to: "c3" }));
  });

  it("gives a coaching agent capabilities, a catch-up record, and a PGN export", () => {
    const match = agentMatch();
    const actions = createAgentActions(match);
    match.submitHumanMove({ from: "e2", to: "e4" });

    expect(actions.getCapabilities()).toMatchObject({ canProposeMove: true, canCommitProposal: false, canStartTraining: true });
    expect(actions.listActivity(0)).toContainEqual(expect.objectContaining({ title: "You played e4." }));
    expect(actions.getPgn()).toMatchObject({ positionVersion: 1 });
    expect(actions.getPgn().pgn).toContain("1. e4 *");
    expect(actions.availableTraining()).toContainEqual(expect.objectContaining({ id: "scandinavian-queen-chase" }));
  });

  it("lets an agent withdraw its pending proposal without altering the board", () => {
    const match = agentMatch();
    const actions = createAgentActions(match);
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = actions.proposeMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });
    const fen = match.getSnapshot().fen;

    actions.withdrawProposal(proposal.id);

    expect(match.getSnapshot()).toMatchObject({ fen, status: "awaiting_agent", proposedMove: undefined });
  });

  it("reveals progressive training hints and marks the objective complete on Nc3", () => {
    const match = agentMatch();
    const actions = createAgentActions(match);
    actions.startTrainingScenario("scandinavian-queen-chase");

    expect(actions.revealTrainingHint(0)).toMatchObject({ hintLevel: 1, hint: "Which White minor piece can develop immediately?" });
    match.submitHumanMove({ from: "b1", to: "c3" });

    expect(actions.getTrainingState()).toMatchObject({ completed: true, hintLevel: 1 });
    expect(match.getSnapshot().activity.at(-1)).toMatchObject({ title: "Objective met" });
  });

  it("derives capture and material analytics from the real move record", () => {
    const match = agentMatch();
    match.submitHumanMove({ from: "e2", to: "e4" });
    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "d7", to: "d5", explanation: "Contest the centre." });
    match.createDecisionReceipt({ expectedVersion: 1, proposalId: proposal.id });
    match.applyProposal(proposal.id, 1, "human");
    match.submitHumanMove({ from: "e4", to: "d5" });

    expect(getMatchInsights(match.getSnapshot())).toMatchObject({ materialLabel: "White +1", capturedValueBy: { w: 1, b: 0 } });
    expect(match.getSnapshot().history.at(-1)).toMatchObject({ san: "exd5", captured: "p" });
  });
});
