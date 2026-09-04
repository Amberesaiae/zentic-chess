const claims = [
  { title: "Not an engine", detail: "The practice opponent is a small local routine and the interface says so. Nothing here is Stockfish wearing another name." },
  { title: "Not a chatbot beside a board", detail: "The agent acts through the game's own rules or it does not act. There is no side channel that quietly edits the position." },
  { title: "Not a claim about one model", detail: "Bring the agent client you already trust. Zentic gives it the board, the rules, and a record it cannot rewrite." },
];

export function HonestScope() {
  return <section className="honest-scope" id="honest-scope" aria-labelledby="honest-scope-title">
    <figure>
      <img src="/assets/zentic-queen-study.png" alt="A white queen resting on a dark stone base, lit from one side." width="1129" height="1411" loading="lazy" />
    </figure>
    <div className="scope-copy">
      <h2 id="honest-scope-title">What Zentic is not</h2>
      <dl>
        {claims.map((claim) => <div key={claim.title}>
          <dt>{claim.title}</dt>
          <dd>{claim.detail}</dd>
        </div>)}
      </dl>
    </div>
  </section>;
}
