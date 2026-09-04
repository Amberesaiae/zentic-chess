import { ArrowRight, CaretLeft, CaretRight, ChartLineUp, CheckCircle, ClipboardText, ShieldCheck, Sparkle, Trophy } from "@phosphor-icons/react";
import { useState } from "react";
import { CommandSidebar, type LandingView } from "./command-sidebar";

interface ReviewMove {
  ply: number;
  notation: string;
  player: "You" | "Agent";
  eval: string;
  evalNum: number;
  commentary: string;
  badge?: "Best" | "Tactical" | "Mistake" | "Key move";
  boardPreview: string; // ASCII or key indicator
}

const SAMPLE_GAME: ReviewMove[] = [
  { ply: 1, notation: "e4", player: "You", eval: "+0.2", evalNum: 0.2, commentary: "Controls the center squares (d5, f5) and opens lines for White's bishop and queen.", badge: "Best", boardPreview: "Central expansion" },
  { ply: 2, notation: "d5", player: "Agent", eval: "+0.4", evalNum: 0.4, commentary: "Scandinavian Defense: immediate challenge to the white central pawn.", badge: "Key move", boardPreview: "Center contest" },
  { ply: 3, notation: "exd5", player: "You", eval: "+0.4", evalNum: 0.4, commentary: "Accepting the exchange is the classical mainline, forcing Black's queen out early.", badge: "Best", boardPreview: "Capture pawn" },
  { ply: 4, notation: "Qxd5", player: "Agent", eval: "+0.5", evalNum: 0.5, commentary: "Recaptures with queen. The queen is now exposed on d5, allowing White free tempo.", badge: "Key move", boardPreview: "Queen out" },
  { ply: 5, notation: "Nc3", player: "You", eval: "+0.9", evalNum: 0.9, commentary: "Developing the knight with tempo on the black queen. White gains a clear lead in development.", badge: "Tactical", boardPreview: "Tempo development" },
  { ply: 6, notation: "Qa5", player: "Agent", eval: "+1.1", evalNum: 1.1, commentary: "Retreating the queen along the a5-e1 diagonal while avoiding pin lines.", badge: "Best", boardPreview: "Queen safe" },
  { ply: 7, notation: "d4", player: "You", eval: "+1.2", evalNum: 1.2, commentary: "Dominates central space, prepares bishop development to c4 or d3.", badge: "Best", boardPreview: "Space control" },
];

