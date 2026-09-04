import { ArrowRight, CheckCircle, DownloadSimple, FloppyDisk, Lightbulb, Rewind, Robot, TrayArrowDown, UploadSimple, WarningCircle, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { getMatchInsights } from "../domain/chess/match-insights";
import type { AgentActions } from "../domain/chess/agent-actions";
import type { AgentProposal, CharterAuthority, DecisionReceipt, MatchState } from "../domain/chess/types";
import { Button } from "./ui/button";
import { VoiceCoach } from "./voice-coach";

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
  onApply: (proposal: AgentProposal) => void;
  onDismiss: (proposal: AgentProposal) => void;
};

export function ActivityRail({ state, webMcpStatus, actions, onUndo, onHint, onSave, onLoad, onExport, onImport, onApply, onDismiss }: Props) {
  const agentMode = state.mode === "agent";
  const [view, setView] = useState<"conversation" | "record">("conversation");
  const [traceOpen, setTraceOpen] = useState(false);

  useEffect(() => {
    setView("conversation");
    setTraceOpen(false);
  }, [state.mode]);

  return <aside className="activity-rail" aria-label="Match companion">
    <MatchFoundation state={state} webMcpStatus={webMcpStatus} onUndo={onUndo} onHint={onHint} onSave={onSave} onLoad={onLoad} onExport={onExport} onImport={onImport} />
    <nav className="companion-switch" aria-label="Match companion views">
      <button type="button" aria-current={view === "conversation" ? "page" : undefined} onClick={() => setView("conversation")}>{agentMode ? "Talk" : "Board"}</button>
      <button type="button" aria-current={view === "record" ? "page" : undefined} onClick={() => setView("record")}>Moves</button>
    </nav>
    <div className="companion-workspace">
      {view === "conversation" && agentMode && <>
        <CharterPanel state={state} actions={actions} />
        <VoiceCoach actions={actions} onToggleTrace={() => setTraceOpen((open) => !open)} traceOpen={traceOpen} />
        {state.proposedMove && <MoveProposal proposal={state.proposedMove} policy={state.sessionPolicy} receipt={state.decisionReceipts.find((item) => item.proposalId === state.proposedMove?.id && item.positionVersion === state.positionVersion && item.status !== "withdrawn")} canGrantConsent={state.playCharter.authority === "one_move"} consented={state.activeConsent?.proposalId === state.proposedMove.id} onGrantConsent={() => actions.grantMoveConsent(state.proposedMove!.id, state.positionVersion)} onApply={onApply} onDismiss={onDismiss} />}
        {traceOpen && <TracePanel entries={state.mcpTrace} onClose={() => setTraceOpen(false)} />}
      </>}
      {view === "conversation" && !agentMode && <GamePrompt state={state} onShowRecord={() => setView("record")} />}
      {view === "record" && <MatchRecord state={state} />}
    </div>
  </aside>;
}

function CharterPanel({ state, actions }: { state: MatchState; actions: AgentActions }) {
  const [editing, setEditing] = useState(false);
  const [objective, setObjective] = useState(state.playCharter.objective);
  const [constraints, setConstraints] = useState(state.playCharter.constraints.join(", "));
  const [authority, setAuthority] = useState<CharterAuthority>(state.playCharter.authority);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!editing) {
      setObjective(state.playCharter.objective);
      setConstraints(state.playCharter.constraints.join(", "));
      setAuthority(state.playCharter.authority);
    }
  }, [editing, state.playCharter]);

  function save() {
    try {
      actions.updatePlayCharter(state.positionVersion, { objective, constraints: constraints.split(","), authority });
      setError(undefined);
      setEditing(false);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The charter could not be updated."); }
  }

  if (editing) return <section className="play-charter charter-edit" aria-labelledby="charter-title"><header><span id="charter-title">Your play charter</span><button type="button" onClick={() => setEditing(false)}>Cancel</button></header><label>Objective<input value={objective} onChange={(event) => setObjective(event.target.value)} /></label><label>Constraints <small>Separate them with commas</small><input value={constraints} onChange={(event) => setConstraints(event.target.value)} placeholder="Keep my king safe, avoid queen trades" /></label><label>Agent authority<select value={authority} onChange={(event) => setAuthority(event.target.value as CharterAuthority)}><option value="explain">Explain only</option><option value="propose">Ask before every move</option><option value="one_move">Allow one approved move</option></select></label>{error && <p className="charter-error" role="alert">{error}</p>}<button type="button" className="charter-save" onClick={save}>Save charter</button></section>;

  return <section className="play-charter" aria-labelledby="charter-title"><header><span id="charter-title">Your play charter</span><button type="button" onClick={() => setEditing(true)}>Edit</button></header><strong>{state.playCharter.objective}</strong><p>{state.playCharter.constraints.length ? state.playCharter.constraints.join(" · ") : "No additional constraints yet."}</p><small>{authorityLabel(state.playCharter.authority)}</small></section>;
}

