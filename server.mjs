import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { Chess } from "chess.js";

await loadLocalEnv();

// Render and most Node hosts inject PORT. VOICE_PORT remains available for
// local development so the Vite proxy can keep using its stable endpoint.
const port = Number(process.env.PORT ?? process.env.VOICE_PORT ?? 8787);
const instructions = "You are Zentic, a conservative chess coach working under a visible player play charter. Keep answers to one or two sentences unless asked for more. Never claim an unverified move is legal. Before an official move decision, call prepare_agent_turn; it gives the exact board, charter, capabilities, and legal moves in one read-only preflight command. Respect explain-only authority. An official proposal exists only after the propose_agent_move tool succeeds; never call a move a proposal in prose before that. When it is the human's turn, offer non-binding advice and clearly call it a suggestion. When it is the agent's turn and the user asks what you should play, call prepare_agent_turn, propose_agent_move, then create_decision_receipt, and only then describe it as a proposal. After a decision receipt succeeds, stop calling tools and give one concise reply directing the player to review it. Before a move can be played, obtain explicit one-move consent when required; never treat a vague affirmation as consent. For opening, repertoire, or historical questions, call identify_opening after reading the match; it resolves the actual move history against Zentic's CC0 Lichess library, so never guess an opening name. Once identify_opening returns, stop calling tools and answer from its exact result; mention the opening name and ECO only when the result is not null, otherwise say the current history is not yet named. For a lesson request, call list_training_scenarios if the requested scenario is unclear. Explain that loading any named lesson replaces the current board and ask for a clear yes. If the same conversation then contains a clear yes, call start_training_scenario with the chosen scenario id; this command is permitted after that confirmation. Teach from the live position with concise observations and progressive hints, not generic chess advice.";
const tools = [
  { type: "function", name: "read_match", description: "Read the exact live board before giving chess advice.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "identify_opening", description: "Resolve the exact current move history against Zentic's local CC0 Lichess opening library. Use this for any opening-name, repertoire, or history-grounded lesson question.", parameters: { type: "object", properties: { expectedVersion: { type: "number" } }, required: ["expectedVersion"], additionalProperties: false } },
  { type: "function", name: "get_agent_capabilities", description: "Read which agent actions are possible at the live position before offering or attempting an official proposal.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "prepare_agent_turn", description: "Read the exact board, charter, allowed actions, and legal moves in one read-only preflight command before an official move proposal.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "list_legal_moves", description: "List legal moves for the current board version.", parameters: { type: "object", properties: { expectedVersion: { type: "number" } }, required: ["expectedVersion"], additionalProperties: false } },
  { type: "function", name: "post_agent_note", description: "Leave a concise, visible coaching note in the game record.", parameters: { type: "object", properties: { expectedVersion: { type: "number" }, text: { type: "string" }, kind: { type: "string", enum: ["analysis", "status"] } }, required: ["expectedVersion", "text", "kind"], additionalProperties: false } },
  { type: "function", name: "get_play_charter", description: "Read the player's live objective, guardrails, and authority level before proposing a move.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "update_play_charter", description: "Update the visible charter only when the player clearly states or changes their intent.", parameters: { type: "object", properties: { expectedVersion: { type: "number" }, objective: { type: "string" }, constraints: { type: "array", items: { type: "string" } }, authority: { type: "string", enum: ["explain", "propose", "one_move"] } }, required: ["expectedVersion", "objective", "authority"], additionalProperties: false } },
  { type: "function", name: "propose_agent_move", description: "Propose one legal move tied to the current position, with a concise reason. Do not apply it.", parameters: { type: "object", properties: { expectedVersion: { type: "number" }, from: { type: "string" }, to: { type: "string" }, promotion: { type: "string" }, explanation: { type: "string" } }, required: ["expectedVersion", "from", "to", "explanation"], additionalProperties: false } },
  { type: "function", name: "create_decision_receipt", description: "Create the visible record connecting a proposal to the player's charter and the tools used. Do this before asking for consent.", parameters: { type: "object", properties: { expectedVersion: { type: "number" }, proposalId: { type: "string" }, rationale: { type: "string" } }, required: ["expectedVersion", "proposalId"], additionalProperties: false } },
  { type: "function", name: "grant_move_consent", description: "Grant one exact receipt-backed move only after the player explicitly says yes to that move. This grants no future move authority.", parameters: { type: "object", properties: { proposalId: { type: "string" }, expectedVersion: { type: "number" } }, required: ["proposalId", "expectedVersion"], additionalProperties: false } },
  { type: "function", name: "commit_agent_move", description: "Apply the consented proposal when the charter and policy permit it. Never call this without an exact active consent.", parameters: { type: "object", properties: { proposalId: { type: "string" }, expectedVersion: { type: "number" } }, required: ["proposalId", "expectedVersion"], additionalProperties: false } },
  { type: "function", name: "withdraw_agent_proposal", description: "Withdraw a pending proposal when it is stale or no longer appropriate.", parameters: { type: "object", properties: { proposalId: { type: "string" } }, required: ["proposalId"], additionalProperties: false } },
  { type: "function", name: "list_training_scenarios", description: "List the curated lessons that are available before recommending one.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "get_training_state", description: "Read the current training lesson and progress, if any.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "reveal_training_hint", description: "Reveal one progressive training hint for the current board version.", parameters: { type: "object", properties: { expectedVersion: { type: "number" } }, required: ["expectedVersion"], additionalProperties: false } },
  { type: "function", name: "start_training_scenario", description: "Load one confirmed curated lesson. This replaces the current board only after the user clearly agrees.", parameters: { type: "object", properties: { scenarioId: { type: "string", enum: ["scandinavian-queen-chase", "italian-central-break", "knight-fork", "mate-net"] } }, required: ["scenarioId"], additionalProperties: false } },
];
const analysisCache = new Map();
let analysisInFlight = false;
let openingLibraryPromise;
const openingSources = ["a", "b", "c", "d", "e"].map((volume) => `https://raw.githubusercontent.com/lichess-org/chess-openings/master/${volume}.tsv`);
void getOpeningLibrary().catch(() => { openingLibraryPromise = undefined; });
const dist = join(process.cwd(), "dist");
const mimeTypes = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

createServer(async (request, response) => {
  if (request.method === "GET") {
    await serveStatic(request, response);
    return;
  }
  if (request.method !== "POST") {
    response.writeHead(405).end();
    return;
  }
  if (request.url === "/api/analysis/cloud") {
    await serveCloudAnalysis(request, response);
    return;
  }
  if (request.url === "/api/openings/identify") {
    await serveOpeningIdentification(request, response);
    return;
  }
  if (request.url === "/api/agent/text") {
    await serveAgentText(request, response);
    return;
  }
  if (request.url !== "/api/realtime/session") {
    response.writeHead(404).end();
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    response.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ error: "Voice is not configured. Add OPENAI_API_KEY to the server environment." }));
    return;
  }
  try {
    const upstream = await externalFetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ session: { type: "realtime", model: "gpt-realtime-2.1", instructions, tools, tool_choice: "auto", audio: { input: { transcription: { model: "gpt-live-transcribe", prompt: "Chess coaching. Terms include Scandinavian Defense, queen, knight, bishop, castling, FEN, e4, d5, Qxd5, Nc3, en passant." }, turn_detection: { type: "semantic_vad" } }, output: { voice: "marin" } } } }),
    });
    const data = await upstream.json();
    if (!upstream.ok) throw new Error(data.error?.message ?? "OpenAI rejected the Realtime session.");
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ clientSecret: data.value }));
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Voice session could not be created." }));
  }
}).listen(port, () => console.log(`Zentic voice server listening on ${port}`));

