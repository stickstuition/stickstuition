export const LEVELS = ["junior", "intermediate", "senior"];
export const TOPICS = ["Mixed", "Number", "Algebra", "Geometry", "Measurement", "Probability", "Statistics", "Logic"];

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed) {
  let state = hashSeed(seed) || 1;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const integer = (random, min, max) => Math.floor(random() * (max - min + 1)) + min;
const pick = (random, values) => values[integer(random, 0, values.length - 1)];
const shuffle = (random, values) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = integer(random, 0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const fraction = (numerator, denominator) => {
  const factor = gcd(numerator, denominator);
  return `${numerator / factor}/${denominator / factor}`;
};
const choose = (n, r) => {
  let result = 1;
  for (let index = 1; index <= r; index += 1) result = (result * (n - r + index)) / index;
  return Math.round(result);
};

function numericOptions(random, answer, offsets = [-2, -1, 1, 2, 3]) {
  const values = [answer];
  for (const offset of offsets) {
    const candidate = answer + offset;
    if (candidate >= 0 && !values.includes(candidate)) values.push(candidate);
  }
  let step = Math.max(1, Math.round(Math.abs(answer) * 0.1));
  while (values.length < 5) {
    const candidate = answer + step * values.length;
    if (!values.includes(candidate)) values.push(candidate);
    step += 1;
  }
  return shuffle(random, values.slice(0, 5).map(String));
}

function textOptions(random, answer, distractors) {
  const values = [...new Set([answer, ...distractors])];
  for (const fallback of ["0", "1", "Cannot be determined", "None of these", "All of these"]) {
    if (values.length >= 5) break;
    if (!values.includes(fallback)) values.push(fallback);
  }
  return shuffle(random, values.slice(0, 5));
}

function makeQuestion(spec, level, seed, random) {
  const answerType = spec.answerType ?? "multipleChoice";
  const optionValues = answerType === "multipleChoice" ? spec.options : undefined;
  return {
    id: `${spec.id}-${seed}`,
    seed,
    level,
    topic: spec.topic,
    archetype: spec.id,
    archetypeName: spec.name,
    context: spec.context ?? "visual challenge",
    prompt: spec.prompt,
    answerType,
    correctAnswer: String(spec.answer),
    options: optionValues?.map((value, index) => ({ id: `option-${index}`, value: String(value) })),
    hint: spec.hint,
    solutionSteps: spec.solution.map((step) => typeof step === "string" ? { explanation: step } : step),
    diagramType: spec.diagramType,
    diagramData: spec.diagramData,
    diagramAlt: spec.diagramAlt,
    metadata: {
      generatedAt: new Date(0).toISOString(),
      reasoningSteps: spec.reasoningSteps,
      requiresDiagram: true,
    },
  };
}

function archetype(id, name, supportedLevels, topic, generator) {
  return {
    id, name, supportedLevels, topic,
    generate(level, seed) {
      const random = seededRandom(`${id}:${level}:${seed}`);
      return makeQuestion({ id, name, topic, ...generator(random, level) }, level, seed, random);
    },
    validate: validateQuestion,
  };
}

const junior = ["junior"];
const intermediate = ["intermediate"];
const senior = ["senior"];

export const ARCHETYPES = [
  archetype("grid-area", "Grid area", junior, "Geometry", (random) => {
    const width = integer(random, 4, 7); const height = integer(random, 3, 6); const missing = integer(random, 2, Math.min(6, width * height - 3)); const answer = width * height - missing;
    return { answer, options: numericOptions(random, answer), prompt: "The shaded shape is made from unit squares. What is its area?", hint: "Count a full rectangle, then remove the unshaded squares.", solution: [`The full rectangle contains ${width} × ${height} = ${width * height} squares.`, `Remove the ${missing} unshaded squares: ${width * height} − ${missing} = ${answer}.`], diagramType: "grid", diagramData: { width, height, missing }, diagramAlt: `${width} by ${height} square grid with ${missing} squares unshaded.`, reasoningSteps: 2 };
  }),
  archetype("perimeter-path", "Perimeter path", junior, "Measurement", (random) => {
    const width = integer(random, 5, 10); const height = integer(random, 3, 8); const answer = 2 * (width + height);
    return { answer, options: numericOptions(random, answer, [-4, -2, 2, 4, 6]), prompt: "The stepped path has the same outside perimeter as the labelled rectangle. What is its perimeter?", hint: "Slide the short stepped edges outward; their total lengths do not change.", solution: [`The horizontal edges total ${width} + ${width} = ${2 * width}.`, `The vertical edges total ${height} + ${height} = ${2 * height}.`, `Perimeter = ${2 * width} + ${2 * height} = ${answer}.`], diagramType: "polygon", diagramData: { width, height }, diagramAlt: `Stepped polygon spanning ${width} units by ${height} units.`, reasoningSteps: 2 };
  }),
  archetype("number-line-position", "Number line position", junior, "Number", (random) => {
    const start = integer(random, 0, 5); const end = start + integer(random, 8, 14); const left = start + 2; const right = end - 2; const answer = (left + right) / 2;
    return { answer, options: numericOptions(random, answer), prompt: `Point M is halfway between ${left} and ${right}. Which value is at M?`, hint: "The midpoint is the average of the two endpoint values.", solution: [`Add the endpoint values: ${left} + ${right} = ${left + right}.`, `Divide by 2: ${left + right} ÷ 2 = ${answer}.`], diagramType: "numberline", diagramData: { start, end, left, right, answer }, diagramAlt: `Number line from ${start} to ${end}, with points at ${left}, ${right}, and midpoint M.`, reasoningSteps: 2 };
  }),
  archetype("spinner-probability", "Spinner probability", junior, "Probability", (random) => {
    const sectors = pick(random, [6, 8, 10]); const favourable = integer(random, 2, sectors - 2); const answer = fraction(favourable, sectors);
    const distractors = [fraction(sectors - favourable, sectors), fraction(1, sectors), `${favourable}/${sectors - favourable}`, fraction(favourable + 1, sectors)];
    return { answer, options: textOptions(random, answer, distractors), prompt: "The spinner has equal sectors. What is the probability of landing on a red sector?", hint: "Count red sectors, then count all sectors.", solution: [`There are ${favourable} red sectors out of ${sectors} equal sectors.`, `The probability is ${favourable}/${sectors} = ${answer}.`], diagramType: "spinner", diagramData: { sectors, favourable }, diagramAlt: `Spinner with ${sectors} equal sectors, ${favourable} coloured red.`, reasoningSteps: 1 };
  }),
  archetype("visual-estimation-dial", "Visual estimation dial", junior, "Measurement", (random) => {
    const max = pick(random, [50, 100, 200]); const tick = max / 10; const position = integer(random, 2, 9); const answer = position * tick;
    return { answer, options: numericOptions(random, answer, [-tick * 2, -tick, tick, tick * 2, tick * 3]), prompt: "What value is shown by the pointer on the scale?", hint: `Work out the value of each gap between 0 and ${max}.`, solution: [`The scale from 0 to ${max} is split into 10 equal gaps.`, `Each gap is ${max} ÷ 10 = ${tick}.`, `The pointer is at gap ${position}, so it shows ${answer}.`], diagramType: "gauge", diagramData: { max, position }, diagramAlt: `Scale from 0 to ${max} with pointer at the ${position}th of 10 intervals.`, reasoningSteps: 2 };
  }),
  archetype("coordinate-reflection", "Coordinate reflection", junior, "Geometry", (random) => {
    const x = integer(random, 1, 5) * pick(random, [-1, 1]); const y = integer(random, 1, 5); const axis = pick(random, ["x-axis", "y-axis"]); const reflected = axis === "x-axis" ? [x, -y] : [-x, y]; const answer = `(${reflected[0]}, ${reflected[1]})`;
    return { answer, options: textOptions(random, answer, [`(${-x}, ${-y})`, `(${y}, ${x})`, `(${x}, ${y})`, `(${-y}, ${x})`]), prompt: `Point P is reflected in the ${axis}. What are the coordinates of P′?`, hint: `A reflection in the ${axis} changes only one coordinate sign.`, solution: [`P is at (${x}, ${y}).`, `Reflecting in the ${axis} gives ${answer}.`], diagramType: "coordinate", diagramData: { x, y, axis }, diagramAlt: `Coordinate plane showing P at ${x}, ${y} and the ${axis}.`, reasoningSteps: 1 };
  }),
  archetype("tile-pattern", "Tile pattern", junior, "Algebra", (random) => {
    const stage = integer(random, 4, 8); const answer = 3 * stage + 1;
    return { answer, answerType: "integer", prompt: `The diagram shows the first three stages of a tile pattern. The pattern continues in the same way. How many tiles are in stage ${stage}?`, hint: "Look at how many tiles are added from one stage to the next.", solution: ["The stages contain 4, 7, 10, … tiles, so 3 tiles are added each time.", `Stage ${stage} has 3 × ${stage} + 1 = ${answer} tiles.`], diagramType: "tiles", diagramData: { stage, rule: 3 }, diagramAlt: "First three stages of a pattern containing 4, 7, and 10 tiles.", reasoningSteps: 2 };
  }),
  archetype("missing-angle", "Missing angle", junior, "Geometry", (random) => {
    const a = integer(random, 45, 100); const b = integer(random, 60, 130); const answer = 360 - a - b - 90;
    return { answer, options: numericOptions(random, answer, [-20, -10, 10, 20, 30]), prompt: "Four angles meet at a point. What is the missing angle x?", hint: "Angles around a point add to 360°.", solution: [`The known angles total ${a}° + ${b}° + 90° = ${a + b + 90}°.`, `x = 360° − ${a + b + 90}° = ${answer}°.`], diagramType: "angle", diagramData: { a, b, answer }, diagramAlt: `Four angles around a point labelled ${a} degrees, ${b} degrees, 90 degrees, and x.`, reasoningSteps: 2 };
  }),
  archetype("competing-spinners", "Competing spinners", intermediate, "Probability", (random) => {
    const a = shuffle(random, [1, 2, 3, 4]); const b = shuffle(random, [2, 3, 4, 5]); let wins = 0; for (const x of a) for (const y of b) if (x > y) wins += 1; const answer = fraction(wins, 16);
    return { answer, options: textOptions(random, answer, [fraction(16 - wins, 16), fraction(wins + 1, 16), fraction(Math.max(1, wins - 1), 16), "1/2"]), prompt: "Ava and Ben each spin once. What is the probability that Ava’s number is greater than Ben’s?", hint: "Make a 4 by 4 table of all equally likely pairs.", solution: ["There are 4 × 4 = 16 equally likely pairs.", `${wins} pairs have Ava’s number greater than Ben’s.`, `The probability is ${wins}/16 = ${answer}.`], diagramType: "dualspinner", diagramData: { a, b }, diagramAlt: `Two four-sector spinners labelled ${a.join(", ")} and ${b.join(", ")}.`, reasoningSteps: 3 };
  }),
  archetype("tank-displacement", "Tank displacement", intermediate, "Measurement", (random) => {
    const length = pick(random, [20, 25, 40]); const width = pick(random, [10, 20]); const rise = integer(random, 2, 6); const volume = length * width * rise; const answer = rise;
    return { answer, answerType: "integer", prompt: `A solid with volume ${volume} cm³ is fully lowered into the tank shown. By how many centimetres does the water level rise?`, hint: "Divide the displaced volume by the area of the tank’s base.", solution: [`Tank base area = ${length} × ${width} = ${length * width} cm².`, `Rise = ${volume} ÷ ${length * width} = ${answer} cm.`], diagramType: "tank", diagramData: { length, width, volume }, diagramAlt: `Rectangular tank with base ${length} cm by ${width} cm and a submerged solid of volume ${volume} cubic centimetres.`, reasoningSteps: 2 };
  }),
  archetype("coordinate-triangle", "Coordinate triangle", intermediate, "Geometry", (random) => {
    const base = integer(random, 4, 10); const height = integer(random, 3, 8); const answer = (base * height) / 2;
    return { answer, options: numericOptions(random, answer, [-base, -2, 2, base, base * height - answer]), prompt: "Using the coordinates shown, what is the area of triangle ABC?", hint: "Use the horizontal side as the base and read the perpendicular height from the grid.", solution: [`Base AB = ${base} units and perpendicular height = ${height} units.`, `Area = ½ × ${base} × ${height} = ${answer} square units.`], diagramType: "coordinate-triangle", diagramData: { base, height }, diagramAlt: `Coordinate triangle with horizontal base ${base} and height ${height}.`, reasoningSteps: 2 };
  }),
  archetype("resource-limitation", "Resource limitation", intermediate, "Logic", (random) => {
    const perA = integer(random, 2, 5); const perB = integer(random, 3, 6); const batches = integer(random, 4, 8); const availableA = perA * batches + integer(random, 0, perA - 1); const availableB = perB * (batches + 1); const answer = batches;
    return { answer, options: numericOptions(random, answer), prompt: "Each robot kit needs the resources shown. What is the greatest number of complete kits that can be made?", hint: "Work out how many kits each resource could make; the smaller result is the limit.", solution: [`Resource A makes ⌊${availableA} ÷ ${perA}⌋ = ${batches} kits.`, `Resource B makes ⌊${availableB} ÷ ${perB}⌋ = ${batches + 1} kits.`, `Resource A runs out first, so ${answer} complete kits can be made.`], diagramType: "resource", diagramData: { perA, perB, availableA, availableB }, diagramAlt: `Table showing ${availableA} of resource A and ${availableB} of resource B, with ${perA} and ${perB} needed per kit.`, reasoningSteps: 3 };
  }),
  archetype("group-transfer", "Group transfer", intermediate, "Algebra", (random) => {
    const small = integer(random, 20, 50); const large = small + integer(random, 10, 30); const moved = integer(random, 5, 12); const finalLarge = large - moved; const answer = large;
    return { answer, options: numericOptions(random, answer, [-moved, -5, 5, moved, moved * 2]), prompt: `${moved} tokens are moved from the larger box to the smaller box. The larger box then contains ${finalLarge} tokens. How many tokens were originally in the larger box?`, hint: "Undo the transfer by adding the moved tokens back.", solution: [`The larger box lost ${moved} tokens.`, `Original amount = ${finalLarge} + ${moved} = ${answer}.`], diagramType: "groups", diagramData: { small, finalLarge, moved }, diagramAlt: `Two boxes with an arrow showing ${moved} tokens moving from the larger to the smaller.`, reasoningSteps: 2 };
  }),
  archetype("calendar-reasoning", "Calendar reasoning", intermediate, "Logic", (random) => {
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; const startIndex = integer(random, 0, 6); const days = integer(random, 8, 25); const answer = weekdays[(startIndex + days) % 7];
    return { answer, options: textOptions(random, answer, weekdays.filter((day) => day !== answer).slice(0, 4)), prompt: `A science project begins on ${weekdays[startIndex]}. Its final check is ${days} days later. On which day is the final check?`, hint: "Whole groups of 7 days return to the same weekday.", solution: [`${days} = ${Math.floor(days / 7)} whole weeks + ${days % 7} days.`, `Move ${days % 7} days forward from ${weekdays[startIndex]} to reach ${answer}.`], diagramType: "calendar", diagramData: { startIndex, days }, diagramAlt: `One-week calendar beginning with ${weekdays[startIndex]} highlighted and an arrow ${days} days forward.`, reasoningSteps: 2 };
  }),
  archetype("travel-meeting", "Travel and meeting points", intermediate, "Measurement", (random) => {
    const speedA = integer(random, 3, 7); const speedB = integer(random, 2, 6); const time = integer(random, 3, 8); const distance = (speedA + speedB) * time; const answer = time;
    return { answer, options: numericOptions(random, answer), prompt: `Two hikers start ${distance} km apart and walk towards each other at ${speedA} km/h and ${speedB} km/h. After how many hours do they meet?`, hint: "When moving towards each other, add their speeds.", solution: [`Closing speed = ${speedA} + ${speedB} = ${speedA + speedB} km/h.`, `Time = ${distance} ÷ ${speedA + speedB} = ${answer} hours.`], diagramType: "path", diagramData: { speedA, speedB, distance }, diagramAlt: `Straight path of ${distance} kilometres with hikers at each end moving toward each other at ${speedA} and ${speedB} kilometres per hour.`, reasoningSteps: 2 };
  }),
  archetype("median-diagram", "Median diagram", intermediate, "Statistics", (random) => {
    const values = [2, 4, 5, 7, 9].map((value) => value + integer(random, 0, 2)); values.sort((a, b) => a - b); const added = values[4] + 2; const all = [...values, added].sort((a, b) => a - b); const answer = (all[2] + all[3]) / 2;
    return { answer, options: numericOptions(random, answer), prompt: `The dot plot shows five scores. A score of ${added} is added. What is the new median?`, hint: "With six values, average the third and fourth values in order.", solution: [`In order, the six values are ${all.join(", ")}.`, `The middle values are ${all[2]} and ${all[3]}.`, `Median = (${all[2]} + ${all[3]}) ÷ 2 = ${answer}.`], diagramType: "scatter", diagramData: { values, added }, diagramAlt: `Dot plot of scores ${values.join(", ")}.`, reasoningSteps: 3 };
  }),
  archetype("digit-arrangement", "Digit arrangement", intermediate, "Number", (random) => {
    const digits = shuffle(random, [1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 4); const answer = 24;
    return { answer, options: numericOptions(random, answer, [-18, -12, -6, 6, 12]), prompt: `How many different four-digit numbers can be made using ${digits.join(", ")} exactly once each?`, hint: "Choose a digit for each position, reducing the choices each time.", solution: ["There are 4 choices for the first digit, then 3, then 2, then 1.", `4 × 3 × 2 × 1 = ${answer}.`], diagramType: "digits", diagramData: { digits }, diagramAlt: `Four digit cards labelled ${digits.join(", ")}.`, reasoningSteps: 2 };
  }),
  archetype("circle-sector", "Circle sector comparison", intermediate, "Geometry", (random) => {
    const sectors = [{ label: "A", radius: 2, angle: 180 }, { label: "B", radius: 3, angle: 90 }, { label: "C", radius: 4, angle: 60 }]; const scores = sectors.map((sector) => sector.radius ** 2 * sector.angle); const answer = String(Math.max(...scores));
    return { answer, options: numericOptions(random, Number(answer), [-180, -90, 90, 180, 360]), prompt: "Sector area is proportional to angle × radius². Which value of angle × radius² is greatest for the three sectors shown?", hint: "Compare angle × radius²; the common constant is not needed.", solution: sectors.map((sector) => `${sector.label}: ${sector.angle} × ${sector.radius}² = ${sector.angle * sector.radius ** 2}.`).concat(`The greatest comparison value is ${answer}.`), diagramType: "sectors", diagramData: { sectors }, diagramAlt: "Three sectors labelled with radius and central angle.", reasoningSteps: 3 };
  }),
  archetype("digit-multiplication", "Digit multiplication puzzle", senior, "Algebra", (random) => {
    const digit = integer(random, 2, 8); const multiplier = integer(random, 3, 7); const tens = integer(random, 2, 6); const product = (10 * tens + digit) * multiplier; const answer = digit;
    return { answer, options: numericOptions(random, answer), prompt: `In the multiplication shown, □ is one digit. What digit must replace □?`, hint: "Work backwards by dividing the product by the one-digit multiplier.", solution: [`The two-digit number is ${product} ÷ ${multiplier} = ${10 * tens + digit}.`, `Its ones digit is ${answer}, so □ = ${answer}.`], diagramType: "digit-puzzle", diagramData: { tens, multiplier, product }, diagramAlt: `Written multiplication ${tens}□ times ${multiplier} equals ${product}.`, reasoningSteps: 3 };
  }),
  archetype("layered-pattern", "Layered geometric pattern", senior, "Algebra", (random) => {
    const stage = integer(random, 8, 15); const answer = 1 + 3 * stage * (stage - 1);
    return { answer, answerType: "integer", prompt: `A centred hexagonal pattern follows the stages shown. How many tiles are in stage ${stage}?`, hint: "The rings add 6, 12, 18, … tiles around the centre.", solution: [`Stage ${stage} has one centre tile and rings containing 6(1 + 2 + … + ${stage - 1}) tiles.`, `1 + 6 × ${stage - 1} × ${stage} ÷ 2 = ${answer}.`], diagramType: "layered", diagramData: { stage }, diagramAlt: "First three centred hexagonal tile patterns with one, seven, and nineteen tiles.", reasoningSteps: 4 };
  }),
  archetype("integer-constraints", "Integer constraint system", senior, "Algebra", (random) => {
    const x = integer(random, 8, 20); const y = integer(random, 2, x - 2); const sum = x + y; const difference = x - y; const answer = x * y;
    return { answer, options: numericOptions(random, answer, [-sum, -difference, sum, difference, x]), prompt: `Positive integers x and y satisfy x + y = ${sum} and x − y = ${difference}. What is xy?`, hint: "Add the two equations to eliminate y.", solution: [`Adding gives 2x = ${sum + difference}, so x = ${x}.`, `Then y = ${sum} − ${x} = ${y}.`, `xy = ${x} × ${y} = ${answer}.`], diagramType: "balance", diagramData: { sum, difference }, diagramAlt: `Two balance statements showing x plus y equals ${sum}, and x minus y equals ${difference}.`, reasoningSteps: 4 };
  }),
  archetype("geometry-partition", "Geometry area partition", senior, "Geometry", (random) => {
    const totalArea = pick(random, [60, 72, 84, 96]); const ratioA = integer(random, 2, 4); const ratioB = integer(random, 2, 5); const answer = totalArea * ratioA / (ratioA + ratioB);
    return { answer, options: numericOptions(random, answer, [-12, -6, 6, 12, 18]), prompt: `A line divides the triangle so the two smaller triangles have base lengths in the ratio ${ratioA}:${ratioB} and the same height. If the total area is ${totalArea}, what is the area of the left triangle?`, hint: "Triangles with the same height have areas in the same ratio as their bases.", solution: [`The areas are in the ratio ${ratioA}:${ratioB}.`, `The left triangle is ${ratioA}/${ratioA + ratioB} of the total.`, `${ratioA}/${ratioA + ratioB} × ${totalArea} = ${answer}.`], diagramType: "partition", diagramData: { ratioA, ratioB, totalArea }, diagramAlt: `Triangle divided from its top vertex to split the base in ratio ${ratioA} to ${ratioB}.`, reasoningSteps: 4 };
  }),
  archetype("timer-chain", "Recursive timer chain", senior, "Logic", (random) => {
    const delays = [integer(random, 2, 5), integer(random, 3, 7), integer(random, 4, 9), integer(random, 2, 6)]; const cycles = integer(random, 2, 4); const answer = delays.reduce((sum, delay) => sum + delay, 0) * cycles;
    return { answer, options: numericOptions(random, answer, [-10, -5, 5, 10, 15]), prompt: `Each machine activates the next after its labelled delay. The full chain runs ${cycles} times. After how many seconds does the final activation occur?`, hint: "Find the time for one full chain, then account for the repeated cycles.", solution: [`One chain takes ${delays.join(" + ")} = ${delays.reduce((sum, delay) => sum + delay, 0)} seconds.`, `${cycles} chains take ${delays.reduce((sum, delay) => sum + delay, 0)} × ${cycles} = ${answer} seconds.`], diagramType: "timer", diagramData: { delays, cycles }, diagramAlt: `Chain of four machines with delays ${delays.join(", ")} seconds, repeated ${cycles} times.`, reasoningSteps: 4 };
  }),
  archetype("route-counting", "Combinatorial route problem", senior, "Logic", (random) => {
    const width = integer(random, 3, 5); const height = integer(random, 3, 5); const blockX = integer(random, 1, width - 1); const blockY = integer(random, 1, height - 1); const total = choose(width + height, width); const throughBlock = choose(blockX + blockY, blockX) * choose(width - blockX + height - blockY, width - blockX); const answer = total - throughBlock;
    return { answer, answerType: "integer", prompt: "Move only right or up from S to F. The marked intersection is closed. How many valid shortest routes are there?", hint: "Count all shortest routes, then subtract routes that pass through the closed intersection.", solution: [`All shortest routes: choose ${width} right moves among ${width + height}, giving ${total}.`, `Routes through the closed point: ${choose(blockX + blockY, blockX)} × ${choose(width - blockX + height - blockY, width - blockX)} = ${throughBlock}.`, `Valid routes = ${total} − ${throughBlock} = ${answer}.`], diagramType: "route", diagramData: { width, height, blockX, blockY }, diagramAlt: `${width} by ${height} route grid from S to F with intersection ${blockX}, ${blockY} closed.`, reasoningSteps: 5 };
  }),
];

export function validateQuestion(question) {
  if (!question || !LEVELS.includes(question.level) || !question.correctAnswer || !question.prompt || !question.hint) return false;
  if (!question.diagramType || !question.diagramData || !question.metadata?.requiresDiagram) return false;
  if (!Array.isArray(question.solutionSteps) || question.solutionSteps.length < 1) return false;
  if (question.answerType === "multipleChoice") {
    if (!Array.isArray(question.options) || question.options.length !== 5) return false;
    const values = question.options.map((option) => option.value);
    if (new Set(values).size !== 5) return false;
    if (values.filter((value) => value === question.correctAnswer).length !== 1) return false;
  }
  return true;
}

export function availableArchetypes({ level, topic = "Mixed", answerType = "any" }) {
  return ARCHETYPES.filter((item) => item.supportedLevels.includes(level))
    .filter((item) => topic === "Mixed" || item.topic === topic)
    .filter((item) => {
      if (answerType === "any") return true;
      const probe = item.generate(level, "answer-type-probe");
      return probe.answerType === answerType;
    });
}

export function generateQuestion({ level, seed, topic = "Mixed", answerType = "any", forceArchetype = "", recentArchetypes = [] }) {
  const candidates = availableArchetypes({ level, topic, answerType });
  const forced = ARCHETYPES.find((item) => item.id === forceArchetype && item.supportedLevels.includes(level));
  if (forced) return forced.generate(level, seed);
  if (!candidates.length) return availableArchetypes({ level, topic: "Mixed", answerType: "any" })[0].generate(level, seed);
  const random = seededRandom(`select:${level}:${seed}`);
  const lastFive = new Set(recentArchetypes.slice(-5));
  const fresh = candidates.filter((item) => !lastFive.has(item.id));
  const pool = fresh.length ? fresh : candidates.filter((item) => item.id !== recentArchetypes.at(-1));
  const selected = pick(random, pool.length ? pool : candidates);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const question = selected.generate(level, attempt ? `${seed}-${attempt}` : seed);
    if (validateQuestion(question)) return question;
  }
  return candidates[0].generate(level, "safe-fallback");
}
