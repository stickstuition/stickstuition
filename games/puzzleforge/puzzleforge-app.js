import { ARCHETYPES, generateQuestion } from "./puzzleforge-core.js";
import { renderDiagram } from "./puzzleforge-diagrams.js";

const app = document.querySelector("[data-pf-app]");
if (!app) throw new Error("PuzzleForge app root was not found.");

const query = (name) => app.querySelector(`[data-pf-${name}]`);
const elements = Object.fromEntries(["generate", "generator-status", "workspace", "empty", "level-badge", "topic-badge", "archetype", "prompt", "diagram", "answer-form", "options", "number-wrap", "number-answer", "hint-button", "solution-button", "feedback", "hint", "solution", "solution-steps", "solution-close", "another", "seed", "history", "topic", "answer-type", "force", "diagrams", "ai", "show-seed", "reset"].map((name) => [name, query(name)]));

const HISTORY_KEY = "sticks-puzzleforge:v2:recent";
const PREFERENCES_KEY = "sticks-puzzleforge:v2:preferences";
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const safeWrite = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const escapeHtml = (value) => { const node = document.createElement("span"); node.textContent = String(value); return node.innerHTML; };

const state = {
  question: null,
  attempts: 0,
  answered: false,
  history: Array.isArray(safeRead(HISTORY_KEY, [])) ? safeRead(HISTORY_KEY, []).slice(-30) : [],
};

function selectedLevel() {
  return app.querySelector('input[name="pf-level"]:checked')?.value ?? "junior";
}

function createSeed() {
  const bytes = new Uint32Array(2);
  crypto.getRandomValues(bytes);
  return `${Date.now().toString(36)}-${bytes[0].toString(36)}${bytes[1].toString(36)}`;
}

function populateForceArchetypes() {
  const level = selectedLevel();
  const current = elements.force.value;
  elements.force.innerHTML = '<option value="">Automatic variety</option>' + ARCHETYPES.filter((item) => item.supportedLevels.includes(level)).map((item) => `<option value="${item.id}">${item.name}</option>`).join("");
  if ([...elements.force.options].some((option) => option.value === current)) elements.force.value = current;
}

function savePreferences() {
  safeWrite(PREFERENCES_KEY, { level: selectedLevel(), topic: elements.topic.value, answerType: elements["answer-type"].value, diagrams: elements.diagrams.checked, ai: elements.ai.checked, showSeed: elements["show-seed"].checked });
}

function restorePreferences() {
  const preferences = safeRead(PREFERENCES_KEY, {});
  const levelInput = app.querySelector(`input[name="pf-level"][value="${preferences.level}"]`);
  if (levelInput) levelInput.checked = true;
  if ([...elements.topic.options].some((option) => option.value === preferences.topic)) elements.topic.value = preferences.topic;
  if ([...elements["answer-type"].options].some((option) => option.value === preferences.answerType)) elements["answer-type"].value = preferences.answerType;
  elements.diagrams.checked = preferences.diagrams !== false;
  elements.ai.checked = Boolean(preferences.ai);
  elements["show-seed"].checked = Boolean(preferences.showSeed);
}

function addHistory(question) {
  state.history.push({ id: question.id, seed: question.seed, level: question.level, topic: question.topic, archetype: question.archetype, archetypeName: question.archetypeName, correctAnswer: question.correctAnswer, context: question.context, opening: question.prompt.slice(0, 70) });
  state.history = state.history.slice(-30);
  safeWrite(HISTORY_KEY, state.history);
}

function renderHistory() {
  const recent = state.history.slice(-5).reverse();
  elements.history.innerHTML = recent.length ? recent.map((item) => `<div><span>${escapeHtml(item.level)}</span><strong>${escapeHtml(item.archetypeName)}</strong></div>`).join("") : "<p>No recent challenges yet.</p>";
}

function renderOptions(question) {
  const isMultipleChoice = question.answerType === "multipleChoice";
  elements.options.hidden = !isMultipleChoice;
  elements["number-wrap"].hidden = isMultipleChoice;
  elements["number-answer"].value = "";
  elements.options.innerHTML = isMultipleChoice
    ? `<legend>Select your answer</legend>${question.options.map((option, index) => `<label><input type="radio" name="pf-answer" value="${escapeHtml(option.value)}"><span><b>${String.fromCharCode(65 + index)}</b>${escapeHtml(option.value)}</span></label>`).join("")}`
    : "";
}

