import type { Color } from "chess.js";
import type { MatchState, MoveRecord } from "./types";

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export const PIECE_SYMBOLS: Record<string, string> = { p: "♟", n: "♞", b: "♝", r: "♜", q: "♛" };

export type MatchInsights = {
  materialBalance: number;
  materialLabel: string;
  moveCount: number;
  capturedBy: Record<Color, MoveRecord[]>;
  capturedValueBy: Record<Color, number>;
  lastMove?: MoveRecord;
};

export function getCaptureInsights(history: MoveRecord[]) {
  const capturedBy = {
    w: history.filter((move) => move.color === "w" && move.captured),
    b: history.filter((move) => move.color === "b" && move.captured),
  } satisfies Record<Color, MoveRecord[]>;
  const capturedValueBy = {
    w: capturedBy.w.reduce((total, move) => total + (PIECE_VALUES[move.captured ?? ""] ?? 0), 0),
    b: capturedBy.b.reduce((total, move) => total + (PIECE_VALUES[move.captured ?? ""] ?? 0), 0),
  } satisfies Record<Color, number>;
  return { capturedBy, capturedValueBy };
}

export function getMatchInsights(state: Pick<MatchState, "fen" | "history">): MatchInsights {
  const materialBalance = [...state.fen.split(" ")[0]].reduce((score, token) => {
    const value = PIECE_VALUES[token.toLowerCase()] ?? 0;
    return score + (token === token.toUpperCase() ? value : -value);
  }, 0);
  const { capturedBy, capturedValueBy } = getCaptureInsights(state.history);
  const materialLabel = materialBalance === 0 ? "Level material" : materialBalance > 0 ? `White +${materialBalance}` : `Black +${Math.abs(materialBalance)}`;

  return {
    materialBalance,
    materialLabel,
    moveCount: Math.ceil(state.history.length / 2),
    capturedBy,
    capturedValueBy,
    lastMove: state.history.at(-1),
  };
}
