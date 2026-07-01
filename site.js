document.querySelectorAll(".site-header").forEach((header) => {
  const toggle = header.querySelector("[data-menu-toggle]");
  const nav = header.querySelector(".nav-links");
  if (!toggle || !nav) return;

  function setMenu(open) {
    header.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("has-open-menu", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("is-menu-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  header.querySelector(".nav-cta")?.addEventListener("click", () => setMenu(false));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenu(false);
  });
});

document.querySelectorAll("[data-contact-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (form.getAttribute("action")) return;
    event.preventDefault();
    const button = form.querySelector("button");
    const original = button.textContent;
    button.textContent = "Message queued";
    form.classList.add("is-sent");
    window.setTimeout(() => {
      button.textContent = original;
      form.classList.remove("is-sent");
      form.reset();
    }, 1800);
  });
});

document.querySelectorAll("[data-pricing-page]").forEach((page) => {
  const priceData = {
    aus: {
      label: "Australia",
      tiers: [{ label: "All students", price: "$59.99", note: "per lesson for all students" }],
    },
    uk: {
      label: "United Kingdom",
      tiers: [
        { label: "GCSE", price: "\u00a339.99", note: "per GCSE lesson" },
        { label: "A Levels", price: "\u00a344.99", note: "per A Level lesson" },
      ],
    },
    europe: {
      label: "Europe",
      tiers: [
        { label: "Years 7-10", price: "\u20ac34.99", note: "per Years 7-10 lesson" },
        { label: "Years 11-12", price: "\u20ac39.99", note: "per Years 11-12 lesson" },
      ],
    },
  };

  const regionLabel = page.querySelector("[data-region-label]");
  const priceDisplay = page.querySelector("[data-price-display]");
  const priceNote = page.querySelector("[data-price-note]");
  const regionStatus = page.querySelector("[data-region-status]");
  const tierSwitch = page.querySelector("[data-tier-switch]");
  const tierToggle = page.querySelector("[data-tier-toggle]");
  const tierALabel = page.querySelector("[data-tier-a-label]");
  const tierBLabel = page.querySelector("[data-tier-b-label]");
  let activeRegion = "aus";
  let activeTier = 0;

  function regionFromCountry(countryCode) {
    const code = String(countryCode || "").toUpperCase();
    if (code === "AU") return "aus";
    if (code === "GB" || code === "UK") return "uk";
    const europeCodes = new Set([
      "AD", "AL", "AT", "BA", "BE", "BG", "BY", "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FO",
      "FR", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS", "IT", "JE", "LI", "LT", "LU", "LV", "MC",
      "MD", "ME", "MK", "MT", "NL", "NO", "PL", "PT", "RO", "RS", "SE", "SI", "SK", "SM", "UA", "VA",
    ]);
    if (europeCodes.has(code)) return "europe";
    return "";
  }

  function guessRegionFromBrowser() {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const language = navigator.language || "";
    if (timeZone.startsWith("Australia/")) return "aus";
    if (timeZone === "Europe/London" || language.toLowerCase().includes("gb")) return "uk";
    if (timeZone.startsWith("Europe/")) return "europe";
    return "aus";
  }

  async function detectRegion() {
    try {
      const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!response.ok) throw new Error("Location lookup failed");
      const data = await response.json();
      const region = regionFromCountry(data.country_code);
      if (region) {
        activeRegion = region;
        if (regionStatus) {
          regionStatus.textContent = `Pricing detected for ${priceData[region].label}. If that looks wrong, tell us your country when you enquire.`;
        }
        renderPricing();
        return;
      }
    } catch (error) {
      // Browser timezone is a quiet fallback when IP geolocation is blocked.
    }

    activeRegion = guessRegionFromBrowser();
    if (regionStatus) {
      regionStatus.textContent = `Pricing estimated for ${priceData[activeRegion].label}. If that looks wrong, tell us your country when you enquire.`;
    }
    renderPricing();
  }

  function renderPricing() {
    const region = priceData[activeRegion];
    const hasToggle = region.tiers.length > 1;
    activeTier = hasToggle ? activeTier : 0;
    const tier = region.tiers[activeTier];

    regionLabel.textContent = region.label;
    priceDisplay.textContent = tier.price;
    priceNote.textContent = tier.note;

    tierSwitch.hidden = !hasToggle;
    if (hasToggle) {
      tierALabel.textContent = region.tiers[0].label;
      tierBLabel.textContent = region.tiers[1].label;
      tierToggle.setAttribute("aria-checked", String(activeTier === 1));
    }
  }

  tierToggle.addEventListener("click", () => {
    activeTier = activeTier === 0 ? 1 : 0;
    renderPricing();
  });

  renderPricing();
  detectRegion();
});

