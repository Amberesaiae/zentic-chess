import { Clock } from "@phosphor-icons/react";
import { TIME_CONTROLS, type TimeControl } from "../domain/chess/types";
import { SetupFieldset } from "./opponent-selector";

export function TimeControlSelector({ value, onChange }: { value: TimeControl; onChange: (value: TimeControl) => void }) {
  return <SetupFieldset legend="Time control"><div className="time-options">{(Object.entries(TIME_CONTROLS) as [TimeControl, typeof TIME_CONTROLS[TimeControl]][]).map(([id, control]) => <button className={value === id ? "selected" : ""} type="button" onClick={() => onChange(id)} key={id}><Clock size={16} /><b>{control.label}</b><span>{control.detail}</span></button>)}</div></SetupFieldset>;
}
