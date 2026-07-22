(function () {
  const ID = "tetris";
  const COLS = 10;
  const ROWS = 20;
  const GRAVITY = 700;
  const COLORS = ["#e85d4c", "#2bb3a3", "#f0b429", "#4f9fd8", "#ff8fab", "#7b5ea7", "#5ecfc2"];
  const SHAPES = [
    [[1, 1, 1, 1]],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
  ];

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let grid, piece, score, alive, timer, cellW, cellH;

  function emptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  function newPiece() {
    const type = (Math.random() * SHAPES.length) | 0;
    return {
      shape: SHAPES[type].map((row) => row.slice()),
      color: COLORS[type],
      x: 3,
      y: 0,
    };
  }

  function collide(p, ox, oy, shape) {
    const sh = shape || p.shape;
    for (let r = 0; r < sh.length; r++) {
      for (let c = 0; c < sh[r].length; c++) {
        if (!sh[r][c]) continue;
        const rr = p.y + r + oy;
        const cc = p.x + c + ox;
        if (rr < 0 || cc < 0 || cc >= COLS || rr >= ROWS || grid[rr][cc]) return true;
      }
    }
    return false;
  }

  function merge() {
    piece.shape.forEach((row, r) => {
      row.forEach((v, c) => {
        if (v) grid[piece.y + r][piece.x + c] = piece.color;
      });
    });
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (grid[r].every((v) => v)) {
        grid.splice(r, 1);
        grid.unshift(Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      score += cleared * 100;
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    }
  }

  function spawn() {
    piece = newPiece();
    if (collide(piece, 0, 0)) {
      alive = false;
      clearInterval(timer);
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
      GamesCommon.showMsg(msg, "堆到顶啦，再来一局吧～", "lose");
    }
  }

  function tick() {
    if (!alive) return;
    if (!collide(piece, 0, 1)) piece.y += 1;
    else {
      merge();
      clearLines();
      spawn();
    }
    draw();
  }

  function rotate() {
    if (!alive) return;
    const sh = piece.shape;
    const rotated = sh[0].map((_, i) => sh.map((row) => row[i]).reverse());
    if (!collide(piece, 0, 0, rotated)) piece.shape = rotated;
    draw();
  }

  function move(dx) {
    if (!alive) return;
    if (!collide(piece, dx, 0)) piece.x += dx;
    draw();
  }

  function softDrop() {
    if (!alive) return;
    if (!collide(piece, 0, 1)) {
      piece.y += 1;
      score += 1;
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    }
    draw();
  }

  function hardDrop() {
    if (!alive) return;
    while (!collide(piece, 0, 1)) {
      piece.y += 1;
      score += 2;
    }
    merge();
    clearLines();
    GamesCommon.submitScore(ID, score);
    GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    spawn();
    draw();
  }

  function draw() {
    cellW = canvas.width / COLS;
    cellH = canvas.height / ROWS;
    ctx.fillStyle = "#2a3140";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!grid[r][c]) continue;
        ctx.fillStyle = grid[r][c];
        ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
      }
    }
    if (piece && alive) {
      ctx.fillStyle = piece.color;
      piece.shape.forEach((row, r) => {
        row.forEach((v, c) => {
          if (!v) return;
          ctx.fillRect((piece.x + c) * cellW + 1, (piece.y + r) * cellH + 1, cellW - 2, cellH - 2);
        });
      });
    }
  }

  function reset() {
    if (alive && score > 0) GamesCommon.submitScore(ID, score);
    clearInterval(timer);
    grid = emptyGrid();
    score = 0;
    alive = true;
    GamesCommon.showMsg(msg, "");
    GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    spawn();
    draw();
    timer = setInterval(tick, GRAVITY);
  }

  document.getElementById("btnLeft").addEventListener("click", () => move(-1));
  document.getElementById("btnRight").addEventListener("click", () => move(1));
  document.getElementById("btnRot").addEventListener("click", rotate);
  document.getElementById("btnDown").addEventListener("click", softDrop);
  document.getElementById("btnDrop").addEventListener("click", hardDrop);
  window.addEventListener("keydown", (e) => {
    const map = {
      ArrowLeft: () => move(-1),
      ArrowRight: () => move(1),
      ArrowUp: rotate,
      ArrowDown: softDrop,
      " ": hardDrop,
    };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  });
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
