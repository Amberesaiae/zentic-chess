import type { MatchConfig } from "../../domain/chess/types";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { ReviewsPage } from "./reviews-page";
import { SetupModal } from "./setup-modal";
import { useState } from "react";
import type { LandingView } from "./command-sidebar";

export function LandingPage({ onStart }: { onStart: (config: MatchConfig) => void }) {
  const [view, setView] = useState<LandingView>("home");
  const [setupOpen, setSetupOpen] = useState(false);
  const start = (config: MatchConfig) => { setSetupOpen(false); onStart(config); };
  if (view === "how") return <><HowItWorks onNavigate={setView} onPlay={() => setSetupOpen(true)} /><SetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onStart={start} /></>;
  if (view === "reviews") return <><ReviewsPage onNavigate={setView} onPlay={() => setSetupOpen(true)} /><SetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onStart={start} /></>;

  return <div className="landing" id="top"><Hero onPlay={() => setSetupOpen(true)} onNavigate={setView} /><SetupModal open={setupOpen} onClose={() => setSetupOpen(false)} onStart={start} /></div>;
}
