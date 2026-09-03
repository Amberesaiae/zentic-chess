import { startTransition, useState } from "react";
import { Lobby } from "./components/lobby";
import { MatchScreen } from "./components/match-screen";
import type { AgentProposal, MatchConfig } from "./domain/chess/types";
import { useMatch } from "./hooks/use-match";
import { createAgentActions } from "./domain/chess/agent-actions";

export default function App() {
  const { controller, state, webMcpStatus } = useMatch();
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string>();
  const [screen, setScreen] = useState<"lobby" | "match">("lobby");
  const legalMoves = controller.listLegalMoves();
  const agentActions = createAgentActions(controller);

  function safely(action: () => void) {
    try {
      setError(undefined);
      startTransition(action);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That action could not be completed.");
    }
  }

  function applyProposal(proposal: AgentProposal) {
    safely(() => controller.applyProposal(proposal.id, state.positionVersion, "human"));
  }

  function startMatch(config: MatchConfig) {
    safely(() => controller.reset(config));
    setFlipped(config.humanColor === "b");
    setScreen("match");
  }

  if (screen === "lobby") return <Lobby onStart={startMatch} />;

  return <MatchScreen state={state} legalMoves={legalMoves} webMcpStatus={webMcpStatus} actions={agentActions} flipped={flipped} error={error} onFlip={() => setFlipped((current) => !current)} onReset={() => safely(() => controller.reset())} onLobby={() => setScreen("lobby")} onMove={(from, to) => safely(() => controller.submitHumanMove({ from, to }))} onApplyProposal={applyProposal} onDismissProposal={(proposal) => safely(() => controller.dismissProposal(proposal.id))} onDismissError={() => setError(undefined)} />;
}
