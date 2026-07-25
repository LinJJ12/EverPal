/**
 * Smoke checks for public/games: registration, assets, syntax, maze solvability.
 * Run from repo root: node frontend/scripts/games/smoke-check.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../../public/games");
const failures = [];

function fail(msg) {
  failures.push(msg);
  console.error("FAIL:", msg);
}

function ok(msg) {
  console.log("OK  ", msg);
}

const commonSrc = fs.readFileSync(path.join(root, "games-common.js"), "utf8");
const metaMatch = commonSrc.match(/const META = (\[[\s\S]*?\]);/);
if (!metaMatch) {
  fail("cannot parse META from games-common.js");
  process.exit(1);
}
const META = vm.runInNewContext("(" + metaMatch[1] + ")");
ok(`META has ${META.length} games`);

const storeSrc = fs.readFileSync(path.join(root, "store.js"), "utf8");
for (const g of META) {
  const htmlPath = path.join(root, `${g.id}.html`);
  const jsPath = path.join(root, "js", `${g.id}.js`);
  if (!fs.existsSync(htmlPath)) fail(`missing ${g.id}.html`);
  else ok(`html ${g.id}.html`);
  if (!fs.existsSync(jsPath)) fail(`missing js/${g.id}.js`);
  else {
    const chk = spawnSync(process.execPath, ["--check", jsPath], { encoding: "utf8" });
    if (chk.status !== 0) fail(`syntax js/${g.id}.js: ${chk.stderr}`);
    else ok(`syntax js/${g.id}.js`);
  }
  const html = fs.readFileSync(htmlPath, "utf8");
  const requiredIds = ["restartBtn", "scoreNow", "scoreBest", "gameMsg"];
  if (g.id === "guess") requiredIds.push("guessInput", "guessBtn", "guessLog", "triesLeft");
  else requiredIds.push("board");
  if (g.id === "flip") requiredIds.push("pairsNow");
  for (const id of requiredIds) {
    if (!html.includes(`id="${id}"`) && !html.includes(`id='${id}'`)) {
      fail(`${g.id}.html missing #${id}`);
    }
  }
  if (!html.includes(`js/${g.id}.js`)) fail(`${g.id}.html does not load js/${g.id}.js`);
  if (!html.includes('href="/games"')) fail(`${g.id}.html missing 回大厅 link`);
  if (g.lowerBetter && !storeSrc.includes(`${g.id}:`)) {
    fail(`store.js missing default for lowerBetter game ${g.id}`);
  }
  if (g.lowerBetter && !storeSrc.includes(`${g.id}: true`)) {
    fail(`store.js GAME_LOWER_BETTER missing ${g.id}`);
  }
}

const local = {
  data: null,
  getItem() {
    return this.data;
  },
  setItem(_k, v) {
    this.data = v;
  },
};
const storeSandbox = {
  localStorage: local,
  document: {
    documentElement: { setAttribute() {}, getAttribute() { return null; } },
    querySelectorAll() { return []; },
    addEventListener() {},
  },
  window: {},
  console,
};
storeSandbox.window = storeSandbox;
vm.runInNewContext(storeSrc, storeSandbox);
const DemoStore = storeSandbox.window.DemoStore || storeSandbox.DemoStore;
if (!DemoStore) {
  fail("DemoStore not exported");
} else {
  local.data = null;
  DemoStore.submitGameScore("maze", 40);
  DemoStore.submitGameScore("maze", 25);
  DemoStore.submitGameScore("maze", 30);
  const high = DemoStore.getGameHigh("maze");
  if (high !== 25) fail(`maze lowerBetter expected 25 got ${high}`);
  else ok("store lowerBetter maze");

  DemoStore.submitGameScore("breakout", 10);
  DemoStore.submitGameScore("breakout", 50);
  DemoStore.submitGameScore("breakout", 20);
  const bh = DemoStore.getGameHigh("breakout");
  if (bh !== 50) fail(`breakout higher expected 50 got ${bh}`);
  else ok("store higher breakout");

  const before = DemoStore.getGameHigh("tictactoe") || 0;
  DemoStore.submitGameScore("tictactoe", before + 1);
  if (DemoStore.getGameHigh("tictactoe") !== before + 1) fail("tictactoe win increment");
  else ok("store tictactoe win increment");
}

function generateMaze(COLS, ROWS) {
  const g = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
  const stack = [[1, 1]];
  g[1][1] = 0;
  function neighbors(x, y) {
    return [
      [x, y - 2],
      [x, y + 2],
      [x - 2, y],
      [x + 2, y],
    ].filter(([nx, ny]) => nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1);
  }
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = neighbors(x, y).filter(([nx, ny]) => g[ny][nx] === 1);
    if (!opts.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = opts[(Math.random() * opts.length) | 0];
    g[ny][nx] = 0;
    g[(y + ny) >> 1][(x + nx) >> 1] = 0;
    stack.push([nx, ny]);
  }
  g[1][1] = 0;
  g[ROWS - 2][COLS - 2] = 0;
  return g;
}

function reachable(g, COLS, ROWS) {
  const q = [[1, 1]];
  const seen = new Set(["1,1"]);
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  while (q.length) {
    const [x, y] = q.shift();
    if (x === COLS - 2 && y === ROWS - 2) return true;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      const k = nx + "," + ny;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      if (g[ny][nx] !== 0 || seen.has(k)) continue;
      seen.add(k);
      q.push([nx, ny]);
    }
  }
  return false;
}

let mazeOk = 0;
for (let i = 0; i < 30; i++) {
  const g = generateMaze(11, 11);
  if (reachable(g, 11, 11)) mazeOk += 1;
}
if (mazeOk < 30) fail(`maze solvability ${mazeOk}/30`);
else ok("maze generation solvable 30/30");

const gamesMetaPath = path.resolve(__dirname, "../../src/utils/gamesMeta.ts");
if (fs.existsSync(gamesMetaPath)) {
  const gm = fs.readFileSync(gamesMetaPath, "utf8");
  for (const g of META) {
    if (!gm.includes(`id: "${g.id}"`)) fail(`gamesMeta.ts missing id ${g.id}`);
  }
  ok("gamesMeta.ts aligned with META");
} else {
  fail("missing frontend/src/utils/gamesMeta.ts");
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log(`\nAll smoke checks passed (${META.length} games).`);