document.querySelectorAll("[data-horse-race]").forEach((game) => {
  const finish = 8;
  const positions = Array.from({ length: 11 }, () => 0);
  const track = game.querySelector("[data-track]");
  const dieOne = game.querySelector("[data-die-one]");
  const dieTwo = game.querySelector("[data-die-two]");
  const result = game.querySelector("[data-result]");
  const winner = game.querySelector("[data-winner]");
  const rollButton = game.querySelector("[data-roll]");
  const resetButton = game.querySelector("[data-reset]");
  const modal = game.querySelector("[data-race-modal]");
  const modalWinner = game.querySelector("[data-modal-winner]");
  const raceBars = game.querySelector("[data-race-bars]");
  const totalRolls = game.querySelector("[data-total-rolls]");
  const modalClose = game.querySelector("[data-modal-close]");
  const modalNewRace = game.querySelector("[data-modal-new-race]");
  let isRolling = false;
  let modalTimer = 0;

  function setupDie(element, value = 1) {
    element.innerHTML = `
      <span class="die-cube">
        <span class="die-face die-front" aria-live="polite">1</span>
        <span class="die-face die-top"></span>
        <span class="die-face die-right"></span>
        <span class="die-face die-left"></span>
        <span class="die-face die-bottom"></span>
        <span class="die-face die-back"></span>
      </span>
    `;
    setDieValue(element, value);
  }

  function setDieValue(element, value) {
    element.dataset.value = value;
    const front = element.querySelector(".die-front");
    if (front) front.textContent = value;
  }

  function renderTracks(highlightNumber = 0) {
    track.innerHTML = "";
    positions.forEach((position, index) => {
      const number = index + 2;
      const row = document.createElement("div");
      row.className = `track-row${number === highlightNumber ? " is-flashing" : ""}`;
      row.innerHTML = `
        <span class="track-number">${number}</span>
        <div class="track"><span class="horse" style="left: calc(${(position / finish) * 100}% - ${position ? 84 : 0}px)"><img src="sprites/lanes/${number}.png" alt=""><span class="horse-body"></span><span class="horse-rider">${number}</span></span></div>
        <span class="track-score">${position}/${finish}</span>
      `;
      track.appendChild(row);
    });
  }

  function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
  }

  function rollAnimatedDice(first, second) {
    return new Promise((resolve) => {
      let ticks = 0;
      const interval = window.setInterval(() => {
        ticks += 1;
        setDieValue(dieOne, ticks >= 10 ? first : rollDie());
        setDieValue(dieTwo, ticks >= 10 ? second : rollDie());
        if (ticks >= 10) {
          window.clearInterval(interval);
          window.setTimeout(resolve, 120);
        }
      }, 70);
    });
  }

  function renderDistribution() {
    const total = positions.reduce((sum, count) => sum + count, 0);
    const max = Math.max(...positions, 1);
    totalRolls.textContent = `${total} roll${total === 1 ? "" : "s"}`;
    raceBars.innerHTML = positions.map((count, index) => {
      const lane = index + 2;
      const percent = total ? Math.round((count / total) * 100) : 0;
      const height = Math.max(8, Math.round((count / max) * 100));
      return `
        <div class="race-bar-item">
          <div class="race-bar-track"><span style="height:${height}%"></span></div>
          <strong>${lane}</strong>
          <em>${percent}%</em>
          <small>${count}</small>
        </div>
      `;
    }).join("");
  }

  function showRaceModal(winningLane) {
    window.clearTimeout(modalTimer);
    modalWinner.textContent = `Lane ${winningLane} wins!`;
    renderDistribution();
    modal.hidden = false;
    modal.classList.remove("show-chart");
    void modal.offsetWidth;
    modal.classList.add("is-open");
    modalTimer = window.setTimeout(() => {
      modal.classList.add("show-chart");
    }, 1600);
  }

  function closeRaceModal() {
    window.clearTimeout(modalTimer);
    modal.classList.remove("is-open", "show-chart");
    window.setTimeout(() => {
      modal.hidden = true;
    }, 220);
  }

  function resetRace() {
    positions.fill(0);
    setDieValue(dieOne, 1);
    setDieValue(dieTwo, 1);
    result.textContent = "Ready to roll.";
    winner.textContent = "";
    rollButton.textContent = "Roll dice";
    isRolling = false;
    closeRaceModal();
    renderTracks();
  }

  rollButton.addEventListener("click", () => {
    if (winner.textContent || isRolling) return;
    isRolling = true;
    rollButton.textContent = "Rolling...";
    const first = rollDie();
    const second = rollDie();
    const sum = first + second;
    rollAnimatedDice(first, second).then(() => {
      const index = sum - 2;
      positions[index] += 1;
      result.textContent = `${first} + ${second} = ${sum}. Lane ${sum} advances.`;
      renderTracks(sum);
      if (positions[index] >= finish) {
        winner.textContent = `Lane ${sum} wins the Chance Cup!`;
        rollButton.textContent = "Race finished";
        showRaceModal(sum);
      } else {
        rollButton.textContent = "Roll dice";
      }
      isRolling = false;
    });
  });

  resetButton.addEventListener("click", resetRace);
  modalClose.addEventListener("click", closeRaceModal);
  modalNewRace.addEventListener("click", resetRace);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeRaceModal();
  });

  setupDie(dieOne, 1);
  setupDie(dieTwo, 1);
  renderTracks();
});

