import { SetupFieldset } from "./opponent-selector";

export function SideSelector({ color, onChange }: { color: "w" | "b"; onChange: (color: "w" | "b") => void }) {
  return <SetupFieldset legend="Your pieces"><div className="side-options"><button className={color === "w" ? "selected" : ""} type="button" onClick={() => onChange("w")}><span className="piece-token white-piece" aria-hidden="true">K</span><span><b>White</b><small>You make the first move.</small></span></button><button className={color === "b" ? "selected" : ""} type="button" onClick={() => onChange("b")}><span className="piece-token black-piece" aria-hidden="true">K</span><span><b>Black</b><small>You respond from the far side.</small></span></button></div></SetupFieldset>;
}
