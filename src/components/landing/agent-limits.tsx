import { Check, Prohibit } from "@phosphor-icons/react";

const allowed = [
  "Read the live position and every legal move in it.",
  "Write a short note into the game record for you to read.",
  "Propose one legal move for the position it just read.",
];

const refused = [
  "Move a piece on its own, unless you grant that in setup.",
  "Act on an old position. A proposal dies the moment the board changes.",
  "Reach anything outside this match. There is no account and no wallet here.",
];

export function AgentLimits() {
  return <section className="agent-limits" id="agent-limits" aria-labelledby="agent-limits-title">
    <div className="limits-lede">
      <h2 id="agent-limits-title">The agent plays inside a fence you set</h2>
      <p>Permission is a setting on the game, not a promise in a marketing page. These are the actual boundaries the match enforces.</p>
    </div>
    <div className="limits-columns">
      <div className="limit-column">
        <h3><Check size={17} weight="bold" aria-hidden="true" />What it can do</h3>
        <ul>{allowed.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
      <div className="limit-column denied">
        <h3><Prohibit size={17} weight="bold" aria-hidden="true" />What it cannot do</h3>
        <ul>{refused.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </div>
  </section>;
}
