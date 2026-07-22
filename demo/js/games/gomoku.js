(function () {
  const ID = "gomoku";
  const N = 13;
  const WIN = 5;
  const BLACK = 1;
  const WHITE = 2;
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let board, ended, turn, pageWins, cell;

  function reset() {
    board = Array.from({ length: N }, () => Array(N).fill(0));
    ended = false;
    turn = BLACK;
    GamesCommon.showMsg(msg, "轮到你落子啦");
    refreshScores();
    resize();
  }

  function refreshScores() {
    scoreNow.textContent = String(pageWins);
    scoreBest.textContent = String(GamesCommon.getHigh(ID) || 0);
  }

  function resize() {
    const size = Math.min(440, Math.floor(canvas.parentElement.clientWidth || 390));
    canvas.width = size;
    canvas.height = size;
    cell = size / (N + 1);
    draw();
  }

  function draw() {
    const s = canvas.width;
    ctx.fillStyle = "#f0d9a8";
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = "#8b6914";
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= N; i++) {
      ctx.beginPath();
      ctx.moveTo(cell, i * cell);
      ctx.lineTo(N * cell, i * cell);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i * cell, cell);
      ctx.lineTo(i * cell, N * cell);
      ctx.stroke();
    }
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!board[r][c]) continue;
        ctx.beginPath();
        ctx.arc((c + 1) * cell, (r + 1) * cell, cell * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = board[r][c] === BLACK ? "#2a3140" : "#fff8f0";
        ctx.fill();
        ctx.strokeStyle = "#2a3140";
        ctx.stroke();
      }
    }
  }

  function countDir(r, c, dr, dc, color) {
    let n = 0;
    let rr = r + dr;
    let cc = c + dc;
    while (rr >= 0 && rr < N && cc >= 0 && cc < N && board[rr][cc] === color) {
      n++;
      rr += dr;
      cc += dc;
    }
    return n;
  }

  function isWin(r, c, color) {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    return dirs.some(([dr, dc]) => countDir(r, c, dr, dc, color) + countDir(r, c, -dr, -dc, color) + 1 >= WIN);
  }

  function scoreLine(r, c, color) {
    if (board[r][c]) return -1;
    board[r][c] = color;
    let best = 0;
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    dirs.forEach(([dr, dc]) => {
      const n = countDir(r, c, dr, dc, color) + countDir(r, c, -dr, -dc, color) + 1;
      best = Math.max(best, n);
    });
    board[r][c] = 0;
    return best;
  }

  function boardFull() {
    return board.every((row) => row.every((v) => v));
  }

  function finishDraw() {
    ended = true;
    GamesCommon.showMsg(msg, "棋盘下满啦，和棋！再来一局吧～");
  }

  function aiMove() {
    let best = null;
    let bestScore = -1;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (board[r][c]) continue;
        const attack = scoreLine(r, c, WHITE);
        const defend = scoreLine(r, c, BLACK);
        let s = attack * 10 + defend * 11;
        if (attack >= 5) s += 10000;
        if (defend >= 5) s += 8000;
        if (attack >= 4) s += 500;
        if (defend >= 4) s += 600;
        if (attack >= 3) s += 50;
        if (defend >= 3) s += 55;
        // prefer center
        s += 6 - Math.abs(r - 6) - Math.abs(c - 6);
        if (s > bestScore) {
          bestScore = s;
          best = [r, c];
        }
      }
    }
    if (!best) {
      finishDraw();
      return;
    }
    const [r, c] = best;
    board[r][c] = WHITE;
    draw();
    if (isWin(r, c, WHITE)) {
      ended = true;
      GamesCommon.showMsg(msg, "电脑连成五子啦，再来一局加油～", "lose");
      return;
    }
    if (boardFull()) {
      finishDraw();
      return;
    }
    turn = BLACK;
    GamesCommon.showMsg(msg, "轮到你落子啦");
  }

  function place(r, c) {
    if (ended || turn !== BLACK || board[r][c]) return;
    board[r][c] = BLACK;
    draw();
    if (isWin(r, c, BLACK)) {
      ended = true;
      pageWins += 1;
      GamesCommon.submitScore(ID, (GamesCommon.getHigh(ID) || 0) + 1);
      refreshScores();
      GamesCommon.showMsg(msg, "你赢啦，五子连成！", "win");
      return;
    }
    if (boardFull()) {
      finishDraw();
      return;
    }
    turn = WHITE;
    GamesCommon.showMsg(msg, "电脑思考中…");
    setTimeout(aiMove, 280);
  }

  function eventToCell(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left) * scaleX;
    const y = ((e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - rect.top) * scaleY;
    const c = Math.round(x / cell) - 1;
    const r = Math.round(y / cell) - 1;
    if (r < 0 || c < 0 || r >= N || c >= N) return null;
    return [r, c];
  }

  canvas.addEventListener("click", (e) => {
    const pos = eventToCell(e);
    if (pos) place(pos[0], pos[1]);
  });

  pageWins = 0;
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  window.addEventListener("resize", resize);
  reset();
})();
