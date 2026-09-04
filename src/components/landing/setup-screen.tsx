import { ArrowLeft } from "@phosphor-icons/react";
import type { MatchConfig } from "../../domain/chess/types";
import { Button } from "../ui/button";
import { SetupPanel } from "./setup-panel";

type Props = {
  onBack: () => void;
  onStart: (config: MatchConfig) => void;
};

export function SetupScreen({ onBack, onStart }: Props) {
  return <div className="setup-route">
    <header className="setup-route-header">
      <button type="button" className="setup-route-brand" onClick={onBack}><span>Z</span><b>ZENTIC</b></button>
      <Button variant="ghost" onClick={onBack}><ArrowLeft size={17} /> Back to preview</Button>
    </header>
    <main><SetupPanel onStart={onStart} /></main>
  </div>;
}
