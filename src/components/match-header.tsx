import { ArrowCounterClockwise, ArrowLeft, CaretDown, Flag, Swap } from "@phosphor-icons/react";
import type { MatchState } from "../domain/chess/types";
import { Button } from "./ui-button";

export function MatchHeader({ state, onFlip, onReset, onLobby }: { state: MatchState; onFlip: () => void; onReset: () => void; onLobby: () => void }) {
  const turnLabel = state.status === "finished" ? state.result?.label ?? "Match complete" : state.status === "awaiting_human" ? "Your move" : state.status === "awaiting_agent" ? state.mode === "computer" ? "Computer thinking" : "Waiting for agent" : "Agent proposal ready";
  const matchName = state.mode === "computer" ? "Practice game" : "Agent game";
  return <header className="match-header">
    <div className="wordmark"><span aria-hidden="true">Z</span><b>ZENTIC</b></div>
    <div className="game-identity"><button type="button" onClick={onLobby}>{matchName} <CaretDown size={13} weight="bold" /></button><span>{state.timeControl === "untimed" ? "No clock" : state.timeControl === "rapid_10" ? "10 min" : "5 min"}</span></div>
    <div className="turn-status" aria-live="polite"><Flag size={16} weight="fill" /><strong>{turnLabel}</strong></div>
    <div className="match-actions">
      <Button className="quiet-button icon-button" onClick={onFlip} aria-label="Rotate board" title="Rotate board"><Swap size={18} /></Button>
      <Button className="quiet-button lobby-button" onClick={onLobby}><ArrowLeft size={17} /> Game setup</Button>
      <Button className="primary-button" onClick={onReset}><ArrowCounterClockwise size={17} /> Start over</Button>
    </div>
  </header>;
}
