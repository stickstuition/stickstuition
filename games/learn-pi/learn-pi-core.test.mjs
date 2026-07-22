import test from "node:test";
import assert from "node:assert/strict";
import core from "./learn-pi-core.js";

const { PI_DIGITS, createRound, submitDigit } = core;

test("includes an accurate local sequence of at least 1,000 pi digits", () => {
  assert.ok(PI_DIGITS.length >= 1000);
  assert.equal(PI_DIGITS.slice(0, 50), "14159265358979323846264338327950288419716939937510");
  assert.equal(PI_DIGITS.slice(990, 1010), "21642019893809525720");
});

test("correct digits advance the score and personal best", () => {
  const result = submitDigit(createRound(0), "1");
  assert.equal(result.outcome, "correct");
  assert.deepEqual(result.state, { score: 1, lives: 3, best: 1, status: "playing" });
});

test("incorrect digits consume all three lives without advancing", () => {
  let state = createRound(7);
  for (let attempt = 0; attempt < 3; attempt += 1) state = submitDigit(state, "9").state;
  assert.deepEqual(state, { score: 0, lives: 0, best: 7, status: "game-over" });
});

test("non-digits and input after game over are ignored", () => {
  const initial = createRound();
  assert.strictEqual(submitDigit(initial, "x").state, initial);
  const gameOver = { ...initial, lives: 0, status: "game-over" };
  assert.strictEqual(submitDigit(gameOver, "1").state, gameOver);
});
