/**
 * Logic playtests for kids games (no browser).
 * Run from repo root: node frontend/scripts/games/playtest-logic.mjs
 */
import assert from "node:assert/strict";

// —— Tic-tac-toe AI (mirror of public/games/js/tictactoe.js) ——
const YOU = "O";
const AI = "X";
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

{
  const b = ["O", "O", "", "", "X", "", "", "", ""];
  assert.equal(aiMove(b), 2, "AI should block top row");
}
{
  const b = ["X", "X", "", "O", "O", "", "", "", ""];
  assert.equal(aiMove(b), 2, "AI should complete its row");
}
for (let g = 0; g < 50; g++) {
  let board = Array(9).fill("");
  let turn = YOU;
  let guard = 0;
  while (!winner(board) && guard < 20) {
    guard += 1;
    if (turn === YOU) {
      const free = empties(board);
      board[free[(Math.random() * free.length) | 0]] = YOU;
      turn = AI;
    } else {
      const m = aiMove(board);
      assert.ok(m >= 0 && !board[m], "AI plays empty cell");
      board[m] = AI;
      turn = YOU;
    }
  }
  assert.ok(winner(board), "game ends");
}
console.log("OK   tictactoe AI playtests");

const FACES = ["🌟", "🎈", "🐱", "🌈", "🍎", "🎵"];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
for (let i = 0; i < 20; i++) {
  const deck = shuffle(FACES.concat(FACES));
  assert.equal(deck.length, 12);
  for (const f of FACES) {
    assert.equal(deck.filter((x) => x === f).length, 2, `pair count for ${f}`);
  }
}
console.log("OK   flip deck pairs");

function validateGuess(n) {
  return Number.isInteger(n) && n >= 1 && n <= 50;
}
assert.equal(validateGuess(1), true);
assert.equal(validateGuess(50), true);
assert.equal(validateGuess(0), false);
assert.equal(validateGuess(51), false);
assert.equal(validateGuess(1.5), false);
console.log("OK   guess bounds");

function bounceVx(ballX, paddleX, PADDLE_W = 88) {
  const hit = (ballX - (paddleX + PADDLE_W / 2)) / (PADDLE_W / 2);
  let vx = hit * 3.2;
  if (Math.abs(vx) < 0.85) vx = hit >= 0 ? 0.85 : -0.85;
  return vx;
}
assert.ok(Math.abs(bounceVx(100, 100 - 44)) >= 0.85);
console.log("OK   breakout vx floor");

console.log("\nAll logic playtests passed.");
