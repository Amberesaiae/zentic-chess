export type AgentPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export type AgentContent = { role: "user" | "model"; parts: AgentPart[] };

type AgentResponse = { provider: string; parts: AgentPart[] };

export async function runAgentTurn(input: {
  history: AgentContent[];
  text: string;
  execute: (name: string, args: Record<string, unknown>) => unknown | Promise<unknown>;
}): Promise<{ history: AgentContent[]; reply: string; provider: string }> {
  let contents: AgentContent[] = [...input.history.slice(-18), { role: "user", parts: [{ text: input.text }] }];
  let reply = "";
  let provider = "Gemini";

  for (let round = 0; round < 8; round += 1) {
    const response = await requestAgent(contents);
    provider = response.provider;
    contents = [...contents, { role: "model", parts: response.parts }];
    reply += response.parts.flatMap((part) => "text" in part ? [part.text] : []).join("");
    const calls = response.parts.flatMap((part) => "functionCall" in part ? [part.functionCall] : []);
    if (!calls.length) return { history: contents.slice(-20), reply: reply.trim(), provider };
    const results = await Promise.all(calls.map(async (call) => ({
      functionResponse: { name: call.name, response: await toolResult(() => input.execute(call.name, call.args)) },
    })));
    contents = [...contents, { role: "user", parts: results }];
  }
  return {
    history: contents.slice(-20),
    reply: reply.trim() || "The requested board actions are complete. Review the visible decision receipt before approving the move.",
    provider,
  };
}

async function requestAgent(contents: AgentContent[]): Promise<AgentResponse> {
  const response = await fetch("/api/agent/text", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  const data = await response.json().catch(() => ({})) as Partial<AgentResponse> & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "The agent could not respond.");
  if (!Array.isArray(data.parts) || typeof data.provider !== "string") throw new Error("The agent sent an invalid response.");
  return { provider: data.provider, parts: data.parts as AgentPart[] };
}

async function toolResult(run: () => unknown | Promise<unknown>): Promise<Record<string, unknown>> {
  try {
    const result = await run();
    return { ok: true, result: result && typeof result === "object" ? result as Record<string, unknown> : { value: result } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Action failed." };
  }
}
