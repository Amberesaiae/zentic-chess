import type { TrainingScenario } from "./types";

export const TRAINING_SCENARIOS: Record<TrainingScenario["id"], TrainingScenario> = {
  "scandinavian-queen-chase": {
    id: "scandinavian-queen-chase",
    title: "Scandinavian: gain a tempo",
    summary: "After 1. e4 d5 2. exd5 Qxd5, White to move.",
    prompt: "Black has recovered the pawn with the queen. Find the forcing move that develops a piece and gains time on the queen.",
    fen: "rnb1kbnr/pppp1ppp/8/3q4/8/8/PPPP1PPP/RNBQKBNR w KQkq - 0 3",
    humanColor: "w",
  },
};
