import test from "node:test";
import assert from "node:assert/strict";
import { tempoCompatibility, scoreTransition, rankForTransition } from "../src/engine/compatibility.js";

test("tempo compatibility rewards equal tempos", () => {
  assert.equal(tempoCompatibility(120, 120), 1);
});

test("transition score stays in range", () => {
  const result = scoreTransition({ bpm: 120, key: "8A" }, { bpm: 122, key: "9A" });
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("ranking puts closer tempo first", () => {
  const ranked = rankForTransition([{ bpm: 150 }, { bpm: 121 }], { bpm: 120 });
  assert.equal(ranked[0].bpm, 121);
});
