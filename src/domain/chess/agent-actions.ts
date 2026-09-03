import type { MatchController } from "./match-controller";
import { TRAINING_SCENARIOS } from "./training-scenarios";
import type { TrainingScenario } from "./types";
import type { AgentProposal, MatchState } from "./types";

export function createAgentActions(controller: MatchController) {
  return {
    readMatch: () => controller.getSnapshot(),
    getCapabilities: () => capabilitiesFor(controller.getSnapshot()),
    listLegalMoves: (expectedVersion: number) => ({ positionVersion: expectedVersion, moves: controller.listLegalMoves(expectedVersion) }),
    listActivity: (afterPositionVersion?: number) => controller.listActivity(afterPositionVersion),
    getPgn: () => ({ positionVersion: controller.getSnapshot().positionVersion, pgn: controller.getPgn() }),
    addNote: (expectedVersion: number, text: string, kind: "analysis" | "status") => {
      controller.postAgentNote(expectedVersion, text, kind);
      return { positionVersion: controller.getSnapshot().positionVersion, status: "recorded" as const };
    },
    proposeMove: (input: Parameters<MatchController["proposeAgentMove"]>[0]) => controller.proposeAgentMove(input),
    commitProposedMove: (proposalId: string, expectedVersion: number) => {
      controller.applyProposal(proposalId, expectedVersion, "agent");
      const state = controller.getSnapshot();
      return { positionVersion: state.positionVersion, status: state.status };
    },
    withdrawProposal: (proposalId: string) => {
      controller.dismissProposal(proposalId);
      const state = controller.getSnapshot();
      return { positionVersion: state.positionVersion, status: state.status };
    },
    startTrainingScenario: (id: TrainingScenario["id"]) => {
      controller.startTrainingScenario(id);
      const state = controller.getSnapshot();
      return { positionVersion: state.positionVersion, training: state.training, fen: state.fen };
    },
    getTrainingState: () => controller.getSnapshot().training,
    revealTrainingHint: (expectedVersion: number) => controller.revealTrainingHint(expectedVersion),
    availableTraining: () => Object.values(TRAINING_SCENARIOS).map(({ id, title, summary }) => ({ id, title, summary })),
  };
}

export type AgentActions = ReturnType<typeof createAgentActions>;

function capabilitiesFor(state: MatchState) {
  return {
    mode: state.mode,
    positionVersion: state.positionVersion,
    canRead: true,
    canListLegalMoves: true,
    canPostNote: true,
    canProposeMove: state.mode === "agent" && state.status === "awaiting_agent",
    canCommitProposal: state.mode === "agent" && state.status === "agent_proposed" && state.sessionPolicy === "agent_may_play",
    canWithdrawProposal: Boolean(state.proposedMove),
    canStartTraining: true,
    canRevealHint: Boolean(state.training && !state.training.completed),
    requiresHumanConfirmation: ["start_training_scenario", "commit_agent_move"],
    currentProposal: state.proposedMove ? proposalSummary(state.proposedMove) : undefined,
  };
}

function proposalSummary(proposal: AgentProposal) {
  return { id: proposal.id, san: proposal.move.san, positionVersion: proposal.positionVersion };
}
