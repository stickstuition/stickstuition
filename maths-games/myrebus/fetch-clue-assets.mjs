import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { rebuses } from "./rebus-content.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "assets", "clues");
await mkdir(output, { recursive: true });

const uniqueAssets = new Map();
for (const rebus of rebuses) {
  for (const clue of rebus.clues) uniqueAssets.set(path.basename(clue.image), clue.emoji);
}

let fetched = 0;
for (const [filename, emoji] of uniqueAssets) {
  const fullCode = Array.from(emoji).map((char) => char.codePointAt(0).toString(16)).join("-");
  const shortCode = fullCode.split("-").filter((part) => part !== "fe0f").join("-");
  const candidates = [shortCode, fullCode];
  let response;
  for (const code of [...new Set(candidates)]) {
    response = await fetch(`https://raw.githubusercontent.com/jdecked/twemoji/v16.0.1/assets/svg/${code}.svg`);
    if (response.ok) break;
  }
  if (!response?.ok) throw new Error(`Could not fetch Twemoji artwork for ${emoji} (${filename})`);
  await writeFile(path.join(output, filename), await response.text(), "utf8");
  fetched += 1;
}

await writeFile(path.join(root, "assets", "TWEMOJI-LICENSE.txt"), `Twemoji graphics\n\nCopyright 2021 Twitter, Inc and other contributors\nGraphics licensed under CC-BY 4.0: https://creativecommons.org/licenses/by/4.0/\nSource: https://github.com/jdecked/twemoji\n`, "utf8");
console.log(`Saved ${fetched} local clue illustrations.`);