document.querySelectorAll("[data-arithmatrick]").forEach((game) => {
  const largeCards = [25, 50, 75, 100, 25, 50];
  const smallCards = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const largeCount = game.querySelector("[data-large-count]");
  const largeCountOptions = Array.from(game.querySelectorAll("[data-large-count-option]"));
  const roundingOptions = Array.from(game.querySelectorAll("[data-rounding]"));
  const targetEl = game.querySelector("[data-target]");
  const cardsEl = game.querySelector("[data-number-cards]");
  const expression = game.querySelector("[data-expression]");
  const feedback = game.querySelector("[data-arith-feedback]");
  const newRound = game.querySelector("[data-new-round]");
  const check = game.querySelector("[data-check-expression]");
  const clear = game.querySelector("[data-clear-expression]");
  let cards = [];
  let target = 0;

  function getLargeCount() {
    const checkedOption = largeCountOptions.find((option) => option.checked);
    if (checkedOption) return Number(checkedOption.value);
    return Number(largeCount?.value || 2);
  }

  function getRounding() {
    const checkedOption = roundingOptions.find((option) => option.checked);
    return Number(checkedOption?.value || 0);
  }

  function draw(pool, count) {
    const copy = [...pool];
    const picked = [];
    while (picked.length < count && copy.length) {
      const index = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(index, 1)[0]);
    }
    return picked;
  }

  function countValues(values) {
    return values.reduce((map, value) => {
      map[value] = (map[value] || 0) + 1;
      return map;
    }, {});
  }

  function generateTarget() {
    const rounding = getRounding();
    if (!rounding) return Math.floor(Math.random() * 899) + 101;
    const min = Math.ceil(101 / rounding);
    const max = Math.floor(999 / rounding);
    return (Math.floor(Math.random() * (max - min + 1)) + min) * rounding;
  }

  function renderRound() {
    const count = getLargeCount();
    cards = [...draw(largeCards, count), ...draw(smallCards, 6 - count)].sort(() => Math.random() - 0.5);
    target = generateTarget();
    targetEl.textContent = target;
    cardsEl.innerHTML = cards.map((card) => `<button class="number-card" type="button" data-card-value="${card}" aria-label="Use ${card}">${card}</button>`).join("");
    if (expression) expression.value = "";
    const rounding = getRounding();
    setFeedback(rounding ? `Use the cards to get within ${rounding} of the target.` : "Use the cards to hit the target exactly.", "");
  }

  function setFeedback(message, state) {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.remove("is-good", "is-warn");
    if (state) feedback.classList.add(state);
  }

  function tokenize(input) {
    const cleaned = input.replaceAll("x", "*").replaceAll("X", "*").replaceAll("×", "*").replaceAll("÷", "/").replace(/\s+/g, "");
    if (!/^[\d+\-*/().]+$/.test(cleaned)) throw new Error("Use only numbers, +, -, x, / and brackets.");
    return cleaned.match(/\d+(?:\.\d+)?|[+\-*/()]/g) || [];
  }

  function toRpn(tokens) {
    const output = [];
    const ops = [];
    const precedence = { "+": 1, "-": 1, "*": 2, "/": 2 };
    tokens.forEach((token) => {
      if (/^\d/.test(token)) {
        output.push(Number(token));
      } else if (token in precedence) {
        while (ops.length && ops[ops.length - 1] in precedence && precedence[ops[ops.length - 1]] >= precedence[token]) {
          output.push(ops.pop());
        }
        ops.push(token);
      } else if (token === "(") {
        ops.push(token);
      } else if (token === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") output.push(ops.pop());
        if (ops.pop() !== "(") throw new Error("Check your brackets.");
      }
    });
    while (ops.length) {
      const op = ops.pop();
      if (op === "(") throw new Error("Check your brackets.");
      output.push(op);
    }
    return output;
  }

  function evaluateRpn(rpn) {
    const stack = [];
    rpn.forEach((token) => {
      if (typeof token === "number") {
        stack.push(token);
        return;
      }
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) throw new Error("That expression is incomplete.");
      if (token === "+") stack.push(a + b);
      if (token === "-") stack.push(a - b);
      if (token === "*") stack.push(a * b);
      if (token === "/") {
        if (b === 0) throw new Error("Division by zero is not allowed.");
        stack.push(a / b);
      }
    });
    if (stack.length !== 1 || !Number.isFinite(stack[0])) throw new Error("That expression is incomplete.");
    return stack[0];
  }

  function validateNumbers(tokens) {
    const used = tokens.filter((token) => /^\d/.test(token)).map(Number);
    const cardCounts = countValues(cards);
    const usedCounts = countValues(used);
    for (const value of used) {
      if (!cardCounts[value]) throw new Error(`${value} is not one of your cards.`);
      if (usedCounts[value] > cardCounts[value]) throw new Error(`${value} was used too many times.`);
    }
  }

  check?.addEventListener("click", () => {
    try {
      const tokens = tokenize(expression.value);
      if (!tokens.length) throw new Error("Type an expression first.");
      validateNumbers(tokens);
      const value = evaluateRpn(toRpn(tokens));
      const rounded = Math.round(value * 100) / 100;
      const gap = Math.abs(value - target);
      const rounding = getRounding();
      if (gap < 0.000001) {
        setFeedback(`Exact hit: ${rounded}. Beautiful.`, "is-good");
      } else if (rounding && gap <= rounding) {
        setFeedback(`Close enough: ${rounded}. Difference from target: ${Math.round(gap * 100) / 100}.`, "is-good");
      } else {
        setFeedback(`You made ${rounded}. Difference from target: ${Math.round(gap * 100) / 100}.`, "is-warn");
      }
    } catch (error) {
      setFeedback(error.message, "is-warn");
    }
  });

  clear?.addEventListener("click", () => {
    expression.value = "";
    setFeedback("Cleared. Try a new combination.", "");
  });

  cardsEl.addEventListener("click", (event) => {
    const card = event.target.closest("[data-card-value]");
    if (!card) return;
    if (!expression) return;
    expression.value = `${expression.value}${expression.value ? " " : ""}${card.dataset.cardValue}`;
    expression.focus();
  });

  largeCountOptions.forEach((option) => option.addEventListener("change", renderRound));
  roundingOptions.forEach((option) => option.addEventListener("change", renderRound));
  newRound.addEventListener("click", renderRound);
  renderRound();
});

document.querySelectorAll("[data-fraction-forge]").forEach((game) => {
  const pairs = [["1/2", "2/4"], ["1/3", "2/6"], ["3/4", "6/8"], ["2/5", "4/10"], ["1/4", "3/12"], ["5/6", "10/12"]];
  const tiles = game.querySelector("[data-fraction-tiles]");
  const score = game.querySelector("[data-fraction-score]");
  const feedback = game.querySelector("[data-fraction-feedback]");
  const fresh = game.querySelector("[data-fraction-new]");
  let selected = null;
  let matched = 0;

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function render() {
    selected = null;
    matched = 0;
    score.textContent = `Score 0 / ${pairs.length}`;
    feedback.textContent = "Pick a fraction tile.";
    const cards = shuffle(pairs.flatMap((pair, pairIndex) => pair.map((label) => ({ label, pairIndex }))));
    tiles.innerHTML = cards.map((card, index) => `<button class="fraction-tile" data-pair="${card.pairIndex}" data-index="${index}" type="button">${card.label}</button>`).join("");
  }

  tiles.addEventListener("click", (event) => {
    const tile = event.target.closest(".fraction-tile");
    if (!tile || tile.classList.contains("is-matched")) return;
    if (!selected) {
      selected = tile;
      tile.classList.add("is-selected");
      feedback.textContent = "Now choose an equivalent partner.";
      return;
    }
    if (tile === selected) return;
    if (tile.dataset.pair === selected.dataset.pair) {
      tile.classList.add("is-matched");
      selected.classList.add("is-matched");
      selected.classList.remove("is-selected");
      selected = null;
      matched += 1;
      score.textContent = `Score ${matched} / ${pairs.length}`;
      feedback.textContent = matched === pairs.length ? "Forge complete. Every pair matched." : "Matched. Keep forging.";
    } else {
      selected.classList.remove("is-selected");
      selected = null;
      feedback.textContent = "Not equivalent. Try again.";
    }
  });

  fresh.addEventListener("click", render);
  render();
});

