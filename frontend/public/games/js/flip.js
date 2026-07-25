(function () {
  const ID = "flip";
  const FACES = ["🌟", "🎈", "🐱", "🌈", "🍎", "🎵"];
  const boardEl = document.getElementById("board");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const pairsNow = document.getElementById("pairsNow");
  const msg = document.getElementById("gameMsg");

  let cards, open, moves, matched, lock, won;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refreshBest() {
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function reset() {
    const deck = shuffle(FACES.concat(FACES));
    cards = deck.map((face, i) => ({ id: i, face, matched: false }));
    open = [];
    moves = 0;
    matched = 0;
    lock = false;
    won = false;
    scoreNow.textContent = "0";
    pairsNow.textContent = "0";
    GamesCommon.showMsg(msg, "点开两张牌找相同的图案吧");
    refreshBest();
    render();
  }

  function flip(i) {
    if (won || lock) return;
    const c = cards[i];
    if (!c || c.matched || open.includes(i)) return;
    open.push(i);
    render();
    if (open.length < 2) return;
    moves += 1;
    scoreNow.textContent = String(moves);
    const [a, b] = open;
    if (cards[a].face === cards[b].face) {
      cards[a].matched = true;
      cards[b].matched = true;
      matched += 1;
      pairsNow.textContent = String(matched);
      open = [];
      if (matched >= FACES.length) {
        won = true;
        GamesCommon.submitScore(ID, moves);
        refreshBest();
        GamesCommon.showMsg(msg, "全部配对成功！用了 " + moves + " 步～", "win");
      } else {
        GamesCommon.showMsg(msg, "配对成功！继续加油～", "win");
      }
      render();
    } else {
      lock = true;
      GamesCommon.showMsg(msg, "不一样哦，再记一记～");
      setTimeout(() => {
        open = [];
        lock = false;
        render();
      }, 700);
    }
  }

  function render() {
    boardEl.innerHTML = "";
    cards.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      const show = c.matched || open.includes(i);
      btn.className = "cell flip-card" + (show ? " is-open" : "") + (c.matched ? " is-matched" : "");
      btn.textContent = show ? c.face : "?";
      btn.setAttribute("aria-label", show ? "图案 " + c.face : "背面牌");
      btn.disabled = c.matched || lock;
      btn.addEventListener("click", () => flip(i));
      boardEl.appendChild(btn);
    });
  }

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
