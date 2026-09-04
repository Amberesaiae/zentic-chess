import { ArrowRight, Brain, ChartLineUp, Check, Play, ShieldCheck, Sparkle } from "@phosphor-icons/react";
import { CommandSidebar, type LandingView } from "./command-sidebar";
import { ProposalDemo } from "./proposal-demo";

export function HeroScene({ onPlay, onNavigate }: { onPlay: () => void; onNavigate: (view: LandingView) => void }) {
  return <div className="home-deck" aria-label="Zentic chess command deck">
    <img className="home-deck-art" src="/assets/zentic-command-hero-no-sidebar.webp" alt="Chess board with a player hand and Zentic agent analysis." width="1586" height="992" fetchPriority="high" />
    <div className="home-deck-vignette" aria-hidden="true" />
    <CommandSidebar activeView="home" onNavigate={onNavigate} onPlay={onPlay} />

    {/* Main Command Stage Content */}
    <div className="home-stage-container">
      {/* Left Column: Brand Identity & Value Proposition */}
      <section className="home-headline-card" aria-labelledby="home-hero-title">
        <div className="home-badge-row">
          <span className="home-tag"><Sparkle size={13} weight="fill" aria-hidden="true" /> WEBMCP CHESS AGENT</span>
          <span className="home-pill-legal"><ShieldCheck size={14} weight="bold" aria-hidden="true" /> 100% Legal Moves</span>
        </div>

        <h1 id="home-hero-title">A Chess Agent You Can Audit.</h1>
        <p className="home-lead">
          Play with an AI coach that acts through strict game rules. Every move is verified by WebMCP, proposed with plain-English tactical rationale, and applied only with your explicit consent.
        </p>

        <div className="home-cta-row">
          <button type="button" className="home-cta-primary" onClick={onPlay}>
            <Play size={18} weight="fill" aria-hidden="true" />
            <span>Start a Match</span>
          </button>
          <button type="button" className="home-cta-secondary" onClick={() => onNavigate("how")}>
            <span>How it works</span>
            <ArrowRight size={16} weight="bold" aria-hidden="true" />
          </button>
        </div>

        {/* Feature Signals */}
        <div className="home-feature-stats" aria-label="Agent core guarantees">
          <div className="stat-box">
            <strong>01 / Read</strong>
            <span>Direct FEN &amp; legal state via WebMCP</span>
          </div>
          <div className="stat-box">
            <strong>02 / Explain</strong>
            <span>Verifiable strategic rationale for every move</span>
          </div>
          <div className="stat-box">
            <strong>03 / Consent</strong>
            <span>Zero autonomous moves without your permission</span>
          </div>
        </div>
      </section>

      {/* Right Column: Live Interactive Proposal Sandbox & Agent Telemetry */}
      <div className="home-interactive-deck">
        <div className="home-deck-topbar">
          <div className="home-agent-status-pill">
            <span className="status-indicator-dot" aria-hidden="true" />
            <Brain size={16} weight="fill" aria-hidden="true" />
            <span>Agent Active &bull; v1.0.0</span>
          </div>
          <div className="home-eval-badge">
            <ChartLineUp size={15} weight="bold" aria-hidden="true" />
            <span>Eval: +0.38</span>
          </div>
        </div>

        {/* Interactive Proposal Demo Board with Apply/Decline */}
        <ProposalDemo />
      </div>
    </div>
  </div>;
}