document.querySelectorAll("[data-algebra-lockpick]").forEach((game) => {
  const equation = game.querySelector("[data-equation]");
  const answer = game.querySelector("[data-algebra-answer]");
  const feedback = game.querySelector("[data-algebra-feedback]");
  const meter = game.querySelector("[data-lock-meter]");
  const check = game.querySelector("[data-algebra-check]");
  const fresh = game.querySelector("[data-algebra-new]");
  let solution = 0;
  let locks = 0;

  function newLock() {
    solution = Math.floor(Math.random() * 17) - 8;
    const a = Math.floor(Math.random() * 7) + 2;
    const b = Math.floor(Math.random() * 19) - 9;
    const total = a * solution + b;
    equation.textContent = `${a}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)} = ${total}`;
    answer.value = "";
    feedback.textContent = "Ready.";
    meter.textContent = `Tumblers open: ${locks} / 5`;
  }

  check.addEventListener("click", () => {
    if (Number(answer.value) === solution) {
      locks = Math.min(5, locks + 1);
      feedback.textContent = locks === 5 ? "Vault open. Excellent inverse operations." : "Click. Tumbler opened.";
      meter.textContent = `Tumblers open: ${locks} / 5`;
      if (locks < 5) window.setTimeout(newLock, 650);
    } else {
      feedback.textContent = "Not yet. Undo the operations in reverse.";
    }
  });

  fresh.addEventListener("click", () => {
    locks = 0;
    newLock();
  });
  newLock();
});

document.querySelectorAll("[data-graph-glider]").forEach((game) => {
  const svg = game.querySelector("[data-graph-svg]");
  const gradient = game.querySelector("[data-gradient]");
  const intercept = game.querySelector("[data-intercept]");
  const feedback = game.querySelector("[data-graph-feedback]");
  const fresh = game.querySelector("[data-graph-new]");
  let target = { x: 2, y: 4 };

  function sx(x) { return 210 + x * 20; }
  function sy(y) { return 210 - y * 20; }

  function draw() {
    const m = Number(gradient.value);
    const b = Number(intercept.value);
    const yAtTarget = m * target.x + b;
    const hit = yAtTarget === target.y;
    svg.innerHTML = `
      <line class="axis" x1="0" y1="210" x2="420" y2="210"></line>
      <line class="axis" x1="210" y1="0" x2="210" y2="420"></line>
      <line class="glider-line" x1="${sx(-10)}" y1="${sy(m * -10 + b)}" x2="${sx(10)}" y2="${sy(m * 10 + b)}"></line>
      <circle class="target-point" cx="${sx(target.x)}" cy="${sy(target.y)}" r="9"></circle>
    `;
    feedback.textContent = hit ? `Direct hit: y = ${m}x ${b >= 0 ? "+" : "-"} ${Math.abs(b)}` : `Target (${target.x}, ${target.y}). Current y there: ${yAtTarget}.`;
    feedback.classList.toggle("is-good", hit);
  }

  function newTarget() {
    target = { x: Math.floor(Math.random() * 13) - 6, y: Math.floor(Math.random() * 13) - 6 };
    draw();
  }

  gradient.addEventListener("input", draw);
  intercept.addEventListener("input", draw);
  fresh.addEventListener("click", newTarget);
  newTarget();
});

document.querySelectorAll("[data-angle-architect]").forEach((game) => {
  const svg = game.querySelector("[data-angle-svg]");
  const prompt = game.querySelector("[data-angle-prompt]");
  const answer = game.querySelector("[data-angle-answer]");
  const feedback = game.querySelector("[data-angle-feedback]");
  const check = game.querySelector("[data-angle-check]");
  const fresh = game.querySelector("[data-angle-new]");
  let missing = 0;

  function draw() {
    const straight = Math.random() > 0.5;
    const known = straight ? Math.floor(Math.random() * 110) + 25 : Math.floor(Math.random() * 65) + 15;
    missing = straight ? 180 - known : 90 - known;
    prompt.textContent = straight ? `Straight line: one angle is ${known} degrees. Find the missing angle.` : `Right angle: one angle is ${known} degrees. Find the missing angle.`;
    svg.innerHTML = `
      <line class="beam" x1="70" y1="240" x2="350" y2="240"></line>
      <line class="beam" x1="210" y1="240" x2="${straight ? 120 : 210}" y2="${straight ? 100 : 90}"></line>
      <path class="angle-arc" d="M 250 240 A 40 40 0 0 0 210 200"></path>
      <text x="245" y="208" font-size="26" fill="#121514">${known} deg</text>
      <text x="135" y="206" font-size="32" fill="#ff8f70">?</text>
    `;
    answer.value = "";
    feedback.textContent = "Enter the missing angle.";
  }

  check.addEventListener("click", () => {
    const value = Number(answer.value);
    const correct = value === missing;
    feedback.textContent = correct ? "Structure stable. Nice angle fact." : `Not quite. The missing angle is ${missing} degrees.`;
    feedback.classList.toggle("is-good", correct);
  });
  fresh.addEventListener("click", draw);
  draw();
});

