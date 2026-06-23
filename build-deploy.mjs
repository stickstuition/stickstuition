import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "dist");

const copyItems = [
  "index.html",
  "our-lessons.html",
  "pricing-and-packages.html",
  "maths-games.html",
  "login.html",
  "get-started.html",
  "styles.css",
  "site.js",
  "gamesimages",
  "logos",
  "randomimages",
];

const skipGamePaths = [
  path.normalize("angle-architect/AngryBirdsRemakeUnity-main"),
  path.normalize("angle-architect/angry-birds-4-0-0.exe"),
];

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const item of copyItems) {
  const from = path.join(root, item);
  if (!existsSync(from)) continue;
  await cp(from, path.join(out, item), { recursive: true });
}

await cp(path.join(root, "games"), path.join(out, "games"), {
  recursive: true,
  filter(source) {
    const relative = path.relative(path.join(root, "games"), source);
    const normalized = path.normalize(relative);
    return !skipGamePaths.some((blocked) => normalized === blocked || normalized.startsWith(`${blocked}${path.sep}`));
  },
});

console.log(`Prepared static site in ${path.relative(root, out)}/`);
