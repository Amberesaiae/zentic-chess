import { Brain, Clock, Robot, User } from "@phosphor-icons/react";
import type { Color } from "chess.js";
import type { MatchMode, MoveRecord } from "../domain/chess/types";

const symbols: Record<string, string> = { p: "P", n: "N", b: "B", r: "R", q: "Q" };

export function PlayerSlot({ color, humanColor, mode, clock, active, moves }: { color: Color; humanColor: Color; mode: MatchMode; clock: number | null; active: boolean; moves: MoveRecord[] }) {
  const isHuman = color === humanColor;
  const captured = moves.filter((move) => move.color === color && move.captured).map((move) => symbols[move.captured!]);
  const name = isHuman ? "You" : mode === "computer" ? "Practice computer" : "Browser agent";
  const subtitle = isHuman ? `${color === "w" ? "White" : "Black"} pieces` : mode === "computer" ? "Local opponent" : "WebMCP participant";
  const Icon = isHuman ? User : mode === "computer" ? Robot : Brain;
  return <section className={`player-slot ${active ? "active" : ""}`} aria-label={`${name}, ${subtitle}`}><div className="player-avatar"><Icon size={20} weight="fill" /></div><div className="player-identity"><strong>{name}</strong><span>{subtitle}</span></div><div className="capture-tray" aria-label={`${captured.length} captured pieces`}>{captured.length ? captured.map((piece, index) => <b key={`${piece}-${index}`}>{piece}</b>) : <span>No captures</span>}</div><div className="clock"><Clock size={16} weight="fill" /><time>{formatClock(clock)}</time></div></section>;
}

function formatClock(seconds: number | null) { if (seconds === null) return "--:--"; return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`; }
