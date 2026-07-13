import {
  QUESTIONS_PER_GAME,
  DIFFICULTIES,
  OPERATION_ORDER,
  OPERATION_SYMBOLS,
  calculateScore,
  calculateStatistics,
  createOperationKey,
  generateQuestionSet,
  isAnswerCorrect,
  londonWeekStart,
  previousWeekStart,
  validateDisplayName,
} from "./rapid-fire-core.js";

const root = document.querySelector("[data-rapid-fire]");
if (!root) throw new Error("Rapid Fire root was not found.");

const STORAGE = {
  preferences: "sticks-rapid-fire:v1:preferences",
  player: "sticks-rapid-fire:v1:anonymous-player",
  attempts: "sticks-rapid-fire:v1:attempts",
  personalBests: "sticks-rapid-fire:v1:personal-bests",
};

const elements = Object.fromEntries([
  "display-name", "difficulty-options", "operation-options", "sound-enabled", "setup-form", "setup-message", "start-game",
  "menu-background", "countdown", "progress-label", "progress-bar", "correct-count", "timer", "question-stage", "streak",
  "question-text", "answer-form", "answer", "answer-feedback", "live-status", "final-score", "final-accuracy", "final-correct",
  "final-time", "average-time", "final-streak", "personal-best", "ranking-note", "result-message", "review-count", "answer-review",
  "how-dialog", "leaderboard-week", "leaderboard-difficulty", "leaderboard-operations", "leaderboard-body", "leaderboard-empty",
].map((name) => [name, root.querySelector(`[data-${name}]`) || document.querySelector(`[data-${name}]`)]));

const safeJson = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const writeJson = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const operationLabels = { addition: "Addition", subtraction: "Subtraction", multiplication: "Multiplication", division: "Division" };

const storedPreferences = safeJson(STORAGE.preferences, {});
const validStoredDifficulty = Object.hasOwn(DIFFICULTIES, storedPreferences.difficulty) ? storedPreferences.difficulty : "intermediate";
const validStoredOperations = Array.isArray(storedPreferences.operations)
  ? OPERATION_ORDER.filter((operation) => storedPreferences.operations.includes(operation))
  : [...OPERATION_ORDER];

const state = {
  status: "setup",
  returnScreen: "setup",
  settings: {
    displayName: typeof storedPreferences.displayName === "string" ? storedPreferences.displayName : "",
    difficulty: validStoredDifficulty,
    operations: validStoredOperations.length ? validStoredOperations : [...OPERATION_ORDER],
    soundEnabled: Boolean(storedPreferences.soundEnabled),
  },
  questions: [],
  questionIndex: 0,
  results: [],
  correctAnswers: 0,
  streak: 0,
  interrupted: false,
  acceptingAnswer: false,
  gameStart: 0,
  questionStart: 0,
  timerFrame: 0,
  countdownTimer: 0,
  menuVideo: null,
  finalResult: null,
};

