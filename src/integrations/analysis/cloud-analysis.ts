export type CloudVariation = { moves: string; centipawns?: number; mate?: number };
export type CloudAnalysis = { source: "lichess-cloud"; depth: number; variations: CloudVariation[] };

export async function requestCloudAnalysis(fen: string, timeoutMs = 2_400): Promise<CloudAnalysis | { unavailable: true; reason: string }> {
  const abortController = new AbortController();
  const timeout = window.setTimeout(() => abortController.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch("/api/analysis/cloud", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fen }), signal: abortController.signal });
  } catch {
    return { unavailable: true, reason: "Cloud analysis did not respond in time." };
  } finally {
    window.clearTimeout(timeout);
  }
  const body = await response.json().catch(() => ({ error: "Analysis response was not valid JSON." }));
  if (!response.ok) return { unavailable: true, reason: body.error ?? "Cloud analysis is unavailable for this position." };
  return { source: "lichess-cloud", depth: body.depth, variations: body.pvs.map((variation: { moves: string; cp?: number; mate?: number }) => ({ moves: variation.moves, centipawns: variation.cp, mate: variation.mate })) };
}
