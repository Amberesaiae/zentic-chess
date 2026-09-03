import { Crown } from "@phosphor-icons/react";

export function LobbyIntro() {
  return <div className="lobby-intro">
    <h1>Play a real game.<br />Bring an agent to the table when it helps.</h1>
    <p>Zentic keeps the board, the conversation, and every decision in one place. No invisible moves. No loose chat thread.</p>
    <div className="lobby-note"><Crown size={20} weight="fill" /><span>Your board stays yours. An agent can inspect the position and make a case for its move, but you decide what happens next.</span></div>
  </div>;
}
