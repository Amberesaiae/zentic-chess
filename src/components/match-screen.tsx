import type { Square } from "chess.js";
import { MatchHeader } from "./match-header";
import { BoardColumn } from "./match/board-column";
import { MatchSidePanel } from "./match/side-panel";
import type { AgentActions } from "../domain/chess/agent-actions";
import type { AgentProposal, LegalMove, MatchState } from "../domain/chess/types";

type Props = {
  state: MatchState;
  legalMoves: LegalMove[];
  webMcpStatus: "unavailable" | "registering" | "ready" | "error";
  actions: AgentActions;
  flipped: boolean;
  error?: string;
  onFlip: () => void;
  onReset: () => void;
  onLobby: () => void;
  onMove: (from: Square, to: Square) => void;
  onApplyProposal: (proposal: AgentProposal) => void;
  onDismissProposal: (proposal: AgentProposal) => void;
  onDismissError: () => void;
  onUndo: () => void;
  onHint: () => void;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onExport: () => void;
  onImport: (pgn: string) => void;
};

export function MatchScreen({ state, legalMoves, webMcpStatus, actions, flipped, error, onFlip, onReset, onLobby, onMove, onApplyProposal, onDismissProposal, onDismissError, onUndo, onHint, onSave, onLoad, onExport, onImport }: Props) {
  return <div className="app-shell">
    <a className="skip-link" href="#match-workspace">Skip to match table</a>
    <MatchHeader state={state} onFlip={onFlip} onReset={onReset} onLobby={onLobby} />
    <main id="match-workspace" className="match-table" tabIndex={-1}>
      <BoardColumn state={state} legalMoves={legalMoves} flipped={flipped} error={error} onDismissError={onDismissError} onMove={onMove} proposal={state.proposedMove} />
      <MatchSidePanel state={state} webMcpStatus={webMcpStatus} actions={actions} onUndo={onUndo} onHint={onHint} onSave={onSave} onLoad={onLoad} onExport={onExport} onImport={onImport} onApplyProposal={onApplyProposal} onDismissProposal={onDismissProposal} />
    </main>
  </div>;
}
