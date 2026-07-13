const escapeXml = (value) => String(value).replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]);
const line = (x1, y1, x2, y2, extra = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra}/>`;
const text = (x, y, value, extra = "") => `<text x="${x}" y="${y}" ${extra}>${escapeXml(value)}</text>`;
const circlePoint = (x, y, label = "") => `<circle cx="${x}" cy="${y}" r="6" class="pf-point"/>${label ? text(x + 10, y - 10, label, 'class="pf-label"') : ""}`;

function wrap(question, body, viewBox = "0 0 640 360") {
  return `<svg viewBox="${viewBox}" role="img" aria-labelledby="diagram-title diagram-desc"><title id="diagram-title">${escapeXml(question.archetypeName)} diagram</title><desc id="diagram-desc">${escapeXml(question.diagramAlt)}</desc><g class="pf-svg-art">${body}</g></svg>`;
}

function spinner(cx, cy, radius, values, favourable = 0) {
  const count = values?.length || 0;
  let paths = "";
  for (let index = 0; index < count; index += 1) {
    const start = -Math.PI / 2 + index * Math.PI * 2 / count;
    const end = -Math.PI / 2 + (index + 1) * Math.PI * 2 / count;
    const x1 = cx + radius * Math.cos(start); const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end); const y2 = cy + radius * Math.sin(end);
    const mid = (start + end) / 2;
    const label = values[index];
    paths += `<path d="M${cx} ${cy}L${x1} ${y1}A${radius} ${radius} 0 0 1 ${x2} ${y2}Z" class="${index < favourable ? "pf-accent-fill" : index % 2 ? "pf-soft-fill" : "pf-white-fill"}"/>`;
    if (label !== "") paths += text(cx + radius * .66 * Math.cos(mid), cy + radius * .66 * Math.sin(mid) + 5, label, 'class="pf-centre-text"');
  }
  return `${paths}<circle cx="${cx}" cy="${cy}" r="8" class="pf-accent-fill"/><path d="M${cx} ${cy - radius - 18}l-10-16h20z" class="pf-ink-fill"/>`;
}

function renderGrid(question) {
  const { width, height, missing } = question.diagramData; const size = Math.min(44, 240 / height, 360 / width); const ox = (640 - width * size) / 2; const oy = (360 - height * size) / 2; let body = "";
  for (let row = 0; row < height; row += 1) for (let column = 0; column < width; column += 1) {
    const index = row * width + column; const unshaded = index >= width * height - missing;
    body += `<rect x="${ox + column * size}" y="${oy + row * size}" width="${size}" height="${size}" class="${unshaded ? "pf-white-fill" : "pf-accent-fill"}"/>`;
  }
  return wrap(question, body);
}

function renderPolygon(question) {
  const { width, height } = question.diagramData;
  return wrap(question, `<path d="M150 280V90H300V145H390V90H490V280H360V230H270V280Z" class="pf-soft-fill pf-heavy"/>${text(320, 326, `${width} units`, 'class="pf-label" text-anchor="middle"')}${text(112, 190, `${height} units`, 'class="pf-label" text-anchor="middle" transform="rotate(-90 112 190)"')}<path d="M150 310H490M135 280V90" class="pf-measure"/>`);
}

function renderNumberLine(question) {
  const { start, end, left, right, answer } = question.diagramData; const scale = (value) => 80 + (value - start) / (end - start) * 480; let ticks = "";
  for (let value = start; value <= end; value += 1) ticks += `${line(scale(value), 185, scale(value), value === start || value === end ? 218 : 202, 'class="pf-line"')}${value === start || value === end ? text(scale(value), 244, value, 'class="pf-label" text-anchor="middle"') : ""}`;
  return wrap(question, `${line(70, 185, 570, 185, 'class="pf-heavy"')}${ticks}${circlePoint(scale(left), 185, left)}${circlePoint(scale(right), 185, right)}${circlePoint(scale(answer), 185, "M")}`);
}

function renderGauge(question) {
  const { max, position } = question.diagramData; let ticks = "";
  for (let index = 0; index <= 10; index += 1) { const x = 90 + index * 46; ticks += `${line(x, 170, x, index % 5 === 0 ? 215 : 198, 'class="pf-line"')}${index % 5 === 0 ? text(x, 244, index * max / 10, 'class="pf-label" text-anchor="middle"') : ""}`; }
  const pointerX = 90 + position * 46;
  return wrap(question, `<rect x="70" y="130" width="500" height="130" rx="28" class="pf-soft-fill"/>${line(90, 170, 550, 170, 'class="pf-heavy"')}${ticks}<path d="M${pointerX} 94l-15 28h30z" class="pf-accent-fill"/>${line(pointerX, 116, pointerX, 164, 'class="pf-accent-line pf-heavy"')}`);
}

function coordinateGrid() {
  let grid = ""; for (let index = -5; index <= 5; index += 1) { const p = 320 + index * 27; grid += `${line(p, 45, p, 315, 'class="pf-grid-line"')}${line(185, 180 + index * 27, 455, 180 + index * 27, 'class="pf-grid-line"')}`; }
  return `${grid}${line(185, 180, 455, 180, 'class="pf-heavy"')}${line(320, 45, 320, 315, 'class="pf-heavy"')}${text(462, 185, "x", 'class="pf-label"')}${text(326, 42, "y", 'class="pf-label"')}`;
}

function renderCoordinate(question) {
  const { x, y, axis } = question.diagramData; const px = 320 + x * 27; const py = 180 - y * 27;
  return wrap(question, `${coordinateGrid()}${circlePoint(px, py, "P")}<path d="${axis === "x-axis" ? "M185 180H455" : "M320 45V315"}" class="pf-accent-line pf-heavy"/>`);
}

function renderTiles(question) {
  let body = ""; [1, 2, 3].forEach((stage, group) => { const ox = 95 + group * 190; const count = 3 * stage + 1; for (let index = 0; index < count; index += 1) { const column = index % (stage + 1); const row = Math.floor(index / (stage + 1)); body += `<rect x="${ox + column * 30}" y="${120 + row * 30}" width="26" height="26" rx="4" class="${index % 2 ? "pf-soft-fill" : "pf-accent-fill"}"/>`; } body += text(ox + 45, 275, `Stage ${stage}`, 'class="pf-label" text-anchor="middle"'); });
  return wrap(question, body);
}

function renderAngle(question) {
  const { a, b } = question.diagramData; const rays = [[320, 45], [510, 160], [390, 315], [170, 265], [320, 45]];
  return wrap(question, `${rays.map((point) => line(320, 180, point[0], point[1], 'class="pf-heavy"')).join("")}${circlePoint(320, 180)}${text(356, 102, `${a}°`, 'class="pf-label"')}${text(410, 230, `${b}°`, 'class="pf-label"')}${text(238, 250, "90°", 'class="pf-label"')}${text(232, 122, "x", 'class="pf-accent-text"')}`);
}

function renderDualSpinner(question) {
  const { a, b } = question.diagramData;
  return wrap(question, `${spinner(205, 185, 105, a)}${spinner(435, 185, 105, b)}${text(205, 330, "Ava", 'class="pf-label" text-anchor="middle"')}${text(435, 330, "Ben", 'class="pf-label" text-anchor="middle"')}`);
}

function renderTank(question) {
  const { length, width, volume } = question.diagramData;
  return wrap(question, `<path d="M145 75V285H495V75M145 185H495" class="pf-heavy pf-no-fill"/><path d="M147 187H493V283H147Z" class="pf-water"/><rect x="275" y="145" width="90" height="110" rx="8" class="pf-accent-fill"/>${text(320, 140, `${volume} cm³`, 'class="pf-label" text-anchor="middle"')}${text(320, 325, `${length} cm`, 'class="pf-label" text-anchor="middle"')}${text(515, 240, `${width} cm`, 'class="pf-label"')}`);
}

function renderCoordinateTriangle(question) {
  const { base, height } = question.diagramData; const basePx = base * 28; const heightPx = height * 24; const left = 320 - basePx / 2; const bottom = 285;
  return wrap(question, `${coordinateGrid()}<polygon points="${left},${bottom} ${left + basePx},${bottom} ${left + basePx * .65},${bottom - heightPx}" class="pf-accent-soft pf-heavy"/>${text(320, 325, `base ${base}`, 'class="pf-label" text-anchor="middle"')}${text(left + basePx * .7, bottom - heightPx / 2, `height ${height}`, 'class="pf-label"')}`);
}

function renderResource(question) {
  const { perA, perB, availableA, availableB } = question.diagramData;
  return wrap(question, `<rect x="100" y="65" width="440" height="230" rx="24" class="pf-white-fill pf-heavy"/>${line(100, 130, 540, 130, 'class="pf-line"')}${line(320, 65, 320, 295, 'class="pf-line"')}${text(210, 105, "Available", 'class="pf-heading" text-anchor="middle"')}${text(430, 105, "Per kit", 'class="pf-heading" text-anchor="middle"')}${text(130, 180, "Resource A", 'class="pf-label"')}${text(245, 180, availableA, 'class="pf-value"')}${text(440, 180, perA, 'class="pf-value"')}${text(130, 250, "Resource B", 'class="pf-label"')}${text(245, 250, availableB, 'class="pf-value"')}${text(440, 250, perB, 'class="pf-value"')}`);
}

function renderGroups(question) {
  const { small, finalLarge, moved } = question.diagramData;
  return wrap(question, `<rect x="100" y="120" width="150" height="150" rx="24" class="pf-soft-fill pf-heavy"/><rect x="390" y="120" width="150" height="150" rx="24" class="pf-soft-fill pf-heavy"/>${text(175, 200, "?", 'class="pf-big-text" text-anchor="middle"')}${text(465, 200, finalLarge, 'class="pf-big-text" text-anchor="middle"')}<path d="M400 85H250l25-18m-25 18 25 18" class="pf-accent-line pf-heavy pf-no-fill"/>${text(325, 60, `${moved} moved`, 'class="pf-label" text-anchor="middle"')}${text(175, 300, `${small} before`, 'class="pf-label" text-anchor="middle"')}`);
}

function renderCalendar(question) {
  const days = ["M", "T", "W", "T", "F", "S", "S"]; const { startIndex } = question.diagramData; let body = `<rect x="70" y="80" width="500" height="200" rx="22" class="pf-white-fill pf-heavy"/>`;
  days.forEach((day, index) => { const x = 91 + index * 70; body += `<rect x="${x}" y="135" width="56" height="70" rx="12" class="${index === startIndex ? "pf-accent-fill" : "pf-soft-fill"}"/>${text(x + 28, 178, day, 'class="pf-centre-text"')}`; });
  return wrap(question, `${body}${text(320, 115, "Project start", 'class="pf-heading" text-anchor="middle"')}`);
}

function renderPath(question) {
  const { speedA, speedB, distance } = question.diagramData;
  return wrap(question, `${line(90, 210, 550, 210, 'class="pf-heavy"')}<circle cx="90" cy="210" r="34" class="pf-accent-fill"/><circle cx="550" cy="210" r="34" class="pf-soft-fill"/>${text(90, 270, `${speedA} km/h →`, 'class="pf-label" text-anchor="middle"')}${text(550, 270, `← ${speedB} km/h`, 'class="pf-label" text-anchor="middle"')}${text(320, 170, `${distance} km`, 'class="pf-heading" text-anchor="middle"')}`);
}

function renderScatter(question) {
  const { values } = question.diagramData; const min = Math.min(...values) - 1; const max = Math.max(...values) + 1; const scale = (value) => 90 + (value - min) / (max - min) * 460; let body = line(70, 260, 570, 260, 'class="pf-heavy"'); const counts = {};
  for (let value = min; value <= max; value += 1) body += `${line(scale(value), 250, scale(value), 272, 'class="pf-line"')}${text(scale(value), 300, value, 'class="pf-label" text-anchor="middle"')}`;
  values.forEach((value) => { counts[value] = (counts[value] || 0) + 1; body += `<circle cx="${scale(value)}" cy="${235 - counts[value] * 36}" r="12" class="pf-accent-fill"/>`; });
  return wrap(question, body);
}

function renderDigits(question) {
  const digits = question.diagramData.digits || [];
  return wrap(question, digits.map((digit, index) => `<rect x="${120 + index * 105}" y="115" width="82" height="118" rx="16" class="${index % 2 ? "pf-soft-fill" : "pf-accent-fill"}"/>${text(161 + index * 105, 188, digit, 'class="pf-big-text" text-anchor="middle"')}`).join(""));
}

function renderSectors(question) {
  const { sectors } = question.diagramData;
  return wrap(question, sectors.map((sector, index) => { const cx = 130 + index * 190; const r = sector.radius * 22; const angle = sector.angle * Math.PI / 180; const x = cx + r * Math.cos(-Math.PI / 2 + angle); const y = 205 + r * Math.sin(-Math.PI / 2 + angle); return `<path d="M${cx} 205L${cx} ${205 - r}A${r} ${r} 0 ${sector.angle > 180 ? 1 : 0} 1 ${x} ${y}Z" class="${index === 1 ? "pf-accent-soft" : "pf-soft-fill"} pf-heavy"/>${text(cx, 310, `${sector.label}: r=${sector.radius}, ${sector.angle}°`, 'class="pf-label" text-anchor="middle"')}`; }).join(""));
}

function renderDigitPuzzle(question) {
  const { tens, multiplier, product } = question.diagramData;
  return wrap(question, `${text(360, 115, `${tens}□`, 'class="pf-maths-text" text-anchor="end"')}${text(265, 178, "×", 'class="pf-maths-text"')}${text(360, 178, multiplier, 'class="pf-maths-text" text-anchor="end"')}${line(245, 198, 385, 198, 'class="pf-heavy"')}${text(360, 260, product, 'class="pf-maths-text" text-anchor="end"')}`);
}

function renderLayered(question) {
  let body = ""; [1, 2, 3].forEach((stage, group) => { const cx = 140 + group * 180; const cy = 180; body += `<circle cx="${cx}" cy="${cy}" r="12" class="pf-accent-fill"/>`; for (let ring = 1; ring < stage; ring += 1) for (let index = 0; index < 6 * ring; index += 1) { const angle = index / (6 * ring) * Math.PI * 2; body += `<circle cx="${cx + Math.cos(angle) * ring * 30}" cy="${cy + Math.sin(angle) * ring * 30}" r="11" class="pf-soft-fill"/>`; } body += text(cx, 300, `Stage ${stage}`, 'class="pf-label" text-anchor="middle"'); }); return wrap(question, body);
}

function renderBalance(question) {
  const { sum, difference } = question.diagramData;
  return wrap(question, `<rect x="95" y="95" width="450" height="70" rx="18" class="pf-soft-fill"/>${text(320, 140, `x + y = ${sum}`, 'class="pf-maths-text" text-anchor="middle"')}<rect x="95" y="205" width="450" height="70" rx="18" class="pf-accent-soft"/>${text(320, 250, `x − y = ${difference}`, 'class="pf-maths-text" text-anchor="middle"')}`);
}

function renderPartition(question) {
  const { ratioA, ratioB, totalArea } = question.diagramData;
  return wrap(question, `<polygon points="100,290 540,290 360,55" class="pf-soft-fill pf-heavy"/>${line(360, 55, 280, 290, 'class="pf-accent-line pf-heavy"')}${text(190, 320, ratioA, 'class="pf-label" text-anchor="middle"')}${text(410, 320, ratioB, 'class="pf-label" text-anchor="middle"')}${text(365, 170, `Total area ${totalArea}`, 'class="pf-heading"')}`);
}

function renderTimer(question) {
  const { delays, cycles } = question.diagramData; let body = "";
  delays.forEach((delay, index) => { const x = 70 + index * 145; body += `<circle cx="${x + 55}" cy="175" r="48" class="${index % 2 ? "pf-soft-fill" : "pf-accent-soft"} pf-heavy"/>${text(x + 55, 182, `${delay}s`, 'class="pf-value" text-anchor="middle"')}${index < delays.length - 1 ? `<path d="M${x + 108} 175h32l-12-10m12 10-12 10" class="pf-line pf-no-fill"/>` : ""}`; }); return wrap(question, `${body}${text(320, 285, `Chain repeats ${cycles} times`, 'class="pf-heading" text-anchor="middle"')}`);
}

function renderRoute(question) {
  const { width, height, blockX, blockY } = question.diagramData; const size = Math.min(52, 240 / height, 400 / width); const ox = (640 - width * size) / 2; const oy = (360 - height * size) / 2; let body = "";
  for (let x = 0; x <= width; x += 1) body += line(ox + x * size, oy, ox + x * size, oy + height * size, 'class="pf-grid-line pf-route-line"');
  for (let y = 0; y <= height; y += 1) body += line(ox, oy + y * size, ox + width * size, oy + y * size, 'class="pf-grid-line pf-route-line"');
  body += `${text(ox - 26, oy + height * size + 8, "S", 'class="pf-heading"')}${text(ox + width * size + 16, oy + 8, "F", 'class="pf-heading"')}<path d="M${ox + blockX * size - 12} ${oy + (height - blockY) * size - 12}l24 24m0-24-24 24" class="pf-accent-line pf-heavy"/>`;
  return wrap(question, body);
}

export function renderDiagram(question) {
  const renderers = {
    grid: renderGrid, polygon: renderPolygon, numberline: renderNumberLine,
    spinner: (item) => wrap(item, spinner(320, 185, 125, Array(item.diagramData.sectors).fill(""), item.diagramData.favourable)),
    gauge: renderGauge, coordinate: renderCoordinate, tiles: renderTiles, angle: renderAngle,
    dualspinner: renderDualSpinner, tank: renderTank, "coordinate-triangle": renderCoordinateTriangle,
    resource: renderResource, groups: renderGroups, calendar: renderCalendar, path: renderPath,
    scatter: renderScatter, digits: renderDigits, sectors: renderSectors, "digit-puzzle": renderDigitPuzzle,
    layered: renderLayered, balance: renderBalance, partition: renderPartition, timer: renderTimer, route: renderRoute,
  };
  return (renderers[question.diagramType] || renderResource)(question);
}