async function serveAgentText(request, response) {
  const body = await readJson(request);
  const contents = validAgentContents(body.contents) ? body.contents : undefined;
  if (!contents) {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "A valid chat history is required." }));
    return;
  }
  try {
    const result = await runAgent(contents);
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    response.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "The chess agent is unavailable." }));
  }
}

async function runAgent(contents) {
  const runners = {
    gemini: () => runGemini(contents),
    groq: () => runOpenAiCompatible("https://api.groq.com/openai/v1/chat/completions", process.env.GROQ_API_KEY, "qwen/qwen3.6-27b", contents),
    openrouter: () => runOpenAiCompatible("https://openrouter.ai/api/v1/chat/completions", process.env.OPENROUTER_API_KEY, "google/gemini-2.5-flash", contents),
  };
  const preferred = process.env.AGENT_PROVIDER ?? "groq";
  const providerOrder = [preferred, ...Object.keys(runners).filter((provider) => provider !== preferred)];
  const attempts = providerOrder.flatMap((provider) => provider in runners ? [[provider, runners[provider]]] : []);
  const failures = [];
  for (const [provider, request] of attempts) {
    try {
      const result = await request();
      return { provider, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : "unavailable";
      console.warn(`Agent provider ${provider} unavailable: ${message}`);
      failures.push(`${provider}: ${message}`);
    }
  }
  throw new Error(`Zentic could not reach an agent provider. ${failures.join(" · ")}`);
}

async function runGemini(contents) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini is not configured.");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
  const upstream = await externalFetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents,
      tools: [{ functionDeclarations: tools.map(({ name, description, parameters }) => ({ name, description, parameters: asGeminiSchema(parameters) })) }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 220 },
    }),
  });
  const data = await upstream.json();
  if (!upstream.ok) throw new Error(data.error?.message ?? `Gemini returned ${upstream.status}.`);
  const parts = data.candidates?.[0]?.content?.parts?.filter(validAgentPart);
  if (!parts?.length) throw new Error("Gemini returned no usable response.");
  return { parts };
}