function playerIdentity() {
  let player = safeJson(STORAGE.player, null);
  if (!player || typeof player.id !== "string") {
    player = { id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeJson(STORAGE.player, player);
  }
  return player;
}

function renderSetupOptions() {
  elements["difficulty-options"].innerHTML = Object.entries(DIFFICULTIES).map(([value, difficulty]) => `
    <label class="rf-choice"><input type="radio" name="difficulty" value="${value}" ${value === state.settings.difficulty ? "checked" : ""}><span>${difficulty.label}<small>${difficulty.detail}</small></span></label>
  `).join("");
  elements["operation-options"].innerHTML = OPERATION_ORDER.map((operation) => `
    <label class="rf-choice"><input type="checkbox" name="operation" value="${operation}" ${state.settings.operations.includes(operation) ? "checked" : ""}><span><b class="rf-operation-symbol">${OPERATION_SYMBOLS[operation]}</b>${operationLabels[operation]}</span></label>
  `).join("");
  elements["display-name"].value = state.settings.displayName;
  elements["sound-enabled"].checked = state.settings.soundEnabled;
}

function readSettings() {
  state.settings.displayName = elements["display-name"].value;
  state.settings.difficulty = root.querySelector('input[name="difficulty"]:checked')?.value ?? "intermediate";
  state.settings.operations = [...root.querySelectorAll('input[name="operation"]:checked')].map((input) => input.value);
  state.settings.soundEnabled = elements["sound-enabled"].checked;
}

function validateSetup(showMessage = true) {
  readSettings();
  const nameResult = validateDisplayName(state.settings.displayName);
  let message = nameResult.message;
  if (!state.settings.operations.length) message = "Select at least one operation to begin.";
  const valid = nameResult.valid && state.settings.operations.length > 0;
  elements["start-game"].disabled = !valid;
  if (showMessage) elements["setup-message"].textContent = message;
  return valid ? { ...state.settings, displayName: nameResult.name } : null;
}

function shouldUseVideo() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType ?? "");
  const lowPowerDevice = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 2;
  return !prefersReducedMotion.matches && !slowConnection && !lowPowerDevice;
}

function mountMenuVideo() {
  if (state.status !== "setup" || state.menuVideo || !shouldUseVideo()) return;
  const video = document.createElement("video");
  video.className = "rf-menu-video";
  video.autoplay = true;
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.poster = "./rapidfireposter.svg";
  video.setAttribute("aria-hidden", "true");
  video.innerHTML = '<source src="./rapidfirehomescreen.webm" type="video/webm"><source src="./rapidfirehomescreen.mp4" type="video/mp4">';
  elements["menu-background"].append(video);
  state.menuVideo = video;
  video.play().catch(() => {});
}

function unmountMenuVideo() {
  if (!state.menuVideo) return;
  state.menuVideo.pause();
  state.menuVideo.removeAttribute("src");
  state.menuVideo.querySelectorAll("source").forEach((source) => source.removeAttribute("src"));
  state.menuVideo.load();
  state.menuVideo.remove();
  state.menuVideo = null;
}

function showScreen(status) {
  state.status = status;
  root.dataset.status = status;
  root.querySelectorAll("[data-screen]").forEach((screen) => { screen.hidden = screen.dataset.screen !== status; });
  if (status === "setup") mountMenuVideo(); else unmountMenuVideo();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion.matches ? "auto" : "smooth" });
}

function savePreferences() {
  writeJson(STORAGE.preferences, state.settings);
}

function audioCue(correct) {
  if (!state.settings.soundEnabled) return;
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = correct ? 620 : 190;
    gain.gain.setValueAtTime(0.06, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.addEventListener("ended", () => context.close(), { once: true });
  } catch { /* Sound is optional. */ }
}

function startChallenge() {
  const settings = validateSetup(true);
  if (!settings) return;
  state.settings = settings;
  savePreferences();
  state.questions = generateQuestionSet(settings.difficulty, settings.operations);
  state.questionIndex = 0;
  state.results = [];
  state.correctAnswers = 0;
  state.streak = 0;
  state.interrupted = false;
  state.finalResult = null;
  showScreen("countdown");
  runCountdown();
}

function runCountdown() {
  const steps = ["3", "2", "1", "Go!"];
  let index = 0;
  const render = () => {
    elements.countdown.textContent = steps[index];
    elements.countdown.style.animation = "none";
    void elements.countdown.offsetWidth;
    elements.countdown.style.animation = "";
    index += 1;
    if (index < steps.length) state.countdownTimer = window.setTimeout(render, 720);
    else state.countdownTimer = window.setTimeout(beginPlaying, 480);
  };
  render();
}

function beginPlaying() {
  showScreen("playing");
  renderQuestion();
  requestAnimationFrame(() => {
    state.gameStart = performance.now();
    state.questionStart = state.gameStart;
    state.acceptingAnswer = true;
    elements.answer.focus({ preventScroll: true });
    updateTimer();
  });
}

