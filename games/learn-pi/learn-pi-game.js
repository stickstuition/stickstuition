import { PI_DIGITS, createRound, submitDigit } from "./learn-pi-core.js";

const BEST_KEY = "sticks-learn-pi-best";

document.querySelectorAll("[data-learn-pi]").forEach((game) => {
  const answer = game.querySelector("[data-answer]");
  const score = game.querySelector("[data-score]");
  const best = game.querySelector("[data-best]");
  const lives = game.querySelector("[data-lives]");
  const sequence = game.querySelector("[data-sequence]");
  const digits = game.querySelector("[data-pi-digits]");
  const sequenceCount = game.querySelector("[data-sequence-count]");
  const feedback = game.querySelector("[data-feedback]");
  const gameOver = game.querySelector("[data-game-over]");
  const gameOverMessage = game.querySelector("[data-game-over-message]");
  const nextDigit = game.querySelector("[data-next-digit]");
  const finalDigits = game.querySelector("[data-final-digits]");
  const digitButtons = Array.from(game.querySelectorAll("[data-digit]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let feedbackTimer = 0;
  let inputLocked = false;

  function readBest() {
    try {
      return Number.parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
    } catch (error) {
      return 0;
    }
  }

  function saveBest(value) {
    try {
      localStorage.setItem(BEST_KEY, String(value));
    } catch (error) {
      // The score still works when storage is blocked by the browser.
    }
  }

  let state = createRound(readBest());

  function focusAnswer() {
    if (state.status === "playing") answer.focus({ preventScroll: true });
  }

  function renderSequence(highlightLatest = false) {
    const completed = PI_DIGITS.slice(0, state.score);
    digits.replaceChildren();

    if (highlightLatest && completed) {
      digits.append(document.createTextNode(completed.slice(0, -1)));
      const latest = document.createElement("span");
      latest.className = "lp-latest-digit";
      latest.textContent = completed.at(-1);
      digits.append(latest);
    } else {
      digits.textContent = completed;
    }

    const label = `Pi equals 3 point ${completed.split("").join(" ")}`.trim();
    sequence.setAttribute("aria-label", label);
    sequenceCount.textContent = `${state.score} digit${state.score === 1 ? "" : "s"} after the decimal`;
    sequence.scrollTop = sequence.scrollHeight;
  }

  function renderStatus() {
    score.textContent = state.score;
    score.setAttribute("aria-label", `Digits correct: ${state.score}`);
    best.textContent = state.best;
    best.setAttribute("aria-label", `Personal best: ${state.best}`);
    lives.innerHTML = `<span aria-hidden="true">${"♥ ".repeat(state.lives).trim()}${state.lives < 3 ? `<i>${"♡ ".repeat(3 - state.lives).trim()}</i>` : ""}</span>`;
    lives.setAttribute("aria-label", `${state.lives} ${state.lives === 1 ? "life" : "lives"} remaining`);
  }

  function showGameOver(correctDigit) {
    answer.disabled = true;
    digitButtons.forEach((button) => { button.disabled = true; });
    gameOverMessage.textContent = `You reached ${state.score} digit${state.score === 1 ? "" : "s"} of pi.`;
    nextDigit.textContent = correctDigit;
    finalDigits.textContent = PI_DIGITS.slice(0, state.score);
    gameOver.hidden = false;
    gameOver.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    gameOver.querySelector("[data-try-again]").focus({ preventScroll: true });
  }

  function flash(kind) {
    window.clearTimeout(feedbackTimer);
    answer.classList.remove("is-correct", "is-incorrect");
    void answer.offsetWidth;
    answer.classList.add(`is-${kind}`);
    feedbackTimer = window.setTimeout(() => answer.classList.remove(`is-${kind}`), 260);
  }

  function handleDigit(digit) {
    if (inputLocked || state.status !== "playing") return;
    inputLocked = true;
    answer.value = digit;
    const previousBest = state.best;
    const result = submitDigit(state, digit);
    state = result.state;

    if (result.outcome === "correct") {
      flash("correct");
      renderSequence(true);
      feedback.textContent = `Correct — ${state.score} digit${state.score === 1 ? "" : "s"}!`;
      if (state.best > previousBest) saveBest(state.best);
    } else if (result.outcome === "incorrect") {
      flash("incorrect");
      feedback.textContent = state.lives ? `Not quite. Try that digit again — ${state.lives} ${state.lives === 1 ? "life" : "lives"} left.` : "That was your last life.";
    }

    renderStatus();

    if (state.status === "game-over") {
      window.setTimeout(() => showGameOver(result.correctDigit), 220);
      return;
    }

    window.setTimeout(() => {
      answer.value = "";
      inputLocked = false;
      focusAnswer();
    }, 180);
  }

  function restart() {
    window.clearTimeout(feedbackTimer);
    state = createRound(readBest());
    inputLocked = false;
    answer.disabled = false;
    answer.value = "";
    answer.classList.remove("is-correct", "is-incorrect");
    digitButtons.forEach((button) => { button.disabled = false; });
    gameOver.hidden = true;
    feedback.textContent = "Start with the first digit after the decimal point.";
    renderStatus();
    renderSequence();
    focusAnswer();
  }

  answer.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || ["Tab", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    if (!/^[0-9]$/.test(event.key)) event.preventDefault();
  });

  answer.addEventListener("input", () => {
    const digit = answer.value.replace(/\D/g, "").slice(0, 1);
    answer.value = digit;
    if (digit) handleDigit(digit);
  });

  digitButtons.forEach((button) => button.addEventListener("click", () => handleDigit(button.dataset.digit)));
  game.querySelector("[data-restart]").addEventListener("click", restart);
  game.querySelector("[data-try-again]").addEventListener("click", restart);

  renderStatus();
  renderSequence();
  window.setTimeout(focusAnswer, 0);
});
