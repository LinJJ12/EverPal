/* Shared helpers for demo kids games */
(function () {
  const META = [
    { id: "snake", title: "贪吃蛇", blurb: "慢慢爬，吃到豆子就变长", unit: "分" },
    { id: "2048", title: "2048", blurb: "滑动合并相同数字", unit: "分" },
    { id: "mines", title: "扫雷", blurb: "小心挖开，别踩到雷", unit: "胜场" },
    { id: "gomoku", title: "五子棋", blurb: "你先手，和电脑下一盘", unit: "胜场" },
    { id: "tetris", title: "俄罗斯方块", blurb: "慢慢下落，消行得分", unit: "分" },
    { id: "puzzle", title: "数字拼图", blurb: "三乘三，步数越少越好", unit: "步", lowerBetter: true },
    { id: "match3", title: "消消乐", blurb: "交换相邻格子，连成三个", unit: "分" },
    { id: "breakout", title: "打砖块", blurb: "左右移动挡板，打掉彩色砖块", unit: "分" },
    { id: "flip", title: "记忆翻牌", blurb: "翻开配对，步数越少越好", unit: "步", lowerBetter: true },
    { id: "guess", title: "猜数字", blurb: "根据提示猜出神秘数字", unit: "最少次数", lowerBetter: true },
    { id: "tictactoe", title: "井字棋", blurb: "你先手，和电脑下一盘", unit: "胜场" },
    { id: "maze", title: "走迷宫", blurb: "找到路，走到星星出口", unit: "步", lowerBetter: true },
  ];

  function getHigh(id) {
    return window.DemoStore.getGameHigh(id);
  }

  function submitScore(id, value) {
    return window.DemoStore.submitGameScore(id, value);
  }

  function formatRecord(id, value) {
    const meta = META.find((m) => m.id === id);
    if (meta && meta.lowerBetter) {
      if (value == null) return "暂无纪录";
      return `最佳 ${value} ${meta.unit}`;
    }
    const n = value == null ? 0 : value;
    return `最高 ${n} ${meta ? meta.unit : ""}`.trim();
  }

  function formatBestLabel(id, value) {
    const meta = META.find((m) => m.id === id);
    if (meta && meta.lowerBetter) {
      return value == null ? "暂无" : String(value);
    }
    return String(value == null ? 0 : value);
  }

  function setScoreUI(nowEl, bestEl, id, nowValue) {
    if (nowEl) nowEl.textContent = String(nowValue);
    if (bestEl) bestEl.textContent = formatBestLabel(id, getHigh(id));
  }

  function showMsg(el, text, kind) {
    if (!el) return;
    el.hidden = !text;
    el.textContent = text || "";
    el.classList.remove("is-win", "is-lose");
    if (kind === "win") el.classList.add("is-win");
    if (kind === "lose") el.classList.add("is-lose");
  }

  function bindRestart(btn, fn) {
    if (!btn) return;
    btn.addEventListener("click", () => fn());
  }

  /** Optional D-pad: buttons with data-dir = up|down|left|right */
  function bindPad(root, onDir) {
    if (!root) return;
    root.querySelectorAll("[data-dir]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        onDir(btn.getAttribute("data-dir"));
      });
    });
  }

  /** Swipe on element → up/down/left/right */
  function bindSwipe(el, onDir, threshold) {
    if (!el) return;
    const th = threshold || 28;
    let x0 = 0;
    let y0 = 0;
    let active = false;
    el.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches[0]) return;
        active = true;
        x0 = e.touches[0].clientX;
        y0 = e.touches[0].clientY;
      },
      { passive: true }
    );
    el.addEventListener(
      "touchmove",
      (e) => {
        if (!active) return;
        if (e.cancelable) e.preventDefault();
      },
      { passive: false }
    );
    el.addEventListener(
      "touchend",
      (e) => {
        if (!active) return;
        active = false;
        const t = e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - x0;
        const dy = t.clientY - y0;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
        if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? "right" : "left");
        else onDir(dy > 0 ? "down" : "up");
      },
      { passive: true }
    );
  }

  function formatHubRecord(id, value) {
    const meta = META.find((m) => m.id === id);
    if (meta && meta.lowerBetter) {
      if (value == null) return "暂无";
      return `${value} ${meta.unit}`;
    }
    return `${value == null ? 0 : value} ${meta ? meta.unit : ""}`.trim();
  }

  function renderHub(container) {
    if (!container) return;
    container.innerHTML = META.map((g) => {
      const high = getHigh(g.id);
      return `<a class="game-card" href="games/${g.id}.html">
        <span class="game-card-kicker">益智小游戏</span>
        <strong>${g.title}</strong>
        <span class="blurb">${g.blurb}</span>
        <span class="record">本机纪录：<b>${formatHubRecord(g.id, high)}</b></span>
      </a>`;
    }).join("");
  }

  window.GamesCommon = {
    META,
    getHigh,
    submitScore,
    formatRecord,
    formatBestLabel,
    setScoreUI,
    showMsg,
    bindRestart,
    bindPad,
    bindSwipe,
    renderHub,
  };
})();
