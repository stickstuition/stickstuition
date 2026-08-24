import test from "node:test";
import assert from "node:assert/strict";
import { generateQuestion, pairKey, playerMatchesGuess, pushRecent } from "./game.js";

const players = [
  { id: 1, squadNumber: 7, teamId: 1, teamName: "Test FC", playable: true, easy: true, name: "Alpha One", webName: "Alpha", firstName: "Alpha", secondName: "One" },
  { id: 2, squadNumber: 9, teamId: 1, teamName: "Test FC", playable: true, easy: true, name: "Bravo Two", webName: "Bravo", firstName: "Bravo", secondName: "Two" },
  { id: 3, squadNumber: 16, teamId: 1, teamName: "Test FC", playable: true, easy: true, name: "Charlie Three", webName: "Charlie", firstName: "Charlie", secondName: "Three" },
  { id: 4, squadNumber: 2, teamId: 2, teamName: "Other FC", playable: true, easy: true, name: "Delta Four", webName: "Delta", firstName: "Delta", secondName: "Four" },
];

test("pair keys ignore player order", () => {
  assert.equal(pairKey(players[0], players[1]), pairKey(players[1], players[0]));
});

test("questions use one team and resolve to a real player on that team", () => {
  const question = generateQuestion(players, [1], "easy");
  assert.equal(question.left.teamId, question.right.teamId);
  assert.equal(question.left.teamId, question.answerPlayer.teamId);
  assert.match(question.operator, /^[+−]$/);
  const expected = question.operator === "+"
    ? question.left.squadNumber + question.right.squadNumber
    : question.left.squadNumber - question.right.squadNumber;
  assert.equal(expected, question.answerPlayer.squadNumber);
});

test("player guesses accept full or familiar web names", () => {
  assert.equal(playerMatchesGuess(players[2], "Charlie Three"), true);
  assert.equal(playerMatchesGuess(players[2], "charlie"), true);
  assert.equal(playerMatchesGuess(players[2], "Bravo"), false);
});

test("recent queue stays bounded", () => {
  assert.deepEqual(pushRecent(["a", "b"], "c", 2), ["b", "c"]);
});
