(function () {
  const ID = "guess";
  const MIN = 1;
  const MAX = 50;
  const MAX_TRIES = 7;

  const input = document.getElementById("guessInput");
  const guessBtn = document.getElementById("guessBtn");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const triesLeftEl = document.getElementById("triesLeft");
  const msg = document.getElementById("gameMsg");
  const logEl = document.getElementById("guessLog");

  let secret, tries, done;

  function refreshBest() {
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function reset() {
    secret = MIN + ((Math.random() * (MAX - MIN + 1)) | 0);
    tries = 0;
    done = false;
    scoreNow.textContent = "0";
    triesLeftEl.textContent = String(MAX_TRIES);
    logEl.innerHTML = "";
    input.value = "";
    input.disabled = false;
    guessBtn.disabled = false;
    GamesCommon.showMsg(msg, "想好了吗？试着猜一个数字～");
    refreshBest();
    input.focus();
  }

  function addLog(text) {
    const li = document.createElement("li");
    li.textContent = text;
    logEl.prepend(li);
  }

  function finish(win) {
    done = true;
    input.disabled = true;
    guessBtn.disabled = true;
    if (win) {
      GamesCommon.submitScore(ID, tries);
      refreshBest();
      GamesCommon.showMsg(msg, "猜对啦！一共用了 " + tries + " 次～", "win");
    } else {
      GamesCommon.showMsg(msg, "次数用完啦，答案是 " + secret + "。再试一局吧！", "lose");
    }
  }

  function guess() {
    if (done) return;
    const n = Number(input.value);
    if (!Number.isInteger(n) || n < MIN || n > MAX) {
      GamesCommon.showMsg(msg, "请输入 " + MIN + " 到 " + MAX + " 的整数哦");
      return;
    }
    tries += 1;
    scoreNow.textContent = String(tries);
    triesLeftEl.textContent = String(Math.max(0, MAX_TRIES - tries));
    if (n === secret) {
      addLog(n + " → 正好！");
      finish(true);
      return;
    }
    if (n < secret) {
      addLog(n + " → 太小了");
      GamesCommon.showMsg(msg, "太小了，再大一点～");
    } else {
      addLog(n + " → 太大了");
      GamesCommon.showMsg(msg, "太大了，再小一点～");
    }
    if (tries >= MAX_TRIES) finish(false);
    input.select();
  }

  guessBtn.addEventListener("click", guess);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      guess();
    }
  });
  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
