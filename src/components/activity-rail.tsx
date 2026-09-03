import { CheckCircle, ClockCounterClockwise, Note, Robot, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import type { ActivityEntry, AgentProposal, MatchState } from "../domain/chess/types";
import { Button } from "./ui-button";
import { VoiceCoach } from "./voice-coach";
import type { AgentActions } from "../domain/chess/agent-actions";

const eventIcons = { human_move: CheckCircle, agent_note: Note, agent_proposal: Robot, agent_move: Robot, system: ClockCounterClockwise };

export function ActivityRail({ state, webMcpStatus, actions, onApply, onDismiss }: { state: MatchState; webMcpStatus: "unavailable" | "registering" | "ready" | "error"; actions: AgentActions; onApply: (proposal: AgentProposal) => void; onDismiss: (proposal: AgentProposal) => void }) {
  return <aside className="activity-rail" aria-label="Match activity">
    <header className="rail-header"><div><span>{state.mode === "agent" ? "AGENT ACTIVITY" : "GAME RECORD"}</span><h2>{state.mode === "agent" ? "Match record" : "Move notebook"}</h2></div>{state.mode === "agent" ? <WebMcpStatus status={webMcpStatus} /> : <span className="connection-status ready"><i />LOCAL GAME</span>}</header>
    {state.mode === "agent" && <VoiceCoach actions={actions} />}
    {state.training && <section className={`training-focus ${state.training.completed ? "complete" : ""}`} aria-label="Training objective"><span>{state.training.completed ? "Objective complete" : "Training focus"}</span><h3>{state.training.title}</h3><p>{state.training.completed ? "You found the developing tempo move. Ask the coach to continue from this position." : state.training.objective}</p>{!state.training.completed && state.training.hintLevel > 0 && <small>{state.training.hintLevel} hint{state.training.hintLevel === 1 ? "" : "s"} revealed</small>}</section>}
    {state.proposedMove && <MoveProposal proposal={state.proposedMove} policy={state.sessionPolicy} onApply={onApply} onDismiss={onDismiss} />}
    <ol className="activity-list" aria-live="polite">{state.activity.slice().reverse().map((entry) => <ActivityItem entry={entry} key={entry.id} />)}</ol>
    <footer className="rail-footer"><ShieldCheck size={18} weight="fill" /><p>{state.mode === "computer" ? "The practice computer moves from the same validated legal move set as the board." : webMcpStatus === "ready" ? "A compatible agent can read the live board, leave a note, and propose a validated move." : "Open this match in a compatible agent client to make its live board tools available."}</p></footer>
  </aside>;
}

function WebMcpStatus({ status }: { status: "unavailable" | "registering" | "ready" | "error" }) {
  const label = status === "ready" ? "TOOLS READY" : status === "registering" ? "CONNECTING" : status === "error" ? "TOOLS ERROR" : "NO AGENT CLIENT";
  return <span className={`connection-status ${status}`}><i />{label}</span>;
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const Icon = eventIcons[entry.kind];
  return <li className={`activity-item ${entry.actor}`}><span className="activity-icon"><Icon size={17} weight={entry.kind === "agent_proposal" ? "fill" : "regular"} /></span><div><div className="activity-meta"><span>{entry.actor === "human" ? "YOU" : entry.actor === "agent" ? "AGENT" : "SYSTEM"}</span><time dateTime={entry.createdAt}>v{entry.positionVersion}</time></div><strong>{entry.title}</strong>{entry.detail && <p>{entry.detail}</p>}{entry.move && <code>{entry.move.from}-{entry.move.to} / {entry.move.san}</code>}</div></li>;
}

function MoveProposal({ proposal, policy, onApply, onDismiss }: { proposal: AgentProposal; policy: MatchState["sessionPolicy"]; onApply: (proposal: AgentProposal) => void; onDismiss: (proposal: AgentProposal) => void }) {
  return <section className="proposal-card" aria-label="Agent move proposal"><div className="proposal-marker"><Robot size={21} weight="fill" /><span>PROPOSAL / v{proposal.positionVersion}</span></div><h3>{proposal.move.san}</h3><p>{proposal.explanation}</p><code>{proposal.move.from} to {proposal.move.to}</code><div className="proposal-actions"><Button className="primary-button" onClick={() => onApply(proposal)}><CheckCircle size={17} weight="fill" /> Apply move</Button><Button className="quiet-button" onClick={() => onDismiss(proposal)}><X size={17} /> Dismiss</Button></div>{policy === "propose_only" && <small><WarningCircle size={14} /> Human confirmation required by match policy.</small>}</section>;
}