document.querySelectorAll("[data-data-detective]").forEach((game) => {
  const valuesEl = game.querySelector("[data-data-values]");
  const bars = game.querySelector("[data-data-bars]");
  const question = game.querySelector("[data-data-question]");
  const answer = game.querySelector("[data-data-answer]");
  const feedback = game.querySelector("[data-data-feedback]");
  const check = game.querySelector("[data-data-check]");
  const fresh = game.querySelector("[data-data-new]");
  let values = [];
  let task = "mean";
  let solution = 0;

  function getMode(valuesList) {
    const counts = {};
    valuesList.forEach((value) => counts[value] = (counts[value] || 0) + 1);
    return Number(Object.keys(counts).sort((a, b) => counts[b] - counts[a] || Number(a) - Number(b))[0]);
  }

  function newCase() {
    values = Array.from({ length: 8 }, () => Math.floor(Math.random() * 12) + 1);
    task = ["mean", "median", "mode", "range"][Math.floor(Math.random() * 4)];
    const sorted = [...values].sort((a, b) => a - b);
    if (task === "mean") solution = values.reduce((a, b) => a + b, 0) / values.length;
    if (task === "median") solution = (sorted[3] + sorted[4]) / 2;
    if (task === "mode") solution = getMode(values);
    if (task === "range") solution = Math.max(...values) - Math.min(...values);
    question.textContent = `Find the ${task} of the evidence.`;
    valuesEl.innerHTML = values.map((value) => `<span>${value}</span>`).join("");
    bars.innerHTML = values.map((value) => `<i style="height:${value * 7}%"></i>`).join("");
    answer.value = "";
    feedback.textContent = "Inspect the evidence.";
  }

  check.addEventListener("click", () => {
    const value = Number(answer.value);
    const correct = Math.abs(value - solution) < 0.01;
    feedback.textContent = correct ? `Case solved: ${task} = ${solution}.` : `Close the case with ${solution}.`;
    feedback.classList.toggle("is-good", correct);
  });
  fresh.addEventListener("click", newCase);
  newCase();
});

