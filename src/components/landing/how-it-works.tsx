import { ArrowRight, CheckCircle, Eye, Lock, Microphone, ShieldCheck, Sparkle, Toolbox, User } from "@phosphor-icons/react";
import { CommandSidebar, type LandingView } from "./command-sidebar";

export function HowItWorks({ onNavigate, onPlay }: { onNavigate: (view: LandingView) => void; onPlay: () => void }) {
  return <main className="explain-route">
    <CommandSidebar activeView="how" onNavigate={onNavigate} onPlay={onPlay} />
    <article className="explain-scroll-canvas">
      <section className="explain-hero-banner" aria-labelledby="how-title">
        <p className="explain-tag">HOW IT WORKS</p>
        <h1 id="how-title">A visible, permissioned loop between you, the board, and the agent.</h1>
        <p className="explain-lead">
          Zentic replaces opaque chess bot black-boxes with a transparent cycle: you make a move, WebMCP extracts structured state, and the AI coach analyzes and proposes verified ideas with full rationale.
        </p>
      </section>

      {/* Featured Diagram Card */}
      <section className="explain-diagram-section" aria-label="Architecture diagram">
        <figure className="explain-diagram-figure">
          <img
            src="/assets/zentic-how-it-works-diagram.png"
            alt="Zentic How It Works: 1. You play (e4), 2. MCP reads structured position and legal moves, 3. Agent responds with suggested move Nf6 and written rationale."
            className="explain-diagram-img"
          />
          <figcaption className="explain-diagram-caption">
            <strong>The Three-Stage Loop:</strong> You play &rarr; WebMCP provides verified board context &rarr; Zentic agent explains and proposes with human confirmation.
          </figcaption>
        </figure>
      </section>

      {/* Three Pillars Breakdown */}
      <section className="explain-pillars-section" aria-labelledby="pillars-title">
        <h2 id="pillars-title" className="explain-section-heading">The Three Core Stages</h2>
        <div className="explain-pillars-grid">
          <div className="explain-pillar-card">
            <div className="pillar-badge">01</div>
            <div className="pillar-header">
              <span className="pillar-icon"><User size={22} weight="fill" /></span>
              <h3>You Play</h3>
            </div>
            <p>Every move you make is recorded immediately on the live board and increments the official position version counter.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> Validated against live FEN and legal move generators</li>
              <li><CheckCircle size={15} weight="fill" /> Generates position version v1, v2, v3...</li>
              <li><CheckCircle size={15} weight="fill" /> Clocks and captured material update in real time</li>
            </ul>
          </div>

          <div className="explain-pillar-card highlighted">
            <div className="pillar-badge">02</div>
            <div className="pillar-header">
              <span className="pillar-icon"><Toolbox size={22} weight="fill" /></span>
              <h3>MCP Connects</h3>
            </div>
            <p>WebMCP exposes structured tool APIs directly to the LLM agent — never hallucinating moves from raw pixels or guesses.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> <code>read_match</code>: current position, clock &amp; turns</li>
              <li><CheckCircle size={15} weight="fill" /> <code>list_legal_moves</code>: validated move lists</li>
              <li><CheckCircle size={15} weight="fill" /> <code>get_training_state</code>: lesson drills and goals</li>
            </ul>
          </div>

          <div className="explain-pillar-card">
            <div className="pillar-badge">03</div>
            <div className="pillar-header">
              <span className="pillar-icon"><Sparkle size={22} weight="fill" /></span>
              <h3>Agent Responds</h3>
            </div>
            <p>The agent explains positional nuances, recommends candidate ideas, or drafts a move proposal bound to your charter.</p>
            <ul className="pillar-points">
              <li><CheckCircle size={15} weight="fill" /> Plain-English explanations of tactical threats</li>
              <li><CheckCircle size={15} weight="fill" /> Reviewable proposal card on the board</li>
              <li><CheckCircle size={15} weight="fill" /> Zero silent moves: you confirm before anything is played</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Safety & Architecture Pillars */}
      <section className="explain-safety-section" aria-labelledby="safety-title">
        <h2 id="safety-title" className="explain-section-heading">Built-in Safety &amp; Guardrails</h2>
        <div className="explain-safety-grid">
          <div className="safety-item">
            <ShieldCheck size={26} weight="fill" />
            <h4>Version Invalidation</h4>
            <p>If you make a move or undo while the agent is thinking, any previous proposal is automatically invalidated to prevent stale execution.</p>
          </div>
          <div className="safety-item">
            <Lock size={26} weight="fill" />
            <h4>Charter Authority</h4>
            <p>Configure agent permissions per session: <em>Explain only</em>, <em>Ask before every move</em>, or <em>One-move consent</em>. The AI cannot exceed your boundary.</p>
          </div>
          <div className="safety-item">
            <Eye size={26} weight="fill" />
            <h4>Transparent MCP Trace</h4>
            <p>Toggle the MCP tool inspector anytime to audit the real tool calls, parameters, and returned game state.</p>
          </div>
          <div className="safety-item">
            <Microphone size={26} weight="fill" />
            <h4>Private Voice Coach</h4>
            <p>Voice interaction operates on demand in the browser. Audio streams only when you activate the microphone.</p>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="explain-cta-section">
        <div className="explain-cta-box">
          <div>
            <h3>Ready to experience visible AI chess?</h3>
            <p>Try a match with the browser coach or practice against the local computer.</p>
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
