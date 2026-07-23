(function () {
  const ID = "mines";
  const N = 8;
  const MINES = 8;
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");
  const modeDig = document.getElementById("modeDig");
  const modeFlag = document.getElementById("modeFlag");

  let mines, open, flags, mode, ended, roundWins;

  function idx(r, c) {
    return r * N + c;
  }

  function neighbors(r, c) {
    const list = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const rr = r + dr;
        const cc = c + dc;
        if (rr >= 0 && rr < N && cc >= 0 && cc < N) list.push([rr, cc]);
      }
    }
    return list;
  }

  function countAround(r, c) {
    return neighbors(r, c).filter(([rr, cc]) => mines.has(idx(rr, cc))).length;
  }

  function placeMines(safeR, safeC) {
    mines = new Set();
    const candidates = [];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
        candidates.push(idx(r, c));
      }
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    candidates.slice(0, MINES).forEach((i) => mines.add(i));
  }

  function refreshScores() {
    scoreNow.textContent = String(roundWins);
    scoreBest.textContent = String(GamesCommon.getHigh(ID) || 0);
  }

  function reset() {
    mines = null;
    open = new Set();
    flags = new Set();
    ended = false;
    mode = "dig";
    modeDig.classList.add("active");
    modeFlag.classList.remove("active");
    GamesCommon.showMsg(msg, "");
    refreshScores();
    render();
  }

  function flood(r, c) {
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      const i = idx(cr, cc);
      if (open.has(i) || flags.has(i)) continue;
      open.add(i);
      if (mines.has(i)) continue;
      if (countAround(cr, cc) === 0) {
        neighbors(cr, cc).forEach(([nr, nc]) => {
          if (!open.has(idx(nr, nc))) stack.push([nr, nc]);
        });
      }
    }
  }

  function onCell(r, c) {
    if (ended) return;
    const i = idx(r, c);
    if (mode === "flag") {
      if (open.has(i)) return;
      if (flags.has(i)) flags.delete(i);
      else flags.add(i);
      render();
      return;
    }
    if (flags.has(i) || open.has(i)) return;
    if (!mines) placeMines(r, c);
    if (mines.has(i)) {
      ended = true;
      open.add(i);
      mines.forEach((m) => open.add(m));
      GamesCommon.showMsg(msg, "踩到雷啦，没关系，再来一局～", "lose");
      render();
      return;
    }
    flood(r, c);
    let safe = 0;
    for (let k = 0; k < N * N; k++) if (!mines.has(k) && open.has(k)) safe++;
    if (safe === N * N - MINES) {
      ended = true;
      roundWins += 1;
      GamesCommon.submitScore(ID, (GamesCommon.getHigh(ID) || 0) + 1);
      refreshScores();
      GamesCommon.showMsg(msg, "全部安全挖开啦，真棒！", "win");
    }
    render();
  }

  function render() {
    boardEl.innerHTML = "";
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const i = idx(r, c);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cell";
        if (flags.has(i) && !open.has(i)) {
          btn.classList.add("flag");
          btn.textContent = "旗";
        } else if (!open.has(i)) {
          btn.classList.add("covered");
        } else if (mines && mines.has(i)) {
          btn.classList.add("mine");
          btn.textContent = "雷";
        } else {
          const n = countAround(r, c);
          btn.classList.add("open");
          if (n) {
            btn.classList.add("n" + Math.min(n, 4));
            btn.textContent = String(n);
          }
        }
        btn.addEventListener("click", () => onCell(r, c));
        boardEl.appendChild(btn);
      }
    }
  }

  roundWins = 0;
  modeDig.addEventListener("click", () => {
    mode = "dig";
    modeDig.classList.add("active");
    modeFlag.classList.remove("active");
  });
  modeFlag.addEventListener("click", () => {
    mode = "flag";
    modeFlag.classList.add("active");
    modeDig.classList.remove("active");
  });
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
