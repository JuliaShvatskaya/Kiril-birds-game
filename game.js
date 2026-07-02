const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// All changing game data is kept in one object to avoid many globals.
const gameState = {
  width: canvas.width,
  height: canvas.height,
  groundHeight: 60,
  gravity: 1200,
  jumpVelocity: -380,
  pipeSpeed: 220,
  pipeGap: 160,
  pipeWidth: 70,
  pipeSpawnInterval: 1.5,
  parrot: {
    x: 170,
    y: 220,
    width: 54,
    height: 40,
    velocityY: 0,
  },
  pipes: [],
  score: 0,
  pipeTimer: 0,
  lastTime: 0,
  started: false,
  gameOver: false,
};

function init() {
  resetGame();
  window.addEventListener('keydown', handleKeyDown);
  requestAnimationFrame(gameLoop);
}

function resetGame() {
  gameState.parrot.y = 220;
  gameState.parrot.velocityY = 0;
  gameState.pipes = [];
  gameState.score = 0;
  gameState.pipeTimer = 0;
  gameState.lastTime = 0;
  gameState.started = false;
  gameState.gameOver = false;
}

function handleKeyDown(event) {
  if (event.code === 'Space') {
    event.preventDefault();

    if (!gameState.started && !gameState.gameOver) {
      gameState.started = true;
    }

    if (gameState.started && !gameState.gameOver) {
      gameState.parrot.velocityY = gameState.jumpVelocity;
    }
  }

  if (event.code === 'Enter' && gameState.gameOver) {
    resetGame();
  }
}

function update(deltaTime) {
  if (!gameState.started || gameState.gameOver) {
    return;
  }

  // Gravity pulls the parrot down every frame; deltaTime keeps motion stable.
  gameState.parrot.velocityY += gameState.gravity * deltaTime;
  gameState.parrot.y += gameState.parrot.velocityY * deltaTime;

  updatePipes(deltaTime);

  if (checkCollision()) {
    gameState.gameOver = true;
    gameState.started = false;
  }
}

function draw() {
  drawSky();
  drawPipes();
  drawGround();
  drawParrot();
  drawScore();
  drawMessages();
}

function drawSky() {
  ctx.fillStyle = '#9fe3ff';
  ctx.fillRect(0, 0, gameState.width, gameState.height);

  // A few soft clouds make the background friendlier.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  drawCloud(120, 90);
  drawCloud(410, 65);
  drawCloud(665, 120);
}

