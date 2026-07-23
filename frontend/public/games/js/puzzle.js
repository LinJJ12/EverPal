(function () {
  const ID = "puzzle";
  const N = 3;
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let tiles, moves, won;

  function goal() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 0];
  }

  function isSolved() {
    const g = goal();
    return tiles.every((v, i) => v === g[i]);
  }

  function inversions(arr) {
    let inv = 0;
    const a = arr.filter((x) => x !== 0);
    for (let i = 0; i < a.length; i++) {
      for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) inv++;
    }
    return inv;
  }

  function shuffleSolvable() {
    let arr;
    do {
      arr = goal().slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = (Math.random() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (inversions(arr) % 2 !== 0 || arr.every((v, i) => v === goal()[i]));
    return arr;
  }

  function refreshBest() {
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function reset() {
    tiles = shuffleSolvable();
    moves = 0;
    won = false;
    scoreNow.textContent = "0";
    refreshBest();
    GamesCommon.showMsg(msg, "");
    render();
  }

  function tryMove(i) {
    if (won) return;
    const empty = tiles.indexOf(0);
    const r = (i / N) | 0;
    const c = i % N;
    const er = (empty / N) | 0;
    const ec = empty % N;
    if (Math.abs(r - er) + Math.abs(c - ec) !== 1) return;
    [tiles[i], tiles[empty]] = [tiles[empty], tiles[i]];
    moves += 1;
    scoreNow.textContent = String(moves);
    if (isSolved()) {
      won = true;
      GamesCommon.submitScore(ID, moves);
      refreshBest();
      GamesCommon.showMsg(msg, "拼好啦！用了 " + moves + " 步～", "win");
    }
    render();
  }

  function render() {
    boardEl.innerHTML = "";
    tiles.forEach((v, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cell" + (v === 0 ? " empty" : "");
      btn.textContent = v === 0 ? "" : String(v);
      btn.disabled = v === 0 || won;
      btn.addEventListener("click", () => tryMove(i));
      boardEl.appendChild(btn);
    });
  }

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
