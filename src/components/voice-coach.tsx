import { Microphone, StopCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { connectRealtimeVoice, type VoiceSession } from "../integrations/voice/realtime-voice";
import type { AgentActions } from "../domain/chess/agent-actions";
import { Button } from "./ui-button";

export function VoiceCoach({ actions }: { actions: AgentActions }) {
  const [session, setSession] = useState<VoiceSession>();
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "thinking" | "ready" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  async function start() {
    try {
      setStatus("connecting");
      setTranscript("");
      setReply("");
      const voice = await connectRealtimeVoice({
        onTranscript: setTranscript,
        onAgentText: (text) => setReply((current) => current + text),
        onStatus: setStatus,
        onToolCall: (name, input) => {
          if (name === "read_match") return actions.readMatch();
          if (name === "list_legal_moves") return actions.listLegalMoves(number(input.expectedVersion));
          if (name === "start_training_scenario") return actions.startTrainingScenario("scandinavian-queen-chase");
          if (name === "post_agent_note") return actions.addNote(number(input.expectedVersion), string(input.text), input.kind === "status" ? "status" : "analysis");
          throw new Error(`Voice coach cannot perform ${name}.`);
        },
      });
      setSession(voice);
    } catch (error) {
      setStatus("error");
      setReply(error instanceof Error ? error.message : "Voice could not start.");
    }
  }

  function stop() {
    session?.close();
    setSession(undefined);
    setStatus("idle");
  }

  return <section className="voice-coach" aria-label="Live voice coach">
    <div><span className={`voice-indicator ${status}`} aria-hidden="true" /><strong>Talk to your coach</strong><p>{status === "idle" ? "Ask for a position, a drill, or one clear explanation." : status === "error" ? reply : status === "thinking" ? "Thinking through the position..." : status === "listening" ? "Listening" : status === "connecting" ? "Connecting securely..." : "Listening and ready to respond."}</p></div>
    {session ? <Button className="quiet-button icon-button" onClick={stop} aria-label="Stop voice coach" title="Stop voice coach"><StopCircle size={19} weight="fill" /></Button> : <Button className="primary-button voice-button" onClick={() => void start()} disabled={status === "connecting"}><Microphone size={18} weight="fill" /> Talk</Button>}
    {(transcript || (reply && status !== "error")) && <div className="voice-transcript"><span>{transcript ? "You" : "Coach"}</span><p>{transcript || reply}</p></div>}
  </section>;
}

function string(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected text from the voice coach.");
  return value;
}

function number(value: unknown) {
  if (typeof value !== "number") throw new Error("Expected a position version from the voice coach.");
  return value;
}