function drawCloud(x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.arc(x + 24, y - 9, 28, 0, Math.PI * 2);
  ctx.arc(x + 54, y, 21, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround() {
  const groundY = gameState.height - gameState.groundHeight;
  ctx.fillStyle = '#77c84f';
  ctx.fillRect(0, groundY, gameState.width, gameState.groundHeight);
  ctx.fillStyle = '#5a9f39';
  ctx.fillRect(0, groundY, gameState.width, 10);
}

function drawParrot() {
  const bird = gameState.parrot;
  const centerX = bird.x + bird.width / 2;
  const centerY = bird.y + bird.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);

  // Yellow body.
  ctx.fillStyle = '#ffd83d';
  ctx.beginPath();
  ctx.ellipse(0, 4, 27, 19, 0, 0, Math.PI * 2);
  ctx.fill();

  // Red head.
  ctx.fillStyle = '#e73636';
  ctx.beginPath();
  ctx.arc(18, -11, 16, 0, Math.PI * 2);
  ctx.fill();

  // Blue wing.
  ctx.fillStyle = '#2787d8';
  ctx.beginPath();
  ctx.ellipse(-8, 6, 15, 10, -0.45, 0, Math.PI * 2);
  ctx.fill();

  // Orange beak.
  ctx.fillStyle = '#ff9820';
  ctx.beginPath();
  ctx.moveTo(31, -12);
  ctx.lineTo(48, -6);
  ctx.lineTo(31, 1);
  ctx.closePath();
  ctx.fill();

  // Black eye.
  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(22, -16, 3, 0, Math.PI * 2);
  ctx.fill();

  // Small tail feathers.
  ctx.fillStyle = '#2fa84f';
  ctx.beginPath();
  ctx.moveTo(-25, 4);
  ctx.lineTo(-43, -7);
  ctx.lineTo(-34, 12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function createPipe() {
  const groundTop = gameState.height - gameState.groundHeight;
  const minTopHeight = 45;
  const maxTopHeight = groundTop - gameState.pipeGap - 45;
  const topHeight = minTopHeight + Math.random() * (maxTopHeight - minTopHeight);

  gameState.pipes.push({
    x: gameState.width,
    topHeight,
    bottomY: topHeight + gameState.pipeGap,
    passed: false,
  });
}

function updatePipes(deltaTime) {
  gameState.pipeTimer += deltaTime;

  if (gameState.pipeTimer >= gameState.pipeSpawnInterval) {
    createPipe();
    gameState.pipeTimer = 0;
  }

  for (const pipe of gameState.pipes) {
    pipe.x -= gameState.pipeSpeed * deltaTime;

    if (!pipe.passed && pipe.x + gameState.pipeWidth < gameState.parrot.x) {
      pipe.passed = true;
      gameState.score += 1;
    }
  }

  gameState.pipes = gameState.pipes.filter(pipe => pipe.x + gameState.pipeWidth > 0);
}

function drawPipes() {
  const groundTop = gameState.height - gameState.groundHeight;

  for (const pipe of gameState.pipes) {
    ctx.fillStyle = '#20a93f';
    ctx.fillRect(pipe.x, 0, gameState.pipeWidth, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, gameState.pipeWidth, groundTop - pipe.bottomY);

    // Darker caps help the columns look like Flappy Bird pipes.
    ctx.fillStyle = '#168331';
    ctx.fillRect(pipe.x - 6, pipe.topHeight - 20, gameState.pipeWidth + 12, 20);
    ctx.fillRect(pipe.x - 6, pipe.bottomY, gameState.pipeWidth + 12, 20);
  }
}

function checkCollision() {
  const bird = gameState.parrot;
  const groundTop = gameState.height - gameState.groundHeight;

  if (bird.y <= 0 || bird.y + bird.height >= groundTop) {
    return true;
  }

  for (const pipe of gameState.pipes) {
    const insidePipeX = bird.x < pipe.x + gameState.pipeWidth && bird.x + bird.width > pipe.x;
    const hitsTopPipe = bird.y < pipe.topHeight;
    const hitsBottomPipe = bird.y + bird.height > pipe.bottomY;

    if (insidePipeX && (hitsTopPipe || hitsBottomPipe)) {
      return true;
    }
  }

  return false;
}

function drawScore() {
  ctx.fillStyle = '#21415a';
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${gameState.score}`, 24, 40);
}

function drawMessages() {
  ctx.textAlign = 'center';

  if (!gameState.started && !gameState.gameOver) {
    ctx.fillStyle = '#21415a';
    ctx.font = 'bold 34px Arial';
    ctx.fillText('Press Space to Start', gameState.width / 2, gameState.height / 2);
  }

  if (gameState.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, gameState.width, gameState.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('Game Over', gameState.width / 2, gameState.height / 2 - 22);
    ctx.font = 'bold 26px Arial';
    ctx.fillText('Press Enter to Restart', gameState.width / 2, gameState.height / 2 + 24);
  }
}

function gameLoop(timestamp) {
  if (!gameState.lastTime) {
    gameState.lastTime = timestamp;
  }

  const deltaTime = Math.min((timestamp - gameState.lastTime) / 1000, 0.05);
  gameState.lastTime = timestamp;

  update(deltaTime);
  draw();
  requestAnimationFrame(gameLoop);
}

init();
