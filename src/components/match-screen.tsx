import { WarningCircle } from "@phosphor-icons/react";
import type { Square } from "chess.js";
import { ActivityRail } from "./activity-rail";
import { LiveBoard } from "./live-board";
import { MatchHeader } from "./match-header";
import { PlayerSlot } from "./player-slot";
import type { AgentProposal, LegalMove, MatchState } from "../domain/chess/types";
import type { AgentActions } from "../domain/chess/agent-actions";

export function MatchScreen({ state, legalMoves, webMcpStatus, actions, flipped, error, onFlip, onReset, onLobby, onMove, onApplyProposal, onDismissProposal, onDismissError }: { state: MatchState; legalMoves: LegalMove[]; webMcpStatus: "unavailable" | "registering" | "ready" | "error"; actions: AgentActions; flipped: boolean; error?: string; onFlip: () => void; onReset: () => void; onLobby: () => void; onMove: (from: Square, to: Square) => void; onApplyProposal: (proposal: AgentProposal) => void; onDismissProposal: (proposal: AgentProposal) => void; onDismissError: () => void }) {
  const lastMove = state.history.at(-1);
  return <div className="app-shell"><MatchHeader state={state} onFlip={onFlip} onReset={onReset} onLobby={onLobby} /><main className="match-table"><section className="board-column">{error && <div className="inline-error" role="alert"><WarningCircle size={18} weight="fill" /> <span>{error}</span><button onClick={onDismissError} aria-label="Dismiss error">x</button></div>}<PlayerSlot color={state.agentColor} humanColor={state.humanColor} mode={state.mode} clock={state.clocks[state.agentColor]} active={state.turn === state.agentColor && state.status !== "finished"} moves={state.history} /><LiveBoard fen={state.fen} legalMoves={legalMoves} lastMove={lastMove} proposal={state.proposedMove} orientation={flipped ? "black" : "white"} canMove={state.status === "awaiting_human"} onMove={onMove} /><PlayerSlot color={state.humanColor} humanColor={state.humanColor} mode={state.mode} clock={state.clocks[state.humanColor]} active={state.turn === state.humanColor && state.status !== "finished"} moves={state.history} /><footer className="table-footer">{state.result ? `${state.result.label}: ${state.result.detail}` : "Every move is checked against the position on the board."}</footer></section><ActivityRail state={state} webMcpStatus={webMcpStatus} actions={actions} onApply={onApplyProposal} onDismiss={onDismissProposal} /></main></div>;
}
