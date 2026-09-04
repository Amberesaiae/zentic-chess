const steps = [
  { verb: "Reads the position", detail: "The agent connects through WebMCP and receives the exact board and the exact legal move list. It never guesses from a screenshot." },
  { verb: "Proposes one move", detail: "One legal move, tied to the position it just read, with a short written reason. If you move first, the proposal expires instead of landing." },
  { verb: "You apply or decline", detail: "Either outcome is written into the game record with its reason, so the game can be read back move by move afterwards." },
];

export function MoveFlow() {
  return <section className="move-flow" id="how-a-move-happens" aria-labelledby="move-flow-title">
    <h2 id="move-flow-title">How a move happens</h2>
    <ol>
      {steps.map((step, index) => <li key={step.verb}>
        <span className="flow-index" aria-hidden="true">{index + 1}</span>
        <h3>{step.verb}</h3>
        <p>{step.detail}</p>
      </li>)}
    </ol>
  </section>;
}
