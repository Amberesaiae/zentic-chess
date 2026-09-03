import { ArrowDown, Crown } from "@phosphor-icons/react";

export function LobbyIntro() {
  return <div className="lobby-intro">
    <p className="eyebrow">A chess room for clear thinking</p>
    <h1 id="lobby-title">The board is yours.<br />The thinking can be shared.</h1>
    <p>Zentic keeps the game, the conversation, and every agent decision together. Nothing moves without a visible reason.</p>
    <a className="hero-cta" href="#game-setup">Set up a game <ArrowDown size={17} weight="bold" /></a>
    <div className="lobby-note"><Crown size={20} weight="fill" /><span>Your board stays yours. An agent can inspect the position and make a case for its move, but you decide what happens next.</span></div>
  </div>;
}
