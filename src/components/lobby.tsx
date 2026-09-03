import { ArrowRight } from "@phosphor-icons/react";
import { useState } from "react";
import type { ComputerDifficulty, MatchConfig, MatchMode, SessionPolicy, TimeControl } from "../domain/chess/types";
import { LobbyIntro } from "./lobby-intro";
import { LobbyScene } from "./lobby-scene";
import { OpponentSelector } from "./opponent-selector";
import { RulesSelector } from "./rules-selector";
import { SideSelector } from "./side-selector";
import { TimeControlSelector } from "./time-control-selector";
import { Button } from "./ui-button";

export function Lobby({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const [mode, setMode] = useState<MatchMode>("computer");
  const [humanColor, setHumanColor] = useState<"w" | "b">("w");
  const [difficulty, setDifficulty] = useState<ComputerDifficulty>("club");
  const [timeControl, setTimeControl] = useState<TimeControl>("rapid_10");
  const [sessionPolicy, setSessionPolicy] = useState<SessionPolicy>("propose_only");

  return <main className="lobby-shell">
    <header className="lobby-header"><div className="wordmark"><span aria-hidden="true">Z</span><b>ZENTIC</b><i /> <small>CHESS, SHARED WITH AGENTS</small></div><span className="lobby-version">A thoughtful way to play online</span></header>
    <section className="lobby-hero" aria-labelledby="lobby-title">
      <LobbyIntro />
      <LobbyScene />
    </section>
    <form className="setup-panel" id="game-setup" data-testid="game-setup" onSubmit={(event) => { event.preventDefault(); onStart({ mode, humanColor, difficulty, timeControl, sessionPolicy }); }}>
        <div className="setup-panel-heading"><h2>New game</h2><p>Set the board. The match record begins with your first move.</p></div>
        <OpponentSelector mode={mode} onChange={setMode} />
        <SideSelector color={humanColor} onChange={setHumanColor} />
        <TimeControlSelector value={timeControl} onChange={setTimeControl} />
        <RulesSelector mode={mode} difficulty={difficulty} sessionPolicy={sessionPolicy} onDifficultyChange={setDifficulty} onPolicyChange={setSessionPolicy} />
        <Button className="start-button" type="submit">Begin game <ArrowRight size={18} /></Button>
    </form>
  </main>;
}
