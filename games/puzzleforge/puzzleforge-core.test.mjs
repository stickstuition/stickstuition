import test from "node:test";
import assert from "node:assert/strict";
import { ARCHETYPES, LEVELS, availableArchetypes, generateQuestion, validateQuestion } from "./puzzleforge-core.js";
import { renderDiagram } from "./puzzleforge-diagrams.js";

test("includes 24 named, level-scoped archetypes", () => {
  assert.equal(ARCHETYPES.length, 24);
  assert.equal(new Set(ARCHETYPES.map((item) => item.id)).size, 24);
  for (const level of LEVELS) assert.ok(availableArchetypes({ level }).length >= 6);
});

test("every archetype passes 500 seeded validation runs", () => {
  for (const item of ARCHETYPES) {
    for (let index = 0; index < 500; index += 1) {
      const level = item.supportedLevels[index % item.supportedLevels.length];
      const question = item.generate(level, `property-${index}`);
      assert.equal(validateQuestion(question), true, `${item.id} failed at seed ${index}`);
      assert.equal(question.archetype, item.id);
      assert.equal(question.level, level);
      assert.ok(question.diagramAlt.length > 10);
    }
  }
});

test("seeded generation is reproducible", () => {
  for (const item of ARCHETYPES) {
    const level = item.supportedLevels[0];
    const first = item.generate(level, "repeat-me");
    const second = item.generate(level, "repeat-me");
    assert.deepEqual(first, second);
  }
});

test("multiple choice answers are unique and contain the answer once", () => {
  for (const item of ARCHETYPES) {
    const question = item.generate(item.supportedLevels[0], "options-check");
    if (question.answerType !== "multipleChoice") continue;
    const values = question.options.map((option) => option.value);
    assert.equal(values.length, 5);
    assert.equal(new Set(values).size, 5);
    assert.equal(values.filter((value) => value === question.correctAnswer).length, 1);
  }
});

test("variety selection avoids the five most recent archetypes when alternatives exist", () => {
  const pool = availableArchetypes({ level: "junior" });
  const recent = pool.slice(0, 5).map((item) => item.id);
  const question = generateQuestion({ level: "junior", seed: "fresh-choice", recentArchetypes: recent });
  assert.equal(recent.includes(question.archetype), false);
});

test("every archetype renders a responsive, described SVG", () => {
  for (const item of ARCHETYPES) {
    const question = item.generate(item.supportedLevels[0], "diagram-check");
    const markup = renderDiagram(question);
    assert.match(markup, /^<svg viewBox=/);
    assert.match(markup, /role="img"/);
    assert.match(markup, /<title/);
    assert.match(markup, /<desc/);
  }
});