function updateTimer() {
  if (state.status !== "playing") return;
  elements.timer.textContent = ((performance.now() - state.gameStart) / 1000).toFixed(2);
  state.timerFrame = requestAnimationFrame(updateTimer);
}

function renderQuestion() {
  const question = state.questions[state.questionIndex];
  elements["progress-label"].textContent = `Question ${state.questionIndex + 1} of ${QUESTIONS_PER_GAME}`;
  elements["progress-bar"].style.width = `${(state.questionIndex / QUESTIONS_PER_GAME) * 100}%`;
  elements["correct-count"].textContent = String(state.correctAnswers);
  elements.streak.textContent = `Streak ${state.streak}`;
  elements["question-text"].textContent = question.displayText;
  elements["live-status"].textContent = `Question ${state.questionIndex + 1} of ${QUESTIONS_PER_GAME}: ${question.displayText}`;
  elements.answer.value = "";
  elements["answer-feedback"].textContent = "";
  elements["question-stage"].classList.remove("is-correct", "is-wrong");
}

function submitAnswer(event) {
  event.preventDefault();
  if (state.status !== "playing" || !state.acceptingAnswer) return;
  const normalized = elements.answer.value.trim().replace(",", ".");
  if (!normalized || !Number.isFinite(Number(normalized))) {
    elements["answer-feedback"].textContent = "Enter a number to continue.";
    elements.answer.focus();
    return;
  }
  state.acceptingAnswer = false;
  const submittedAnswer = Number(normalized);
  const question = state.questions[state.questionIndex];
  const submittedAt = performance.now();
  const wasCorrect = isAnswerCorrect(question, submittedAnswer);
  state.results.push({
    questionId: question.id,
    questionIndex: state.questionIndex,
    operation: question.operation,
    displayText: question.displayText,
    submittedAnswer,
    correctAnswer: question.correctAnswer,
    wasCorrect,
    responseTimeMs: Math.round(submittedAt - state.questionStart),
  });
  if (wasCorrect) {
    state.correctAnswers += 1;
    state.streak += 1;
    elements["answer-feedback"].textContent = "✓ Correct";
    elements["question-stage"].classList.add("is-correct");
  } else {
    state.streak = 0;
    elements["answer-feedback"].textContent = `✕ Correct answer: ${question.correctAnswer}`;
    elements["question-stage"].classList.add("is-wrong");
  }
  audioCue(wasCorrect);
  window.setTimeout(() => {
    state.questionIndex += 1;
    if (state.questionIndex >= QUESTIONS_PER_GAME) finishChallenge(submittedAt);
    else {
      renderQuestion();
      state.questionStart = performance.now();
      state.acceptingAnswer = true;
      elements.answer.focus({ preventScroll: true });
    }
  }, prefersReducedMotion.matches ? 30 : 220);
}

function getAttempts() {
  const attempts = safeJson(STORAGE.attempts, []);
  return Array.isArray(attempts) ? attempts.filter((attempt) => attempt && typeof attempt.score === "number") : [];
}

