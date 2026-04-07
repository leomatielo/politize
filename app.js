const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const messageEl = document.getElementById("message");

const world = {
  gravity: 0.55,
  friction: 0.82,
  width: canvas.width,
  height: canvas.height,
};

const keys = {
  left: false,
  right: false,
  jump: false,
};

const player = {
  x: 60,
  y: 320,
  w: 34,
  h: 56,
  vx: 0,
  vy: 0,
  speed: 0.95,
  jumpPower: 12,
  onGround: false,
  facing: 1,
  lives: 3,
  invincible: 0,
};

const level = {
  platforms: [
    { x: 0, y: 500, w: 960, h: 40 },
    { x: 120, y: 430, w: 150, h: 24 },
    { x: 320, y: 375, w: 140, h: 24 },
    { x: 520, y: 315, w: 130, h: 24 },
    { x: 710, y: 255, w: 180, h: 24 },
    { x: 710, y: 420, w: 180, h: 24 },
  ],
  goal: { x: 900, y: 445, w: 26, h: 55 },
};

const provolones = [
  { x: 165, y: 390, r: 13, taken: false },
  { x: 390, y: 335, r: 13, taken: false },
  { x: 585, y: 275, r: 13, taken: false },
  { x: 805, y: 215, r: 13, taken: false },
  { x: 845, y: 380, r: 13, taken: false },
];

const enemies = [
  { x: 350, y: 348, w: 30, h: 27, minX: 325, maxX: 430, vx: 1.5 },
  { x: 735, y: 228, w: 30, h: 27, minX: 720, maxX: 845, vx: -1.6 },
  { x: 740, y: 393, w: 30, h: 27, minX: 720, maxX: 850, vx: 1.2 },
];

let score = 0;
let gameOver = false;
let won = false;

