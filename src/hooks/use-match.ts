import { useEffect, useState, useSyncExternalStore } from "react";
import { MatchController } from "../domain/chess/match-controller";
import { registerMatchTools } from "../integrations/webmcp/register-tools";

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
    const timeout = window.setTimeout(() => controller.playComputerMove(), 650);
    return () => window.clearTimeout(timeout);
  }, [controller, state.mode, state.status]);

  useEffect(() => {
    if (state.timeControl === "untimed" || state.status === "finished") return undefined;
    const interval = window.setInterval(() => controller.tick(), 1_000);
    return () => window.clearInterval(interval);
  }, [controller, state.status, state.timeControl]);

  return { controller, state, webMcpStatus };
}
