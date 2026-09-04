import type { MoveRecord } from "../../domain/chess/types";

export type OpeningIdentity = {
  eco: string;
  name: string;
  pgn: string;
  matchedPly: number;
  librarySize: number;
  source: "lichess-cc0";
};

export type OpeningLookup = {
  positionVersion: number;
  opening: OpeningIdentity | null;
};

/**
 * The position remains the source of truth in the browser. This service only
 * resolves its move history against the CC0 Lichess opening-name corpus.
 */
export async function identifyOpening(input: { positionVersion: number; history: MoveRecord[] }): Promise<OpeningLookup> {
  const response = await fetch("/api/openings/identify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      positionVersion: input.positionVersion,
      moves: input.history.map(({ from, to, promotion }) => ({ from, to, promotion })),
    }),
  });
  const body = await response.json().catch(() => ({})) as Partial<OpeningLookup> & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "The opening library is unavailable right now.");
  if (typeof body.positionVersion !== "number") throw new Error("The opening library returned an invalid result.");
  return { positionVersion: body.positionVersion, opening: body.opening ?? null };
}
