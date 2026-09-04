import { ArrowRight, Brain, Clock, Robot, ShieldCheck } from "@phosphor-icons/react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { ComputerDifficulty, MatchConfig, MatchMode, SessionPolicy, TimeControl } from "../../domain/chess/types";
import { TIME_CONTROLS } from "../../domain/chess/types";

const difficulties: { id: ComputerDifficulty; label: string }[] = [
  { id: "casual", label: "Learn" }, { id: "club", label: "Club" }, { id: "tactical", label: "Tactical" },
];
const difficultyLabels: Record<ComputerDifficulty, string> = Object.fromEntries(difficulties.map((item) => [item.id, item.label])) as Record<ComputerDifficulty, string>;

export function SetupPanel({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const [mode, setMode] = useState<MatchMode>("computer");
  const [humanColor, setHumanColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<ComputerDifficulty>("club");
  const [timeControl, setTimeControl] = useState<TimeControl>("rapid_10");
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>("propose_only");
  const time = TIME_CONTROLS[timeControl];

  return <form className="match-composer" data-testid="game-setup" onSubmit={(event) => { event.preventDefault(); onStart({ mode, humanColor, difficulty, timeControl, sessionPolicy }); }}>
    <fieldset className="composer-stage"><legend>Choose your opponent</legend><div className="opponent-choices">
      <Choice active={mode === "computer"} onClick={() => setMode("computer")} icon={<Robot size={24} weight="fill" />} title="Practice computer" detail="Play a focused local game." />
      <Choice active={mode === "agent"} onClick={() => setMode("agent")} icon={<Brain size={24} weight="fill" />} title="Browser agent" detail="Get visible, reviewable help." />
    </div></fieldset>

    <div className="composer-controls">
      <fieldset className="composer-stage"><legend>Your side</legend><div className="composer-toggle side-picker">
        <button type="button" className={humanColor === "w" ? "is-selected" : ""} aria-pressed={humanColor === "w"} onClick={() => setHumanColor("w")}>White</button>
        <button type="button" className={humanColor === "b" ? "is-selected" : ""} aria-pressed={humanColor === "b"} onClick={() => setHumanColor("b")}>Black</button>
      </div></fieldset>
      <fieldset className="composer-stage"><legend>Clock</legend><div className="composer-toggle time-toggle">
        {(Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][]).map(([id, control]) => <button key={id} type="button" className={timeControl === id ? "is-selected" : ""} aria-pressed={timeControl === id} onClick={() => setTimeControl(id)}><Clock size={15} /> {control.label}</button>)}
      </div></fieldset>
    </div>

    <fieldset className="composer-stage composer-policy"><legend>{mode === "computer" ? "Playing strength" : "Agent control"}</legend>
      {mode === "computer" ? <div className="composer-toggle">{difficulties.map((item) => <button key={item.id} type="button" className={difficulty === item.id ? "is-selected" : ""} aria-pressed={difficulty === item.id} onClick={() => setDifficulty(item.id)}>{item.label}</button>)}</div> : <div className="composer-toggle agent-toggle"><button type="button" className={sessionPolicy === "propose_only" ? "is-selected" : ""} aria-pressed={sessionPolicy === "propose_only"} onClick={() => setSessionPolicy("propose_only")}><ShieldCheck size={17} weight="fill" /> Review every move</button><button type="button" className={sessionPolicy === "agent_may_play" ? "is-selected" : ""} aria-pressed={sessionPolicy === "agent_may_play"} onClick={() => setSessionPolicy("agent_may_play")}>Allow validated play</button></div>}
    </fieldset>

    <footer className="composer-footer"><p><b>{mode === "computer" ? difficultyLabels[difficulty] : "Agent review"} match</b><span>{humanColor === "w" ? "White" : "Black"} · {time.label}</span></p><button className="composer-start" type="submit">Start match <ArrowRight size={18} weight="bold" /></button></footer>
  </form>;
}

function Choice({ active, onClick, icon, title, detail }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; detail: string }) {
  return <button type="button" className={`opponent-choice ${active ? "is-selected" : ""}`} aria-pressed={active} onClick={onClick}><span>{icon}</span><b>{title}</b><small>{detail}</small></button>;
}