async function runOpenAiCompatible(url, key, model, contents) {
  if (!key) throw new Error("Key is not configured.");
  const upstream = await externalFetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ model, messages: asOpenAiMessages(contents), tools: tools.map(({ name, description, parameters }) => ({ type: "function", function: { name, description, parameters } })), tool_choice: "auto", temperature: 0.25, max_tokens: 220 }),
  });
  const data = await upstream.json();
  if (!upstream.ok) throw new Error(data.error?.message ?? `${model} returned ${upstream.status}.`);
  const message = data.choices?.[0]?.message;
  const parts = [
    ...(message?.content ? [{ text: message.content }] : []),
    ...(message?.tool_calls?.map((call) => ({ functionCall: { name: call.function.name, args: JSON.parse(call.function.arguments || "{}") } })) ?? []),
  ];
  if (!parts.length) throw new Error("Provider returned no usable response.");
  return { parts };
}

function asOpenAiMessages(contents) {
  return contents.flatMap((content, contentIndex) => content.parts.flatMap((part, partIndex) => {
    if (typeof part.text === "string") return [{ role: content.role === "model" ? "assistant" : "user", content: part.text }];
    if (part.functionCall) return [{ role: "assistant", content: null, tool_calls: [{ id: toolCallId(part.functionCall.name, contentIndex, partIndex), type: "function", function: { name: part.functionCall.name, arguments: JSON.stringify(part.functionCall.args ?? {}) } }] }];
    if (part.functionResponse) return [{ role: "tool", tool_call_id: toolCallId(part.functionResponse.name, contentIndex - 1, partIndex), content: JSON.stringify(part.functionResponse.response ?? {}) }];
    return [];
  }));
}

function toolCallId(name, contentIndex, partIndex) { return `zentic-${contentIndex}-${partIndex}-${name}`; }

function asGeminiSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;
  const { type, description, enum: values, properties, items, required } = schema;
  return {
    ...(type ? { type } : {}),
    ...(description ? { description } : {}),
    ...(Array.isArray(values) ? { enum: values } : {}),
    ...(Array.isArray(required) ? { required } : {}),
    ...(properties && typeof properties === "object" ? { properties: Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, asGeminiSchema(value)])) } : {}),
    ...(items ? { items: asGeminiSchema(items) } : {}),
  };
}

function validAgentContents(contents) {
  return Array.isArray(contents) && contents.length > 0 && contents.length <= 24 && contents.every((content) => content && (content.role === "user" || content.role === "model") && Array.isArray(content.parts) && content.parts.length > 0 && content.parts.length <= 8 && content.parts.every(validAgentPart));
}

function validAgentPart(part) {
  if (!part || typeof part !== "object") return false;
  if (typeof part.text === "string") return part.text.length <= 4000;
  if (part.functionCall && typeof part.functionCall.name === "string" && typeof part.functionCall.args === "object") return true;
  return Boolean(part.functionResponse && typeof part.functionResponse.name === "string" && typeof part.functionResponse.response === "object");
}

async function loadLocalEnv() {
  try {
    const text = await readFile(join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
    }
  } catch { /* A local .env is optional. */ }
}

