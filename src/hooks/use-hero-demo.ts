import { Chess } from "chess.js";
import { useMemo, useState } from "react";
import { TRAINING_SCENARIOS } from "../domain/chess/training-scenarios";

export type DemoStage = "proposed" | "applied" | "declined";

const scenario = TRAINING_SCENARIOS["scandinavian-queen-chase"];
const proposal = {
  from: "b1",
  to: "c3",
  san: "Nc3",
  explanation: "The knight develops and attacks the queen on d5. Black has to move it a second time, so you finish the move a tempo ahead.",
} as const;

/** Drives the landing demonstration. Every position here is validated by chess.js, so the board a
 *  visitor sees is a real position and never a picture of one. */
export function useHeroDemo() {
  const [stage, setStage] = useState<DemoStage>("proposed");

  const fen = useMemo(() => {
    if (stage !== "applied") return scenario.fen;
    const chess = new Chess(scenario.fen);
    chess.move({ from: proposal.from, to: proposal.to });
    return chess.fen();
  }, [stage]);

  return {
    stage,
    fen,
    proposal,
    summary: scenario.summary,
    apply: () => setStage("applied"),
    decline: () => setStage("declined"),
    restart: () => setStage("proposed"),
  };
}
