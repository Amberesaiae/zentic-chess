import { BracketsCurly, Microphone, PaperPlaneRight, SpeakerHigh, SpeakerSlash, StopCircle } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { connectRealtimeVoice, type VoiceSession } from "../integrations/voice/realtime-voice";
import { runAgentTurn, type AgentContent } from "../integrations/agent/text-agent";
import { identifyOpening } from "../integrations/openings/opening-library";
import type { AgentActions } from "../domain/chess/agent-actions";
import type { TrainingScenarioId } from "../domain/chess/types";

export function VoiceCoach({ actions, onToggleTrace, traceOpen }: { actions: AgentActions; onToggleTrace: () => void; traceOpen: boolean }) {
  const [session, setSession] = useState<VoiceSession>();
  const [status, setStatus] = useState<"idle" | "connecting" | "listening" | "thinking" | "ready" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const [draft, setDraft] = useState("");
  const [voiceReplies, setVoiceReplies] = useState(true);
  const [history, setHistory] = useState<AgentContent[]>([]);
  const [messages, setMessages] = useState<Array<{ actor: "user" | "agent"; text: string }>>([]);
  const [listeningInBrowser, setListeningInBrowser] = useState(false);
  const recognition = useRef<BrowserRecognition | undefined>(undefined);
  const sending = useRef(false);

  useEffect(() => {
    if (status !== "ready" || !reply || !voiceReplies || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(reply));
  }, [status, reply, voiceReplies]);

  async function connect(audio: boolean) {
    if (session) return session;
    setStatus("connecting"); setReply("");
    try {
      const voice = await connectRealtimeVoice({ onTranscript: setTranscript, onAgentText: (text) => setReply((current) => current + text), onStatus: setStatus, onToolCall: (name, input) => executeTool(name, input, actions) }, { audio });
      setSession(voice);
      return voice;
    } catch (error) { setStatus("error"); setReply(error instanceof Error ? error.message : "Agent connection could not start."); return undefined; }
  }
  async function send(textToSend = draft) {
    const text = textToSend.trim(); if (!text || sending.current) return;
    sending.current = true;
    setTranscript(text); setDraft(""); setReply(""); setStatus("thinking");
    setMessages((current) => [...current, { actor: "user", text }]);
    try {
      const fastReply = await fastCoachReply(text, actions);
      if (fastReply) {
        const fastHistory: AgentContent[] = [{ role: "user", parts: [{ text }] }, { role: "model", parts: [{ text: fastReply }] }];
        setHistory((current) => [...current, ...fastHistory].slice(-20));
        setReply(fastReply); setMessages((current) => [...current, { actor: "agent", text: fastReply }]); setStatus("ready");
        return;
      }
      const result = await runAgentTurn({ history, text, execute: (name, input) => executeTool(name, input, actions) });
      const agentReply = result.reply || "I completed the requested board checks.";
      setHistory(result.history); setReply(agentReply); setMessages((current) => [...current, { actor: "agent", text: agentReply }]); setStatus("ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "The agent could not respond.";
      setReply(message); setMessages((current) => [...current, { actor: "agent", text: message }]); setStatus("error");
    } finally { sending.current = false; }
  }
  function startVoiceInput() {
    const Recognition = browserRecognition();
    if (!Recognition) { void connect(true); return; }
    const next = new Recognition();
    recognition.current = next; next.lang = "en-US"; next.interimResults = false; next.continuous = false;
    next.onresult = (event) => { const text = event.results[event.resultIndex]?.[0]?.transcript ?? ""; setListeningInBrowser(false); if (text) void send(text); };
    next.onerror = () => { setListeningInBrowser(false); setStatus("error"); setReply("Voice input could not hear that. You can type your question instead."); };
    next.onend = () => setListeningInBrowser(false);
    setListeningInBrowser(true); setStatus("listening"); next.start();
  }
  function stop() { recognition.current?.stop(); recognition.current = undefined; setListeningInBrowser(false); session?.close(); setSession(undefined); setStatus("idle"); }

  return <section className="agent-chat" aria-label="Agent chat">
    <div className="chat-presence"><span className={`voice-indicator ${status}`} aria-hidden="true" /><div><b>Zentic</b><span>{status === "listening" ? "Listening" : status === "thinking" ? "Thinking" : status === "error" ? "Couldn’t connect" : "Here when you need it"}</span></div><div className="chat-utilities"><button type="button" className="voice-output-toggle" aria-pressed={voiceReplies} aria-label={voiceReplies ? "Mute spoken replies" : "Enable spoken replies"} onClick={() => setVoiceReplies((enabled) => !enabled)}>{voiceReplies ? <SpeakerHigh size={16} /> : <SpeakerSlash size={16} />}</button><button type="button" className="mapping-control" onClick={onToggleTrace} aria-pressed={traceOpen} aria-label={traceOpen ? "Hide MCP activity" : "Show MCP activity"} aria-describedby="mapping-tip"><BracketsCurly size={17} /></button><span id="mapping-tip" className="sr-only">MCP activity shows only the real board checks, tool calls, and permission-bound actions used for this conversation. It does not expose hidden reasoning.</span></div></div>
    <div className="chat-thread" aria-live="polite">
      {!messages.length && !transcript && !reply && <p className="chat-welcome">Ask about the position, request an explanation, or talk through a plan.</p>}
      {messages.map((message, index) => <p className={`chat-bubble ${message.actor}`} key={`${message.actor}-${index}`}>{message.text}</p>)}
      {status === "thinking" && <p className="chat-bubble agent chat-pending" aria-live="polite">Reading the live board…</p>}
      {!messages.length && transcript && <p className="chat-bubble user">{transcript}</p>}
      {!messages.length && reply && <p className="chat-bubble agent">{reply}</p>}
    </div>
    <div className="chat-composer"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void send(); }} placeholder="Ask about this position" aria-label="Message the agent" disabled={status === "thinking"} /><button type="button" className="chat-send" onClick={() => void send()} aria-label="Send message" disabled={status === "thinking"}><PaperPlaneRight size={17} weight="fill" /></button>{session || listeningInBrowser ? <button type="button" className="chat-talk" onClick={stop} aria-label="Stop voice chat"><StopCircle size={18} weight="fill" /></button> : <button type="button" className="chat-talk" onClick={startVoiceInput} aria-label="Start voice chat"><Microphone size={18} weight="fill" /></button>}</div>
  </section>;
}

