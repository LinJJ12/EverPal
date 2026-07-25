(function () {
  const ID = "breakout";
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const scoreNow = document.getElementById("scoreNow");
  const scoreBest = document.getElementById("scoreBest");
  const msg = document.getElementById("gameMsg");

  const W = canvas.width;
  const H = canvas.height;
  const BRICK_ROWS = 3;
  const BRICK_COLS = 7;
  const BRICK_H = 22;
  const BRICK_GAP = 6;
  const PADDLE_W = 88;
  const PADDLE_H = 14;
  const BALL_R = 8;
  const COLORS = ["#e85d4c", "#f0b429", "#2bb3a3", "#7c6cf0", "#ff8fab"];

  let paddleX, ballX, ballY, vx, vy, bricks, score, lives, running, won, keys, raf;

  function brickLayout() {
    const totalGap = (BRICK_COLS + 1) * BRICK_GAP;
    const bw = (W - totalGap) / BRICK_COLS;
    const list = [];
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        list.push({
          x: BRICK_GAP + c * (bw + BRICK_GAP),
          y: 40 + r * (BRICK_H + BRICK_GAP),
          w: bw,
          h: BRICK_H,
          alive: true,
          color: COLORS[r % COLORS.length],
        });
      }
    }
    return list;
  }

  function refreshBest() {
    scoreBest.textContent = GamesCommon.formatBestLabel(ID, GamesCommon.getHigh(ID));
  }

  function resetBall() {
    ballX = W / 2;
    ballY = H - 80;
    vx = (Math.random() < 0.5 ? -1 : 1) * 2.2;
    vy = -2.6;
  }

  function reset() {
    cancelAnimationFrame(raf);
    paddleX = (W - PADDLE_W) / 2;
    bricks = brickLayout();
    score = 0;
    lives = 3;
    running = true;
    won = false;
    keys = { left: false, right: false };
    scoreNow.textContent = "0";
    refreshBest();
    GamesCommon.showMsg(msg, "准备好了？挡板接住小球～");
    resetBall();
    loop();
  }

  function remaining() {
    return bricks.filter((b) => b.alive).length;
  }

  function hitBricks() {
    for (const b of bricks) {
      if (!b.alive) continue;
      if (
        ballX + BALL_R > b.x &&
        ballX - BALL_R < b.x + b.w &&
        ballY + BALL_R > b.y &&
        ballY - BALL_R < b.y + b.h
      ) {
        b.alive = false;
        vy *= -1;
        score += 10;
        scoreNow.textContent = String(score);
        if (remaining() === 0) {
          won = true;
          running = false;
          GamesCommon.submitScore(ID, score);
          refreshBest();
          GamesCommon.showMsg(msg, "砖块全清啦！得分 " + score + "～", "win");
        }
        break;
      }
    }
  }

  function step() {
    if (!running) return;
    if (keys.left) paddleX -= 5.5;
    if (keys.right) paddleX += 5.5;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));

    ballX += vx;
    ballY += vy;

    if (ballX < BALL_R || ballX > W - BALL_R) vx *= -1;
    if (ballY < BALL_R) vy *= -1;

    const py = H - 36;
    if (
      ballY + BALL_R >= py &&
      ballY + BALL_R <= py + PADDLE_H + 6 &&
      ballX >= paddleX - 2 &&
      ballX <= paddleX + PADDLE_W + 2 &&
      vy > 0
    ) {
      vy = -Math.abs(vy);
      const hit = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
      vx = hit * 3.2;
      // Avoid pure vertical bounce (ball stuck in a column).
      if (Math.abs(vx) < 0.85) vx = hit >= 0 ? 0.85 : -0.85;
    }

    hitBricks();

    if (ballY > H + 20) {
      lives -= 1;
      if (lives <= 0) {
        running = false;
        GamesCommon.submitScore(ID, score);
        refreshBest();
        GamesCommon.showMsg(msg, "小球掉下去啦。得分 " + score + "，再来一局！", "lose");
      } else {
        GamesCommon.showMsg(msg, "还剩 " + lives + " 次机会，继续加油～");
        resetBall();
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#fff8f0");
    g.addColorStop(1, "#ffe8d6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const b of bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      roundRect(b.x, b.y, b.w, b.h, 6);
      ctx.fill();
    }

    ctx.fillStyle = "#2a3140";
    roundRect(paddleX, H - 36, PADDLE_W, PADDLE_H, 8);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#e85d4c";
    ctx.arc(ballX, ballY, BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function loop() {
    step();
    draw();
    if (running) raf = requestAnimationFrame(loop);
  }

  function nudge(dir) {
    if (dir === "left") paddleX -= 28;
    if (dir === "right") paddleX += 28;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, paddleX));
  }

  GamesCommon.bindPad(document.getElementById("pad"), nudge);

  canvas.addEventListener("pointerdown", (e) => canvas.setPointerCapture(e.pointerId));
  canvas.addEventListener("pointermove", (e) => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    paddleX = Math.max(0, Math.min(W - PADDLE_W, x - PADDLE_W / 2));
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") keys.right = false;
  });

  GamesCommon.bindRestart(document.getElementById("restartBtn"), reset);
  reset();
})();
