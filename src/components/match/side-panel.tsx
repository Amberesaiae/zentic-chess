import { ActivityRail } from "../activity-rail";
import type { AgentActions } from "../../domain/chess/agent-actions";
import type { AgentProposal, MatchState } from "../../domain/chess/types";

type Props = {
  state: MatchState;
  webMcpStatus: "unavailable" | "registering" | "ready" | "error";
  actions: AgentActions;
  onUndo: () => void;
  onHint: () => void;
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
  onExport: () => void;
  onImport: (pgn: string) => void;
  onApplyProposal: (proposal: AgentProposal) => void;
  onDismissProposal: (proposal: AgentProposal) => void;
};

export function MatchSidePanel({ state, webMcpStatus, actions, onUndo, onHint, onSave, onLoad, onExport, onImport, onApplyProposal, onDismissProposal }: Props) {
  return <aside className={`match-sidepanels ${state.mode === "agent" ? "agent-workspace" : ""}`}>
    <ActivityRail state={state} webMcpStatus={webMcpStatus} actions={actions} onUndo={onUndo} onHint={onHint} onSave={onSave} onLoad={onLoad} onExport={onExport} onImport={onImport} onApply={onApplyProposal} onDismiss={onDismissProposal} />
  </aside>;
}
