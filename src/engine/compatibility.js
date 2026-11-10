const CAMELOT = {
  "1A": [1], "2A": [2], "3A": [3], "4A": [4], "5A": [5], "6A": [6],
  "7A": [7], "8A": [8], "9A": [9], "10A": [10], "11A": [11], "12A": [12],
  "1B": [1], "2B": [2], "3B": [3], "4B": [4], "5B": [5], "6B": [6],
  "7B": [7], "8B": [8], "9B": [9], "10B": [10], "11B": [11], "12B": [12]
};

function camelotDistance(a, b) {
  if (!a || !b || !CAMELOT[a] || !CAMELOT[b]) return null;
  const na = Number.parseInt(a, 10);
  const nb = Number.parseInt(b, 10);
  const wheel = Math.min((na - nb + 12) % 12, (nb - na + 12) % 12);
  const sameMode = a.endsWith(b.slice(-1));
  return sameMode && wheel === 0 ? 0 : wheel === 1 ? 1 : sameMode && wheel === 0 ? 0 : 3;
}

export function tempoCompatibility(a, b) {
  const x = Number(a), y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return null;
  const ratio = Math.max(x, y) / Math.min(x, y);
  const adjusted = [1, 2, 1.5, 4 / 3, 4 / 5, 2 / 3]
    .map(target => Math.abs(Math.log2(ratio / target)))
    .reduce((best, value) => Math.min(best, value), Infinity);
  return Math.max(0, 1 - adjusted / 0.18);
}

export function scoreTransition(from, to, mode = "balanced") {
  const tempo = tempoCompatibility(from?.bpm, to?.bpm);
  const keyDistance = camelotDistance(from?.key, to?.key);
  const keyScore = keyDistance === null ? null : Math.max(0, 1 - keyDistance / 3);
  const energyA = Number(from?.energy), energyB = Number(to?.energy);
  const energyScore = Number.isFinite(energyA) && Number.isFinite(energyB)
    ? Math.max(0, 1 - Math.abs(energyA - energyB)) : null;

  const parts = mode === "tempo"
    ? [[tempo, 0.75], [keyScore, 0.2], [energyScore, 0.05]]
    : mode === "discovery"
      ? [[tempo, 0.35], [keyScore, 0.1], [energyScore, 0.15], [0.7, 0.4]]
      : [[tempo, 0.5], [keyScore, 0.3], [energyScore, 0.2]];

  let weighted = 0, weight = 0;
  for (const [value, w] of parts) {
    if (value !== null && value !== undefined) { weighted += value * w; weight += w; }
  }
  return {
    score: weight ? Math.round((weighted / weight) * 100) : 50,
    details: { tempo: tempo === null ? null : Math.round(tempo * 100), key: keyScore === null ? null : Math.round(keyScore * 100), energy: energyScore === null ? null : Math.round(energyScore * 100) }
  };
}

export function rankForTransition(tracks, seed, mode = "balanced") {
  if (!seed) return tracks;
  return [...tracks].sort((a, b) =>
    scoreTransition(seed, b, mode).score - scoreTransition(seed, a, mode).score
  );
}
