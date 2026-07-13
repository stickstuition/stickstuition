export const QUESTIONS_PER_GAME = 15;

export const OPERATION_ORDER = ["addition", "subtraction", "multiplication", "division"];

export const OPERATION_SYMBOLS = {
  addition: "+",
  subtraction: "−",
  multiplication: "×",
  division: "÷",
};

export const DIFFICULTIES = {
  junior: { label: "Junior", detail: "Years 7–8 band", add: [-50, 50], multiply: [1, 12], negativeMultiply: false, decimals: 0, target: 35 },
  year_7: { label: "Year 7", detail: "Year level", add: [-100, 100], multiply: [1, 20], negativeMultiply: false, decimals: 0, target: 35 },
  year_8: { label: "Year 8", detail: "Year level", add: [-100, 250], multiply: [2, 20], negativeMultiply: false, decimals: 0, target: 38 },
  intermediate: { label: "Intermediate", detail: "Years 9–10 band", add: [-250, 500], multiply: [2, 25], negativeMultiply: false, decimals: 0, target: 42 },
  year_9: { label: "Year 9", detail: "Year level", add: [-500, 1000], multiply: [2, 30], negativeMultiply: true, decimals: 0, target: 42 },
  year_10: { label: "Year 10", detail: "Year level", add: [-1000, 2000], multiply: [2, 40], negativeMultiply: true, decimals: 0, target: 45 },
  senior: { label: "Senior", detail: "Years 11–12 band", add: [-5000, 10000], multiply: [2, 50], negativeMultiply: true, decimals: 0.25, target: 50 },
  year_11: { label: "Year 11", detail: "Year level", add: [-5000, 10000], multiply: [2, 60], negativeMultiply: true, decimals: 0.35, target: 50 },
  year_12: { label: "Year 12", detail: "Year level", add: [-10000, 15000], multiply: [2, 80], negativeMultiply: true, decimals: 0.45, target: 55 },
};

export const DISPLAY_NAME_BLOCKLIST = [];

