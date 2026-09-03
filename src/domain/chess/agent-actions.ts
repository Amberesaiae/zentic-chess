import type { MatchController } from "./match-controller";
import { TRAINING_SCENARIOS } from "./training-scenarios";
import type { TrainingScenario } from "./types";

export function createAgentActions(controller: MatchController) {
  return {
    readMatch: () => controller.getSnapshot(),
    listLegalMoves: (expectedVersion: number) => ({ positionVersion: expectedVersion, moves: controller.listLegalMoves(expectedVersion) }),
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
    startTrainingScenario: (id: TrainingScenario["id"]) => {
      controller.startTrainingScenario(id);
      const state = controller.getSnapshot();
      return { positionVersion: state.positionVersion, training: state.training, fen: state.fen };
    },
    availableTraining: () => Object.values(TRAINING_SCENARIOS).map(({ id, title, summary }) => ({ id, title, summary })),
  };
}

export type AgentActions = ReturnType<typeof createAgentActions>;
