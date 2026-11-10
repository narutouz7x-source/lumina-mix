function camelotDistance(a, b) {
  if (!a || !b || !/^([1-9]|1[0-2])[AB]$/.test(a) || !/^([1-9]|1[0-2])[AB]$/.test(b)) return null;
  const na = Number.parseInt(a, 10), nb = Number.parseInt(b, 10);
  const wheel = Math.min((na - nb + 12) % 12, (nb - na + 12) % 12);
  const sameMode = a.endsWith(b.slice(-1));
  if (wheel === 0) return sameMode ? 0 : 0.5; // same key or relative major/minor
  return wheel === 1 ? 1 : 3;
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
  const distance = camelotDistance(from?.key, to?.key);
  const keyScore = distance === null ? null : Math.max(0, 1 - distance / 3);
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
    details: {
      tempo: tempo === null ? null : Math.round(tempo * 100),
      key: keyScore === null ? null : Math.round(keyScore * 100),
      energy: energyScore === null ? null : Math.round(energyScore * 100)
    }
  };
}

export function rankForTransition(tracks, seed, mode = "balanced") {
  if (!seed) return tracks;
  return [...tracks].sort((a, b) =>
    scoreTransition(seed, b, mode).score - scoreTransition(seed, a, mode).score
  );
}