const round = (value, places = 3) => {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const randomInt = (min, max, random = Math.random) => Math.floor(random() * (max - min + 1)) + min;

const chooseSign = (allowed, random) => (allowed && random() < 0.22 ? -1 : 1);

const formatNumber = (value) => new Intl.NumberFormat("en-GB", {
  maximumFractionDigits: 3,
  useGrouping: true,
}).format(value);

export function validateDisplayName(value, blocklist = DISPLAY_NAME_BLOCKLIST) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 20) return { valid: false, name, message: "Use a display name between 2 and 20 characters." };
  if (!/^[\p{L}\p{N} '_-]+$/u.test(name)) return { valid: false, name, message: "Use letters, numbers, spaces, hyphens, apostrophes or underscores only." };
  const lowered = name.toLocaleLowerCase("en-GB");
  if (blocklist.some((word) => lowered.includes(String(word).toLocaleLowerCase("en-GB")))) {
    return { valid: false, name, message: "Please choose a different display name." };
  }
  return { valid: true, name, message: "" };
}

export function createOperationKey(operations) {
  const selected = new Set(operations);
  return OPERATION_ORDER.filter((operation) => selected.has(operation)).join("-");
}

export function distributeOperations(operations, count = QUESTIONS_PER_GAME, random = Math.random) {
  const selected = OPERATION_ORDER.filter((operation) => operations.includes(operation));
  if (!selected.length) throw new Error("At least one operation is required.");
  const distribution = Array.from({ length: count }, (_, index) => selected[index % selected.length]);
  for (let index = distribution.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [distribution[index], distribution[swapIndex]] = [distribution[swapIndex], distribution[index]];
  }
  return distribution;
}

function makeQuestion(operation, difficulty, index, random) {
  const profile = DIFFICULTIES[difficulty];
  if (!profile) throw new Error(`Unknown difficulty: ${difficulty}`);
  const useDecimal = profile.decimals > 0 && random() < profile.decimals;
  let leftOperand;
  let rightOperand;
  let correctAnswer;

  if (operation === "addition" || operation === "subtraction") {
    const scale = useDecimal ? 10 : 1;
    leftOperand = randomInt(profile.add[0] * scale, profile.add[1] * scale, random) / scale;
    rightOperand = randomInt(profile.add[0] * scale, profile.add[1] * scale, random) / scale;
    if (difficulty === "junior") {
      leftOperand = randomInt(1, operation === "addition" ? 50 : 100, random);
      rightOperand = randomInt(1, operation === "addition" ? 50 : 100, random);
      if (operation === "addition" && leftOperand + rightOperand > 100) rightOperand = 100 - leftOperand;
      if (operation === "subtraction" && rightOperand > leftOperand) [leftOperand, rightOperand] = [rightOperand, leftOperand];
    }
    correctAnswer = operation === "addition" ? leftOperand + rightOperand : leftOperand - rightOperand;
  } else if (operation === "multiplication") {
    const [min, max] = profile.multiply;
    leftOperand = randomInt(min, max, random) * chooseSign(profile.negativeMultiply, random);
    rightOperand = randomInt(min, Math.min(max, difficulty === "year_12" ? 80 : 30), random) * chooseSign(profile.negativeMultiply, random);
    if (useDecimal) leftOperand = round(leftOperand / 10, 1);
    correctAnswer = leftOperand * rightOperand;
  } else {
    const [min, max] = profile.multiply;
    rightOperand = randomInt(Math.max(1, min), Math.min(max, 30), random) * chooseSign(profile.negativeMultiply, random);
    let quotient = randomInt(1, Math.min(max, difficulty === "year_12" ? 80 : 30), random) * chooseSign(profile.negativeMultiply, random);
    if (useDecimal) {
      if (random() < 0.5) rightOperand = round(rightOperand / 10, 1);
      else quotient = round(quotient / 10, 1);
    }
    leftOperand = round(rightOperand * quotient);
    correctAnswer = quotient;
  }

  leftOperand = round(leftOperand);
  rightOperand = round(rightOperand);
  correctAnswer = round(correctAnswer);
  const decimalQuestion = !Number.isInteger(leftOperand) || !Number.isInteger(rightOperand) || !Number.isInteger(correctAnswer);
  return {
    id: `${difficulty}-${operation}-${index}-${String(leftOperand).replace("-", "n")}-${String(rightOperand).replace("-", "n")}`,
    operation,
    leftOperand,
    rightOperand,
    displayText: `${formatNumber(leftOperand)} ${OPERATION_SYMBOLS[operation]} ${formatNumber(rightOperand)}`,
    correctAnswer,
    acceptedTolerance: decimalQuestion ? 0.001 : 0,
  };
}

export function generateQuestionSet(difficulty, operations, random = Math.random, count = QUESTIONS_PER_GAME) {
  const distribution = distributeOperations(operations, count, random);
  const seen = new Set();
  return distribution.map((operation, index) => {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const question = makeQuestion(operation, difficulty, index, random);
      const signature = `${operation}:${question.leftOperand}:${question.rightOperand}`;
      if (!seen.has(signature)) {
        seen.add(signature);
        return question;
      }
    }
    throw new Error("Unable to generate a unique question set.");
  });
}

export function isAnswerCorrect(question, submittedAnswer) {
  if (!Number.isFinite(submittedAnswer)) return false;
  return Math.abs(submittedAnswer - question.correctAnswer) <= question.acceptedTolerance + Number.EPSILON;
}

export function calculateScore({ correctAnswers, totalQuestions = QUESTIONS_PER_GAME, totalTimeSeconds, difficulty }) {
  const accuracyRatio = Math.max(0, Math.min(1, correctAnswers / totalQuestions));
  const accuracyScore = 15000 * Math.pow(accuracyRatio, 2);
  const targetTime = DIFFICULTIES[difficulty]?.target ?? 45;
  const timeRatio = targetTime / Math.max(totalTimeSeconds, 1);
  const speedMultiplier = 0.75 + Math.min(timeRatio, 1.5) * 0.25;
  const perfectBonus = correctAnswers === totalQuestions ? 1000 : 0;
  return Math.max(0, Math.round(accuracyScore * speedMultiplier + perfectBonus));
}

export function calculateStatistics(questionResults) {
  let streak = 0;
  let longestCorrectStreak = 0;
  let totalResponseTimeMs = 0;
  for (const result of questionResults) {
    totalResponseTimeMs += result.responseTimeMs;
    streak = result.wasCorrect ? streak + 1 : 0;
    longestCorrectStreak = Math.max(longestCorrectStreak, streak);
  }
  return {
    longestCorrectStreak,
    averageResponseTimeMs: questionResults.length ? Math.round(totalResponseTimeMs / questionResults.length) : 0,
  };
}

export function londonWeekStart(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const weekdayIndex = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(parts.weekday);
  const londonDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
  londonDate.setUTCDate(londonDate.getUTCDate() - Math.max(weekdayIndex, 0));
  return londonDate.toISOString().slice(0, 10);
}

export function previousWeekStart(weekStart) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 7);
  return date.toISOString().slice(0, 10);
}