async function fastCoachReply(text: string, actions: AgentActions) {
  if (!/\b(opening|eco|variation|what line|what are we playing)\b/i.test(text)) return undefined;
  const state = actions.readMatch();
  actions.recordMcpTool("read_match", "complete");
  const identity = await identifyOpening({ positionVersion: state.positionVersion, history: state.history });
  actions.recordMcpTool("identify_opening", "complete");
  if (!identity.opening) return "This move history is not named in the opening library yet. Make one more committed move and I’ll classify it from the actual board record.";
  return `${identity.opening.name} (${identity.opening.eco}). Matched from the first ${identity.opening.matchedPly} ply in the CC0 opening library.`;
}

async function executeTool(name: string, input: Record<string, unknown>, actions: AgentActions) {
  try {
    const result = name === "read_match" ? actions.readMatch()
      : name === "identify_opening" ? await identifyOpening({
        positionVersion: number(input.expectedVersion),
        history: actions.readMatch().history,
      })
      : name === "get_agent_capabilities" ? actions.getCapabilities()
        : name === "prepare_agent_turn" ? actions.prepareAgentTurn()
      : name === "list_legal_moves" ? actions.listLegalMoves(number(input.expectedVersion))
        : name === "post_agent_note" ? actions.addNote(number(input.expectedVersion), string(input.text), input.kind === "status" ? "status" : "analysis")
          : name === "get_play_charter" ? actions.getPlayCharter()
            : name === "update_play_charter" ? actions.updatePlayCharter(number(input.expectedVersion), { objective: string(input.objective), constraints: stringArray(input.constraints), authority: authority(input.authority) })
              : name === "propose_agent_move" ? actions.proposeMove({ expectedVersion: number(input.expectedVersion), from: string(input.from) as never, to: string(input.to) as never, promotion: optionalString(input.promotion), explanation: string(input.explanation) })
                : name === "create_decision_receipt" ? actions.createDecisionReceipt({ expectedVersion: number(input.expectedVersion), proposalId: string(input.proposalId), rationale: optionalString(input.rationale) })
                  : name === "grant_move_consent" ? actions.grantMoveConsent(string(input.proposalId), number(input.expectedVersion))
                    : name === "commit_agent_move" ? actions.commitProposedMove(string(input.proposalId), number(input.expectedVersion))
                      : name === "withdraw_agent_proposal" ? actions.withdrawProposal(string(input.proposalId))
                        : name === "list_training_scenarios" ? actions.availableTraining()
                          : name === "get_training_state" ? actions.getTrainingState()
                            : name === "reveal_training_hint" ? actions.revealTrainingHint(number(input.expectedVersion))
                              : name === "start_training_scenario" ? actions.startTrainingScenario(trainingScenarioId(input.scenarioId))
                      : (() => { throw new Error(`Voice coach cannot perform ${name}.`); })();
    actions.recordMcpTool(name, "complete"); return result;
  } catch (error) { actions.recordMcpTool(name, "failed"); throw error; }
}
function string(value: unknown) { if (typeof value !== "string") throw new Error("Expected text from the voice coach."); return value; }
function number(value: unknown) { if (typeof value !== "number") throw new Error("Expected a position version from the voice coach."); return value; }
function optionalString(value: unknown) { return value === undefined ? undefined : string(value); }
function stringArray(value: unknown) { if (value === undefined) return undefined; if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error("Expected text constraints from the voice coach."); return value; }
function authority(value: unknown) { if (value === "explain" || value === "propose" || value === "one_move") return value; throw new Error("Expected a valid charter authority."); }
function trainingScenarioId(value: unknown): TrainingScenarioId { if (value === "scandinavian-queen-chase" || value === "italian-central-break" || value === "knight-fork" || value === "mate-net") return value; throw new Error("Expected an available training scenario."); }

type BrowserRecognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function browserRecognition() {
  if (typeof window === "undefined") return undefined;
  const candidate = window as Window & typeof globalThis & { SpeechRecognition?: new () => BrowserRecognition; webkitSpeechRecognition?: new () => BrowserRecognition };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition;
}
