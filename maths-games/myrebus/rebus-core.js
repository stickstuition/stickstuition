import { categories, rebuses } from "./rebus-content.js";

const shuffle = (items, random = Math.random) => {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
};

const pick = (pool, count, previousIds, usedIds, random) => {
  const valid = pool.filter((item) => !usedIds.has(item.id));
  const fresh = shuffle(valid.filter((item) => !previousIds.has(item.id)), random);
  const repeats = shuffle(valid.filter((item) => previousIds.has(item.id)), random);
  const selected = [...fresh, ...repeats].slice(0, count);
  selected.forEach((item) => usedIds.add(item.id));
  return selected;
};

const categoryCounts = (selectedIds, random) => {
  const ids = shuffle(selectedIds, random);
  if (ids.length > 6) return ids.slice(0, 6).map((id) => [id, 1]);
  if (ids.length === 6) return ids.map((id) => [id, 1]);
  if (ids.length === 5) return ids.map((id, index) => [id, index === 0 ? 2 : 1]);
  if (ids.length === 4) return ids.map((id, index) => [id, index < 2 ? 2 : 1]);
  if (ids.length === 3) return ids.map((id) => [id, 2]);
  if (ids.length === 2) return ids.map((id) => [id, 3]);
  return ids.map((id) => [id, 5]);
};

export function generateRebusBoard({
  selectedCategories,
  previousBoardIds = [],
  excludedIds = [],
  random = Math.random,
} = {}) {
  if (!Array.isArray(selectedCategories) || selectedCategories.length === 0) {
    throw new Error("Choose at least one category.");
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  if (selectedCategories.some((id) => !categoryIds.has(id))) throw new Error("Unknown category selected.");

  const previous = new Set(previousBoardIds);
  const excluded = new Set(excludedIds);
  const available = rebuses.filter((item) => !excluded.has(item.id));
  const used = new Set();
  const board = [];
  const isRandomMix = selectedCategories.includes("random-mix");
  const specific = isRandomMix
    ? categories.filter((category) => category.id !== "random-mix").map((category) => category.id)
    : selectedCategories;
  const distribution = isRandomMix
    ? shuffle(specific, random).slice(0, 6).map((id) => [id, 1])
    : categoryCounts(specific, random);

  for (const [categoryId, count] of distribution) {
    board.push(...pick(available.filter((item) => item.category === categoryId), count, previous, used, random));
  }

  if (board.length < 6) {
    const selectedPool = available.filter((item) => specific.includes(item.category));
    board.push(...pick(selectedPool, 6 - board.length, previous, used, random));
  }

  if (board.length < 6) board.push(...pick(available, 6 - board.length, previous, used, random));
  if (board.length !== 6) throw new Error("Not enough valid rebuses to build a board.");

  let hardCount = board.filter((item) => item.difficulty === 3).length;
  if (hardCount > 1) {
    for (let index = 0; index < board.length && hardCount > 1; index += 1) {
      const current = board[index];
      if (current.difficulty !== 3) continue;
      const replacement = pick(
        available.filter((item) => item.category === current.category && item.difficulty < 3),
        1,
        previous,
        used,
        random,
      )[0];
      if (replacement) {
        used.delete(current.id);
        board[index] = replacement;
        hardCount -= 1;
      }
    }
  }

  return shuffle(board, random);
}

export function normaliseAnswer(value = "") {
  return String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function answerMatches(value, rebus) {
  const normalised = normaliseAnswer(value);
  return rebus.acceptedAnswers.some((answer) => normaliseAnswer(answer) === normalised);
}