function setMessage(text, color = "#fbbf24") {
  messageEl.textContent = text;
  messageEl.style.color = color;
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resetPlayerPosition() {
  player.x = 60;
  player.y = 320;
  player.vx = 0;
  player.vy = 0;
}

function restartGame() {
  score = 0;
  player.lives = 3;
  gameOver = false;
  won = false;
  resetPlayerPosition();
  provolones.forEach((item) => {
    item.taken = false;
  });
  setMessage("Boa sorte!");
}

function handleInput() {
  if (keys.left) {
    player.vx -= player.speed;
    player.facing = -1;
  }
  if (keys.right) {
    player.vx += player.speed;
    player.facing = 1;
  }
  if (keys.jump && player.onGround) {
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}

function updatePlayer() {
  player.vy += world.gravity;
  player.vx *= world.friction;

  if (Math.abs(player.vx) < 0.02) {
    player.vx = 0;
  }

  player.x += player.vx;
  player.y += player.vy;

  if (player.x < 0) {
    player.x = 0;
    player.vx = 0;
  }
  if (player.x + player.w > world.width) {
    player.x = world.width - player.w;
    player.vx = 0;
  }

  player.onGround = false;
  for (const plat of level.platforms) {
    const prevBottom = player.y + player.h - player.vy;
    const currBottom = player.y + player.h;

    if (
      player.x + player.w > plat.x &&
      player.x < plat.x + plat.w &&
      prevBottom <= plat.y &&
      currBottom >= plat.y
    ) {
      player.y = plat.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  if (player.y > world.height + 80) {
    loseLife("Você caiu! Cuidado com os pulos.");
  }

  if (player.invincible > 0) {
    player.invincible -= 1;
  }
}

function updateCollectables() {
  for (const cheese of provolones) {
    if (cheese.taken) continue;
    const dx = player.x + player.w / 2 - cheese.x;
    const dy = player.y + player.h / 2 - cheese.y;
    if (Math.hypot(dx, dy) < cheese.r + 16) {
      cheese.taken = true;
      score += 1;
      setMessage("Provolone coletado! 🧀", "#fde047");
    }
  }
}

function updateEnemies() {
  for (const enemy of enemies) {
    enemy.x += enemy.vx;
    if (enemy.x < enemy.minX || enemy.x + enemy.w > enemy.maxX) {
      enemy.vx *= -1;
    }

    if (
      player.invincible === 0 &&
      rectsOverlap(player, enemy)
    ) {
      loseLife("Ai! Você encostou num inimigo.");
      player.invincible = 80;
    }
  }
}

function loseLife(reason) {
  if (gameOver || won) return;
  player.lives -= 1;
  setMessage(reason, "#fb7185");
  if (player.lives <= 0) {
    player.lives = 0;
    gameOver = true;
    setMessage("Fim de jogo! Pressione R para recomeçar.", "#ef4444");
  }
  resetPlayerPosition();
}

function checkWin() {
  const allCollected = provolones.every((item) => item.taken);
  if (allCollected && rectsOverlap(player, level.goal)) {
    won = true;
    setMessage("Você venceu! Pressione R para jogar de novo.", "#22c55e");
  }
}

function drawSky() {
  const grad = ctx.createLinearGradient(0, 0, 0, world.height);
  grad.addColorStop(0, "#93c5fd");
  grad.addColorStop(1, "#dbeafe");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let i = 0; i < 5; i += 1) {
    const x = 60 + i * 180;
    const y = 60 + (i % 2) * 25;
    ctx.beginPath();
    ctx.arc(x, y, 24, 0, Math.PI * 2);
    ctx.arc(x + 25, y + 5, 20, 0, Math.PI * 2);
    ctx.arc(x - 22, y + 6, 16, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlatforms() {
  for (const plat of level.platforms) {
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    ctx.fillStyle = "#166534";
    ctx.fillRect(plat.x, plat.y + plat.h - 8, plat.w, 8);
  }
}

function drawGoal() {
  ctx.fillStyle = "#6b7280";
  ctx.fillRect(level.goal.x, level.goal.y, 4, level.goal.h);

  ctx.fillStyle = provolones.every((item) => item.taken) ? "#22c55e" : "#94a3b8";
  ctx.beginPath();
  ctx.moveTo(level.goal.x + 4, level.goal.y + 3);
  ctx.lineTo(level.goal.x + 25, level.goal.y + 11);
  ctx.lineTo(level.goal.x + 4, level.goal.y + 19);
  ctx.closePath();
  ctx.fill();
}

function drawProvolone(item) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.arc(0, 0, item.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.arc(-4, -3, 3, 0, Math.PI * 2);
  ctx.arc(4, 4, 2.6, 0, Math.PI * 2);
  ctx.arc(2, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEnemy(enemy) {
  ctx.fillStyle = "#b91c1c";
  ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  ctx.fillStyle = "white";
  ctx.fillRect(enemy.x + 6, enemy.y + 7, 5, 5);
  ctx.fillRect(enemy.x + 18, enemy.y + 7, 5, 5);
}

function drawPlayer() {
  const blink = player.invincible > 0 && Math.floor(player.invincible / 6) % 2 === 0;
  if (blink) return;

  const px = player.x;
  const py = player.y;

  ctx.fillStyle = "#2f1d14";
  ctx.beginPath();
  ctx.arc(px + 17, py + 11, 13, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f3d1b0";
  ctx.fillRect(px + 7, py + 12, 20, 16);

  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + 12, py + 19, 4, 0, Math.PI * 2);
  ctx.arc(px + 22, py + 19, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(px + 16, py + 19);
  ctx.lineTo(px + 18, py + 19);
  ctx.stroke();

  ctx.fillStyle = "#374151";
  ctx.fillRect(px + 8, py + 28, 18, 18);
  ctx.fillStyle = "#111827";
  ctx.fillRect(px + 8, py + 46, 8, 10);
  ctx.fillRect(px + 18, py + 46, 8, 10);

  const legSwing = Math.sin(Date.now() / 120) * (player.vx !== 0 ? 2 : 0);
  ctx.fillStyle = "#111827";
  ctx.fillRect(px + 8 + legSwing, py + 46, 8, 10);
  ctx.fillRect(px + 18 - legSwing, py + 46, 8, 10);

  ctx.fillStyle = "#2f1d14";
  ctx.fillRect(px + 13, py + 24, 8, 2);
}

function render() {
  drawSky();
  drawPlatforms();
  drawGoal();

  for (const cheese of provolones) {
    if (!cheese.taken) {
      drawProvolone(cheese);
    }
  }

  for (const enemy of enemies) {
    drawEnemy(enemy);
  }

  drawPlayer();
}

function updateHud() {
  scoreEl.textContent = `Provolones: ${score}/${provolones.length}`;
  livesEl.textContent = `Vidas: ${player.lives}`;
}

function gameLoop() {
  if (!gameOver && !won) {
    handleInput();
    updatePlayer();
    updateCollectables();
    updateEnemies();
    checkWin();
  }

  render();
  updateHud();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }
  if (
    event.key === "ArrowUp" ||
    event.key === " " ||
    event.key.toLowerCase() === "w"
  ) {
    keys.jump = true;
  }
  if (event.key.toLowerCase() === "r") {
    restartGame();
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }
  if (
    event.key === "ArrowUp" ||
    event.key === " " ||
    event.key.toLowerCase() === "w"
  ) {
    keys.jump = false;
  }
});

setMessage("Colete todos os provolones e vá até a bandeira!");
updateHud();
gameLoop();
