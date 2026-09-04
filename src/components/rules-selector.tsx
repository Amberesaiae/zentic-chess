import type { ComputerDifficulty, MatchMode, SessionPolicy } from "../domain/chess/types";
import { SetupFieldset } from "./opponent-selector";

const difficulties: { id: ComputerDifficulty; label: string; detail: string }[] = [
  { id: "casual", label: "Learn", detail: "Development-first, forgiving replies" },
  { id: "club", label: "Club", detail: "Looks one reply ahead before it plays" },
  { id: "tactical", label: "Tactical", detail: "Looks deeper for forcing moves and loose material" },
];

export function RulesSelector({ mode, difficulty, sessionPolicy, onDifficultyChange, onPolicyChange }: { mode: MatchMode; difficulty: ComputerDifficulty; sessionPolicy: SessionPolicy; onDifficultyChange: (value: ComputerDifficulty) => void; onPolicyChange: (value: SessionPolicy) => void }) {
  if (mode === "computer") return <SetupFieldset legend="Difficulty"><div className="segmented three">{difficulties.map((item) => <button className={difficulty === item.id ? "selected" : ""} type="button" onClick={() => onDifficultyChange(item.id)} key={item.id}><b>{item.label}</b><span>{item.detail}</span></button>)}</div></SetupFieldset>;
  return <SetupFieldset legend="Agent permissions"><div className="segmented two-line"><button className={sessionPolicy === "propose_only" ? "selected" : ""} type="button" onClick={() => onPolicyChange("propose_only")}><b>Suggest moves</b><span>You review every agent move.</span></button><button className={sessionPolicy === "agent_may_play" ? "selected" : ""} type="button" onClick={() => onPolicyChange("agent_may_play")}><b>Play when ready</b><span>Validated proposals can be committed.</span></button></div></SetupFieldset>;
}