function authorityLabel(authority: CharterAuthority) {
  return authority === "explain" ? "Agent explains only" : authority === "one_move" ? "One approved move may be played" : "Agent asks before every move";
}

function MatchFoundation({ state, webMcpStatus, onUndo, onHint, onSave, onLoad, onExport, onImport }: Pick<Props, "state" | "webMcpStatus" | "onUndo" | "onHint" | "onSave" | "onLoad" | "onExport" | "onImport">) {
  const [slot, setSlot] = useState(1);
  const input = useRef<HTMLInputElement>(null);
  const insights = getMatchInsights(state);
  const humanTurn = state.status === "awaiting_human";
  const turnCopy = state.status === "finished" ? state.result?.label ?? "Match complete" : state.status === "agent_proposed" ? "Your approval" : humanTurn ? "Your move" : state.mode === "agent" ? "Agent is reading" : "Zentic is thinking";

  return <section className="companion-foundation" aria-label="Live board state">
    <div className="companion-turn">
      <div><span>Board / {String(state.positionVersion + 1).padStart(2, "0")}</span><strong>{turnCopy}</strong></div>
      <i className={`companion-turn-dot ${state.status}`} aria-hidden="true" />
    </div>
    {state.mode === "agent" && <p className={`webmcp-status ${webMcpStatus}`} role="status" aria-live="polite">{webMcpStatus === "ready" ? "WebMCP connected" : webMcpStatus === "registering" ? "Connecting WebMCP" : webMcpStatus === "error" ? "WebMCP unavailable — chat still works" : "WebMCP unavailable in this browser"}</p>}
    <dl className="companion-facts">
      <div><dt>Ply</dt><dd>{state.history.length || "—"}</dd></div>
      <div><dt>Edge</dt><dd>{insights.materialLabel.replace("Level material", "Even")}</dd></div>
    </dl>
    <div className="companion-actions" aria-label="Quick game actions">
      <button type="button" onClick={onUndo} disabled={!state.history.length}><Rewind size={16} /> Undo</button>
      <button type="button" onClick={onHint} disabled={!humanTurn}><Lightbulb size={16} /> Hint</button>
      <details className="match-tools">
        <summary>Archive</summary>
        <div className="match-tools-content">
          <fieldset><legend>Save slot</legend><div className="slot-picker">{[1, 2, 3].map((value) => <button key={value} type="button" aria-pressed={slot === value} onClick={() => setSlot(value)}>Slot {value}</button>)}</div></fieldset>
          <div className="tool-actions"><button type="button" onClick={() => onSave(slot)}><FloppyDisk size={15} /> Save</button><button type="button" onClick={() => onLoad(slot)}><TrayArrowDown size={15} /> Load</button><button type="button" onClick={onExport}><DownloadSimple size={15} /> Export PGN</button><input ref={input} className="pgn-input" type="file" accept=".pgn,application/x-chess-pgn,text/plain" aria-label="Choose a PGN file to import" onChange={async (event) => { const file = event.target.files?.[0]; if (file) onImport(await file.text()); event.currentTarget.value = ""; }} /><button type="button" onClick={() => input.current?.click()}><UploadSimple size={15} /> Import PGN</button></div>
        </div>
      </details>
    </div>
  </section>;
}

