type VoiceCallbacks = {
  onTranscript: (text: string) => void;
  onAgentText: (text: string) => void;
  onStatus: (status: "listening" | "thinking" | "ready") => void;
  onToolCall: (name: string, input: Record<string, unknown>) => unknown | Promise<unknown>;
};

export type VoiceSession = { close: () => void; sendText: (text: string) => void };

export async function connectRealtimeVoice(callbacks: VoiceCallbacks, options: { audio?: boolean } = {}): Promise<VoiceSession> {
  const session = await fetch("/api/realtime/session", { method: "POST" });
  if (!session.ok) throw new Error((await session.json().catch(() => ({ error: "Voice is not configured." }))).error);
  const { clientSecret } = await session.json() as { clientSecret?: string };
  if (!clientSecret) throw new Error("Voice session did not return a client credential.");

  const stream = options.audio === false ? undefined : await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const peer = new RTCPeerConnection();
  const audio = new Audio();
  audio.autoplay = true;
  peer.ontrack = (event) => { audio.srcObject = event.streams[0]; };
  stream?.getTracks().forEach((track) => peer.addTrack(track, stream));

  const channel = peer.createDataChannel("oai-events");
  channel.addEventListener("message", (event) => {
    const message = JSON.parse(event.data) as { type?: string; delta?: string; transcript?: string; name?: string; call_id?: string; arguments?: string };
    if (message.type === "input_audio_buffer.speech_started") callbacks.onStatus("listening");
    if (message.type === "response.created") callbacks.onStatus("thinking");
    if (message.type === "response.output_audio_transcript.delta" && message.delta) callbacks.onAgentText(message.delta);
    if (message.type === "conversation.item.input_audio_transcription.completed" && message.transcript) callbacks.onTranscript(message.transcript);
    if (message.type === "response.function_call_arguments.done" && message.name && message.call_id) {
      void Promise.resolve().then(() => callbacks.onToolCall(message.name!, JSON.parse(message.arguments ?? "{}") as Record<string, unknown>)).then((output) => {
        channel.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: message.call_id, output: JSON.stringify(output) } }));
        channel.send(JSON.stringify({ type: "response.create" }));
      }).catch((error) => {
        channel.send(JSON.stringify({ type: "conversation.item.create", item: { type: "function_call_output", call_id: message.call_id, output: JSON.stringify({ error: error instanceof Error ? error.message : "Action failed." }) } }));
      });
    }
    if (message.type === "response.done") callbacks.onStatus("ready");
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const answer = await fetch("https://api.openai.com/v1/realtime/calls", {
    method: "POST",
    headers: { Authorization: `Bearer ${clientSecret}`, "Content-Type": "application/sdp" },
    body: offer.sdp,
  });
  if (!answer.ok) {
      stream?.getTracks().forEach((track) => track.stop());
    peer.close();
    throw new Error("The voice service could not establish a secure audio connection.");
  }
  await peer.setRemoteDescription({ type: "answer", sdp: await answer.text() });
  callbacks.onStatus("ready");

  return {
    sendText: (text) => {
      channel.send(JSON.stringify({ type: "conversation.item.create", item: { type: "message", role: "user", content: [{ type: "input_text", text }] } }));
      channel.send(JSON.stringify({ type: "response.create" }));
    },
    close: () => { stream?.getTracks().forEach((track) => track.stop()); channel.close(); peer.close(); audio.srcObject = null; },
  };
}
