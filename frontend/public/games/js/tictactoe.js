(function () {
  const ID = "tictactoe";
  const YOU = "O";
  const AI = "X";
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let cells, over, wins;

  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function winner(board) {
    for (const [a, b, c] of LINES) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    if (board.every(Boolean)) return "draw";
    return null;
  }

  function empties(board) {
    return board.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  }

  function findWinningMove(board, mark) {
    for (const i of empties(board)) {
      const next = board.slice();
      next[i] = mark;
      if (winner(next) === mark) return i;
    }
    return -1;
  }

  /** Weak AI: win if can, block if must, else prefer center/corners/random. */
  function aiMove(board) {
    const win = findWinningMove(board, AI);
    if (win >= 0) return win;
    const block = findWinningMove(board, YOU);
    if (block >= 0) return block;
    const prefs = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const i of prefs) {
      if (!board[i]) return i;
    }
    const free = empties(board);
    return free[(Math.random() * free.length) | 0];
  }

  function refreshScores() {
    scoreNow.textContent = String(wins);
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function reset() {
    cells = Array(9).fill("");
    over = false;
    GamesCommon.showMsg(msg, "轮到你啦，点一个格子下子");
    render();
  }

  function end(result) {
    over = true;
    if (result === YOU) {
      wins += 1;
      // Persist cumulative wins (same as gomoku/mines), not just this page session.
      GamesCommon.submitScore(ID, (GamesCommon.getHigh(ID) || 0) + 1);
      refreshScores();
      GamesCommon.showMsg(msg, "你赢啦！真棒～", "win");
    } else if (result === AI) {
      GamesCommon.showMsg(msg, "电脑连成了三个。再来一局试试！", "lose");
    } else {
      GamesCommon.showMsg(msg, "平局～棋逢对手！", "win");
    }
  }

  function play(i) {
    if (over || cells[i]) return;
    cells[i] = YOU;
    render();
    let w = winner(cells);
    if (w) {
      end(w);
      return;
    }
    const m = aiMove(cells);
    if (m >= 0) cells[m] = AI;
    render();
    w = winner(cells);
    if (w) end(w);
    else GamesCommon.showMsg(msg, "继续下吧～");
  }

  function render() {
    boardEl.innerHTML = "";
    cells.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell ttt-cell" + (v === YOU ? " is-you" : v === AI ? " is-ai" : "");
      btn.textContent = v || "";
      btn.setAttribute("aria-label", v ? "已下 " + v : "空位 " + (i + 1));
      btn.disabled = over || !!v;
      btn.addEventListener("click", () => play(i));
      boardEl.appendChild(btn);
    });
  }

  wins = 0;
  refreshScores();
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
