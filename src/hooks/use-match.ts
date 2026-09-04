import { useEffect, useState, useSyncExternalStore } from "react";
import { MatchController } from "../domain/chess/match-controller";
import { registerMatchTools } from "../integrations/webmcp/register-tools";
import { requestCloudAnalysis } from "../integrations/analysis/cloud-analysis";

export function useMatch() {
  const [controller] = useState(() => new MatchController());
  const [webMcpStatus, setWebMcpStatus] = useState<"unavailable" | "registering" | "ready" | "error">("unavailable");
  const state = useSyncExternalStore(controller.subscribe.bind(controller), controller.getSnapshot, controller.getSnapshot);

  useEffect(() => {
    if (state.mode !== "agent") {
      setWebMcpStatus("unavailable");
      return undefined;
    }
    return registerMatchTools(controller, setWebMcpStatus);
  }, [controller, state.mode]);

  useEffect(() => {
    if (state.mode !== "computer" || state.status !== "awaiting_agent") return undefined;
    let cancelled = false;
    const startedAt = performance.now();
    const minimumCadence = state.timeControl === "blitz_5" ? 260 : state.timeControl === "rapid_10" ? 1_050 : 1_250;
    void replyWithPracticeEngine({ controller, fen: state.fen, difficulty: state.difficulty, minimumCadence, startedAt }).then((move) => {
      if (!cancelled) controller.playComputerMove(move);
    });
    return () => { cancelled = true; };
  }, [controller, state.difficulty, state.fen, state.mode, state.status, state.timeControl]);

  useEffect(() => {
    if (state.timeControl === "untimed" || state.status === "finished") return undefined;
    const interval = window.setInterval(() => controller.tick(), 1_000);
    return () => window.clearInterval(interval);
  }, [controller, state.status, state.timeControl]);

  return { controller, state, webMcpStatus };
}

async function replyWithPracticeEngine(input: { controller: MatchController; fen: string; difficulty: "casual" | "club" | "tactical"; minimumCadence: number; startedAt: number }) {
  const analysis = input.difficulty === "casual" ? undefined : await requestCloudAnalysis(input.fen);
  const elapsed = performance.now() - input.startedAt;
  const wait = Math.max(0, input.minimumCadence - elapsed);
  if (wait) await new Promise<void>((resolve) => window.setTimeout(resolve, wait));
  if (!analysis || "unavailable" in analysis) return undefined;
  const uci = analysis.variations[0]?.moves.split(" ")[0];
  if (!uci || !/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return undefined;
  return { from: uci.slice(0, 2) as never, to: uci.slice(2, 4) as never, promotion: uci[4] };
}
