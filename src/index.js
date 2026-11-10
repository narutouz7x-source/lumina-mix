import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { searchJamendo, getJamendoTrack, getJamendoTrackId } from "./providers/jamendo.js";
import { rankForTransition, scoreTransition } from "./engine/compatibility.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(ROOT, "../manifest.json"), "utf8"));

// Load a local .env without adding a runtime dependency. Host-provided variables win.
try {
  const envText = await readFile(path.join(ROOT, "../.env"), "utf8");
  for (const line of envText.split(/\\r?\\n/)) {
    const match = line.match(/^\\s*([A-Za-z_][A-Za-z0-9_]*)\\s*=\\s*(.*?)\\s*$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^(['"])(.*)\\1$/, "$2");
  }
} catch {}
const PORT = Number(process.env.PORT || 3000);
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
};

async function handle(req, res) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/" || url.pathname === "/health") {
    return json(res, 200, { ok: true, name: manifest.name, version: manifest.version });
  }
  if (url.pathname === "/manifest.json") return json(res, 200, manifest);

  if (url.pathname === "/search") {
    const query = (url.searchParams.get("q") || "").trim();
    if (!query) return json(res, 200, { tracks: [] });
    if (query.length > 160) return json(res, 400, { error: "Search query is too long" });
    try {
      const tracks = await searchJamendo(query, CLIENT_ID);
      const seed = {
        bpm: Number(url.searchParams.get("seedBpm")) || undefined,
        key: url.searchParams.get("seedKey") || undefined,
        energy: Number(url.searchParams.get("seedEnergy")) || undefined
      };
      const mode = url.searchParams.get("mix_mode") || "balanced";
      return json(res, 200, { tracks: rankForTransition(tracks, seed.bpm || seed.key || seed.energy ? seed : null, mode) });
    } catch (error) {
      return json(res, error.statusCode || 502, { tracks: [], error: error.message });
    }
  }

  if (url.pathname.startsWith("/stream/")) {
    const id = decodeURIComponent(url.pathname.slice("/stream/".length));
    const numericId = getJamendoTrackId(id);
    if (!numericId) return json(res, 404, { error: "Track not found" });
    try {
      const track = await getJamendoTrack(numericId, CLIENT_ID);
      if (!track?.streamURL) return json(res, 404, { error: "Track not found" });
      return json(res, 200, {
        url: track.streamURL,
        format: "mp3",
        codec: "mp3",
        container: "mp3",
        manifest: "none",
        encrypted: false,
        quality: "Jamendo MP3 stream"
      });
    } catch (error) {
      return json(res, error.statusCode || 502, { error: error.message });
    }
  }

  if (url.pathname === "/mix/score") {
    const from = { bpm: Number(url.searchParams.get("fromBpm")), key: url.searchParams.get("fromKey"), energy: Number(url.searchParams.get("fromEnergy")) };
    const to = { bpm: Number(url.searchParams.get("toBpm")), key: url.searchParams.get("toKey"), energy: Number(url.searchParams.get("toEnergy")) };
    return json(res, 200, scoreTransition(from, to, url.searchParams.get("mode") || "balanced"));
  }

  return json(res, 404, { error: "Not found" });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => json(res, 500, { error: "Internal server error" }));
});
server.listen(PORT, "0.0.0.0", () => console.log(`Lumina Mix listening on :${PORT}`));
