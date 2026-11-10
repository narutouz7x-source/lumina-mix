const API = "https://api.jamendo.com/v3.0/tracks/";

async function requestTracks(params, clientId) {
  if (!clientId) {
    const error = new Error("Music catalogue is not configured yet. Set JAMENDO_CLIENT_ID.");
    error.statusCode = 503;
    throw error;
  }
  const url = new URL(API);
  url.search = new URLSearchParams({
    client_id: clientId,
    format: "json",
    audioformat: "mp31",
    include: "musicinfo",
    ...params
  }).toString();
  const response = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Music catalogue returned HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.headers?.status !== "success") throw new Error(payload.headers?.error_message || "Music catalogue request failed");
  return (payload.results || []).filter(t => t.audio).map(t => ({
    id: `jamendo:${t.id}`,
    title: t.name,
    artist: t.artist_name || "Unknown artist",
    album: t.album_name || "",
    duration: Number(t.duration) || undefined,
    artworkURL: t.album_image || t.image || undefined,
    format: "mp3",
    audioQuality: "HIGH",
    streamURL: t.audio,
    bpm: Number(t.musicinfo?.tags?.bpm?.[0]) || undefined,
    key: t.musicinfo?.tags?.key?.[0] || undefined,
    energy: Number(t.musicinfo?.tags?.energy?.[0]) || undefined,
    license: t.license_ccurl || undefined
  }));
}

export function searchJamendo(query, clientId) {
  return requestTracks({ limit: "30", search: query, groupby: "artist_id" }, clientId);
}

export async function getJamendoTrack(id, clientId) {
  const tracks = await requestTracks({ id: String(id), limit: "1" }, clientId);
  return tracks[0] || null;
}

export function getJamendoTrackId(id) {
  return String(id).startsWith("jamendo:") ? String(id).slice(8) : null;
}