async function serveCloudAnalysis(request, response) {
  const body = await readJson(request);
  if (typeof body.fen !== "string" || body.fen.length > 200) {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "A valid FEN is required." }));
    return;
  }
  try {
    new Chess(body.fen);
  } catch {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "A valid FEN is required." }));
    return;
  }
  const cached = analysisCache.get(body.fen);
  if (cached && Date.now() - cached.savedAt < 60_000) {
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(cached.value));
    return;
  }
  if (analysisInFlight) {
    response.writeHead(429, { "content-type": "application/json" }).end(JSON.stringify({ error: "Analysis is busy. Try again in a moment." }));
    return;
  }
  analysisInFlight = true;
  try {
    const upstream = await externalFetch(`https://lichess.org/api/cloud-eval?multiPv=3&variant=standard&fen=${encodeURIComponent(body.fen)}`, { headers: { Accept: "application/json" } });
    if (upstream.status === 404) {
      response.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: "No cached cloud analysis exists for this position." }));
      return;
    }
    if (!upstream.ok) throw new Error(`Cloud analysis returned ${upstream.status}.`);
    const value = await upstream.json();
    analysisCache.set(body.fen, { savedAt: Date.now(), value });
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(value));
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "Cloud analysis could not be reached." }));
  } finally {
    analysisInFlight = false;
  }
}

async function serveOpeningIdentification(request, response) {
  const body = await readJson(request);
  const moves = validUciMoves(body.moves);
  if (!moves) {
    response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: "A valid move history is required." }));
    return;
  }
  try {
    const library = await getOpeningLibrary();
    const uci = moves.map((move) => `${move.from}${move.to}${move.promotion ?? ""}`);
    const match = library.find((entry) => entry.uci.length <= uci.length && entry.uci.every((move, index) => move === uci[index]));
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify({
      positionVersion: typeof body.positionVersion === "number" ? body.positionVersion : 0,
      opening: match ? {
        eco: match.eco,
        name: match.name,
        pgn: match.pgn,
        matchedPly: match.uci.length,
        librarySize: library.length,
        source: "lichess-cc0",
      } : null,
    }));
  } catch (error) {
    response.writeHead(502, { "content-type": "application/json" }).end(JSON.stringify({ error: error instanceof Error ? error.message : "The opening library could not be loaded." }));
  }
}

async function getOpeningLibrary() {
  if (!openingLibraryPromise) {
    openingLibraryPromise = Promise.all(openingSources.map(async (source) => {
      const response = await externalFetch(source, { headers: { Accept: "text/plain" } });
      if (!response.ok) throw new Error(`The opening library source returned ${response.status}.`);
      return response.text();
    })).then((volumes) => volumes.flatMap(parseOpeningTsv).sort((left, right) => right.uci.length - left.uci.length));
  }
  return openingLibraryPromise;
}

function parseOpeningTsv(tsv) {
  return tsv.split(/\r?\n/).slice(1).flatMap((line) => {
    const [eco, name, pgn] = line.split("\t");
    if (!eco || !name || !pgn) return [];
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const uci = chess.history({ verbose: true }).map((move) => `${move.from}${move.to}${move.promotion ?? ""}`);
      return uci.length ? [{ eco, name, pgn, uci }] : [];
    } catch {
      return [];
    }
  });
}

function validUciMoves(moves) {
  if (!Array.isArray(moves) || moves.length > 120) return undefined;
  const validSquare = (square) => typeof square === "string" && /^[a-h][1-8]$/.test(square);
  const validPromotion = (promotion) => promotion === undefined || ["q", "r", "b", "n"].includes(promotion);
  return moves.every((move) => move && typeof move === "object" && validSquare(move.from) && validSquare(move.to) && validPromotion(move.promotion)) ? moves : undefined;
}

async function readJson(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  try { return JSON.parse(text); } catch { return {}; }
}

function externalFetch(url, init = {}, timeoutMs = 12_000) {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, timeoutController.signal]) : timeoutController.signal;
  return fetch(url, { ...init, signal }).finally(() => clearTimeout(timeout));
}

async function serveStatic(request, response) {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const relative = pathname === "/" ? "index.html" : normalize(pathname).replace(/^[/\\]+/, "");
  const path = join(dist, relative);
  if (!path.startsWith(dist)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const file = await readFile(path);
    response.writeHead(200, { "content-type": mimeTypes[extname(path)] ?? "application/octet-stream" }).end(file);
  } catch {
    try {
      const index = await readFile(join(dist, "index.html"));
      response.writeHead(200, { "content-type": "text/html" }).end(index);
    } catch {
      response.writeHead(404, { "content-type": "text/plain" }).end("Build the app before starting the production server.");
    }
  }
}