function GamePrompt({ state, onShowRecord }: { state: MatchState; onShowRecord: () => void }) {
  const lastMove = state.history.at(-1);
  const isFinished = state.status === "finished";
  const title = isFinished ? state.result?.label ?? "Match complete" : state.status === "awaiting_human" ? "Your move." : "Zentic is thinking.";
  const detail = isFinished ? lastMove ? `${lastMove.san} sealed the game.` : state.result?.detail ?? "The board is complete." : state.status === "awaiting_human" ? "The board is waiting for your next idea." : "The computer is reading the position.";
  return <section className={`companion-empty-state ${isFinished ? "match-moment complete" : "match-moment"}`}><span>{isFinished ? "Match complete" : "Solo board"}</span><i aria-hidden="true">{isFinished ? "♛" : "♞"}</i><h2>{title}</h2><p>{detail}</p>{isFinished && lastMove && <button type="button" className="moment-review" onClick={onShowRecord}>See the line <ArrowRight size={16} /></button>}</section>;
}

function MatchRecord({ state }: { state: MatchState }) {
  const recentMoves = state.history.slice(-8).reverse();
  return <section className="match-record" aria-labelledby="match-record-title"><header><span>Match line</span><h2 id="match-record-title">{state.history.length ? "Moves so far" : "The game has not started"}</h2></header>{recentMoves.length ? <ol>{recentMoves.map((move) => <li key={move.id}><span>{move.color === "w" ? "White" : "Black"}</span><strong>{move.san}</strong><code>{move.from}–{move.to}</code></li>)}</ol> : <p className="record-empty">Your moves will collect here — never more than the current game needs.</p>}</section>;
}

function TracePanel({ entries, onClose }: { entries: MatchState["mcpTrace"]; onClose: () => void }) {
  return <section className="mcp-trace-panel" aria-label="MCP activity"><header><div><span>Tool trace</span><p>Real board checks and permitted actions only.</p></div><button type="button" onClick={onClose} aria-label="Close MCP activity"><X size={17} /></button></header><ol className="mcp-trace">{entries.length ? entries.slice().reverse().map((entry) => <li key={entry.id}><span className={entry.status}>{entry.status === "complete" ? "✓" : "!"}</span><code>{entry.tool}</code><small>Board v{entry.positionVersion}</small></li>) : <li className="mcp-trace-empty">Tool calls appear here only when the agent actually checks the board or acts with permission.</li>}</ol></section>;
}

function MoveProposal({ proposal, policy, receipt, canGrantConsent, consented, onGrantConsent, onApply, onDismiss }: { proposal: AgentProposal; policy: MatchState["sessionPolicy"]; receipt?: DecisionReceipt; canGrantConsent: boolean; consented: boolean; onGrantConsent: () => void; onApply: (proposal: AgentProposal) => void; onDismiss: (proposal: AgentProposal) => void }) {
  return <section className="proposal-card" aria-label="Agent move proposal"><div className="proposal-marker"><Robot size={21} weight="fill" /><span>PROPOSAL / v{proposal.positionVersion}</span></div><h3>{proposal.move.san}</h3><p>{proposal.explanation}</p><code>{proposal.move.from} to {proposal.move.to}</code>{receipt ? <DecisionReceiptView receipt={receipt} /> : <p className="receipt-missing">The agent must attach a decision receipt before this move can be applied.</p>}<div className="proposal-actions">{receipt && <Button className="bg-[var(--ink)] text-[var(--accent)] hover:bg-[#303027]" onClick={() => onApply(proposal)}><CheckCircle size={17} weight="fill" /> Play now</Button>}{receipt && canGrantConsent && !consented && <Button className="border-[var(--ink)] text-[var(--ink)] hover:bg-[rgba(25,24,19,.1)]" variant="outline" onClick={onGrantConsent}>Grant one move</Button>}<Button className="border-[var(--ink)] text-[var(--ink)] hover:bg-[rgba(25,24,19,.1)]" variant="outline" onClick={() => onDismiss(proposal)}><X size={17} /> Dismiss</Button></div>{consented ? <small><CheckCircle size={14} weight="fill" /> Consent is scoped to this exact move.</small> : policy === "propose_only" && <small><WarningCircle size={14} /> Human confirmation required by match policy.</small>}</section>;
}

function DecisionReceiptView({ receipt }: { receipt: DecisionReceipt }) {
  return <aside className="decision-receipt"><span>Decision receipt</span><strong>{receipt.objective}</strong>{receipt.constraints.length > 0 && <p>Guardrails: {receipt.constraints.join(" · ")}</p>}<p>{receipt.rationale}</p><small>{receipt.toolEvidence.length ? `Verified with ${receipt.toolEvidence.join(", ")}` : "No tool calls were recorded before this receipt."}</small></aside>;
}
