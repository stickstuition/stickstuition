import test from "node:test";
import assert from "node:assert/strict";
import { answerMatches, generateRebusBoard, normaliseAnswer } from "../rebus-core.js";
import { rebuses } from "../rebus-content.js";

const random = () => 0.314159;

test("answer normalisation forgives case, punctuation, spaces, apostrophes and hyphens", () => {
  assert.equal(normaliseAnswer("  GOLD---Coast!! "), "gold coast");
  assert.equal(normaliseAnswer("Dragon’s   Den"), "dragons den");
  assert.equal(answerMatches("gold coast", rebuses.find((item) => item.answer === "Gold Coast")), true);
});

test("one category gives six unique puzzles from that category", () => {
  const board = generateRebusBoard({ selectedCategories: ["cities"], random });
  assert.equal(board.length, 6);
  assert.equal(new Set(board.map((item) => item.id)).size, 6);
  assert.equal(board.filter((item) => item.category === "cities").length, 6);
});

test("two, three, four and five categories receive the required fair allocation", () => {
  const cases = [
    [["cities", "food"], [3, 3]],
    [["cities", "food", "animals"], [2, 2, 2]],
    [["cities", "food", "animals", "music"], [1, 1, 2, 2]],
    [["cities", "food", "animals", "music", "objects"], [1, 1, 1, 1, 2]],
  ];
  for (const [selectedCategories, expected] of cases) {
    const board = generateRebusBoard({ selectedCategories, random });
    const counts = selectedCategories.map((category) => board.filter((item) => item.category === category).length).sort();
    assert.deepEqual(counts, expected);
  }
});

test("random mix draws six unique rebuses from six categories", () => {
  const board = generateRebusBoard({ selectedCategories: ["random-mix"], random });
  assert.equal(new Set(board.map((item) => item.id)).size, 6);
  assert.equal(new Set(board.map((item) => item.category)).size, 6);
});

test("the immediately previous board is avoided when alternatives exist", () => {
  const first = generateRebusBoard({ selectedCategories: ["cities", "food"], random });
  const second = generateRebusBoard({ selectedCategories: ["cities", "food"], previousBoardIds: first.map((item) => item.id), random });
  assert.notDeepEqual(first.map((item) => item.id).sort(), second.map((item) => item.id).sort());
});
