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
    const questions = generateQuestionSet("intermediate", ["addition", "division"]);
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

test("junior multiplication and division use facts from 1 to 12", () => {
  for (let run = 0; run < 100; run += 1) {
    for (const question of generateQuestionSet("junior", ["multiplication", "division"])) {
      if (question.operation === "multiplication") {
        assert.ok(question.leftOperand >= 1 && question.leftOperand <= 12);
        assert.ok(question.rightOperand >= 1 && question.rightOperand <= 12);
      } else {
        assert.ok(question.rightOperand >= 1 && question.rightOperand <= 12);
        assert.ok(question.correctAnswer >= 1 && question.correctAnswer <= 12);
        assert.equal(question.leftOperand, question.rightOperand * question.correctAnswer);
      }
    }
  }
});

test("all three bands stay within their easier configured limits", () => {
  const factorLimits = { junior: 12, intermediate: 15, senior: 20 };
  for (const [difficulty, factorLimit] of Object.entries(factorLimits)) {
    for (let run = 0; run < 50; run += 1) {
      for (const question of generateQuestionSet(difficulty, ["multiplication", "division"])) {
        assert.ok(Math.abs(question.rightOperand) <= factorLimit);
        if (question.operation === "multiplication") assert.ok(Math.abs(question.leftOperand) <= factorLimit);
        else assert.ok(Math.abs(question.correctAnswer) <= factorLimit);
        assert.equal(question.acceptedTolerance, 0);
      }
    }
  }
});

test("division is never by zero and always reverses cleanly", () => {
  for (const difficulty of ["junior", "intermediate", "senior"]) {
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
  const perfectFast = calculateScore({ correctAnswers: 15, totalTimeSeconds: 20, difficulty: "intermediate" });
  const perfectSlow = calculateScore({ correctAnswers: 15, totalTimeSeconds: 120, difficulty: "intermediate" });
  const oneWrongFast = calculateScore({ correctAnswers: 14, totalTimeSeconds: 5, difficulty: "intermediate" });
  const poorFast = calculateScore({ correctAnswers: 7, totalTimeSeconds: 1, difficulty: "intermediate" });
  assert.ok(perfectFast > perfectSlow);
  assert.ok(perfectSlow > poorFast);
  assert.ok(perfectFast > oneWrongFast);
  assert.equal(calculateScore({ correctAnswers: 0, totalTimeSeconds: 1, difficulty: "intermediate" }), 0);
  assert.equal(perfectFast, calculateScore({ correctAnswers: 15, totalTimeSeconds: 20, difficulty: "intermediate" }));
});

test("London leaderboard week starts on Monday", () => {
  assert.equal(londonWeekStart(new Date("2026-07-13T00:30:00+01:00")), "2026-07-13");
  assert.equal(londonWeekStart(new Date("2026-07-19T23:30:00+01:00")), "2026-07-13");
});
