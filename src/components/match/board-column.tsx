import type { Square } from "chess.js";
import { LiveBoard } from "../live-board";
import { PlayerSlot } from "../player-slot";
import type { AgentProposal, LegalMove, MatchState } from "../../domain/chess/types";
import { ErrorBanner } from "./error-banner";

type Props = {
  state: MatchState;
  legalMoves: LegalMove[];
  flipped: boolean;
  error?: string;
  onDismissError: () => void;
  onMove: (from: Square, to: Square) => void;
  proposal?: AgentProposal;
};

export function BoardColumn({ state, legalMoves, flipped, error, onDismissError, onMove, proposal }: Props) {
  const lastMove = state.history.at(-1);
  const humanTurn = state.status === "awaiting_human";
  const bottomColor = flipped ? "b" : "w";
  const topColor = flipped ? "w" : "b";

  return <section className="board-column">
    <ErrorBanner message={error} onDismiss={onDismissError} />
    <PlayerSlot color={topColor} humanColor={state.humanColor} mode={state.mode} clock={state.clocks[topColor]} active={state.turn === topColor && state.status !== "finished"} moves={state.history} />
    <LiveBoard fen={state.fen} legalMoves={legalMoves} lastMove={lastMove} proposal={proposal} orientation={flipped ? "black" : "white"} humanColor={state.humanColor} canMove={humanTurn} onMove={onMove} />
    <PlayerSlot color={bottomColor} humanColor={state.humanColor} mode={state.mode} clock={state.clocks[bottomColor]} active={state.turn === bottomColor && state.status !== "finished"} moves={state.history} />
    <footer className="table-footer">{state.result ? `${state.result.label}: ${state.result.detail}` : "Every move is validated against the live board position."}</footer>
  </section>;
}
