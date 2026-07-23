(function () {
  const ID = "match3";
  const N = 7;
  const COLORS = 4;
  const GLYPHS = ["●", "▲", "■", "★"];
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let grid, score, selected, busy;

  function randColor() {
    return (Math.random() * COLORS) | 0;
  }

  function findMatches() {
    const matched = new Set();
    for (let r = 0; r < N; r++) {
      let run = 1;
      for (let c = 1; c <= N; c++) {
        if (c < N && grid[r][c] === grid[r][c - 1]) run++;
        else {
          if (run >= 3) for (let k = 0; k < run; k++) matched.add(r + "," + (c - 1 - k));
          run = 1;
        }
      }
    }
    for (let c = 0; c < N; c++) {
      let run = 1;
      for (let r = 1; r <= N; r++) {
        if (r < N && grid[r][c] === grid[r - 1][c]) run++;
        else {
          if (run >= 3) for (let k = 0; k < run; k++) matched.add(r - 1 - k + "," + c);
          run = 1;
        }
      }
    }
    return matched;
  }

  function collapse(matched) {
    matched.forEach((key) => {
      const [r, c] = key.split(",").map(Number);
      grid[r][c] = -1;
    });
    for (let c = 0; c < N; c++) {
      let write = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        if (grid[r][c] >= 0) {
          grid[write][c] = grid[r][c];
          write--;
        }
      }
      while (write >= 0) {
        grid[write][c] = randColor();
        write--;
      }
    }
  }

  function resolve() {
    let gained = 0;
    let guard = 0;
    while (guard++ < 40) {
      const m = findMatches();
      if (!m.size) break;
      gained += m.size * 10;
      collapse(m);
    }
    return gained;
  }

  function swap(a, b) {
    const t = grid[a.r][a.c];
    grid[a.r][a.c] = grid[b.r][b.c];
    grid[b.r][b.c] = t;
  }

  function fillNoMatch() {
    let guard = 0;
    do {
      grid = Array.from({ length: N }, () => Array.from({ length: N }, randColor));
      guard++;
    } while (findMatches().size && guard < 80);
    if (findMatches().size) {
      // last resort: force a mostly safe pattern
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) grid[r][c] = (r + c) % COLORS;
      }
    }
  }

  function hasMove() {
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (c + 1 < N) {
          swap({ r, c }, { r, c: c + 1 });
          const ok = findMatches().size > 0;
          swap({ r, c }, { r, c: c + 1 });
          if (ok) return true;
        }
        if (r + 1 < N) {
          swap({ r, c }, { r: r + 1, c });
          const ok = findMatches().size > 0;
          swap({ r, c }, { r: r + 1, c });
          if (ok) return true;
        }
      }
    }
    return false;
  }

  function ensurePlayable() {
    let guard = 0;
    while (!hasMove() && guard++ < 40) fillNoMatch();
  }

  function reset() {
    busy = false;
    selected = null;
    score = 0;
    fillNoMatch();
    ensurePlayable();
    GamesCommon.showMsg(msg, "");
    GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    render();
  }

  function adjacent(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
  }

  function onCell(r, c) {
    if (busy) return;
    if (!selected) {
      selected = { r, c };
      render();
      return;
    }
    if (selected.r === r && selected.c === c) {
      selected = null;
      render();
      return;
    }
    const a = selected;
    const b = { r, c };
    selected = null;
    if (!adjacent(a, b)) {
      selected = b;
      render();
      return;
    }
    busy = true;
    swap(a, b);
    const gained = resolve();
    if (!gained) {
      swap(a, b);
      GamesCommon.showMsg(msg, "这样交换消不掉哦，换一对试试～");
      setTimeout(() => GamesCommon.showMsg(msg, ""), 1200);
    } else {
      score += gained;
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
      if (score >= 500) GamesCommon.showMsg(msg, "消得真棒！继续加油～", "win");
      if (!hasMove()) {
        ensurePlayable();
        GamesCommon.showMsg(msg, "没有可消的了，已帮你换一盘～");
      }
    }
    busy = false;
    render();
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const btn = document.createElement("button");
        btn.type = "button";
        const color = grid[r][c];
        btn.className = "cell c" + color;
        if (selected && selected.r === r && selected.c === c) btn.classList.add("selected");
        btn.textContent = GLYPHS[color];
        btn.setAttribute("aria-label", "颜色" + (color + 1));
        btn.addEventListener("click", () => onCell(r, c));
        boardEl.appendChild(btn);
      }
    }
  }

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
