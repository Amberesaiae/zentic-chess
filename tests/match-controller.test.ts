import { describe, expect, it } from "vitest";
import { MatchController } from "../src/domain/chess/match-controller";
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

  it("records an agent proposal without mutating the board, then lets the human apply it", () => {
    const match = agentMatch();
    match.submitHumanMove({ from: "e2", to: "e4" });
    const fenBeforeProposal = match.getSnapshot().fen;

    const proposal = match.proposeAgentMove({ expectedVersion: 1, from: "e7", to: "e5", explanation: "Meet the centre directly." });

    expect(match.getSnapshot()).toMatchObject({ fen: fenBeforeProposal, status: "agent_proposed", proposedMove: { id: proposal.id } });
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

    expect(() => match.applyProposal(proposal.id, 1, "agent")).toThrow(/requires the human/i);
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
});
