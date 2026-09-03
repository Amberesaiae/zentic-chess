import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.VOICE_PORT ?? 8787);
const instructions = "You are Zentic, a conservative chess coach. Keep answers to one or two sentences unless asked for more. Never claim an unverified move is legal. When asked to start the Scandinavian lesson, explain that it replaces the current board and ask for a clear yes before doing so. Do not autoplay moves; propose them with a concise reason.";
const tools = [
  { type: "function", name: "read_match", description: "Read the exact live board before giving chess advice.", parameters: { type: "object", properties: {}, additionalProperties: false } },
  { type: "function", name: "list_legal_moves", description: "List legal moves for the current board version.", parameters: { type: "object", properties: { expectedVersion: { type: "number" } }, required: ["expectedVersion"], additionalProperties: false } },
  { type: "function", name: "post_agent_note", description: "Leave a concise, visible coaching note in the game record.", parameters: { type: "object", properties: { expectedVersion: { type: "number" }, text: { type: "string" }, kind: { type: "string", enum: ["analysis", "status"] } }, required: ["expectedVersion", "text", "kind"], additionalProperties: false } },
  { type: "function", name: "start_training_scenario", description: "Load the curated Scandinavian training position after the user explicitly confirms that replacing the board is okay.", parameters: { type: "object", properties: { scenarioId: { type: "string", enum: ["scandinavian-queen-chase"] } }, required: ["scenarioId"], additionalProperties: false } },
];
const analysisCache = new Map();
let analysisInFlight = false;
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
  if (request.url !== "/api/realtime/session") {
    response.writeHead(404).end();
    return;
  }
  if (!process.env.OPENAI_API_KEY) {
    response.writeHead(503, { "content-type": "application/json" }).end(JSON.stringify({ error: "Voice is not configured. Add OPENAI_API_KEY to the server environment." }));
    return;
  }
  try {
    const upstream = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
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

async function serveCloudAnalysis(request, response) {
  const body = await readJson(request);
  if (typeof body.fen !== "string" || body.fen.length > 200) {
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
    const upstream = await fetch(`https://lichess.org/api/cloud-eval?multiPv=3&variant=standard&fen=${encodeURIComponent(body.fen)}`, { headers: { Accept: "application/json" } });
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

async function readJson(request) {
  let text = "";
  for await (const chunk of request) text += chunk;
  try { return JSON.parse(text); } catch { return {}; }
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
