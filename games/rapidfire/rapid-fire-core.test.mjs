import test from "node:test";
import assert from "node:assert/strict";
import {
  QUESTIONS_PER_GAME,
  calculateScore,
  createOperationKey,
  distributeOperations,
  generateQuestionSet,
  isAnswerCorrect,
  londonWeekStart,
  validateDisplayName,
} from "./rapid-fire-core.js";

test("generates exactly 15 unique questions from selected operations", () => {
  for (let run = 0; run < 100; run += 1) {
    const questions = generateQuestionSet("year_9", ["addition", "division"]);
    assert.equal(questions.length, QUESTIONS_PER_GAME);
    assert.equal(new Set(questions.map((question) => `${question.operation}:${question.leftOperand}:${question.rightOperand}`)).size, QUESTIONS_PER_GAME);
    assert.ok(questions.every((question) => ["addition", "division"].includes(question.operation)));
  }
});

test("distributes selected operations as evenly as possible", () => {
  const operations = distributeOperations(["addition", "subtraction", "multiplication", "division"], 15, () => 0.4);
  const counts = operations.reduce((result, operation) => ({ ...result, [operation]: (result[operation] ?? 0) + 1 }), {});
  assert.ok(Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)) <= 1);
});

test("junior subtraction never produces a negative answer", () => {
  for (let run = 0; run < 100; run += 1) {
    assert.ok(generateQuestionSet("junior", ["subtraction"]).every((question) => question.correctAnswer >= 0));
  }
});

test("division is never by zero and always reverses cleanly", () => {
  for (const difficulty of ["junior", "year_8", "year_10", "year_12"]) {
    for (const question of generateQuestionSet(difficulty, ["division"])) {
      assert.notEqual(question.rightOperand, 0);
      assert.ok(isAnswerCorrect(question, question.leftOperand / question.rightOperand));
    }
  }
});

test("decimal tolerance accepts rounding noise but rejects wrong answers", () => {
  const question = { correctAnswer: 4.5, acceptedTolerance: 0.001 };
  assert.equal(isAnswerCorrect(question, 4.5009), true);
  assert.equal(isAnswerCorrect(question, 4.51), false);
});

test("operation keys use a stable order", () => {
  assert.equal(createOperationKey(["division", "addition", "multiplication"]), "addition-multiplication-division");
});

test("display names are trimmed and validated", () => {
  assert.deepEqual(validateDisplayName("  Maths Hero  "), { valid: true, name: "Maths Hero", message: "" });
  assert.equal(validateDisplayName("x").valid, false);
  assert.equal(validateDisplayName("name@example.com").valid, false);
});

test("scoring strongly rewards accuracy and remains deterministic", () => {
  const perfectFast = calculateScore({ correctAnswers: 15, totalTimeSeconds: 20, difficulty: "year_9" });
  const perfectSlow = calculateScore({ correctAnswers: 15, totalTimeSeconds: 120, difficulty: "year_9" });
  const oneWrongFast = calculateScore({ correctAnswers: 14, totalTimeSeconds: 5, difficulty: "year_9" });
  const poorFast = calculateScore({ correctAnswers: 7, totalTimeSeconds: 1, difficulty: "year_9" });
  assert.ok(perfectFast > perfectSlow);
  assert.ok(perfectSlow > poorFast);
  assert.ok(perfectFast > oneWrongFast);
  assert.equal(calculateScore({ correctAnswers: 0, totalTimeSeconds: 1, difficulty: "year_9" }), 0);
  assert.equal(perfectFast, calculateScore({ correctAnswers: 15, totalTimeSeconds: 20, difficulty: "year_9" }));
});

test("London leaderboard week starts on Monday", () => {
  assert.equal(londonWeekStart(new Date("2026-07-13T00:30:00+01:00")), "2026-07-13");
  assert.equal(londonWeekStart(new Date("2026-07-19T23:30:00+01:00")), "2026-07-13");
});
