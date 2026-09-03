import { Brain, Robot } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { MatchMode } from "../domain/chess/types";

export function OpponentSelector({ mode, onChange }: { mode: MatchMode; onChange: (mode: MatchMode) => void }) {
  return <SetupFieldset legend="Opponent"><div className="mode-options"><OpponentOption active={mode === "computer"} onClick={() => onChange("computer")} icon={<Robot size={25} weight="fill" />} title="Practice computer" detail="A local, clearly labelled opponent for normal games." /><OpponentOption active={mode === "agent"} onClick={() => onChange("agent")} icon={<Brain size={25} weight="fill" />} title="Browser agent" detail="An agent reads the board and makes its case through WebMCP." /></div></SetupFieldset>;
}

function OpponentOption({ active, onClick, icon, title, detail }: { active: boolean; onClick: () => void; icon: ReactNode; title: string; detail: string }) {
  return <button className={`mode-card ${active ? "active" : ""}`} type="button" onClick={onClick}><span>{icon}</span><b>{title}</b><small>{detail}</small></button>;
}

export function SetupFieldset({ legend, children }: { legend: string; children: ReactNode }) {
  return <fieldset><legend>{legend}</legend>{children}</fieldset>;
}
