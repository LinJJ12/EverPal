(function () {
  const ID = "snake";
  const N = 12;
  const TICK = 220;
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  let snake, dir, pending, food, score, alive, timer, cell;

  function resize() {
    const size = Math.min(420, Math.floor(canvas.parentElement.clientWidth || 360));
    canvas.width = size;
    canvas.height = size;
    cell = size / N;
    draw();
  }

  function randFood() {
    const free = [];
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) {
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    if (!free.length) return null;
    return free[(Math.random() * free.length) | 0];
  }

  function reset() {
    clearInterval(timer);
    snake = [
      { x: 5, y: 6 },
      { x: 4, y: 6 },
      { x: 3, y: 6 },
    ];
    dir = { x: 1, y: 0 };
    pending = null;
    food = randFood();
    score = 0;
    alive = true;
    GamesCommon.showMsg(msg, "");
    GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
    draw();
    timer = setInterval(tick, TICK);
  }

  function setDir(name) {
    if (!alive) return;
    const map = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const n = map[name];
    if (!n) return;
    const cur = pending || dir;
    if (n.x === -cur.x && n.y === -cur.y) return;
    pending = n;
  }

  function tick() {
    if (!alive) return;
    if (pending) {
      dir = pending;
      pending = null;
    }
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N || snake.some((s) => s.x === head.x && s.y === head.y)) {
      alive = false;
      clearInterval(timer);
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
      GamesCommon.showMsg(msg, "哎呀，撞到了！再试一次吧～", "lose");
      return;
    }
    snake.unshift(head);
    if (food && head.x === food.x && head.y === food.y) {
      score += 1;
      food = randFood();
      GamesCommon.submitScore(ID, score);
      GamesCommon.setScoreUI(scoreNow, scoreBest, ID, score);
      if (!food) {
        alive = false;
        clearInterval(timer);
        GamesCommon.showMsg(msg, "太厉害了，整盘都吃满啦！", "win");
      }
    } else {
      snake.pop();
    }
    draw();
  }

  function draw() {
    if (!cell || !snake) return;
    ctx.fillStyle = "#fff8f0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillStyle = "#f3eee6";
          ctx.fillRect(i * cell, j * cell, cell, cell);
        }
      }
    }
    if (food) {
      ctx.fillStyle = "#e85d4c";
      ctx.beginPath();
      ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
      ctx.fill();
    }
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#2bb3a3" : "#5ecfc2";
      const pad = cell * 0.08;
      ctx.fillRect(s.x * cell + pad, s.y * cell + pad, cell - pad * 2, cell - pad * 2);
    });
  }

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  GamesCommon.bindPad(document.getElementById("pad"), setDir);
  window.addEventListener("keydown", (e) => {
    const k = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };
    const dir = k[e.key] || k[e.key.toLowerCase()];
    if (dir) {
      e.preventDefault();
      setDir(dir);
    }
  });
  window.addEventListener("resize", resize);
  resize();
  reset();
})();
