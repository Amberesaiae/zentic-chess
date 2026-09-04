import { ArrowCounterClockwise, Check, X } from "@phosphor-icons/react";
import { useHeroDemo } from "../../hooks/use-hero-demo";
import { DemoBoard } from "./demo-board";

export function ProposalDemo() {
  const demo = useHeroDemo();
  const highlight = demo.stage === "proposed" ? { from: demo.proposal.from, to: demo.proposal.to } : undefined;

  return <section className="proposal-demo" aria-labelledby="demo-title">
    <DemoBoard fen={demo.fen} highlight={highlight} label={`Chess board. ${demo.summary} The agent has marked the squares b1 and c3.`} />
    <div className="demo-detail" aria-live="polite">
      <p className="demo-kicker" id="demo-title">Demonstration. {demo.summary}</p>
      {demo.stage === "proposed" && <>
        <h2>The agent proposes <b translate="no">{demo.proposal.san}</b></h2>
        <p>{demo.proposal.explanation}</p>
        <div className="demo-actions">
          <button className="ui-button primary-button" type="button" onClick={demo.apply}><Check size={16} weight="bold" aria-hidden="true" />Apply the move</button>
          <button className="ui-button quiet-button" type="button" onClick={demo.decline}><X size={16} weight="bold" aria-hidden="true" />Decline</button>
        </div>
      </>}
      {demo.stage === "applied" && <>
        <h2>You applied <b translate="no">{demo.proposal.san}</b></h2>
        <p>The move is on the board and in the record, with the agent&rsquo;s reason attached to it. The board has changed, so any older proposal is now void.</p>
        <button className="ui-button quiet-button" type="button" onClick={demo.restart}><ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />Run it again</button>
      </>}
      {demo.stage === "declined" && <>
        <h2>Declined. Nothing moved.</h2>
        <p>The proposal is gone and the position is untouched. The agent can read the board again and make a different case.</p>
        <button className="ui-button quiet-button" type="button" onClick={demo.restart}><ArrowCounterClockwise size={16} weight="bold" aria-hidden="true" />Run it again</button>
      </>}
    </div>
  </section>;
}