export function ReviewsPage({ onNavigate, onPlay }: { onNavigate: (view: LandingView) => void; onPlay: () => void }) {
  const [selectedPly, setSelectedPly] = useState(5);
  const currentMove = SAMPLE_GAME.find((m) => m.ply === selectedPly) ?? SAMPLE_GAME[4];

  return <main className="explain-route reviews-route">
    <CommandSidebar activeView="reviews" onNavigate={onNavigate} onPlay={onPlay} />
    <article className="explain-scroll-canvas">
      {/* Header */}
      <section className="explain-hero-banner" aria-labelledby="reviews-title">
        <p className="explain-tag">MATCH REVIEWS</p>
        <h1 id="reviews-title">Analyze every decision. Understand every shift.</h1>
        <p className="explain-lead">
          After each game, Zentic generates a deep interactive review: step through the exact moves, inspect engine evaluations, and read the agent’s verified reasoning for every proposed and accepted move.
        </p>
      </section>

      {/* Interactive Reviewer Showcase */}
      <section className="review-showcase-card" aria-label="Interactive game replay preview">
        <div className="review-showcase-header">
          <div>
            <span className="review-badge-accent">SAMPLE MATCH REVIEW</span>
            <h3>Scandinavian Defense &bull; You vs Zentic Coach</h3>
          </div>
          <div className="review-match-result">
            <Trophy size={18} weight="fill" />
            <span>White Won (1-0)</span>
          </div>
        </div>

        <div className="review-interactive-stage">
          {/* Left: Move Timeline Selector */}
          <div className="review-timeline-col">
            <span className="review-col-title" id="moves-sequence-title">MOVE SEQUENCE</span>
            <div className="review-moves-list" role="tablist" aria-labelledby="moves-sequence-title">
              {SAMPLE_GAME.map((m) => (
                <button
                  key={m.ply}
                  type="button"
                  role="tab"
                  id={`review-move-tab-${m.ply}`}
                  aria-selected={m.ply === selectedPly}
                  aria-controls="review-selected-panel"
                  className={`review-move-btn ${m.ply === selectedPly ? "is-selected" : ""}`}
                  onClick={() => setSelectedPly(m.ply)}
                >
                  <span className="move-idx">{Math.ceil(m.ply / 2)}{m.ply % 2 === 1 ? "." : "..."}</span>
                  <strong className="move-san">{m.notation}</strong>
                  <span className="move-player">{m.player}</span>
                  {m.badge && <span className={`move-badge ${m.badge.toLowerCase()}`}>{m.badge}</span>}
                  <span className="move-eval">{m.eval}</span>
                </button>
              ))}
            </div>
            <div className="review-stepper-controls" aria-label="Review timeline controls">
              <button
                type="button"
                className="review-nav-btn"
                disabled={selectedPly <= 1}
                onClick={() => setSelectedPly((prev) => Math.max(1, prev - 1))}
                aria-label="Previous move"
              >
                <CaretLeft size={16} weight="bold" aria-hidden="true" /> Prev
              </button>
              <span className="review-step-count" aria-live="polite" aria-atomic="true">
                {selectedPly} of {SAMPLE_GAME.length}
              </span>
              <button
                type="button"
                className="review-nav-btn"
                disabled={selectedPly >= SAMPLE_GAME.length}
                onClick={() => setSelectedPly((prev) => Math.min(SAMPLE_GAME.length, prev + 1))}
                aria-label="Next move"
              >
                Next <CaretRight size={16} weight="bold" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right: Detailed Move Insight & Evaluation */}
          <div className="review-insight-col" id="review-selected-panel" role="tabpanel" aria-labelledby={`review-move-tab-${selectedPly}`}>
            <div className="review-eval-gauge" role="region" aria-label="Position evaluation gauge">
              <span className="eval-label">STOCKFISH &bull; WEBMCP EVALUATION</span>
              <div
                className="eval-bar-track"
                role="progressbar"
                aria-valuenow={Math.round(Math.min(100, Math.max(0, 50 + currentMove.evalNum * 20)))}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Evaluation gauge: ${currentMove.eval}`}
              >
                <div
                  className="eval-bar-fill"
                  style={{ width: `${Math.min(95, Math.max(10, 50 + currentMove.evalNum * 20))}%` }}
                />
              </div>
              <div className="eval-score-row">
                <strong>Advantage: {currentMove.eval}</strong>
                <span>Position version: v{currentMove.ply}</span>
              </div>
            </div>

            <div className="review-selected-box" aria-live="polite">
              <div className="selected-box-top">
                <span className="selected-move-token" aria-hidden="true">{currentMove.notation}</span>
                <div>
                  <h4>{currentMove.player === "You" ? "Your Move" : "Agent Response"}</h4>
                  <span>Move #{Math.ceil(currentMove.ply / 2)} &bull; {currentMove.boardPreview}</span>
                </div>
              </div>
              <p className="selected-rationale">{currentMove.commentary}</p>
            </div>

            <div className="review-verifiable-note">
              <ShieldCheck size={20} weight="fill" aria-hidden="true" />
              <div>
                <strong>Auditable Rationale</strong>
                <p>Every suggestion is backed by an MCP tool receipt, showing candidate legal moves and safety constraints.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Benefits Cards */}
      <section className="explain-pillars-section" aria-labelledby="benefits-title">
        <h2 id="benefits-title" className="explain-section-heading">Why Post-Game Reviews Matter</h2>
        <div className="explain-pillars-grid">
          <div className="explain-pillar-card">
            <div className="pillar-header">
              <span className="pillar-icon"><ClipboardText size={22} weight="fill" /></span>
              <h3>Move-by-Move Record</h3>
            </div>
            <p>Every ply is indexed with its board version, timestamp, and clock duration so you can recreate the entire game state precisely.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> Jump directly to any turn or critical blunder</li>
              <li><CheckCircle size={15} weight="fill" /> Download complete PGN with full metadata</li>
            </ul>
          </div>

          <div className="explain-pillar-card highlighted">
            <div className="pillar-header">
              <span className="pillar-icon"><ChartLineUp size={22} weight="fill" /></span>
              <h3>Evaluation Shifts</h3>
            </div>
            <p>Track tactical turns and positional advantages. Spot exactly which choice forfeited an initiative or secured a win.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> Instant detection of blunders, mistakes, and best moves</li>
              <li><CheckCircle size={15} weight="fill" /> Material imbalance analytics tracking</li>
            </ul>
          </div>

          <div className="explain-pillar-card">
            <div className="pillar-header">
              <span className="pillar-icon"><Sparkle size={22} weight="fill" /></span>
              <h3>Agent Decision Audits</h3>
            </div>
            <p>Look behind the curtain: see what the agent suggested, why it recommended it, and compare it with the move you played.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> Inspect tool receipts and verify safety guardrails</li>
              <li><CheckCircle size={15} weight="fill" /> Understand opening ideas and long-term structures</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Launch CTA */}
      <section className="explain-cta-section">
        <div className="explain-cta-box">
          <div>
            <h3>Ready to play and review your next game?</h3>
            <p>Play with the AI coach, save your positions, and analyze every decision.</p>
          </div>
          <button type="button" className="explain-cta-btn" onClick={onPlay}>
            <span>Start a match</span>
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </section>
    </article>
  </main>;
}
