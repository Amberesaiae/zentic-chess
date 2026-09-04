import { ChartLineUp, ClipboardText, Sparkle } from "@phosphor-icons/react";
import { CommandSidebar, type LandingView } from "./command-sidebar";

export function ReviewsPage({ onNavigate, onPlay }: { onNavigate: (view: LandingView) => void; onPlay: () => void }) {
  return <main className="explain-route reviews-route">
    <CommandSidebar activeView="reviews" onNavigate={onNavigate} onPlay={onPlay} />
    <section className="explain-content" aria-labelledby="reviews-title">
      <header><p className="section-kicker">Match reviews</p><h1 id="reviews-title">Return to the moves that changed the game.</h1><p>After a match, Zentic keeps a reviewable record of the board, agent proposals, and the decision you made.</p></header>
      <ol className="explain-steps">
        <li><span className="explain-icon"><ClipboardText size={22} weight="fill" /></span><div><b>Move-by-move record</b><p>Replay the exact position and see the legal context that was available at each turn.</p></div></li>
        <li><span className="explain-icon"><ChartLineUp size={22} weight="fill" /></span><div><b>Evaluation shifts</b><p>Find critical moments and understand how a move changed the position.</p></div></li>
        <li><span className="explain-icon"><Sparkle size={22} weight="fill" /></span><div><b>Agent rationale</b><p>Review what the agent proposed, why it proposed it, and whether you accepted it.</p></div></li>
      </ol>
    </section>
  </main>;
}
