import { Brain, Clock, Robot, User } from "@phosphor-icons/react";
import type { Color } from "chess.js";
import { getCaptureInsights, PIECE_SYMBOLS } from "../domain/chess/match-insights";
import type { MatchMode, MoveRecord } from "../domain/chess/types";

export function PlayerSlot({ color, humanColor, mode, clock, active, moves }: { color: Color; humanColor: Color; mode: MatchMode; clock: number | null; active: boolean; moves: MoveRecord[] }) {
  const isHuman = color === humanColor;
  const { capturedBy, capturedValueBy } = getCaptureInsights(moves);
  const captured = capturedBy[color];
  const capturedValue = capturedValueBy[color];
  const name = isHuman ? "You" : mode === "computer" ? "Practice computer" : "Browser agent";
  const subtitle = isHuman ? `${color === "w" ? "White" : "Black"} pieces` : mode === "computer" ? "Local opponent" : "WebMCP participant";
  const Icon = isHuman ? User : mode === "computer" ? Robot : Brain;
  return <section className={`player-slot ${active ? "active" : ""}`} aria-label={`${name}, ${subtitle}`}><PlayerIdentity Icon={Icon} name={name} subtitle={subtitle} /><PlayerMaterial captured={captured} value={capturedValue} name={name} /><PlayerClock seconds={clock} /></section>;
}

function PlayerIdentity({ Icon, name, subtitle }: { Icon: typeof User; name: string; subtitle: string }) {
  return <div className="player-identity-module"><span className="player-avatar"><Icon size={20} weight="fill" /></span><span className="player-identity"><strong>{name}</strong><span>{subtitle}</span></span></div>;
}

function PlayerMaterial({ captured, value, name }: { captured: MoveRecord[]; value: number; name: string }) {
  return <div className="player-material" aria-label={`${captured.length} pieces captured by ${name}`}>{captured.length ? <><div className="captured-pieces">{captured.map((move) => <b key={move.id} title={`${move.san}: captured ${move.captured}`} aria-label={`captured ${move.captured}`}>{PIECE_SYMBOLS[move.captured ?? ""]}</b>)}</div><strong>+{value}</strong></> : <span>—</span>}</div>;
}

function PlayerClock({ seconds }: { seconds: number | null }) {
  return <div className="player-clock"><Clock size={16} weight="fill" /><time>{formatClock(seconds)}</time></div>;
}

function formatClock(seconds: number | null) { if (seconds === null) return "--:--"; return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }
