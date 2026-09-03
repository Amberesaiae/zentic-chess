export type CloudVariation = { moves: string; centipawns?: number; mate?: number };
export type CloudAnalysis = { source: "lichess-cloud"; depth: number; variations: CloudVariation[] };

export async function requestCloudAnalysis(fen: string): Promise<CloudAnalysis | { unavailable: true; reason: string }> {
  const response = await fetch("/api/analysis/cloud", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fen }) });
  const body = await response.json().catch(() => ({ error: "Analysis response was not valid JSON." }));
  if (!response.ok) return { unavailable: true, reason: body.error ?? "Cloud analysis is unavailable for this position." };
  return { source: "lichess-cloud", depth: body.depth, variations: body.pvs.map((variation: { moves: string; cp?: number; mate?: number }) => ({ moves: variation.moves, centipawns: variation.cp, mate: variation.mate })) };
}
