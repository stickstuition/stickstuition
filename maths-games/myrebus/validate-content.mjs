import { access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { categories, rebuses } from "./rebus-content.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const errors = [];
const ids = new Set();
let missingAssets = 0;

for (const rebus of rebuses) {
  if (ids.has(rebus.id)) errors.push(`Duplicate ID: ${rebus.id}`);
  ids.add(rebus.id);
  if (!categories.some((category) => category.id === rebus.category)) errors.push(`Unknown category: ${rebus.id}`);
  if (!rebus.answer?.trim()) errors.push(`Missing answer: ${rebus.id}`);
  if (!Array.isArray(rebus.acceptedAnswers) || rebus.acceptedAnswers.length === 0) errors.push(`Missing accepted answers: ${rebus.id}`);
  if (!Array.isArray(rebus.clues) || rebus.clues.length < 1 || rebus.clues.length > 3) errors.push(`Invalid clue count: ${rebus.id}`);
  if (!rebus.hint?.trim()) errors.push(`Missing hint: ${rebus.id}`);
  if (![1, 2, 3].includes(rebus.difficulty)) errors.push(`Invalid difficulty: ${rebus.id}`);
  if (rebus.approved !== true || rebus.imageStatus !== "ready") errors.push(`Not approved: ${rebus.id}`);
  for (const clue of rebus.clues || []) {
    try {
      await access(path.resolve(root, clue.image));
    } catch {
      missingAssets += 1;
      errors.push(`Missing asset: ${rebus.id} -> ${clue.image}`);
    }
  }
}

console.log("MY REBUS CONTENT AUDIT\n");
for (const category of categories) {
  const count = rebuses.filter((rebus) => rebus.category === category.id).length;
  console.log(`${category.name}: ${count} ${count === 5 ? "✓" : "✗"}`);
  if (count !== 5) errors.push(`${category.name} has ${count} rebuses; expected 5.`);
}
const difficulty = [1, 2, 3].map((level) => rebuses.filter((rebus) => rebus.difficulty === level).length);
console.log(`\nTotal rebuses: ${rebuses.length}`);
console.log(`Valid: ${errors.length ? rebuses.length - new Set(errors.map((error) => error.split(":")[1])).size : rebuses.length}`);
console.log(`Missing assets: ${missingAssets}`);
console.log(`Duplicate IDs: ${rebuses.length - ids.size}`);
console.log(`Difficulty 1 / 2 / 3: ${difficulty.join(" / ")}`);

if (rebuses.length !== 100) errors.push(`Expected 100 rebuses, found ${rebuses.length}.`);
if (difficulty.join(",") !== "50,40,10") errors.push(`Difficulty split should be 50,40,10; found ${difficulty.join(",")}.`);
if (errors.length) {
  console.error(`\nCONTENT ERRORS (${errors.length})\n${errors.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log("\nREADY FOR CLASSROOM ✓");
}
