import { answerMatches, generateRebusBoard } from "./rebus-core.js";
import { categories, categoryById } from "./rebus-content.js";

const app = document.querySelector("[data-my-rebus]");
const screens = new Map([...app.querySelectorAll("[data-screen]")].map((screen) => [screen.dataset.screen, screen]));
const categoryGrid = app.querySelector("[data-category-grid]");
const createBoardButton = app.querySelector("[data-create-board]");
const selectionSummary = app.querySelector("[data-selection-summary]");
const boardGrid = app.querySelector("[data-board-grid]");
const boardCategories = app.querySelector("[data-board-categories]");
const boardStatus = app.querySelector("[data-board-status]");
const completeBanner = app.querySelector("[data-complete-banner]");
const cardTemplate = document.querySelector("#rebus-card-template");

let selectedCategories = new Set();
let previousBoardIds = [];
let currentBoard = [];
let cardStates = [];

const showScreen = (name) => {
  for (const [screenName, screen] of screens) screen.hidden = screenName !== name;
  window.scrollTo({ top: 0, behavior: "instant" });
};

const updateCategoryControls = () => {
  for (const button of categoryGrid.querySelectorAll("[data-category]")) {
    button.setAttribute("aria-pressed", String(selectedCategories.has(button.dataset.category)));
  }
  const count = selectedCategories.size;
  createBoardButton.disabled = count === 0;
  selectionSummary.textContent = count === 0
    ? "Choose at least one category"
    : `${count} ${count === 1 ? "category" : "categories"} selected`;
};

for (const category of categories) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mr-category-tile";
  button.dataset.category = category.id;
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = `<span class="mr-category-icon" aria-hidden="true">${category.icon}</span><span>${category.name}</span><span class="mr-category-check" aria-hidden="true">✓</span>`;
  button.addEventListener("click", () => {
    if (category.id === "random-mix") {
      selectedCategories = selectedCategories.has(category.id) ? new Set() : new Set([category.id]);
    } else {
      selectedCategories.delete("random-mix");
      if (selectedCategories.has(category.id)) selectedCategories.delete(category.id);
      else selectedCategories.add(category.id);
    }
    updateCategoryControls();
  });
  categoryGrid.append(button);
}

const preloadImages = (board) => Promise.all(board.flatMap((rebus) => rebus.clues.map((clue) => new Promise((resolve, reject) => {
  const image = new Image();
  image.onload = resolve;
  image.onerror = () => reject(new Error(rebus.id));
  image.src = clue.image;
}))));

const updateBoardProgress = () => {
  const complete = cardStates.filter((state) => state.status === "solved" || state.status === "revealed").length;
  boardStatus.textContent = `${complete} / 6 complete`;
  completeBanner.hidden = complete !== 6;
};

const finishCard = (card, rebus, state, status) => {
  state.status = status;
  card.dataset.state = status;
  card.querySelector("[data-answer-form]").hidden = true;
  card.querySelector("[data-card-tools]").hidden = true;
  card.querySelector("[data-hint]").hidden = true;
  const answerPanel = card.querySelector("[data-answer-panel]");
  answerPanel.hidden = false;
  const prefix = status === "solved" ? "✓" : "Revealed:";
  card.querySelector("[data-answer-state]").textContent = `${prefix} ${rebus.answer.toUpperCase()}`;
  card.querySelector("[data-answer-equation]").textContent = `${rebus.clues.map((clue) => clue.word.toUpperCase()).join(" + ")} = ${rebus.answer.toUpperCase()}`;
  updateBoardProgress();
};

const renderCard = (rebus, index) => {
  const state = { status: "open", attempts: 0, hintOpen: false };
  cardStates.push(state);
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector("[data-card]");
  const category = categoryById.get(rebus.category);
  card.querySelector("[data-card-number]").textContent = `Rebus ${index + 1}`;
  card.querySelector("[data-card-category]").textContent = `${category.icon} ${category.name}`;
  card.querySelector("[data-answer-label]").setAttribute("for", `rebus-answer-${index}`);
  const input = card.querySelector("[data-answer-input]");
  input.id = `rebus-answer-${index}`;
  input.setAttribute("aria-label", `Answer for rebus ${index + 1}`);

  const clueRow = card.querySelector("[data-clues]");
  rebus.clues.forEach((clue, clueIndex) => {
    if (clueIndex > 0) {
      const plus = document.createElement("span");
      plus.className = "mr-plus";
      plus.textContent = "+";
      plus.setAttribute("aria-hidden", "true");
      clueRow.append(plus);
    }
    const picture = document.createElement("span");
    picture.className = "mr-clue";
    const image = document.createElement("img");
    image.src = clue.image;
    image.alt = clue.alt;
    image.width = 128;
    image.height = 128;
    picture.append(image);
    clueRow.append(picture);
  });

  const feedback = card.querySelector("[data-feedback]");
  const revealButton = card.querySelector("[data-reveal-button]");
  card.querySelector("[data-answer-form]").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!input.value.trim()) {
      feedback.textContent = "Type an answer";
      input.focus();
      return;
    }
    if (answerMatches(input.value, rebus)) {
      feedback.textContent = "✓ Correct";
      feedback.classList.add("is-correct");
      finishCard(card, rebus, state, "solved");
      return;
    }
    state.attempts += 1;
    feedback.textContent = "✕ Try again";
    revealButton.hidden = false;
    card.classList.remove("is-shaking");
    requestAnimationFrame(() => card.classList.add("is-shaking"));
    input.select();
  });

  const hint = card.querySelector("[data-hint]");
  card.querySelector("[data-hint-button]").addEventListener("click", (event) => {
    state.hintOpen = !state.hintOpen;
    hint.textContent = rebus.hint;
    hint.hidden = !state.hintOpen;
    event.currentTarget.textContent = state.hintOpen ? "Hide hint" : "Hint";
  });
  revealButton.addEventListener("click", () => finishCard(card, rebus, state, "revealed"));
  return fragment;
};

const renderBoard = () => {
  boardGrid.replaceChildren();
  cardStates = [];
  currentBoard.forEach((rebus, index) => boardGrid.append(renderCard(rebus, index)));
  boardCategories.replaceChildren();
  for (const id of selectedCategories) {
    const category = categoryById.get(id);
    const chip = document.createElement("span");
    chip.textContent = `${category.icon} ${category.name}`;
    boardCategories.append(chip);
  }
  completeBanner.hidden = true;
  updateBoardProgress();
  showScreen("board");
};

async function buildBoard() {
  showScreen("loading");
  const excluded = new Set();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = generateRebusBoard({
      selectedCategories: [...selectedCategories],
      previousBoardIds,
      excludedIds: [...excluded],
    });
    try {
      await preloadImages(candidate);
      currentBoard = candidate;
      previousBoardIds = candidate.map((rebus) => rebus.id);
      renderBoard();
      return;
    } catch (error) {
      excluded.add(error.message);
    }
  }
  selectionSummary.textContent = "We couldn’t load enough picture clues. Please try again.";
  showScreen("categories");
}

app.querySelector("[data-open-categories]").addEventListener("click", () => showScreen("categories"));
app.querySelector("[data-back-home]").addEventListener("click", () => showScreen("landing"));
createBoardButton.addEventListener("click", buildBoard);
app.querySelector("[data-new-board]").addEventListener("click", buildBoard);
app.querySelector("[data-change-categories]").addEventListener("click", () => showScreen("categories"));
app.querySelector("[data-reset-answers]").addEventListener("click", renderBoard);

updateCategoryControls();
