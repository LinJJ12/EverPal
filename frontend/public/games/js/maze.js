(function () {
  const ID = "maze";
  /** Odd size so recursive backtracker yields clean corridors. */
  const COLS = 11;
  const ROWS = 11;
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let grid, px, py, steps, won, cell;

  function neighbors(x, y) {
    return [
      [x, y - 2],
      [x, y + 2],
      [x - 2, y],
      [x + 2, y],
    ].filter(([nx, ny]) => nx > 0 && ny > 0 && nx < COLS - 1 && ny < ROWS - 1);
  }

  /** Perfect maze: 1 = wall, 0 = path. */
  function generate() {
    const g = Array.from({ length: ROWS }, () => Array(COLS).fill(1));
    const stack = [[1, 1]];
    g[1][1] = 0;
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

  /** BFS ensures start reaches end; regenerate if broken (should not happen). */
  function reachable(g) {
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

  function makeMaze() {
    let g;
    let guard = 0;
    do {
      g = generate();
      guard += 1;
    } while (!reachable(g) && guard < 20);
    return g;
  }

  function refreshBest() {
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function resize() {
    const size = Math.min(420, Math.floor((canvas.parentElement && canvas.parentElement.clientWidth) || 360));
    canvas.width = size;
    canvas.height = size;
    cell = size / COLS;
    draw();
  }

  function reset() {
    grid = makeMaze();
    px = 1;
    py = 1;
    steps = 0;
    won = false;
    scoreNow.textContent = "0";
    refreshBest();
    GamesCommon.showMsg(msg, "出发！走到右下角的星星吧");
    resize();
  }

  function tryMove(dir) {
    if (won) return;
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const d = map[dir];
    if (!d) return;
    const nx = px + d[0];
    const ny = py + d[1];
    if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) return;
    if (grid[ny][nx] !== 0) {
      GamesCommon.showMsg(msg, "这边是墙哦，换个方向试试");
      return;
    }
    px = nx;
    py = ny;
    steps += 1;
    scoreNow.textContent = String(steps);
    if (px === COLS - 2 && py === ROWS - 2) {
      won = true;
      GamesCommon.submitScore(ID, steps);
      refreshBest();
      GamesCommon.showMsg(msg, "走出迷宫啦！用了 " + steps + " 步～", "win");
    } else {
      GamesCommon.showMsg(msg, "继续前进～");
    }
    draw();
  }

  function draw() {
    const s = canvas.width;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = "#fff8f0";
    ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x] === 1) {
          ctx.fillStyle = "#c4b5a0";
          ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
        } else {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
        }
      }
    }
    // exit
    ctx.font = Math.floor(cell * 0.7) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⭐", (COLS - 2 + 0.5) * cell, (ROWS - 2 + 0.5) * cell);
    // player
    ctx.beginPath();
    ctx.fillStyle = "#e85d4c";
    ctx.arc((px + 0.5) * cell, (py + 0.5) * cell, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  GamesCommon.bindPad(document.getElementById("pad"), tryMove);
  GamesCommon.bindSwipe(canvas, tryMove, 24);
  window.addEventListener("keydown", (e) => {
    const map = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
      W: "up",
      S: "down",
      A: "left",
      D: "right",
    };
    if (map[e.key]) {
      e.preventDefault();
      tryMove(map[e.key]);
    }
  });
  window.addEventListener("resize", resize);
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
