import { ChartLine, DownloadSimple, FloppyDisk, Lightbulb, MagnifyingGlassPlus, Rewind, Target, TrayArrowDown, UploadSimple } from "@phosphor-icons/react";
import { useRef, useState } from "react";
import { getMatchInsights } from "../domain/chess/match-insights";
import type { MatchState } from "../domain/chess/types";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

type Props = { state: MatchState; onUndo: () => void; onHint: () => void; onSave: (slot: number) => void; onLoad: (slot: number) => void; onExport: () => void; onImport: (pgn: string) => void };

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="match-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>;
}

export function GameControlDock({ state, onUndo, onHint, onSave, onLoad, onExport, onImport }: Props) {
  const [slot, setSlot] = useState(1);
  const input = useRef<HTMLInputElement>(null);
  const insights = getMatchInsights(state);
  const activePlayer = state.turn === "w" ? "White" : "Black";
  return <aside className="game-control-dock" aria-label="Game controls">
    <Tabs defaultValue="game" className="control-tabs-root">
      <TabsList className="control-tabs" aria-label="Game panels"><TabsTrigger value="game">Match</TabsTrigger><TabsTrigger value="analysis">Position</TabsTrigger><TabsTrigger value="library">Record</TabsTrigger></TabsList>
      <TabsContent value="game" className="control-panel">
        <Card className="match-summary-card"><CardContent className="match-summary-content"><div><span className="eyebrow">Live match</span><strong>{activePlayer} to move</strong></div><span className={`turn-dot ${state.status}`} aria-label={`${activePlayer} to move`} /></CardContent></Card>
        <div className="metric-grid" aria-label="Live match analytics"><Metric label="Moves" value={String(insights.moveCount)} detail={`${state.history.length} ply logged`} /><Metric label="Material" value={insights.materialLabel} detail={`White captured ${insights.capturedValueBy.w} · Black ${insights.capturedValueBy.b}`} /></div>
      <div className="control-grid">
        <Button variant="outline" onClick={onUndo} disabled={state.history.length === 0}><Rewind size={17} /> Undo</Button>
        <Button variant="outline" onClick={onHint} disabled={state.status !== "awaiting_human"}><Lightbulb size={17} /> Hint</Button>
        <Button variant="outline" onClick={() => onSave(slot)}><FloppyDisk size={17} /> Save</Button>
        <Button variant="outline" onClick={() => onLoad(slot)}><TrayArrowDown size={17} /> Load</Button>
      </div>
        <div className="save-slots" aria-label="Browser save slots">{[1, 2, 3].map((value) => <Button type="button" variant={slot === value ? "secondary" : "ghost"} size="sm" onClick={() => setSlot(value)} key={value}>Slot {value}</Button>)}</div>
      </TabsContent>
      <TabsContent value="analysis" className="control-panel"><Card className="analysis-card"><CardContent><div className="panel-heading"><ChartLine size={20} weight="fill" /><div><span className="eyebrow">Position read</span><strong>{insights.materialLabel}</strong></div></div><div className="analysis-list"><p><span>Move</span><b>{insights.lastMove?.san ?? "Opening position"}</b></p><p><span>Captured</span><b>{insights.capturedBy.w.length + insights.capturedBy.b.length} pieces</b></p><p><span>Side to move</span><b>{activePlayer}</b></p></div><p className="analysis-note">This is a board-state read, not a fake engine evaluation. Connect an engine later for depth, lines, and accuracy scores.</p><Button variant="outline" onClick={onHint} disabled={state.status !== "awaiting_human"}><MagnifyingGlassPlus size={17} /> Show a legal move</Button></CardContent></Card></TabsContent>
      <TabsContent value="library" className="control-panel"><Card className="record-card"><CardContent><div className="panel-heading"><Target size={20} weight="fill" /><div><span className="eyebrow">Portable record</span><strong>PGN study file</strong></div></div><p>Export this actual match for review in a chess study tool, or resume a standard PGN here.</p><div className="record-actions"><Button onClick={onExport}><DownloadSimple size={17} /> Export PGN</Button><input ref={input} className="pgn-input" type="file" accept=".pgn,application/x-chess-pgn,text/plain" aria-label="Choose a PGN file to import" onChange={async (event) => { const file = event.target.files?.[0]; if (file) onImport(await file.text()); event.currentTarget.value = ""; }} /><Button variant="outline" onClick={() => input.current?.click()}><UploadSimple size={17} /> Import PGN</Button></div></CardContent></Card></TabsContent>
    </Tabs>
  </aside>;
}
