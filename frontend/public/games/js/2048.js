(function () {
  const ID = "2048";
  const N = 4;
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let grid, score, over, reached2048;

  function emptyCells() {
    const list = [];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (!grid[r][c]) list.push([r, c]);
    return list;
  }

  function spawn() {
    const list = emptyCells();
    if (!list.length) return;
    const [r, c] = list[(Math.random() * list.length) | 0];
    grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }

  function reset() {
    grid = Array.from({ length: N }, () => Array(N).fill(0));
    score = 0;
    over = false;
    reached2048 = false;
    spawn();
    spawn();
    GamesCommon.showMsg(msg, "");
    render();
  }

  function slide(line) {
    const filtered = line.filter((v) => v);
    const out = [];
    let gained = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const v = filtered[i] * 2;
        out.push(v);
        gained += v;
        i++;
      } else out.push(filtered[i]);
    }
    while (out.length < N) out.push(0);
    return { line: out, gained };
  }

  function move(dir) {
    if (over) return;
    const prev = grid.map((row) => row.slice());
    let gained = 0;
    if (dir === "left" || dir === "right") {
      for (let r = 0; r < N; r++) {
        let line = grid[r].slice();
        if (dir === "right") line.reverse();
        const res = slide(line);
        if (dir === "right") res.line.reverse();
        grid[r] = res.line;
        gained += res.gained;
      }
    } else {
      for (let c = 0; c < N; c++) {
        let line = grid.map((row) => row[c]);
        if (dir === "down") line.reverse();
        const res = slide(line);
        if (dir === "down") res.line.reverse();
        for (let r = 0; r < N; r++) grid[r][c] = res.line[r];
        gained += res.gained;
      }
    }
    const changed = grid.some((row, r) => row.some((v, c) => v !== prev[r][c]));
    if (!changed) return;
    score += gained;
    GamesCommon.submitScore(ID, score);
    spawn();
    render();
    if (!canMove()) {
      over = true;
      GamesCommon.showMsg(msg, "格子满啦，再开一局试试～", "lose");
    } else if (!reached2048 && grid.some((row) => row.some((v) => v >= 2048))) {
      reached2048 = true;
      GamesCommon.showMsg(msg, "太棒了，合成 2048 啦！还可以继续玩～", "win");
    }
  }

  function canMove() {
    if (emptyCells().length) return true;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = grid[r][c];
        if (c + 1 < N && grid[r][c + 1] === v) return true;
        if (r + 1 < N && grid[r + 1][c] === v) return true;
      }
    }
    return false;
  }

  function render() {
    GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const v = grid[r][c];
        const cell = document.createElement("div");
        cell.className = "cell" + (v ? " t" + v : "");
        cell.textContent = v || "";
        boardEl.appendChild(cell);
      }
    }
  }

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  GamesCommon.bindPad(document.getElementById("pad"), move);
  GamesCommon.bindSwipe(boardEl, move);
  window.addEventListener("keydown", (e) => {
    const k = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
    if (k[e.key]) {
      e.preventDefault();
      move(k[e.key]);
    }
  });
  reset();
})();
