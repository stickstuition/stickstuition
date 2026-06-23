(() => {
  const SELECTOR = "[data-angle-architect-game]";
  const WIDTH = 1180;
  const HEIGHT = 720;
  const START_Y = 552;
  const SAFE = {
    minX: 96,
    maxX: 1084,
    minY: 92,
    maxY: 596,
  };

  const ASSETS = {
    wood: "sprites/kenney_physicsAssets_v2/PNG/Wood%20elements/elementWood011.png",
    metalPost: "sprites/kenney_physicsAssets_v2/PNG/Metal%20elements/elementMetal011.png",
    weakBracket: "sprites/kenney_physicsAssets_v2/PNG/Glass%20elements/elementGlass046.png",
    miner: "sprites/builders/miner-single.png",
  };

  const qs = (root, selector) => root.querySelector(selector);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const randomFrom = (items) => items[Math.floor(Math.random() * items.length)];
  const rand = (min, max) => min + Math.random() * (max - min);
  const stepRand = (min, max, step) => min + Math.floor(Math.random() * ((max - min) / step + 1)) * step;
  const degToRad = (deg) => (deg * Math.PI) / 180;
  const radToDeg = (rad) => (rad * 180) / Math.PI;
  const normalizeRad = (rad) => {
    let value = rad;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  };

  const FOREMAN_LINES = {
    start: [
      "Blueprint is live. First bracket sets the tone.",
      "Crew is moving. Keep your angles clean.",
      "Fresh build. No panic, just precision.",
      "Read the joint before the timber starts arguing.",
      "That first support decides the whole frame.",
      "Start steady. Speed comes after accuracy.",
      "Eyes on the flashing joint.",
      "New scaffold, clean slate.",
      "Measure once, install once.",
      "Let's make this one pass inspection.",
      "The base is set. Brackets do the clever work.",
      "No guessing. The diagram is giving you the answer.",
      "A good bracket now saves a wobble later.",
      "Builders are ready for your call.",
      "Keep the first angle tidy.",
      "We are stable for now. Use that time.",
      "Right angle or straight line, same discipline.",
      "The frame is quiet. Let's keep it that way.",
      "First beam is never free. It wants support.",
      "Show me a neat bracket.",
    ],
    steady: [
      "Structure is holding. Keep the rhythm.",
      "Good pace. Do not let the joint drift.",
      "Stable enough, but not forever.",
      "That beam is waiting on a number.",
      "The crew can work faster if you do.",
      "I like calm maths on a noisy site.",
      "Read the known angle, finish the bracket.",
      "No drama yet. Keep it that way.",
      "The scaffold is listening to your answer.",
      "A clean support keeps the line straight.",
      "You have time, but not spare time.",
      "This is the sweet spot. Use it.",
      "Small wobble, small problem. For now.",
      "The joint is still cooperating.",
      "Keep the build balanced.",
      "The frame is steady enough to solve.",
      "Do not chase the beam. Solve the angle.",
      "Every bracket buys us height.",
      "That support wants the missing degrees.",
      "Keep those answers coming.",
    ],
    urgent: [
      "That beam is starting to wander.",
      "Faster now. The joint is losing patience.",
      "The frame is leaning into trouble.",
      "Do the angle before the timber does its own thing.",
      "This is not a tea break joint.",
      "Support it now or we are sweeping later.",
      "The wobble is building.",
      "Quick bracket, clean bracket.",
      "Stability is leaking. Answer now.",
      "The crew is backing off that beam.",
      "That joint is flashing for a reason.",
      "Angle first, disaster never.",
      "The scaffold is starting to complain.",
      "We need that support before the next swing.",
      "This one is getting lively.",
      "Keep it together. Literally.",
      "The longer it hangs, the worse it gets.",
      "That beam is not decorative. Fix it.",
      "Pressure is up. Stay sharp.",
      "Do not let the physics win.",
    ],
    success: [
      "Locked in. Nice bracket.",
      "That support sat down beautifully.",
      "Clean install. Builders can move.",
      "Good angle, good frame.",
      "That is how you stop a wobble.",
      "Bracket accepted. Structure likes it.",
      "Strong answer. Strong joint.",
      "Perfect fit on that support.",
      "The beam settled straight away.",
      "That one passes inspection.",
      "Good work. Next beam is coming.",
      "You read that joint properly.",
      "Support is doing its job.",
      "Nice and tidy.",
      "The crew trusts that bracket.",
      "That answer bought us stability.",
      "Good maths, good metal.",
      "No shake on that one.",
      "Keep stacking those clean installs.",
      "That is a foreman-approved fix.",
    ],
    warning: [
      "Wrong bracket. The frame felt that.",
      "Nope. That support did not line up.",
      "That angle has upset the scaffold.",
      "We lost stability there.",
      "The joint rejected that bracket.",
      "Careful. Wrong metal makes worse trouble.",
      "That one shook the crew.",
      "Not the angle we needed.",
      "The beam is fighting back.",
      "Reset your eyes on the known angle.",
      "That bracket is not carrying load.",
      "We can recover, but not forever.",
      "Wrong fit. Damage is up.",
      "The frame does not forgive many of those.",
      "Try the missing degrees, not the shown degrees.",
      "That was a warning wobble.",
      "Incorrect support. Check the total angle.",
      "The scaffold just lost confidence.",
      "One mistake is workable. Two gets expensive.",
      "Patch it properly this time.",
    ],
    streak: [
      "Perfect chain running. Keep it clean.",
      "You are building like a pro now.",
      "That streak is reinforcing the frame.",
      "Precision bonus is live.",
      "The crew has found its rhythm.",
      "Clean answers are stacking up.",
      "This is premium bracket work.",
      "Keep the chain alive.",
      "Every perfect support makes the next safer.",
      "The frame is starting to trust you.",
      "No wasted metal in this run.",
      "That is a serious build streak.",
      "Quick and accurate. Best combination.",
      "The inspection clipboard is smiling.",
      "You are making this look easy.",
      "That chain is worth protecting.",
      "Reinforced rhythm. Lovely.",
      "Keep those exact angles landing.",
      "This is the tidy version of fast.",
      "Do not blink. The streak is alive.",
    ],
  };

  class AngleArchitectGame {
    constructor(root) {
      this.root = root;
      this.stageEl = qs(root, "[data-aa-stage]");
      this.inputBubble = qs(root, "[data-aa-input-bubble]");
      this.answerInput = qs(root, "[data-aa-answer]");
      this.installButton = qs(root, "[data-aa-install]");
      this.startOverlay = qs(root, "[data-aa-start]");
      this.startButton = qs(root, "[data-aa-start-button]");
      this.gameOverOverlay = qs(root, "[data-aa-game-over]");
      this.restartButton = qs(root, "[data-aa-restart]");
      this.gameOverTitle = qs(root, "[data-aa-game-over-title]");
      this.gameOverCopy = qs(root, "[data-aa-game-over-copy]");
      this.scoreEl = qs(root, "[data-aa-score]");
      this.levelEl = qs(root, "[data-aa-level]");
      this.stabilityEl = qs(root, "[data-aa-stability]");
      this.stabilityBar = qs(root, "[data-aa-stability-bar]");
      this.promptEl = qs(root, "[data-aa-prompt]");
      this.chainEl = qs(root, "[data-aa-chain]");
      this.foremanEl = qs(root, "[data-aa-foreman]");
      this.foremanLine = qs(root, "[data-aa-foreman-line]");

      this.score = 0;
      this.level = 1;
      this.round = 0;
      this.stability = 100;
      this.damage = 0;
      this.streak = 0;
      this.perfectChain = 0;
      this.started = false;
      this.processingAnswer = false;
      this.stageScale = 1;
      this.stageOffset = { x: 0, y: 0 };
      this.members = [];
      this.anchors = [];
      this.builders = [];
      this.dynamicSprites = new Map();
      this.previousVelocity = new Map();
      this.pending = null;
      this.activeMarker = null;
      this.problemStartedAt = 0;
      this.lastTickAt = performance.now();
      this.foremanTimer = null;
      this.lastForemanLine = "";

      this.startBuild = this.startBuild.bind(this);
      this.submitAnswer = this.submitAnswer.bind(this);
      this.hideInput = this.hideInput.bind(this);
      this.onResize = this.onResize.bind(this);
      this.tick = this.tick.bind(this);
      if (window.location.hostname === "localhost" || window.location.search.includes("aaDebug")) {
        root.angleArchitectGame = this;
      }
      this.init();
    }

    init() {
      if (!window.PIXI || !window.gsap || !window.Matter) {
        this.stageEl.textContent = "Angle Architect needs PixiJS, GSAP and Matter.js to run.";
        this.stageEl.classList.add("is-error");
        return;
      }

      this.Matter = window.Matter;
      this.engine = this.Matter.Engine.create({
        enableSleeping: true,
        gravity: { x: 0, y: 0.22 },
      });
      this.engine.positionIterations = 14;
      this.engine.velocityIterations = 12;
      this.engine.constraintIterations = 6;

      this.app = new PIXI.Application({
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });

      this.stageEl.prepend(this.app.view);
      this.world = new PIXI.Container();
      this.backLayer = new PIXI.Container();
      this.baseLayer = new PIXI.Container();
      this.memberLayer = new PIXI.Container();
      this.bracketLayer = new PIXI.Container();
      this.markerLayer = new PIXI.Container();
      this.characterLayer = new PIXI.Container();
      this.fxLayer = new PIXI.Container();
      this.world.addChild(
        this.backLayer,
        this.baseLayer,
        this.memberLayer,
        this.bracketLayer,
        this.markerLayer,
        this.characterLayer,
        this.fxLayer
      );
      this.app.stage.addChild(this.world);
      this.app.stage.eventMode = "static";
      this.app.stage.hitArea = new PIXI.Rectangle(0, 0, WIDTH, HEIGHT);
      this.app.stage.on("pointerdown", this.hideInput);

      this.textures = Object.fromEntries(
        Object.entries(ASSETS).map(([name, path]) => [name, PIXI.Texture.from(path)])
      );

      this.drawBackground();
      this.createBuilders();
      this.bindEvents();
      this.Matter.Events.on(this.engine, "collisionStart", (event) => this.onCollisionStart(event));
      this.app.ticker.add(this.tick);
      window.addEventListener("resize", this.onResize);
      this.onResize();
      this.updateHud();
    }

    bindEvents() {
      this.startButton.addEventListener("click", this.startBuild);
      this.restartButton.addEventListener("click", this.startBuild);
      this.installButton.addEventListener("click", this.submitAnswer);
      this.answerInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") this.submitAnswer();
        if (event.key === "Escape") this.hideInput();
      });
    }

    onResize() {
      const rect = this.stageEl.getBoundingClientRect();
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(420, Math.floor(rect.height));
      this.app.renderer.resize(width, height);
      this.stageScale = Math.min(width / WIDTH, height / HEIGHT) * 0.94;
      this.stageOffset.x = (width - WIDTH * this.stageScale) / 2;
      this.stageOffset.y = (height - HEIGHT * this.stageScale) / 2;
      this.world.scale.set(this.stageScale);
      this.world.position.set(this.stageOffset.x, this.stageOffset.y);
      this.placeInputBubble();
    }

    drawBackground() {
      const bg = new PIXI.Graphics();
      bg.beginFill(0x111524);
      bg.drawRoundedRect(18, 18, WIDTH - 36, HEIGHT - 36, 22);
      bg.endFill();
      bg.beginFill(0x20243e, 0.96);
      bg.drawRoundedRect(50, 48, WIDTH - 100, HEIGHT - 104, 14);
      bg.endFill();

      const grid = new PIXI.Graphics();
      grid.lineStyle(1, 0xffffff, 0.06);
      for (let x = 88; x <= 1092; x += 72) grid.moveTo(x, 78).lineTo(x, 610);
      for (let y = 86; y <= 610; y += 58) grid.moveTo(88, y).lineTo(1092, y);

      this.backLayer.addChild(bg, grid);
    }

    startBuild() {
      this.score = 0;
      this.level = 1;
      this.round = 0;
      this.stability = 100;
      this.damage = 0;
      this.streak = 0;
      this.perfectChain = 0;
      this.processingAnswer = false;
      this.pending = null;
      this.lastTickAt = performance.now();
      this.started = true;
      this.hideInput();
      this.startOverlay.hidden = true;
      this.startOverlay.classList.remove("is-visible");
      this.gameOverOverlay.hidden = true;
      this.gameOverOverlay.classList.remove("is-visible");
      this.startForemanChatter();
      this.resetWorld();
      this.drawStarterFrame();
      this.resetBuilders();
      this.speak("start", "neutral");
      this.updateHud();
      window.setTimeout(() => this.nextRound(), 650);
    }

    resetWorld() {
      this.Matter.Composite.clear(this.engine.world, false, true);
      this.baseLayer.removeChildren();
      this.memberLayer.removeChildren();
      this.bracketLayer.removeChildren();
      this.markerLayer.removeChildren();
      this.fxLayer.removeChildren();
      this.members = [];
      this.anchors = [];
      this.dynamicSprites.clear();
      this.previousVelocity.clear();
      this.activeMarker = null;

      const ground = this.Matter.Bodies.rectangle(590, 665, 1040, 58, {
        isStatic: true,
        friction: 1,
        restitution: 0,
        label: "stone-ground",
      });
      const leftWall = this.Matter.Bodies.rectangle(54, 370, 28, 620, { isStatic: true, label: "wall" });
      const rightWall = this.Matter.Bodies.rectangle(1126, 370, 28, 620, { isStatic: true, label: "wall" });
      this.Matter.Composite.add(this.engine.world, [ground, leftWall, rightWall]);
    }

    drawStarterFrame() {
      const base = [
        this.addAnchor(300, START_Y),
        this.addAnchor(445, START_Y),
        this.addAnchor(590, START_Y),
        this.addAnchor(735, START_Y),
        this.addAnchor(880, START_Y),
      ];
      const top = base.map((point) => this.addAnchor(point.x, 438));

      top.forEach((point, index) => {
        this.addStaticMember(base[index], point, "metalPost", 22);
      });
      for (let i = 0; i < top.length - 1; i += 1) {
        this.addStaticMember(top[i], top[i + 1], "wood", 28);
      }
      this.anchors = top.map((anchor, index) => ({
        ...anchor,
        growthBias: index < 2 ? -1 : index > 2 ? 1 : 0,
        uses: 0,
      }));
    }

    addAnchor(x, y, open = true) {
      return { x, y, open, uses: 0, members: [] };
    }

    addStaticMember(a, b, textureName = "wood", thickness = 28) {
      const member = this.createMemberSprite(a, b, textureName, thickness, this.memberLayer);
      const body = this.Matter.Bodies.rectangle(member.cx, member.cy, member.length, thickness, {
        angle: member.angle,
        isStatic: true,
        friction: 0.92,
        restitution: 0,
        label: "locked-member",
      });
      member.body = body;
      member.locked = true;
      this.Matter.Composite.add(this.engine.world, body);
      this.dynamicSprites.set(body.id, member.sprite);
      a.members.push(member);
      b.members.push(member);
      this.members.push(member);
      return member;
    }

    createMemberSprite(a, b, textureName, thickness, layer) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const sprite = new PIXI.Sprite(this.textures[textureName]);
      sprite.anchor.set(0.5);
      sprite.position.set((a.x + b.x) / 2, (a.y + b.y) / 2);
      sprite.rotation = angle;
      sprite.width = length;
      sprite.height = thickness;
      layer.addChild(sprite);
      return {
        a,
        b,
        sprite,
        textureName,
        thickness,
        length,
        angle,
        cx: (a.x + b.x) / 2,
        cy: (a.y + b.y) / 2,
      };
    }

    nextRound() {
      if (!this.started || this.pending) return;
      this.round += 1;
      this.level = Math.min(12, 1 + Math.floor((this.round - 1) / 3));
      const joint = this.createPendingJoint();
      this.pending = joint;
      this.problemStartedAt = performance.now();
      this.processingAnswer = false;
      this.animateBuildersTo(joint.anchor.x);
      this.drawActiveMarker();
      this.speak(this.stability < 55 ? "urgent" : "steady", "neutral");
      this.updateHud();
    }

    createPendingJoint() {
      const anchor = this.pickAnchor();
      const existingMember = this.pickExistingMember(anchor);
      const targetTotal = this.pickTargetTotal();
      const knownAngle = this.pickKnownAngle(targetTotal);
      const existingAngle = this.angleAwayFromAnchor(existingMember, anchor);
      const plan = this.pickBeamPlan(anchor, existingAngle, knownAngle);
      const end = {
        x: plan.x,
        y: plan.y,
        open: true,
        uses: 0,
        members: [],
      };

      const member = this.createMemberSprite(anchor, end, "wood", 26, this.memberLayer);
      member.sprite.alpha = 0;
      gsap.to(member.sprite, { alpha: 1, duration: 0.28, ease: "power2.out" });

      const body = this.Matter.Bodies.rectangle(member.cx, member.cy, member.length, member.thickness, {
        angle: member.angle,
        density: 0.0024,
        friction: 0.92,
        frictionAir: 0.054,
        restitution: 0.02,
        chamfer: { radius: 5 },
        label: "candidate-beam",
      });
      this.Matter.Body.setInertia(body, body.inertia * 1.35);
      const pivot = this.Matter.Constraint.create({
        bodyA: body,
        pointA: { x: -member.length / 2, y: 0 },
        pointB: { x: anchor.x, y: anchor.y },
        length: 0,
        stiffness: 0.985,
        damping: 0.56,
        label: "candidate-pivot",
      });
      this.Matter.Composite.add(this.engine.world, [body, pivot]);
      this.dynamicSprites.set(body.id, member.sprite);
      this.previousVelocity.set(body.id, { x: 0, y: 0 });
      member.body = body;
      member.pivot = pivot;
      member.locked = false;
      anchor.members.push(member);
      end.members.push(member);
      this.members.push(member);

      this.Matter.Body.applyForce(body, body.position, { x: plan.side * 0.00045, y: 0.0002 });

      return {
        anchor,
        end,
        member,
        existingMember,
        knownAngle,
        targetTotal,
        answer: targetTotal - knownAngle,
        side: plan.side,
        wrongAttempts: 0,
      };
    }

    pickAnchor() {
      const viable = this.anchors.filter((anchor) => anchor.open && anchor.uses < 3 && anchor.x > 135 && anchor.x < 1045 && anchor.y > 122 && anchor.y < 575);
      return randomFrom(viable.length ? viable : this.anchors);
    }

    pickExistingMember(anchor) {
      const locked = anchor.members.filter((member) => member.locked);
      return locked.length ? locked[locked.length - 1] : this.members.find((member) => member.locked);
    }

    pickTargetTotal() {
      if (this.level <= 2) return 90;
      if (this.level <= 4) return randomFrom([90, 180]);
      return randomFrom([90, 180]);
    }

    pickKnownAngle(targetTotal) {
      if (targetTotal === 90) return stepRand(20, 70, 5);
      if (targetTotal === 180) return stepRand(45, 145, 5);
      return stepRand(120, 235, 5);
    }

    pickGrowthSide(anchor) {
      if (anchor.x < 300) return 1;
      if (anchor.x > 880) return -1;
      if (anchor.growthBias) return anchor.growthBias;
      return Math.random() > 0.5 ? 1 : -1;
    }

    pickBeamPlan(anchor, existingAngle, knownAngle) {
      const preferred = this.pickGrowthSide(anchor);
      const lengths = [160, 145, 130, 115, 100, 88];
      const sides = [preferred, -preferred];
      const candidates = [];

      sides.forEach((side, sideIndex) => {
        const angle = existingAngle + side * degToRad(knownAngle);
        lengths.forEach((length, lengthIndex) => {
          const x = anchor.x + Math.cos(angle) * length;
          const y = anchor.y + Math.sin(angle) * length;
          if (x < SAFE.minX || x > SAFE.maxX || y < SAFE.minY || y > SAFE.maxY) return;
          const edgePenalty = Math.max(0, 170 - x, x - 1010, 125 - y, y - 560);
          const growthReward = Math.abs(x - 590) * 0.05 + Math.max(0, anchor.y - y) * 0.28;
          candidates.push({
            x,
            y,
            side,
            angle,
            score: 100 - sideIndex * 18 - lengthIndex * 4 - edgePenalty + growthReward,
          });
        });
      });

      if (candidates.length) {
        return candidates.sort((a, b) => b.score - a.score)[0];
      }

      const side = preferred;
      const angle = existingAngle + side * degToRad(knownAngle);
      return {
        x: clamp(anchor.x + Math.cos(angle) * 96, SAFE.minX, SAFE.maxX),
        y: clamp(anchor.y + Math.sin(angle) * 96, SAFE.minY, SAFE.maxY),
        side,
        angle,
      };
    }

    angleAwayFromAnchor(member, anchor) {
      const other = Math.hypot(member.a.x - anchor.x, member.a.y - anchor.y) < 4 ? member.b : member.a;
      return Math.atan2(other.y - anchor.y, other.x - anchor.x);
    }

    drawActiveMarker() {
      this.markerLayer.removeChildren();
      const joint = this.pending;
      const marker = new PIXI.Container();
      marker.eventMode = "static";
      marker.cursor = "pointer";
      marker.hitArea = new PIXI.Circle(0, 0, 70);
      marker.position.set(joint.anchor.x, joint.anchor.y);
      marker.on("pointerdown", (event) => {
        event.stopPropagation();
        this.showInput();
      });

      const arc = this.drawAngleArc(joint);
      const targetArc = this.drawTargetBracketArc(joint);
      const ring = new PIXI.Graphics();
      ring.lineStyle(7, 0xb9f4de, 1);
      ring.beginFill(0xb9f4de, 0.13);
      ring.drawCircle(0, 0, 31);
      ring.endFill();
      const dot = new PIXI.Graphics();
      dot.beginFill(0xc6001c);
      dot.drawCircle(0, 0, 10);
      dot.endFill();

      const label = this.makeLabel(`${joint.knownAngle} deg`, -4, -62, 24, 0xffffff);
      const target = this.makeLabel(`${joint.targetTotal} deg bracket`, 0, 54, 17, 0xb9f4de);
      marker.addChild(targetArc, arc, ring, dot, label, target);
      this.markerLayer.addChild(marker);
      this.activeMarker = marker;

      gsap.to(ring.scale, { x: 1.42, y: 1.42, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
      gsap.to(ring, { alpha: 0.34, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }

    drawAngleArc(joint) {
      const start = this.angleAwayFromAnchor(joint.existingMember, joint.anchor);
      const end = this.currentCandidateAngle(joint);
      const sweep = this.sweepForKnown(start, end, joint.knownAngle);
      return this.arcGraphic(start, sweep, 48, 0xffd057, 6, 0.95);
    }

    drawTargetBracketArc(joint) {
      const start = this.angleAwayFromAnchor(joint.existingMember, joint.anchor);
      const sweep = joint.side * degToRad(joint.targetTotal);
      return this.arcGraphic(start, sweep, 61, 0xb9f4de, 2, 0.32);
    }

    currentCandidateAngle(joint) {
      return joint.member.body ? joint.member.body.angle : joint.member.angle;
    }

    sweepForKnown(start, end, degrees) {
      const expected = degToRad(degrees);
      const diff = normalizeRad(end - start);
      return Math.abs(diff - expected) < Math.abs(diff + expected) ? expected : -expected;
    }

    arcGraphic(start, sweep, radius, color, width, alpha) {
      const graphic = new PIXI.Graphics();
      graphic.lineStyle(width, color, alpha);
      const steps = Math.max(14, Math.ceil(Math.abs(radToDeg(sweep)) / 6));
      for (let i = 0; i <= steps; i += 1) {
        const angle = start + (sweep * i) / steps;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) graphic.moveTo(x, y);
        else graphic.lineTo(x, y);
      }
      return graphic;
    }

    makeLabel(text, x, y, size, fill) {
      const label = new PIXI.Text(text, {
        fontFamily: "Arial",
        fontSize: size,
        fontWeight: "800",
        fill,
        stroke: 0x101322,
        strokeThickness: 5,
      });
      label.anchor.set(0.5);
      label.position.set(x, y);
      return label;
    }

    showInput() {
      if (!this.pending || this.processingAnswer) return;
      this.inputBubble.hidden = false;
      this.inputBubble.classList.add("is-visible");
      this.answerInput.value = "";
      this.placeInputBubble();
      window.setTimeout(() => this.answerInput.focus(), 20);
    }

    hideInput() {
      this.inputBubble.classList.remove("is-visible");
      this.inputBubble.hidden = true;
    }

    placeInputBubble() {
      if (!this.pending || this.inputBubble.hidden) return;
      const x = this.stageOffset.x + this.pending.anchor.x * this.stageScale;
      const y = this.stageOffset.y + this.pending.anchor.y * this.stageScale;
      this.inputBubble.style.left = `${clamp(x + 24, 10, this.stageEl.clientWidth - 250)}px`;
      this.inputBubble.style.top = `${clamp(y - 72, 10, this.stageEl.clientHeight - 130)}px`;
    }

    submitAnswer() {
      if (!this.pending || this.processingAnswer) return;
      const value = Number(this.answerInput.value.trim());
      if (!Number.isFinite(value)) {
        this.popText(this.pending.anchor.x, this.pending.anchor.y - 38, "number?", 0xffd057);
        return;
      }

      if (Math.round(value) === this.pending.answer) {
        this.handleCorrect();
      } else {
        this.handleWrong();
      }
    }

    handleCorrect() {
      const joint = this.pending;
      this.processingAnswer = true;
      this.hideInput();
      const time = (performance.now() - this.problemStartedAt) / 1000;
      const speedBonus = clamp(Math.round((12 - time) * 9), 0, 95);
      this.streak += 1;
      this.perfectChain += joint.wrongAttempts === 0 ? 1 : 0;
      const chainBonus = this.perfectChain > 0 && this.perfectChain % 3 === 0 ? 260 + this.level * 35 : 0;
      const points = 160 + this.level * 18 + this.streak * 24 + speedBonus + chainBonus;
      this.score += points;
      this.damage = clamp(this.damage - (chainBonus ? 18 : 8), 0, 100);

      this.lockJoint(joint, Boolean(chainBonus));
      this.markerLayer.removeChildren();
      this.popText(joint.anchor.x, joint.anchor.y - 72, chainBonus ? `perfect +${points}` : `+${points}`, 0xb9f4de);
      this.cheerBuilders();
      this.speak(chainBonus ? "streak" : "success", "happy");
      this.pending = null;
      this.updateHud();
      window.setTimeout(() => this.nextRound(), 850);
    }

    lockJoint(joint, reinforced) {
      const { member } = joint;
      this.Matter.Composite.remove(this.engine.world, member.pivot);
      this.Matter.Body.setVelocity(member.body, { x: 0, y: 0 });
      this.Matter.Body.setAngularVelocity(member.body, 0);
      this.Matter.Body.setPosition(member.body, { x: member.cx, y: member.cy });
      this.Matter.Body.setAngle(member.body, member.angle);
      this.Matter.Body.setStatic(member.body, true);
      member.body.label = "locked-member";
      member.locked = true;

      const bracket = this.createBracketSprite(joint, reinforced);
      gsap.fromTo(bracket.scale, { x: 0.35, y: 0.35 }, { x: 1, y: 1, duration: 0.32, ease: "back.out(2.2)" });

      joint.anchor.uses += 1;
      joint.end.growthBias = joint.end.x < 500 ? -1 : 1;
      this.anchors.push(joint.end);
      if (this.anchors.length > 11) {
        this.anchors = this.anchors.filter((anchor) => anchor.uses < 3).slice(-11);
      }
    }

    createBracketSprite(joint, reinforced) {
      const plate = new PIXI.Container();
      plate.position.set(joint.anchor.x, joint.anchor.y);

      const start = joint.member.angle;
      const sweep = joint.side * degToRad(joint.answer);
      const inner = reinforced ? 17 : 19;
      const outer = reinforced ? 60 : 54;
      const steps = Math.max(5, Math.ceil(Math.abs(joint.answer) / 14));
      const points = [];

      points.push(Math.cos(start) * inner, Math.sin(start) * inner);
      for (let i = 0; i <= steps; i += 1) {
        const angle = start + (sweep * i) / steps;
        points.push(Math.cos(angle) * outer, Math.sin(angle) * outer);
      }
      points.push(Math.cos(start + sweep) * inner, Math.sin(start + sweep) * inner);

      const fill = reinforced ? 0x9eead9 : 0xb8cbd0;
      const edge = reinforced ? 0xb9f4de : 0x7f9ba3;
      const graphic = new PIXI.Graphics();
      graphic.beginFill(fill, 0.96);
      graphic.lineStyle(4, edge, 1);
      graphic.drawPolygon(points);
      graphic.endFill();

      const rib = new PIXI.Graphics();
      rib.lineStyle(3, 0xffffff, 0.28);
      rib.moveTo(Math.cos(start) * 26, Math.sin(start) * 26);
      rib.lineTo(Math.cos(start + sweep) * 46, Math.sin(start + sweep) * 46);

      const bolts = new PIXI.Graphics();
      [start, start + sweep].forEach((angle) => {
        bolts.beginFill(0x34434a, 0.95);
        bolts.drawCircle(Math.cos(angle) * 30, Math.sin(angle) * 30, 4);
        bolts.endFill();
      });
      bolts.beginFill(0x34434a, 0.95);
      bolts.drawCircle(0, 0, 4);
      bolts.endFill();

      plate.addChild(graphic, rib, bolts);
      this.bracketLayer.addChild(plate);
      return plate;
    }

    handleWrong() {
      const joint = this.pending;
      this.processingAnswer = true;
      this.streak = 0;
      this.perfectChain = 0;
      joint.wrongAttempts += 1;
      this.damage = clamp(this.damage + 14 + this.level * 3 + joint.wrongAttempts * 2, 0, 100);
      this.installWeakBracket(joint);
      this.wobbleCandidate(joint);
      this.shakeWorld();
      this.popText(joint.anchor.x, joint.anchor.y - 74, `${joint.answer} deg`, 0xff7080);
      this.speak("warning", "warning", `Inspection failed. Missing bracket was ${joint.answer} deg.`);
      this.updateStability();
      this.updateHud();
      if (this.stability <= 0) {
        window.setTimeout(() => this.endGame(), 700);
        return;
      }
      window.setTimeout(() => {
        if (!this.pending) return;
        this.processingAnswer = false;
        this.showInput();
      }, 900);
    }

    installWeakBracket(joint) {
      const sprite = new PIXI.Sprite(this.textures.weakBracket);
      sprite.anchor.set(0.5);
      sprite.position.set(joint.anchor.x, joint.anchor.y);
      sprite.width = 58;
      sprite.height = 58;
      sprite.tint = 0xff8090;
      sprite.alpha = 0.75;
      this.bracketLayer.addChild(sprite);
      gsap.to(sprite, {
        alpha: 0,
        rotation: rand(-0.45, 0.45),
        duration: 0.55,
        delay: 0.25,
        ease: "power2.out",
        onComplete: () => sprite.destroy(),
      });
    }

    wobbleCandidate(joint) {
      const body = joint.member.body;
      joint.member.pivot.stiffness = 0.42;
      joint.member.pivot.damping = 0.14;
      this.Matter.Body.setStatic(body, false);
      this.Matter.Body.applyForce(body, body.position, {
        x: joint.side * rand(0.006, 0.014),
        y: -rand(0.004, 0.01),
      });
      this.Matter.Body.setAngularVelocity(body, joint.side * rand(0.08, 0.16));
      window.setTimeout(() => {
        if (this.pending !== joint) return;
        joint.member.pivot.stiffness = 0.985;
        joint.member.pivot.damping = 0.56;
        this.Matter.Body.setVelocity(body, { x: 0, y: 0 });
        this.Matter.Body.setAngularVelocity(body, 0);
        this.Matter.Body.setPosition(body, { x: joint.member.cx, y: joint.member.cy });
        this.Matter.Body.setAngle(body, joint.member.angle);
      }, 760);
    }

    updateStability() {
      const candidates = this.Matter.Composite.allBodies(this.engine.world).filter((body) => body.label === "candidate-beam");
      const elapsed = this.pending ? (performance.now() - this.problemStartedAt) / 1000 : 0;
      const timePenalty = this.pending ? Math.max(0, elapsed - 2.2) * (0.65 + this.level * 0.14) : 0;
      const movingPenalty = candidates.reduce((total, body) => {
        const speed = Math.hypot(body.velocity.x, body.velocity.y);
        return total + Math.min(8, speed * 1.2 + Math.abs(body.angularVelocity) * 6);
      }, 0);
      const heightPenalty = candidates.some((body) => body.position.y > 650) ? 10 : 0;
      this.stability = clamp(100 - this.damage - Math.round(movingPenalty) - heightPenalty - Math.round(timePenalty), 0, 100);
    }

    onCollisionStart(event) {
      if (!this.started || !this.pending) return;
      event.pairs.forEach((pair) => {
        const bodies = [pair.bodyA, pair.bodyB].filter((body) => body.label === "candidate-beam");
        bodies.forEach((body) => {
          const previous = this.previousVelocity.get(body.id) || body.velocity;
          const impact = Math.hypot(previous.x - body.velocity.x, previous.y - body.velocity.y);
          if (impact > 2.8) {
            this.damage = clamp(this.damage + impact * 0.8, 0, 100);
            this.popText(body.position.x, body.position.y - 20, "impact", 0xffd057);
          }
        });
      });
    }

    tick() {
      if (!this.engine) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastTickAt) / 1000 || 0);
      this.lastTickAt = now;
      this.Matter.Engine.update(this.engine, 1000 / 60);
      this.applyTimePressure(dt);
      this.syncSprites();
      this.trackVelocity();
      if (this.started) {
        this.updateStability();
        if (this.pending && !this.processingAnswer) this.updateHud();
        if (this.stability <= 0) this.endGame();
      }
    }

    applyTimePressure(dt) {
      if (!this.started || !this.pending || this.processingAnswer) return;
      const elapsed = (performance.now() - this.problemStartedAt) / 1000;
      if (elapsed < 1.2) return;
      const body = this.pending.member.body;
      const pressure = Math.min(1, (elapsed - 1.2) / Math.max(4.6, 8.8 - this.level * 0.28));
      const direction = Math.sin(elapsed * (1.8 + this.level * 0.08)) >= 0 ? 1 : -1;
      const force = (0.000026 + this.level * 0.000007) * pressure * dt * 60;
      this.Matter.Body.applyForce(body, body.position, {
        x: direction * force,
        y: -force * 0.28,
      });
      this.pending.member.pivot.damping = clamp(0.56 - pressure * 0.12, 0.36, 0.56);
    }

    syncSprites() {
      this.dynamicSprites.forEach((sprite, id) => {
        const body = this.Matter.Composite.get(this.engine.world, Number(id), "body");
        if (!body) return;
        sprite.position.set(body.position.x, body.position.y);
        sprite.rotation = body.angle;
      });

      if (this.pending && this.activeMarker) {
        this.activeMarker.position.set(this.pending.anchor.x, this.pending.anchor.y);
      }
      this.placeInputBubble();
    }

    trackVelocity() {
      this.Matter.Composite.allBodies(this.engine.world).forEach((body) => {
        if (body.label === "candidate-beam") {
          this.previousVelocity.set(body.id, { x: body.velocity.x, y: body.velocity.y });
        }
      });
    }

    createBuilders() {
      const roster = [
        { x: 170, scale: 1.72, flip: 1, delay: 0 },
        { x: 238, scale: 1.72, flip: 1, delay: 0.12 },
        { x: 905, scale: 1.72, flip: -1, delay: 0.04 },
        { x: 975, scale: 1.72, flip: -1, delay: 0.18 },
        { x: 1040, scale: 1.72, flip: -1, delay: 0.24 },
      ];

      roster.forEach((item) => {
        const builder = new PIXI.Sprite(this.textures.miner);
        builder.anchor.set(0.5, 1);
        builder.position.set(item.x, 620);
        builder.scale.set(item.scale * item.flip, item.scale);
        builder.homeX = item.x;
        builder.homeY = 620;
        builder.baseScaleX = item.scale * item.flip;
        builder.baseScaleY = item.scale;
        builder.stateTween = gsap.to(builder, {
          y: 615,
          duration: 0.42,
          repeat: -1,
          yoyo: true,
          delay: item.delay,
          ease: "sine.inOut",
        });
        this.characterLayer.addChild(builder);
        this.builders.push(builder);
      });
    }

    resetBuilders() {
      this.builders.forEach((builder, index) => {
        gsap.killTweensOf(builder);
        builder.position.set(builder.homeX, builder.homeY);
        builder.rotation = 0;
        builder.scale.set(builder.baseScaleX, builder.baseScaleY);
        gsap.to(builder, {
          y: 615,
          duration: 0.42 + index * 0.03,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });
    }

    animateBuildersTo(x) {
      const offsets = [-150, -88, 86, 148, 210];
      this.builders.forEach((builder, index) => {
        const targetX = clamp(x + offsets[index], 135, 1045);
        const targetY = 618 - (index % 2) * 7;
        builder.scale.x = Math.sign(targetX - builder.x || builder.baseScaleX) * Math.abs(builder.baseScaleX);
        gsap.to(builder, {
          x: targetX,
          y: targetY,
          duration: 0.52 + index * 0.04,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(builder, {
              rotation: builder.baseScaleX > 0 ? -0.07 : 0.07,
              duration: 0.18,
              repeat: 3,
              yoyo: true,
              ease: "sine.inOut",
            });
          },
        });
      });
    }

    cheerBuilders() {
      this.builders.forEach((builder, index) => {
        gsap.fromTo(
          builder,
          { y: builder.y, rotation: 0 },
          {
            y: builder.y - 24,
            rotation: builder.baseScaleX > 0 ? 0.12 : -0.12,
            duration: 0.16,
            repeat: 3,
            yoyo: true,
            delay: index * 0.035,
            ease: "sine.out",
          }
        );
      });
    }

    popText(x, y, text, color) {
      const container = new PIXI.Container();
      container.position.set(x, y);
      const glow = new PIXI.Graphics();
      glow.beginFill(color, 0.18);
      glow.drawCircle(0, 4, 42);
      glow.endFill();
      const label = new PIXI.Text(text, {
        fontFamily: "Arial",
        fontSize: text.length > 9 ? 20 : 28,
        fontWeight: "800",
        fill: color,
        stroke: 0x101322,
        strokeThickness: 6,
      });
      label.anchor.set(0.5);
      container.addChild(glow, label);
      this.fxLayer.addChild(container);
      gsap.to(container, {
        y: y - 50,
        alpha: 0,
        duration: 0.85,
        ease: "power2.out",
        onComplete: () => container.destroy({ children: true }),
      });
      gsap.fromTo(glow.scale, { x: 0.4, y: 0.4 }, { x: 1.6, y: 1.6, duration: 0.45, ease: "power2.out" });
    }

    shakeWorld() {
      gsap.killTweensOf(this.world);
      gsap.fromTo(
        this.world,
        { x: this.stageOffset.x - 10 },
        {
          x: this.stageOffset.x + 10,
          duration: 0.055,
          repeat: 7,
          yoyo: true,
          ease: "sine.inOut",
          onComplete: () => this.world.position.set(this.stageOffset.x, this.stageOffset.y),
        }
      );
    }

    setForeman(mood, line) {
      this.foremanEl.dataset.aaForeman = mood;
      this.foremanLine.textContent = line;
      this.lastForemanLine = line;
    }

    speak(context, mood = "neutral", forcedLine = "") {
      const lines = FOREMAN_LINES[context] || FOREMAN_LINES.steady;
      let line = forcedLine || randomFrom(lines);
      if (!forcedLine && lines.length > 1) {
        let attempts = 0;
        while (line === this.lastForemanLine && attempts < 6) {
          line = randomFrom(lines);
          attempts += 1;
        }
      }
      this.setForeman(mood, line);
    }

    startForemanChatter() {
      this.stopForemanChatter();
      this.foremanTimer = window.setInterval(() => {
        if (!this.started) return;
        if (this.stability < 45) {
          this.speak("urgent", "warning");
          return;
        }
        if (this.perfectChain >= 2) {
          this.speak("streak", "happy");
          return;
        }
        if (this.pending) {
          const elapsed = (performance.now() - this.problemStartedAt) / 1000;
          this.speak(elapsed > Math.max(4.5, 8 - this.level * 0.35) ? "urgent" : "steady", "neutral");
          return;
        }
        this.speak("steady", "neutral");
      }, 4200);
    }

    stopForemanChatter() {
      if (this.foremanTimer) {
        window.clearInterval(this.foremanTimer);
        this.foremanTimer = null;
      }
    }

    updateHud() {
      this.scoreEl.textContent = String(Math.round(this.score));
      this.levelEl.textContent = String(this.level);
      this.stabilityEl.textContent = `${Math.round(this.stability)}%`;
      this.chainEl.textContent = String(this.perfectChain);
      if (this.promptEl) {
        this.promptEl.textContent = this.pending
          ? `${this.pending.targetTotal} - ${this.pending.knownAngle} = ?`
          : this.started
            ? "Waiting for next beam"
            : "Start the build";
      }
      this.stabilityBar.style.width = `${Math.round(this.stability)}%`;
      this.stabilityBar.dataset.state = this.stability < 35 ? "danger" : this.stability < 65 ? "warn" : "good";
    }

    endGame() {
      if (!this.started) return;
      this.started = false;
      this.stopForemanChatter();
      this.processingAnswer = false;
      this.hideInput();
      this.markerLayer.removeChildren();
      this.setForeman("warning", "The frame failed inspection. Start a new build.");
      this.gameOverTitle.textContent = "Structure failed";
      this.gameOverCopy.textContent = `Final score: ${Math.round(this.score)}. Highest level reached: ${this.level}.`;
      this.gameOverOverlay.hidden = false;
      this.gameOverOverlay.classList.add("is-visible");
      this.updateHud();
    }
  }

  document.querySelectorAll(SELECTOR).forEach((root) => new AngleArchitectGame(root));
})();