document.querySelectorAll("[data-puzzleforge]").forEach((game) => {
  const topicSelect = game.querySelector("[data-pf-topic]");
  const difficultySelect = game.querySelector("[data-pf-difficulty]");
  const generateButton = game.querySelector("[data-pf-generate]");
  const status = game.querySelector("[data-pf-status]");
  const checks = game.querySelector("[data-pf-checks]");
  const templateLabel = game.querySelector("[data-pf-template]");
  const verifiedLabel = game.querySelector("[data-pf-verified]");
  const questionText = game.querySelector("[data-pf-question]");
  const diagram = game.querySelector("[data-pf-diagram]");
  const optionsEl = game.querySelector("[data-pf-options]");
  const feedback = game.querySelector("[data-pf-feedback]");
  const explanation = game.querySelector("[data-pf-explanation]");
  const tutorReply = game.querySelector("[data-pf-tutor-reply]");
  let currentQuestion = null;

  const labels = ["A", "B", "C", "D", "E"];

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function sample(items) {
    return items[rand(0, items.length - 1)];
  }

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function uniqueDistractors(correct, candidates, format) {
    const values = [];
    candidates.forEach((candidate) => {
      if (candidate === correct) return;
      if (!Number.isFinite(Number(candidate))) return;
      if (!values.includes(candidate)) values.push(candidate);
    });
    let nudge = 1;
    while (values.length < 4) {
      const candidate = correct + nudge * (values.length % 2 ? -1 : 1);
      if (candidate !== correct && !values.includes(candidate)) values.push(candidate);
      nudge += 1;
    }
    return shuffle([correct, ...values.slice(0, 4)]).map((value, index) => ({
      label: labels[index],
      value,
      text: format(value),
    }));
  }

  function coordinateSvg(points, extras = "") {
    const size = 360;
    const origin = 180;
    const unit = 28;
    const sx = (x) => origin + x * unit;
    const sy = (y) => origin - y * unit;
    const grid = Array.from({ length: 13 }, (_, index) => index - 6).map((n) => `
      <line class="pf-grid-line" x1="${sx(n)}" y1="${sy(-6)}" x2="${sx(n)}" y2="${sy(6)}"></line>
      <line class="pf-grid-line" x1="${sx(-6)}" y1="${sy(n)}" x2="${sx(6)}" y2="${sy(n)}"></line>
    `).join("");
    return `
      <svg viewBox="0 0 ${size} ${size}" role="img" aria-label="Coordinate diagram">
        ${grid}
        <line class="pf-axis" x1="12" y1="${origin}" x2="348" y2="${origin}"></line>
        <line class="pf-axis" x1="${origin}" y1="12" x2="${origin}" y2="348"></line>
        ${extras}
        ${points.map((point) => `<circle class="pf-point" cx="${sx(point.x)}" cy="${sy(point.y)}" r="7"></circle><text x="${sx(point.x) + 9}" y="${sy(point.y) - 8}">${point.label}</text>`).join("")}
      </svg>
    `;
  }

  function gridAreaTemplate(difficulty) {
    const width = difficulty === "beginner" ? rand(3, 6) : rand(5, 9);
    const height = difficulty === "senior" ? rand(5, 9) : rand(3, 7);
    const cut = rand(1, Math.min(width, height) - 1);
    const answer = width * height - cut * cut;
    const svg = `
      <svg viewBox="0 0 360 260" role="img" aria-label="Shaded grid area">
        ${Array.from({ length: width + 1 }, (_, i) => `<line class="pf-grid-line" x1="${40 + i * 28}" y1="30" x2="${40 + i * 28}" y2="${30 + height * 28}"></line>`).join("")}
        ${Array.from({ length: height + 1 }, (_, i) => `<line class="pf-grid-line" x1="40" y1="${30 + i * 28}" x2="${40 + width * 28}" y2="${30 + i * 28}"></line>`).join("")}
        <path class="pf-shade" d="M40 30 H${40 + width * 28} V${30 + height * 28} H40 Z M40 30 H${40 + cut * 28} V${30 + cut * 28} H40 Z"></path>
        <text x="42" y="${56 + height * 28}">Each square has area 1</text>
      </svg>
    `;
    return {
      topic: "Geometry",
      templateId: "grid-shaded-area",
      questionText: `A ${width} by ${height} rectangle is drawn on a square grid. A ${cut} by ${cut} square is removed from one corner. What is the shaded area?`,
      correctValue: answer,
      diagram: { type: "grid", svg, data: { width, height, cut } },
      options: uniqueDistractors(answer, [width * height, answer + cut, answer - cut, width + height + cut, answer + cut * cut], (v) => `${v} square units`),
      explanationShort: `Find the rectangle area, then subtract the missing square: ${width} x ${height} - ${cut} x ${cut} = ${answer}.`,
      explanationFull: `Key idea: the shaded area is the whole rectangle minus the cut-out corner. The rectangle has area ${width * height}. The removed square has area ${cut * cut}. So ${width * height} - ${cut * cut} = ${answer}.`,
      commonMistakes: `A common mistake is to count the outside dimensions and forget to subtract the removed ${cut} by ${cut} square.`,
      trick: "Work with areas, not just side lengths.",
    };
  }

  function coordinateAreaTemplate(difficulty) {
    const base = difficulty === "beginner" ? rand(3, 6) : rand(4, 9);
    const height = difficulty === "senior" ? rand(5, 9) : rand(3, 7);
    const x = rand(-4, 1);
    const y = rand(-4, 0);
    const points = [{ label: "A", x, y }, { label: "B", x: x + base, y }, { label: "C", x, y: y + height }];
    const answer = (base * height) / 2;
    const polygon = `<polygon class="pf-shape" points="${points.map((p) => `${180 + p.x * 28},${180 - p.y * 28}`).join(" ")}"></polygon>`;
    return {
      topic: "Geometry",
      templateId: "coordinate-triangle-area",
      questionText: `Triangle ABC has vertices A(${x}, ${y}), B(${x + base}, ${y}) and C(${x}, ${y + height}). What is its area?`,
      correctValue: answer,
      diagram: { type: "coordinate-plane", svg: coordinateSvg(points, polygon), data: { points, base, height } },
      options: uniqueDistractors(answer, [base * height, base + height, answer + base, answer + height, Math.abs(base - height)], (v) => `${v} square units`),
      explanationShort: `The base is ${base} and the height is ${height}, so the area is (${base} x ${height}) / 2 = ${answer}.`,
      explanationFull: `Key idea: this is a right triangle on the coordinate grid. AB is ${base} units and AC is ${height} units. Triangle area is half base times height, so (${base} x ${height}) / 2 = ${answer}.`,
      commonMistakes: "A common mistake is to use base times height and forget to halve it for a triangle.",
      trick: "Use the horizontal and vertical sides as the base and height.",
    };
  }

  function remainderTemplate(difficulty) {
    const divisor = difficulty === "senior" ? rand(7, 12) : rand(4, 9);
    const quotient = difficulty === "beginner" ? rand(8, 18) : rand(18, 45);
    const remainder = rand(1, divisor - 1);
    const number = divisor * quotient + remainder;
    return {
      topic: "Number Properties",
      templateId: "remainder-logic",
      questionText: `When ${number} is divided by ${divisor}, what is the remainder?`,
      correctValue: remainder,
      diagram: { type: "number-line", svg: `<svg viewBox="0 0 360 130" role="img" aria-label="Number line jumps"><line class="pf-axis" x1="30" y1="70" x2="330" y2="70"></line><path class="pf-arc" d="M60 68 Q98 18 136 68 T212 68 T288 68"></path><text x="52" y="105">0</text><text x="248" y="105">${divisor} x ${quotient}</text><text x="298" y="52">+ ${remainder}</text></svg>`, data: { number, divisor, quotient, remainder } },
      options: uniqueDistractors(remainder, [divisor - remainder, remainder + 1, remainder - 1, divisor, quotient], (v) => `${v}`),
      explanationShort: `${divisor} x ${quotient} = ${divisor * quotient}, and ${number} is ${remainder} more than that.`,
      explanationFull: `Key idea: find the nearest lower multiple of ${divisor}. Since ${divisor} x ${quotient} = ${divisor * quotient}, the difference ${number} - ${divisor * quotient} is ${remainder}.`,
      commonMistakes: "A common mistake is to give the quotient instead of the leftover amount.",
      trick: "Use the nearest lower multiple, then count what is left over.",
    };
  }

  function fractionTemplate(difficulty) {
    const denominators = difficulty === "senior" ? [8, 10, 12, 15] : [4, 5, 6, 8, 10];
    const denominator = sample(denominators);
    const numerator = rand(1, denominator - 2);
    const total = denominator * rand(3, difficulty === "senior" ? 11 : 8);
    const answer = (total / denominator) * numerator;
    return {
      topic: "Fractions",
      templateId: "fraction-of-set",
      questionText: `A collection has ${total} tiles. ${numerator}/${denominator} of the tiles are blue. How many tiles are blue?`,
      correctValue: answer,
      diagram: { type: "ratio-strip", svg: `<svg viewBox="0 0 360 150" role="img" aria-label="Fraction strip">${Array.from({ length: denominator }, (_, i) => `<rect class="${i < numerator ? "pf-shade" : "pf-empty"}" x="${30 + i * (300 / denominator)}" y="44" width="${300 / denominator}" height="52"></rect>`).join("")}<text x="30" y="126">${numerator} of ${denominator} equal parts are blue</text></svg>`, data: { numerator, denominator, total } },
      options: uniqueDistractors(answer, [total / denominator, total - answer, answer + denominator, numerator * denominator, answer - numerator], (v) => `${v}`),
      explanationShort: `One ${denominator}th is ${total / denominator}, so ${numerator}/${denominator} is ${numerator} x ${total / denominator} = ${answer}.`,
      explanationFull: `Key idea: divide by the denominator first. ${total} divided by ${denominator} is ${total / denominator}. There are ${numerator} of those parts, so ${numerator} x ${total / denominator} = ${answer}.`,
      commonMistakes: "A common mistake is to multiply the two numbers in the fraction instead of finding equal parts of the total.",
      trick: "Denominator first, numerator second.",
    };
  }

  function spinnerTemplate(difficulty) {
    const total = difficulty === "senior" ? rand(8, 12) : rand(5, 8);
    const wins = rand(1, total - 1);
    const answer = wins;
    const angle = (wins / total) * 360;
    return {
      topic: "Probability",
      templateId: "spinner-probability",
      questionText: `A spinner has ${total} equal sectors. ${wins} sectors are shaded. Out of ${total} equally likely outcomes, how many give a shaded result?`,
      correctValue: answer,
      diagram: { type: "spinner", svg: `<svg viewBox="0 0 240 240" role="img" aria-label="Spinner with shaded sectors"><circle class="pf-spinner" cx="120" cy="120" r="82"></circle>${Array.from({ length: total }, (_, i) => `<line class="pf-spoke" x1="120" y1="120" x2="${120 + Math.cos((i / total) * Math.PI * 2) * 82}" y2="${120 + Math.sin((i / total) * Math.PI * 2) * 82}"></line>`).join("")}<path class="pf-sector" d="M120 120 L202 120 A82 82 0 ${angle > 180 ? 1 : 0} 1 ${120 + Math.cos((angle * Math.PI) / 180) * 82} ${120 + Math.sin((angle * Math.PI) / 180) * 82} Z"></path><circle class="pf-point" cx="120" cy="120" r="5"></circle></svg>`, data: { total, wins } },
      options: uniqueDistractors(answer, [total - wins, wins + 1, wins - 1, total, Math.max(1, total - wins + 1)], (v) => `${v}`),
      explanationShort: `The shaded result happens on ${wins} of the ${total} equal sectors.`,
      explanationFull: `Key idea: equal sectors are equally likely. Count the shaded sectors. There are ${wins}, so ${wins} outcomes give a shaded result.`,
      commonMistakes: "A common mistake is to count the unshaded sectors instead of the shaded ones.",
      trick: "For equally likely sectors, probability starts with counting.",
    };
  }

  function statisticsTemplate(difficulty) {
    const count = difficulty === "senior" ? 7 : 5;
    const values = Array.from({ length: count }, () => rand(3, 18)).sort((a, b) => a - b);
    const middle = Math.floor(values.length / 2);
    const answer = values[middle];
    return {
      topic: "Statistics",
      templateId: "median-from-chart",
      questionText: `The values shown are already in order. What is the median?`,
      correctValue: answer,
      diagram: { type: "dot-row", svg: `<svg viewBox="0 0 360 150" role="img" aria-label="Ordered data row">${values.map((value, i) => `<g><circle class="${i === middle ? "pf-point" : "pf-dot"}" cx="${48 + i * (264 / (values.length - 1))}" cy="70" r="18"></circle><text x="${42 + i * (264 / (values.length - 1))}" y="76">${value}</text></g>`).join("")}<line class="pf-axis" x1="32" y1="116" x2="328" y2="116"></line></svg>`, data: { values } },
      options: uniqueDistractors(answer, [values[0], values[values.length - 1], values.reduce((a, b) => a + b, 0) / values.length, answer + 1, answer - 1], (v) => `${Math.round(v * 10) / 10}`),
      explanationShort: `There are ${values.length} values, so the median is the middle value: ${answer}.`,
      explanationFull: `Key idea: the median is the middle when the data is ordered. With ${values.length} values, the middle is position ${middle + 1}, which is ${answer}.`,
      commonMistakes: "A common mistake is to calculate the mean when the question asks for the median.",
      trick: "Ordered data means you can go straight to the middle.",
    };
  }

  function algebraTemplate(difficulty) {
    const x = rand(difficulty === "senior" ? -8 : 1, difficulty === "senior" ? 12 : 10);
    const a = rand(2, difficulty === "beginner" ? 5 : 9);
    const b = rand(3, 16);
    const total = a * x + b;
    return {
      topic: "Algebra",
      templateId: "linear-equation",
      questionText: `If ${a}x + ${b} = ${total}, what is x?`,
      correctValue: x,
      diagram: { type: "balance", svg: `<svg viewBox="0 0 360 170" role="img" aria-label="Equation balance"><line class="pf-axis" x1="70" y1="92" x2="290" y2="92"></line><line class="pf-axis" x1="180" y1="45" x2="180" y2="126"></line><rect class="pf-empty" x="78" y="104" width="78" height="34"></rect><rect class="pf-empty" x="204" y="104" width="78" height="34"></rect><text x="92" y="128">${a}x + ${b}</text><text x="229" y="128">${total}</text></svg>`, data: { a, b, total } },
      options: uniqueDistractors(x, [total / a, total - b, x + 1, x - 1, -x], (v) => `${v}`),
      explanationShort: `Subtract ${b}, then divide by ${a}: (${total} - ${b}) / ${a} = ${x}.`,
      explanationFull: `Key idea: undo the operations in reverse. ${total} - ${b} = ${total - b}. Then ${total - b} divided by ${a} is ${x}.`,
      commonMistakes: "A common mistake is to divide before subtracting the added number.",
      trick: "Undo addition first, then multiplication.",
    };
  }

  function measurementTemplate(difficulty) {
    const scale = difficulty === "senior" ? rand(5, 12) : rand(2, 8);
    const drawing = rand(3, 9);
    const answer = scale * drawing;
    return {
      topic: "Measurement",
      templateId: "scale-length",
      questionText: `On a scale diagram, 1 cm represents ${scale} m. A path is ${drawing} cm long on the diagram. What is its real length?`,
      correctValue: answer,
      diagram: { type: "scale", svg: `<svg viewBox="0 0 360 150" role="img" aria-label="Scale line"><line class="pf-axis" x1="55" y1="72" x2="305" y2="72"></line><circle class="pf-point" cx="55" cy="72" r="7"></circle><circle class="pf-point" cx="305" cy="72" r="7"></circle><text x="132" y="54">${drawing} cm on diagram</text><text x="94" y="112">1 cm = ${scale} m</text></svg>`, data: { scale, drawing } },
      options: uniqueDistractors(answer, [answer + scale, answer - scale, drawing + scale, scale, drawing], (v) => `${v} m`),
      explanationShort: `Each centimetre represents ${scale} m, so ${drawing} cm represents ${drawing} x ${scale} = ${answer} m.`,
      explanationFull: `Key idea: scale diagrams multiply the drawing length by the scale. The path is ${drawing} cm, and each centimetre is ${scale} m, so ${drawing} x ${scale} = ${answer} m.`,
      commonMistakes: "A common mistake is to add the two numbers instead of multiplying by the scale.",
      trick: "Scale length means repeated equal units, so multiply.",
    };
  }

  const templates = {
    Geometry: [gridAreaTemplate, coordinateAreaTemplate],
    "Number Properties": [remainderTemplate],
    Fractions: [fractionTemplate],
    Probability: [spinnerTemplate],
    Statistics: [statisticsTemplate],
    Algebra: [algebraTemplate],
    Measurement: [measurementTemplate],
  };

  function verify(question) {
    const values = question.options.map((option) => option.value);
    const matching = values.filter((value) => value === question.correctValue).length;
    const distinct = new Set(values.map((value) => String(value))).size === values.length;
    const hasDiagramData = Boolean(question.diagram?.svg && question.diagram?.data);
    const checksPassed = {
      "Solver answer matches option": matching === 1,
      "Five distinct options": values.length === 5 && distinct,
      "Diagram shares variables": hasDiagramData,
      "Explanation reaches answer": question.explanationFull.includes(String(question.correctValue)),
      "Multiple choice only": question.options.every((option, index) => option.label === labels[index]),
    };
    return {
      status: Object.values(checksPassed).every(Boolean) ? "VERIFIED" : "FAILED",
      checksPassed,
      solverResult: question.correctValue,
      diagramCheck: hasDiagramData ? "Diagram data present" : "Missing diagram data",
      llmReview: "Not run in static MVP; code checks are required before display.",
    };
  }

  function buildQuestion() {
    const topic = topicSelect.value;
    const difficulty = difficultySelect.value;
    const template = sample(templates[topic] || templates.Geometry);
    const question = template(difficulty);
    question.id = `pf-${Date.now()}`;
    question.difficulty = difficulty;
    question.correctLabel = question.options.find((option) => option.value === question.correctValue)?.label || "";
    question.verification = verify(question);
    return question;
  }

  function renderQuestion() {
    let question = buildQuestion();
    let attempts = 0;
    while (question.verification.status !== "VERIFIED" && attempts < 8) {
      question = buildQuestion();
      attempts += 1;
    }
    currentQuestion = question;
    templateLabel.textContent = `${question.topic} / ${question.templateId}`;
    verifiedLabel.textContent = question.verification.status;
    verifiedLabel.classList.toggle("is-failed", question.verification.status !== "VERIFIED");
    questionText.textContent = question.questionText;
    diagram.innerHTML = question.diagram.svg;
    optionsEl.innerHTML = question.options.map((option) => `<button type="button" data-pf-option="${option.label}"><strong>${option.label}</strong><span>${option.text}</span></button>`).join("");
    feedback.textContent = "Choose one answer.";
    feedback.classList.remove("is-good", "is-warn");
    explanation.textContent = question.explanationShort;
    tutorReply.textContent = "Follow-up answers use only the verified puzzle data.";
    status.textContent = question.verification.status === "VERIFIED" ? "Question passed code verification." : "Question failed verification and should be regenerated.";
    checks.innerHTML = Object.entries(question.verification.checksPassed).map(([name, passed]) => `<span class="${passed ? "is-good" : "is-warn"}">${passed ? "PASS" : "FAIL"} ${name}</span>`).join("");
  }

  optionsEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-pf-option]");
    if (!button || !currentQuestion) return;
    const chosen = button.dataset.pfOption;
    const correct = chosen === currentQuestion.correctLabel;
    optionsEl.querySelectorAll("button").forEach((optionButton) => {
      optionButton.classList.toggle("is-correct", optionButton.dataset.pfOption === currentQuestion.correctLabel);
      optionButton.classList.toggle("is-wrong", optionButton === button && !correct);
    });
    feedback.textContent = correct ? `Correct. ${currentQuestion.explanationShort}` : `Not quite. The answer is ${currentQuestion.correctLabel}. ${currentQuestion.commonMistakes}`;
    feedback.classList.toggle("is-good", correct);
    feedback.classList.toggle("is-warn", !correct);
    explanation.textContent = `${currentQuestion.explanationFull} So the answer is ${currentQuestion.correctLabel}, ${currentQuestion.options.find((option) => option.label === currentQuestion.correctLabel).text}.`;
  });

  game.querySelectorAll("[data-pf-tutor]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!currentQuestion) return;
      const type = button.dataset.pfTutor;
      const correctOption = currentQuestion.options.find((option) => option.label === currentQuestion.correctLabel);
      const replies = {
        why: currentQuestion.explanationFull,
        easier: `Short version: ${currentQuestion.trick} That gives ${correctOption.text}.`,
        mistake: currentQuestion.commonMistakes,
        trick: currentQuestion.trick,
      };
      tutorReply.textContent = replies[type] || currentQuestion.explanationShort;
    });
  });

  generateButton.addEventListener("click", renderQuestion);
  renderQuestion();
});