function finishChallenge(endTime) {
  cancelAnimationFrame(state.timerFrame);
  const completionTimeMs = Math.round(endTime - state.gameStart);
  const statistics = calculateStatistics(state.results);
  const accuracyPercentage = Math.round((state.correctAnswers / QUESTIONS_PER_GAME) * 100);
  const score = calculateScore({ correctAnswers: state.correctAnswers, totalQuestions: QUESTIONS_PER_GAME, totalTimeSeconds: completionTimeMs / 1000, difficulty: state.settings.difficulty });
  const operationKey = createOperationKey(state.settings.operations);
  const personalBests = safeJson(STORAGE.personalBests, {});
  const personalBestKey = `${state.settings.difficulty}:${operationKey}`;
  const previousBest = Number(personalBests[personalBestKey] ?? 0);
  const isPersonalBest = score > previousBest;
  if (isPersonalBest) {
    personalBests[personalBestKey] = score;
    writeJson(STORAGE.personalBests, personalBests);
  }
  const result = {
    id: crypto.randomUUID(),
    playerId: playerIdentity().id,
    displayName: state.settings.displayName,
    difficulty: state.settings.difficulty,
    operations: [...state.settings.operations],
    operationKey,
    questionCount: QUESTIONS_PER_GAME,
    correctAnswers: state.correctAnswers,
    incorrectAnswers: QUESTIONS_PER_GAME - state.correctAnswers,
    accuracyPercentage,
    completionTimeMs,
    score,
    weekStart: londonWeekStart(),
    isRanked: !state.interrupted,
    interruptionReason: state.interrupted ? "window-lost-focus" : null,
    createdAt: new Date().toISOString(),
    averageResponseTimeMs: statistics.averageResponseTimeMs,
    longestCorrectStreak: statistics.longestCorrectStreak,
    isPersonalBest,
    previousBest,
    questionResults: state.results,
  };
  const attempts = getAttempts();
  attempts.push(result);
  writeJson(STORAGE.attempts, attempts.slice(-250));
  state.finalResult = result;
  renderResults();
  showScreen("results");
}

function bestRankedAttempts(filters) {
  const filtered = getAttempts().filter((attempt) => attempt.isRanked && attempt.weekStart === filters.weekStart && attempt.difficulty === filters.difficulty && attempt.operationKey === filters.operationKey);
  const bestByPlayer = new Map();
  const compare = (a, b) => b.score - a.score || b.correctAnswers - a.correctAnswers || a.completionTimeMs - b.completionTimeMs || a.createdAt.localeCompare(b.createdAt);
  filtered.forEach((attempt) => {
    const current = bestByPlayer.get(attempt.playerId);
    if (!current || compare(attempt, current) < 0) bestByPlayer.set(attempt.playerId, attempt);
  });
  return [...bestByPlayer.values()].sort(compare);
}

