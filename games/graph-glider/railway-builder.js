(() => {
  const ROOT_SELECTOR = "[data-railway-builder]";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const BOARD = { width: 720, height: 560, pad: 58 };
  const EPS = 1e-7;

  const gcd = (a, b) => {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) [x, y] = [y, x % y];
    return x || 1;
  };

  class Fraction {
    constructor(numerator, denominator = 1) {
      if (denominator === 0) throw new Error("A fraction cannot have denominator 0.");
      const sign = denominator < 0 ? -1 : 1;
      const divisor = gcd(numerator, denominator);
      this.n = sign * numerator / divisor;
      this.d = Math.abs(denominator) / divisor;
    }

    static from(value) {
      if (value instanceof Fraction) return value;
      if (Number.isInteger(value)) return new Fraction(value, 1);
      const fixed = String(Number(value.toFixed(6)));
      if (!fixed.includes(".")) return new Fraction(Number(fixed), 1);
      const decimals = fixed.split(".")[1].length;
      return new Fraction(Number(fixed.replace(".", "")), 10 ** decimals);
    }

    valueOf() {
      return this.n / this.d;
    }

    toString() {
      if (this.d === 1) return String(this.n);
      return `${this.n}/${this.d}`;
    }
  }

  const Maths = {
    gradient(a, b) {
      if (Math.abs(b.x - a.x) < EPS) return null;
      return Fraction.from((b.y - a.y) / (b.x - a.x));
    },

    intercept(point, m) {
      if (m === null) return null;
      return Fraction.from(point.y - Number(m) * point.x);
    },

    equationFromPoints(a, b) {
      const m = this.gradient(a, b);
      if (m === null) return { vertical: true, x: Fraction.from(a.x) };
      return { m, b: this.intercept(a, m) };
    },

    pointOnLine(point, line, tolerance = 0.08) {
      if (line.vertical) return Math.abs(point.x - Number(line.x)) <= tolerance;
      return Math.abs(point.y - (Number(line.m) * point.x + Number(line.b))) <= tolerance;
    },

    parallel(lineA, lineB, tolerance = EPS) {
      if (lineA.vertical || lineB.vertical) return Boolean(lineA.vertical && lineB.vertical);
      return Math.abs(Number(lineA.m) - Number(lineB.m)) <= tolerance;
    },

    perpendicular(lineA, lineB, tolerance = EPS) {
      if (lineA.vertical) return !lineB.vertical && Math.abs(Number(lineB.m)) <= tolerance;
      if (lineB.vertical) return !lineA.vertical && Math.abs(Number(lineA.m)) <= tolerance;
      return Math.abs(Number(lineA.m) * Number(lineB.m) + 1) <= tolerance;
    },

    intersection(lineA, lineB) {
      if (this.parallel(lineA, lineB)) return null;
      if (lineA.vertical) {
        const x = Number(lineA.x);
        return { x, y: Number(lineB.m) * x + Number(lineB.b) };
      }
      if (lineB.vertical) {
        const x = Number(lineB.x);
        return { x, y: Number(lineA.m) * x + Number(lineA.b) };
      }
      const x = (Number(lineB.b) - Number(lineA.b)) / (Number(lineA.m) - Number(lineB.m));
      return { x, y: Number(lineA.m) * x + Number(lineA.b) };
    },

    midpoint(a, b) {
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    },

    distance(a, b) {
      return Math.hypot(b.x - a.x, b.y - a.y);
    },

    parseEquation(input) {
      const compact = input
        .toLowerCase()
        .replaceAll(" ", "")
        .replaceAll("−", "-")
        .replace(/^y=/, "");
      if (/^x=-?\d+(?:\.\d+)?$/.test(compact)) {
        return { vertical: true, x: Fraction.from(Number(compact.slice(2))) };
      }
      const match = compact.match(/^([+-]?(?:\d+(?:\/\d+)?|\d*\.\d+)?)x([+-](?:\d+(?:\/\d+)?|\d*\.\d+))?$/);
      if (!match) return null;
      const m = parseCoefficient(match[1]);
      const b = match[2] ? parseCoefficient(match[2]) : new Fraction(0, 1);
      return { m, b };
    },

    formatLine(line) {
      if (!line) return "No line";
      if (line.vertical) return `x = ${line.x}`;
      const m = Fraction.from(Number(line.m));
      const b = Fraction.from(Number(line.b));
      const mText = Number(m) === 1 ? "x" : Number(m) === -1 ? "-x" : `${m}x`;
      if (Math.abs(Number(b)) < EPS) return `y = ${mText}`;
      return `y = ${mText} ${Number(b) >= 0 ? "+" : "-"} ${new Fraction(Math.abs(b.n), b.d)}`;
    },
  };

  function parseCoefficient(raw) {
    if (!raw || raw === "+") return new Fraction(1, 1);
    if (raw === "-") return new Fraction(-1, 1);
    const sign = raw.startsWith("-") ? -1 : 1;
    const clean = raw.replace(/^[+-]/, "");
    if (clean.includes("/")) {
      const [n, d] = clean.split("/").map(Number);
      return new Fraction(sign * n, d);
    }
    return Fraction.from(sign * Number(clean));
  }

  function lineFromMB(m, b) {
    return { m: Fraction.from(m), b: Fraction.from(b) };
  }

  const LEVELS = [
    {
      id: 1,
      title: "Connect two stations",
      instruction: "Draw a straight railway from Ash Halt to Birch Bank.",
      objective: "Your track must pass through both station platforms.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 5 },
      stations: [{ id: "A", name: "Ash", x: -4, y: -2 }, { id: "B", name: "Birch", x: 4, y: 2 }],
      required: ["A", "B"],
      allowedTools: ["points", "equation"],
      hint: "Put each red control point on a station. The gradient should be 1/2.",
      success: "The starter line is open.",
      startPoints: [{ x: -5, y: -3 }, { x: 3, y: 1 }],
      checks: [{ type: "passesStations", stations: ["A", "B"], message: "The track does not pass through both stations." }],
    },
    {
      id: 2,
      title: "Find the gradient",
      instruction: "Build a line with gradient 2 through the loading platform.",
      objective: "The railway must pass through Clay Depot and have gradient 2.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [{ id: "C", name: "Clay", x: -2, y: -1 }, { id: "D", name: "Drift", x: 2, y: 7 }],
      required: ["C"],
      targetGradient: new Fraction(2, 1),
      allowedTools: ["points", "equation"],
      hint: "For every 1 square right, the track rises 2 squares.",
      success: "Steep line approved.",
      startPoints: [{ x: -4, y: -2 }, { x: 1, y: 2 }],
      checks: [
        { type: "gradient", value: 2, message: "The gradient is not 2 yet." },
        { type: "passesStations", stations: ["C"], message: "The track must pass through Clay Depot." },
      ],
    },
    {
      id: 3,
      title: "Use the y-intercept",
      instruction: "Create the railway y = -x + 3.",
      objective: "The line must cross the y-axis at 3 and reach Fern Station.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [{ id: "F", name: "Fern", x: 4, y: -1 }],
      required: ["F"],
      allowedTools: ["points", "equation"],
      hint: "The intercept is where the track crosses the vertical axis.",
      success: "Intercept set correctly.",
      startPoints: [{ x: -3, y: 2 }, { x: 3, y: 0 }],
      checks: [
        { type: "lineEquals", line: lineFromMB(-1, 3), message: "The gradient or intercept is wrong for y = -x + 3." },
      ],
    },
    {
      id: 4,
      title: "Equation from two points",
      instruction: "Enter the equation for the railway through both marked stations.",
      objective: "Use equation mode to connect Glen and Harbour.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [{ id: "G", name: "Glen", x: -3, y: 5 }, { id: "H", name: "Harbour", x: 3, y: 1 }],
      required: ["G", "H"],
      allowedTools: ["equation"],
      hint: "Gradient = change in y / change in x = -4/6 = -2/3.",
      success: "Equation entered and verified.",
      startEquation: "y = x",
      checks: [{ type: "passesStations", stations: ["G", "H"], message: "That equation does not connect both stations." }],
    },
    {
      id: 5,
      title: "Parallel tracks",
      instruction: "Build a second railway parallel to the existing track.",
      objective: "Your new line must pass through Ivy Stop and be parallel to the grey railway.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [{ id: "I", name: "Ivy", x: -1, y: 4 }],
      existingLines: [{ label: "Old route", line: lineFromMB(1, -2) }],
      required: ["I"],
      allowedTools: ["points", "equation"],
      hint: "Parallel lines have exactly the same gradient.",
      success: "Parallel service commissioned.",
      startPoints: [{ x: -4, y: 3 }, { x: 2, y: 4 }],
      checks: [
        { type: "parallel", lineIndex: 0, message: "This line is not parallel to the existing railway." },
        { type: "passesStations", stations: ["I"], message: "The line must pass through Ivy Stop." },
      ],
    },
    {
      id: 6,
      title: "Perpendicular crossing",
      instruction: "Build a crossing track at right angles to the existing railway.",
      objective: "The new route must pass through Junction J and be perpendicular.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [{ id: "J", name: "Junction", x: 2, y: 1 }],
      existingLines: [{ label: "Main line", line: lineFromMB(2, -1) }],
      required: ["J"],
      allowedTools: ["points", "equation"],
      hint: "Perpendicular gradients multiply to -1, so the gradient should be -1/2.",
      success: "Crossing angle cleared.",
      startPoints: [{ x: -3, y: 1 }, { x: 4, y: -1 }],
      checks: [
        { type: "perpendicular", lineIndex: 0, message: "This crossing is not perpendicular." },
        { type: "passesStations", stations: ["J"], message: "The crossing track must pass through Junction J." },
      ],
    },
    {
      id: 7,
      title: "Intersection station",
      instruction: "Place the interchange marker where the two railways meet.",
      objective: "Drag the mint interchange marker to the intersection point.",
      bounds: { xMin: -6, xMax: 6, yMin: -5, yMax: 7 },
      stations: [],
      existingLines: [{ label: "North line", line: lineFromMB(1, 1) }, { label: "South line", line: lineFromMB(-2, 4) }],
      allowedTools: ["junction"],
      hint: "Solve x + 1 = -2x + 4. The intersection is (1, 2).",
      success: "Interchange placed exactly.",
      markerStart: { x: -2, y: 1 },
      checks: [{ type: "intersectionMarker", a: 0, b: 1, message: "The interchange marker is not at the intersection." }],
    },
    {
      id: 8,
      title: "Best route challenge",
      instruction: "Connect the terminals while avoiding the restricted works zone.",
      objective: "One straight track must reach both stations without touching the obstacle.",
      bounds: { xMin: -7, xMax: 7, yMin: -6, yMax: 6 },
      stations: [{ id: "K", name: "Kestrel", x: -6, y: -4 }, { id: "L", name: "Larch", x: 6, y: 2 }],
      required: ["K", "L"],
      obstacles: [{ type: "rect", xMin: -1, xMax: 2, yMin: -1, yMax: 2, label: "works zone" }],
      allowedTools: ["points", "equation"],
      hint: "The direct line has gradient 1/2 and passes below the restricted zone.",
      success: "Express route approved.",
      startPoints: [{ x: -6, y: -1 }, { x: 5, y: 3 }],
      checks: [
        { type: "passesStations", stations: ["K", "L"], message: "The track must connect both terminal stations." },
        { type: "avoidsObstacles", message: "The train hits an obstacle." },
      ],
    },
  ];

  class RailwayBuilder {
    constructor(root) {
      this.root = root;
      this.svg = root.querySelector("[data-rb-board]");
      this.levelSelect = root.querySelector("[data-rb-level-select]");
      this.modeButtons = Array.from(root.querySelectorAll("[data-rb-mode]"));
      this.equationInput = root.querySelector("[data-rb-equation-input]");
      this.applyEquationButton = root.querySelector("[data-rb-apply-equation]");
      this.launchButton = root.querySelector("[data-rb-launch]");
      this.checkButton = root.querySelector("[data-rb-check]");
      this.resetButton = root.querySelector("[data-rb-reset]");
      this.feedback = root.querySelector("[data-rb-feedback]");
      this.result = root.querySelector("[data-rb-result]");
      this.title = root.querySelector("[data-rb-title]");
      this.levelNumber = root.querySelector("[data-rb-level-number]");
      this.instruction = root.querySelector("[data-rb-instruction]");
      this.objective = root.querySelector("[data-rb-objective]");
      this.hint = root.querySelector("[data-rb-hint]");
      this.tools = root.querySelector("[data-rb-tools]");
      this.equationReadout = root.querySelector("[data-rb-equation-readout]");
      this.gradientReadout = root.querySelector("[data-rb-gradient-readout]");
      this.interceptReadout = root.querySelector("[data-rb-intercept-readout]");
      this.mode = "points";
      this.dragTarget = null;
      this.trainAnimation = null;

      this.populateLevels();
      this.bindEvents();
      this.loadLevel(0);
    }

    populateLevels() {
      this.levelSelect.innerHTML = LEVELS.map((level, index) => `<option value="${index}">${level.id}. ${level.title}</option>`).join("");
    }

    bindEvents() {
      this.levelSelect.addEventListener("change", () => this.loadLevel(Number(this.levelSelect.value)));
      this.modeButtons.forEach((button) => {
        button.addEventListener("click", () => this.setMode(button.dataset.rbMode));
      });
      this.applyEquationButton.addEventListener("click", () => this.applyEquation());
      this.equationInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.applyEquation();
      });
      this.checkButton.addEventListener("click", () => this.check(false));
      this.launchButton.addEventListener("click", () => this.check(true));
      this.resetButton.addEventListener("click", () => this.resetLine());
      window.addEventListener("pointermove", (event) => this.onPointerMove(event));
      window.addEventListener("pointerup", () => {
        this.dragTarget = null;
      });
    }

    loadLevel(index) {
      this.levelIndex = index;
      this.level = LEVELS[index];
      this.levelSelect.value = String(index);
      this.title.textContent = this.level.title;
      this.levelNumber.textContent = `Level ${this.level.id}`;
      this.instruction.textContent = this.level.instruction;
      this.objective.textContent = this.level.objective;
      this.hint.textContent = this.level.hint;
      this.tools.textContent = this.level.allowedTools.map((tool) => tool === "points" ? "Drag points" : tool === "equation" ? "Equation input" : "Junction marker").join(", ");
      this.result.textContent = "Waiting for a track inspection.";
      this.feedback.textContent = "Build the railway, then check or launch the train.";
      this.feedback.dataset.state = "neutral";
      this.stopTrain();

      const junctionOnly = this.level.allowedTools.length === 1 && this.level.allowedTools[0] === "junction";
      const initial = junctionOnly ? null : this.level.startEquation ? Maths.parseEquation(this.level.startEquation) : Maths.equationFromPoints(...(this.level.startPoints || [{ x: -2, y: -1 }, { x: 2, y: 1 }]));
      this.line = initial;
      this.points = junctionOnly ? [] : this.level.startPoints ? this.level.startPoints.map((point) => ({ ...point })) : this.clipLine(this.line);
      this.marker = { ...(this.level.markerStart || { x: 0, y: 0 }) };
      this.setMode(this.level.allowedTools[0]);
      this.render();
    }

    setMode(mode) {
      if (!this.level.allowedTools.includes(mode)) mode = this.level.allowedTools[0];
      this.mode = mode;
      this.modeButtons.forEach((button) => {
        const enabled = this.level.allowedTools.includes(button.dataset.rbMode);
        button.disabled = !enabled;
        button.classList.toggle("is-active", enabled && button.dataset.rbMode === mode);
      });
      this.equationInput.disabled = !this.level.allowedTools.includes("equation");
      this.applyEquationButton.disabled = !this.level.allowedTools.includes("equation");
      this.render();
    }

    resetLine() {
      this.loadLevel(this.levelIndex);
    }

    applyEquation() {
      const parsed = Maths.parseEquation(this.equationInput.value);
      if (!parsed) {
        this.say("Try an equation like y = 2x + 1 or y = -1/2x + 4.", "bad");
        return;
      }
      this.line = parsed;
      this.points = this.clipLine(parsed);
      this.say("Equation applied to the grid.", "neutral");
      this.render();
    }

    onPointerMove(event) {
      if (!this.dragTarget) return;
      event.preventDefault();
      const point = this.screenToGrid(event.clientX, event.clientY);
      if (this.dragTarget === "marker") {
        this.marker = point;
      } else {
        this.points[this.dragTarget] = point;
        this.line = Maths.equationFromPoints(this.points[0], this.points[1]);
      }
      this.render();
    }

    screenToGrid(clientX, clientY) {
      const rect = this.svg.getBoundingClientRect();
      const sx = (clientX - rect.left) / rect.width * BOARD.width;
      const sy = (clientY - rect.top) / rect.height * BOARD.height;
      const raw = this.svgToGrid({ x: sx, y: sy });
      return {
        x: clamp(Math.round(raw.x), this.level.bounds.xMin, this.level.bounds.xMax),
        y: clamp(Math.round(raw.y), this.level.bounds.yMin, this.level.bounds.yMax),
      };
    }

    gridToSvg(point) {
      const { xMin, xMax, yMin, yMax } = this.level.bounds;
      const w = BOARD.width - BOARD.pad * 2;
      const h = BOARD.height - BOARD.pad * 2;
      return {
        x: BOARD.pad + (point.x - xMin) / (xMax - xMin) * w,
        y: BOARD.height - BOARD.pad - (point.y - yMin) / (yMax - yMin) * h,
      };
    }

    svgToGrid(point) {
      const { xMin, xMax, yMin, yMax } = this.level.bounds;
      const w = BOARD.width - BOARD.pad * 2;
      const h = BOARD.height - BOARD.pad * 2;
      return {
        x: xMin + (point.x - BOARD.pad) / w * (xMax - xMin),
        y: yMin + (BOARD.height - BOARD.pad - point.y) / h * (yMax - yMin),
      };
    }

    clipLine(line) {
      const { xMin, xMax, yMin, yMax } = this.level.bounds;
      if (line.vertical) return [{ x: Number(line.x), y: yMin }, { x: Number(line.x), y: yMax }];
      const candidates = [
        { x: xMin, y: Number(line.m) * xMin + Number(line.b) },
        { x: xMax, y: Number(line.m) * xMax + Number(line.b) },
      ];
      const addY = (y) => {
        if (Math.abs(Number(line.m)) < EPS) return;
        candidates.push({ x: (y - Number(line.b)) / Number(line.m), y });
      };
      addY(yMin);
      addY(yMax);
      const inside = candidates.filter((p) => p.x >= xMin - EPS && p.x <= xMax + EPS && p.y >= yMin - EPS && p.y <= yMax + EPS);
      return inside.slice(0, 2).map((point) => ({ x: Number(point.x.toFixed(4)), y: Number(point.y.toFixed(4)) }));
    }

    render() {
      this.svg.innerHTML = "";
      this.drawGrid();
      this.drawObstacles();
      this.drawExistingLines();
      this.drawStations();
      this.drawCurrentTrack();
      if (this.level.allowedTools.includes("junction")) this.drawMarker();
      this.updateReadout();
    }

    drawGrid() {
      const { xMin, xMax, yMin, yMax } = this.level.bounds;
      const group = el("g", { class: "railway-grid" });
      for (let x = xMin; x <= xMax; x += 1) {
        const a = this.gridToSvg({ x, y: yMin });
        const b = this.gridToSvg({ x, y: yMax });
        group.append(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: x === 0 ? "axis" : "" }));
        if (x !== 0) group.append(label(x, a.x, this.gridToSvg({ x, y: 0 }).y + 18, "railway-axis-label"));
      }
      for (let y = yMin; y <= yMax; y += 1) {
        const a = this.gridToSvg({ x: xMin, y });
        const b = this.gridToSvg({ x: xMax, y });
        group.append(el("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: y === 0 ? "axis" : "" }));
        if (y !== 0) group.append(label(y, this.gridToSvg({ x: 0, y }).x - 18, a.y + 5, "railway-axis-label"));
      }
      this.svg.append(group);
    }

    drawObstacles() {
      (this.level.obstacles || []).forEach((obstacle) => {
        if (obstacle.type !== "rect") return;
        const a = this.gridToSvg({ x: obstacle.xMin, y: obstacle.yMax });
        const b = this.gridToSvg({ x: obstacle.xMax, y: obstacle.yMin });
        this.svg.append(el("rect", { class: "railway-obstacle", x: a.x, y: a.y, width: b.x - a.x, height: b.y - a.y, rx: 8 }));
        this.svg.append(label(obstacle.label || "hazard", (a.x + b.x) / 2, (a.y + b.y) / 2 + 5, "railway-obstacle-label"));
      });
    }

    drawExistingLines() {
      (this.level.existingLines || []).forEach((existing) => {
        const points = this.clipLine(existing.line);
        const a = this.gridToSvg(points[0]);
        const b = this.gridToSvg(points[1]);
        this.svg.append(track(a, b, "railway-existing-track"));
      });
    }

    drawStations() {
      (this.level.stations || []).forEach((station) => {
        const p = this.gridToSvg(station);
        this.svg.append(el("rect", { class: "railway-station-platform", x: p.x - 26, y: p.y - 8, width: 52, height: 16, rx: 5 }));
        this.svg.append(el("circle", { class: "railway-station-dot", cx: p.x, cy: p.y, r: 7 }));
        this.svg.append(label(`${station.id} ${station.name}`, p.x, p.y - 18, "railway-station-label"));
      });
    }

    drawCurrentTrack() {
      if (this.mode === "junction" && !this.level.allowedTools.includes("points")) return;
      if (!this.line || !this.points || this.points.length < 2) return;
      const points = this.clipLine(this.line);
      if (points.length < 2) return;
      const a = this.gridToSvg(points[0]);
      const b = this.gridToSvg(points[1]);
      this.svg.append(track(a, b, "railway-current-track"));
      this.svg.append(el("line", { class: "railway-track-core", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
      if (this.level.allowedTools.includes("points")) {
        this.points.forEach((point, index) => {
          const p = this.gridToSvg(point);
          const handle = el("circle", { class: "railway-handle", cx: p.x, cy: p.y, r: 11, tabindex: 0 });
          handle.addEventListener("pointerdown", (event) => {
            event.preventDefault();
            if (this.mode !== "points") this.setMode("points");
            this.dragTarget = index;
          });
          this.svg.append(handle);
        });
      }
    }

    drawMarker() {
      const p = this.gridToSvg(this.marker);
      const marker = el("g", { class: "railway-marker", tabindex: 0 });
      marker.append(el("circle", { cx: p.x, cy: p.y, r: 15 }));
      marker.append(el("path", { d: `M ${p.x - 8} ${p.y} L ${p.x + 8} ${p.y} M ${p.x} ${p.y - 8} L ${p.x} ${p.y + 8}` }));
      marker.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        this.setMode("junction");
        this.dragTarget = "marker";
      });
      this.svg.append(marker);
    }

    updateReadout() {
      this.equationReadout.textContent = Maths.formatLine(this.line);
      if (!this.line) {
        this.gradientReadout.textContent = "marker";
        this.interceptReadout.textContent = "n/a";
        this.equationInput.value = "";
        return;
      }
      if (this.line?.vertical) {
        this.gradientReadout.textContent = "undefined";
        this.interceptReadout.textContent = "none";
        this.equationInput.value = Maths.formatLine(this.line);
        return;
      }
      this.gradientReadout.textContent = String(Fraction.from(Number(this.line.m)));
      this.interceptReadout.textContent = String(Fraction.from(Number(this.line.b)));
      this.equationInput.value = Maths.formatLine(this.line);
    }

    check(launchTrain) {
      const result = this.validate();
      this.say(result.message, result.ok ? "good" : "bad");
      this.result.textContent = result.ok ? this.level.success : result.message;
      if (result.ok && launchTrain) this.animateTrain();
    }

    validate() {
      for (const check of this.level.checks || []) {
        const result = this.runCheck(check);
        if (!result.ok) return { ok: false, message: check.message || result.message };
      }
      return { ok: true, message: this.level.success };
    }

    runCheck(check) {
      if (check.type === "passesStations") {
        const stations = check.stations.map((id) => this.level.stations.find((station) => station.id === id));
        return { ok: stations.every((station) => Maths.pointOnLine(station, this.line)) };
      }
      if (check.type === "gradient") {
        return { ok: !this.line.vertical && Math.abs(Number(this.line.m) - check.value) < 0.001 };
      }
      if (check.type === "lineEquals") {
        return { ok: !this.line.vertical && Math.abs(Number(this.line.m) - Number(check.line.m)) < 0.001 && Math.abs(Number(this.line.b) - Number(check.line.b)) < 0.001 };
      }
      if (check.type === "parallel") {
        return { ok: Maths.parallel(this.line, this.level.existingLines[check.lineIndex].line, 0.001) };
      }
      if (check.type === "perpendicular") {
        return { ok: Maths.perpendicular(this.line, this.level.existingLines[check.lineIndex].line, 0.001) };
      }
      if (check.type === "intersectionMarker") {
        const target = Maths.intersection(this.level.existingLines[check.a].line, this.level.existingLines[check.b].line);
        return { ok: target && Maths.distance(this.marker, target) <= 0.15 };
      }
      if (check.type === "avoidsObstacles") {
        const endpoints = this.requiredSegment();
        return { ok: !(this.level.obstacles || []).some((obstacle) => segmentHitsRect(endpoints[0], endpoints[1], obstacle)) };
      }
      return { ok: true };
    }

    requiredSegment() {
      const stations = (this.level.required || []).map((id) => this.level.stations.find((station) => station.id === id)).filter(Boolean);
      if (stations.length >= 2) return [stations[0], stations[1]];
      if (!this.line) return [];
      return this.clipLine(this.line);
    }

    animateTrain() {
      this.stopTrain();
      const segment = this.requiredSegment();
      if (!segment || segment.length < 2) {
        this.say(this.level.success, "good");
        return;
      }
      const a = this.gridToSvg(segment[0]);
      const b = this.gridToSvg(segment[1]);
      const train = el("g", { class: "railway-train" });
      train.append(el("rect", { x: -18, y: -10, width: 36, height: 20, rx: 6 }));
      train.append(el("circle", { cx: -10, cy: 12, r: 4 }));
      train.append(el("circle", { cx: 10, cy: 12, r: 4 }));
      this.svg.append(train);

      const start = performance.now();
      const duration = 1400;
      const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      const step = (now) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = a.x + (b.x - a.x) * eased;
        const y = a.y + (b.y - a.y) * eased;
        train.setAttribute("transform", `translate(${x} ${y}) rotate(${angle})`);
        if (t < 1) {
          this.trainAnimation = requestAnimationFrame(step);
        } else {
          this.say(this.level.success, "good");
        }
      };
      this.trainAnimation = requestAnimationFrame(step);
    }

    stopTrain() {
      if (this.trainAnimation) cancelAnimationFrame(this.trainAnimation);
      this.trainAnimation = null;
      this.svg.querySelectorAll(".railway-train").forEach((node) => node.remove());
    }

    say(message, state = "neutral") {
      this.feedback.textContent = message;
      this.feedback.dataset.state = state;
    }
  }

  function el(name, attrs = {}) {
    const node = document.createElementNS(SVG_NS, name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function label(text, x, y, className) {
    const node = el("text", { x, y, class: className, "text-anchor": "middle" });
    node.textContent = text;
    return node;
  }

  function track(a, b, className) {
    const group = el("g", { class: className });
    group.append(el("line", { class: "railway-sleeper-line", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const count = Math.max(4, Math.floor(length / 24));
    const nx = -(b.y - a.y) / length;
    const ny = (b.x - a.x) / length;
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      group.append(el("line", { class: "railway-sleeper", x1: x - nx * 10, y1: y - ny * 10, x2: x + nx * 10, y2: y + ny * 10 }));
    }
    group.append(el("line", { class: "railway-rail", x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
    return group;
  }

  function segmentHitsRect(a, b, rect) {
    for (let i = 0; i <= 80; i += 1) {
      const t = i / 80;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax) return true;
    }
    return false;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  window.RailwayBuilderMath = Maths;
  document.querySelectorAll(ROOT_SELECTOR).forEach((root) => new RailwayBuilder(root));
})();