function renderQuestion(question) {
  state.question = question;
  state.attempts = 0;
  state.answered = false;
  elements.workspace.hidden = false;
  elements.empty.hidden = true;
  elements["level-badge"].textContent = question.level;
  elements["topic-badge"].textContent = question.topic;
  elements.archetype.textContent = question.archetypeName;
  elements.prompt.textContent = question.prompt;
  elements.diagram.innerHTML = renderDiagram(question);
  elements.diagram.hidden = !elements.diagrams.checked;
  renderOptions(question);
  elements.feedback.className = "pf-feedback";
  elements.feedback.textContent = "Take your time and use the information in the diagram.";
  elements.hint.hidden = true;
  elements.hint.querySelector("p").textContent = question.hint;
  elements.solution.hidden = true;
  elements["solution-button"].disabled = true;
  elements["solution-button"].textContent = "Show solution";
  elements["hint-button"].textContent = "Show hint";
  elements.seed.textContent = `Seed: ${question.seed}`;
  elements.seed.hidden = !elements["show-seed"].checked;
  elements["solution-steps"].innerHTML = question.solutionSteps.map((step, index) => `<article><span>Step ${index + 1}</span><p>${escapeHtml(step.explanation)}</p>${step.expression ? `<code>${escapeHtml(step.expression)}</code>` : ""}</article>`).join("");
  addHistory(question);
  renderHistory();
  requestAnimationFrame(() => elements.workspace.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
}

function forgeQuestion() {
  const started = performance.now();
  elements.generate.disabled = true;
  elements["generator-status"].textContent = "Checking the numbers and building the diagram…";
  try {
    const question = generateQuestion({
      level: selectedLevel(),
      seed: createSeed(),
      topic: elements.topic.value,
      answerType: elements["answer-type"].value,
      forceArchetype: elements.force.value,
      recentArchetypes: state.history.map((item) => item.archetype),
    });
    renderQuestion(question);
    const elapsed = Math.max(1, Math.round(performance.now() - started));
    elements["generator-status"].textContent = `Verified locally in ${elapsed} ms${elements.ai.checked ? ". Local wording used; no server AI endpoint is configured." : "."}`;
    savePreferences();
  } catch (error) {
    console.error("PuzzleForge generation failed", error);
    elements["generator-status"].textContent = "A new version could not be created, so we loaded another challenge.";
    const fallback = ARCHETYPES.find((item) => item.id === "grid-area").generate("junior", "safe-fallback");
    renderQuestion(fallback);
  } finally {
    elements.generate.disabled = false;
  }
}

function submittedValue() {
  if (state.question.answerType === "integer") return elements["number-answer"].value.trim();
  return app.querySelector('input[name="pf-answer"]:checked')?.value ?? "";
}

function checkAnswer(event) {
  event.preventDefault();
  if (!state.question || state.answered) return;
  const value = submittedValue();
  if (!value) {
    elements.feedback.className = "pf-feedback is-warn";
    elements.feedback.textContent = "Choose or enter an answer first.";
    return;
  }
  state.attempts += 1;
  const correct = String(value).replace(/\s/g, "") === state.question.correctAnswer.replace(/\s/g, "");
  if (correct) {
    state.answered = true;
    elements.feedback.className = "pf-feedback is-correct";
    elements.feedback.textContent = "Correct! Great reasoning.";
    elements["solution-button"].disabled = false;
    if (state.question.answerType === "multipleChoice") app.querySelector('input[name="pf-answer"]:checked')?.closest("label")?.classList.add("is-correct");
  } else {
    elements.feedback.className = "pf-feedback is-warn";
    elements.feedback.textContent = state.attempts < 2 ? "Not quite. Try looking carefully at the information in the diagram." : "That was your second try. The worked solution is now available.";
    if (state.attempts >= 2) elements["solution-button"].disabled = false;
  }
}

function toggleHint() {
  elements.hint.hidden = !elements.hint.hidden;
  elements["hint-button"].textContent = elements.hint.hidden ? "Show hint" : "Hide hint";
}

function showSolution() {
  if (elements["solution-button"].disabled) return;
  elements.solution.hidden = false;
  elements.solution.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

app.querySelectorAll('input[name="pf-level"]').forEach((input) => input.addEventListener("change", () => { populateForceArchetypes(); savePreferences(); }));
elements.generate.addEventListener("click", forgeQuestion);
elements.another.addEventListener("click", forgeQuestion);
elements["answer-form"].addEventListener("submit", checkAnswer);
elements["hint-button"].addEventListener("click", toggleHint);
elements["solution-button"].addEventListener("click", showSolution);
elements["solution-close"].addEventListener("click", () => { elements.solution.hidden = true; });
elements.diagrams.addEventListener("change", () => { if (state.question) elements.diagram.hidden = !elements.diagrams.checked; savePreferences(); });
elements["show-seed"].addEventListener("change", () => { elements.seed.hidden = !elements["show-seed"].checked || !state.question; savePreferences(); });
[elements.topic, elements["answer-type"], elements.ai].forEach((control) => control.addEventListener("change", savePreferences));
elements.reset.addEventListener("click", () => { state.history = []; localStorage.removeItem(HISTORY_KEY); renderHistory(); elements["generator-status"].textContent = "Recent-question history cleared."; });

restorePreferences();
populateForceArchetypes();
renderHistory();