function animateScore(value) {
  if (prefersReducedMotion.matches) { elements["final-score"].textContent = value.toLocaleString("en-GB"); return; }
  const started = performance.now();
  const tick = (now) => {
    const progress = Math.min(1, (now - started) / 700);
    elements["final-score"].textContent = Math.round(value * (1 - (1 - progress) ** 3)).toLocaleString("en-GB");
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderResults() {
  const result = state.finalResult;
  animateScore(result.score);
  elements["final-accuracy"].textContent = `${result.accuracyPercentage}%`;
  elements["final-correct"].textContent = `${result.correctAnswers} / ${QUESTIONS_PER_GAME} correct`;
  elements["final-time"].textContent = `${(result.completionTimeMs / 1000).toFixed(2)}s`;
  elements["average-time"].textContent = `${(result.averageResponseTimeMs / 1000).toFixed(2)}s average`;
  elements["final-streak"].textContent = result.longestCorrectStreak;
  elements["personal-best"].hidden = !result.isPersonalBest;
  const ranking = bestRankedAttempts(result);
  const rank = ranking.findIndex((attempt) => attempt.id === result.id) + 1;
  elements["ranking-note"].textContent = result.isRanked ? `Weekly rank on this device: #${rank || 1}` : "Unranked attempt";
  elements["result-message"].textContent = result.isRanked
    ? (result.correctAnswers === QUESTIONS_PER_GAME ? "Perfect accuracy. That was seriously quick." : "Strong finish. Here’s how you did.")
    : "This attempt was not added to the leaderboard because the game window lost focus.";
  const incorrect = result.questionResults.filter((answer) => !answer.wasCorrect);
  elements["review-count"].textContent = incorrect.length;
  elements["answer-review"].innerHTML = incorrect.length
    ? incorrect.map((answer) => `<div class="rf-review-item"><strong>${answer.displayText}</strong><span>Your answer: ${answer.submittedAnswer}</span><span>Correct: ${answer.correctAnswer}</span></div>`).join("")
    : '<div class="rf-review-item"><strong>No mistakes to review — perfect round!</strong></div>';
}

function populateLeaderboardFilters() {
  const attempts = getAttempts();
  const currentWeek = londonWeekStart();
  elements["leaderboard-week"].innerHTML = `<option value="${currentWeek}">Current week</option><option value="${previousWeekStart(currentWeek)}">Previous week</option>`;
  elements["leaderboard-difficulty"].innerHTML = Object.entries(DIFFICULTIES).map(([value, item]) => `<option value="${value}">${item.label}</option>`).join("");
  const keys = new Set(attempts.map((attempt) => attempt.operationKey));
  keys.add(createOperationKey(state.settings.operations));
  elements["leaderboard-operations"].innerHTML = [...keys].filter(Boolean).map((key) => `<option value="${key}">${key.split("-").map((operation) => operationLabels[operation]).join(" + ")}</option>`).join("");
  elements["leaderboard-difficulty"].value = state.finalResult?.difficulty ?? state.settings.difficulty;
  elements["leaderboard-operations"].value = state.finalResult?.operationKey ?? createOperationKey(state.settings.operations);
  renderLeaderboard();
}

function renderLeaderboard() {
  const filters = {
    weekStart: elements["leaderboard-week"].value,
    difficulty: elements["leaderboard-difficulty"].value,
    operationKey: elements["leaderboard-operations"].value,
  };
  const playerId = playerIdentity().id;
  const ranked = bestRankedAttempts(filters).slice(0, 100);
  elements["leaderboard-body"].innerHTML = ranked.map((attempt, index) => `<tr class="${attempt.playerId === playerId ? "is-current" : ""}"><td>#${index + 1}</td><td>${escapeHtml(attempt.displayName)}</td><td>${attempt.score.toLocaleString("en-GB")}</td><td>${attempt.accuracyPercentage}%</td><td>${(attempt.completionTimeMs / 1000).toFixed(2)}s</td></tr>`).join("");
  elements["leaderboard-empty"].hidden = ranked.length > 0;
}

function escapeHtml(value) {
  const node = document.createElement("span");
  node.textContent = String(value);
  return node.innerHTML;
}

function openLeaderboard(from = state.status) {
  if (from !== "leaderboard") state.returnScreen = from;
  showScreen("leaderboard");
  populateLeaderboardFilters();
}

elements["setup-form"].addEventListener("submit", (event) => { event.preventDefault(); startChallenge(); });
elements["setup-form"].addEventListener("input", () => validateSetup(true));
elements["answer-form"].addEventListener("submit", submitAnswer);
root.querySelector("[data-open-how]").addEventListener("click", () => elements["how-dialog"].showModal());
root.querySelector("[data-open-leaderboard]").addEventListener("click", () => openLeaderboard("setup"));
root.querySelector("[data-results-leaderboard]").addEventListener("click", () => openLeaderboard("results"));
root.querySelector("[data-leaderboard-back]").addEventListener("click", () => showScreen(state.returnScreen));
root.querySelector("[data-play-again]").addEventListener("click", startChallenge);
root.querySelector("[data-change-settings]").addEventListener("click", () => showScreen("setup"));
[elements["leaderboard-week"], elements["leaderboard-difficulty"], elements["leaderboard-operations"]].forEach((select) => select.addEventListener("change", renderLeaderboard));

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    state.menuVideo?.pause();
    if (state.status === "playing" || state.status === "countdown") state.interrupted = true;
  } else if (state.status === "setup") state.menuVideo?.play().catch(() => {});
});
window.addEventListener("blur", () => {
  if (state.status === "playing" || state.status === "countdown") state.interrupted = true;
});
prefersReducedMotion.addEventListener("change", () => {
  if (prefersReducedMotion.matches) unmountMenuVideo(); else mountMenuVideo();
});

renderSetupOptions();
validateSetup(false);
playerIdentity();
mountMenuVideo();
