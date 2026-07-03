const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const SAVE_KEY = 'parrotJump.save';
const LEADERBOARD_PREFIX = 'parrotJump.leaderboard.';
const DEFAULT_SKINS = ['parrot_red', 'parrot_blue', 'parrot_yellow'];

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getCurrentSeason() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

class SaveManager {
  constructor() {
    this.data = this.load();
  }

  getDefaults() {
    return {
      version: 2,
      gems: 0,
      unlockedSkins: [...DEFAULT_SKINS],
      selectedSkinId: 'parrot_red',
      bestScore: 0,
      playerName: 'Player',
      lastSeason: getCurrentSeason(),
      claimedRewardsBySeason: [],
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const defaults = this.getDefaults();
      return {
        ...defaults,
        ...parsed,
        version: 2,
        gems: Number.isFinite(parsed.gems) ? parsed.gems : defaults.gems,
        unlockedSkins: Array.isArray(parsed.unlockedSkins)
          ? [...new Set([...DEFAULT_SKINS, ...parsed.unlockedSkins])]
          : defaults.unlockedSkins,
        claimedRewardsBySeason: Array.isArray(parsed.claimedRewardsBySeason) ? parsed.claimedRewardsBySeason : [],
        playerName: typeof parsed.playerName === 'string' && parsed.playerName.trim() ? parsed.playerName.trim() : 'Player',
      };
    } catch (error) {
      console.warn('Save data is broken. Falling back to defaults.', error);
      return this.getDefaults();
    }
  }

  save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  hasSkin(id) { return this.data.unlockedSkins.includes(id); }
  unlockSkin(id) { if (!this.hasSkin(id)) this.data.unlockedSkins.push(id); this.save(); }
  spendGems(amount) { if (this.data.gems < amount) return false; this.data.gems -= amount; this.save(); return true; }
  addGems(amount) { this.data.gems += amount; this.save(); }
}

class SkinManager {
  constructor(saveManager) {
    this.saveManager = saveManager;
    this.skins = [
      { id: 'parrot_red', name: 'Parrot Red', type: 'parrot', priceGems: 0, rewardOnly: false, colors: { body: '#ffd83d', head: '#e73636', wing: '#2787d8' } },
      { id: 'parrot_blue', name: 'Parrot Blue', type: 'parrot', priceGems: 0, rewardOnly: false, colors: { body: '#7cc9ff', head: '#2787d8', wing: '#ffd83d' } },
      { id: 'parrot_yellow', name: 'Parrot Yellow', type: 'parrot', priceGems: 0, rewardOnly: false, colors: { body: '#ffe76a', head: '#ffba28', wing: '#2fa84f' } },
      { id: 'owl', name: 'Owl', type: 'owl', priceGems: 5, rewardOnly: false },
      { id: 'square_bee', name: 'Square Bee', type: 'bee', priceGems: 5, rewardOnly: false },
      { id: 'white_owl', name: 'White Owl', type: 'owl', priceGems: null, rewardOnly: true },
    ];
    if (!this.isUnlocked(this.saveManager.data.selectedSkinId)) {
      this.saveManager.data.selectedSkinId = 'parrot_red';
      this.saveManager.save();
    }
  }

  getAll() { return this.skins; }
  getSelected() { return this.skins.find(skin => skin.id === this.saveManager.data.selectedSkinId) || this.skins[0]; }
  isUnlocked(id) { return this.saveManager.hasSkin(id); }
  select(id) { if (!this.isUnlocked(id)) return false; this.saveManager.data.selectedSkinId = id; this.saveManager.save(); return true; }

  draw(ctx, x, y, size, skin = this.getSelected()) {
    if (skin.type === 'bee') return this.drawBee(ctx, x, y, size);
    if (skin.id === 'owl' || skin.id === 'white_owl') return this.drawOwl(ctx, x, y, size, skin.id === 'white_owl');
    return this.drawParrot(ctx, x, y, size, skin.colors);
  }

  drawParrot(ctx, x, y, size, colors) {
    ctx.save(); ctx.translate(x, y); const s = size / 54;
    ctx.scale(s, s);
    ctx.fillStyle = colors.body; ctx.beginPath(); ctx.ellipse(0, 5, 27, 19, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.head; ctx.beginPath(); ctx.arc(18, -11, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = colors.wing; ctx.beginPath(); ctx.ellipse(-8, 6, 15, 10, -0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9820'; ctx.beginPath(); ctx.moveTo(31, -12); ctx.lineTo(48, -6); ctx.lineTo(31, 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(22, -16, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2fa84f'; ctx.beginPath(); ctx.moveTo(-25, 4); ctx.lineTo(-43, -7); ctx.lineTo(-34, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  drawOwl(ctx, x, y, size, white = false) {
    ctx.save(); ctx.translate(x, y); const s = size / 54; ctx.scale(s, s);
    ctx.fillStyle = white ? '#f8fbff' : '#8b5a32'; ctx.beginPath(); ctx.ellipse(0, 0, 25, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = white ? '#dfe8ef' : '#6c3f21'; ctx.beginPath(); ctx.arc(-13, -16, 13, Math.PI, 0); ctx.arc(13, -16, 13, Math.PI, 0); ctx.fill();
    ctx.fillStyle = white ? '#111' : '#ff8a22'; [-9, 9].forEach(px => { ctx.beginPath(); ctx.arc(px, -5, 6, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#111'; [-9, 9].forEach(px => { ctx.beginPath(); ctx.arc(px, -5, 2.4, 0, Math.PI * 2); ctx.fill(); });
    ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(8, 12); ctx.lineTo(-8, 12); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  drawBee(ctx, x, y, size) {
    ctx.save(); ctx.translate(x, y); const s = size / 54; ctx.scale(s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.78)'; ctx.fillRect(-31, -18, 15, 20); ctx.fillRect(16, -18, 15, 20);
    ['#6b421f', '#ffd83d', '#6b421f', '#ffd83d'].forEach((color, i) => { ctx.fillStyle = color; ctx.fillRect(-24 + i * 12, -22, 12, 44); });
    ctx.strokeStyle = '#33210f'; ctx.lineWidth = 3; ctx.strokeRect(-24, -22, 48, 44);
    ctx.fillStyle = '#111'; ctx.fillRect(8, -10, 5, 5); ctx.fillRect(8, 6, 5, 5);
    ctx.restore();
  }
}

class LeaderboardManager {
  getSeasonKey(season) { return `${LEADERBOARD_PREFIX}${season}`; }
  getEntries(season = getCurrentSeason()) { try { return JSON.parse(localStorage.getItem(this.getSeasonKey(season))) || []; } catch { return []; } }
  saveEntries(season, entries) { localStorage.setItem(this.getSeasonKey(season), JSON.stringify(entries.slice(0, 100))); }
  addEntry(entry) { const entries = [...this.getEntries(entry.season), entry].sort((a, b) => b.score - a.score || b.timeSeconds - a.timeSeconds); this.saveEntries(entry.season, entries); }
}

class SeasonManager {
  constructor(saveManager, leaderboardManager, notify) { this.saveManager = saveManager; this.leaderboardManager = leaderboardManager; this.notify = notify; }
  checkSeason() {
    const current = getCurrentSeason();
    const previous = this.saveManager.data.lastSeason;
    if (!previous) { this.saveManager.data.lastSeason = current; this.saveManager.save(); return; }
    if (previous !== current) {
      this.claimReward(previous);
      this.saveManager.data.lastSeason = current;
      this.saveManager.save();
    }
  }
  claimReward(season) {
    if (this.saveManager.data.claimedRewardsBySeason.includes(season)) return;
    const name = this.saveManager.data.playerName || 'Player';
    const top100 = this.leaderboardManager.getEntries(season).slice(0, 100);
    if (top100.some(entry => entry.name === name)) {
      this.saveManager.unlockSkin('white_owl');
      this.notify('Congratulations! You finished Top 100! White Owl unlocked!');
    }
    this.saveManager.data.claimedRewardsBySeason.push(season);
    this.saveManager.save();
  }
}

class UIManager {
  constructor(saveManager, skinManager, leaderboardManager) {
    this.saveManager = saveManager; this.skinManager = skinManager; this.leaderboardManager = leaderboardManager;
    this.scoreLabel = document.getElementById('scoreLabel'); this.timeLabel = document.getElementById('timeLabel');
    this.gemsLabel = document.getElementById('gemsLabel'); this.bestLabel = document.getElementById('bestLabel');
    this.toast = document.getElementById('toast'); this.shopOverlay = document.getElementById('shopOverlay'); this.leaderboardOverlay = document.getElementById('leaderboardOverlay');
    this.shopGrid = document.getElementById('shopGrid'); this.shopMessage = document.getElementById('shopMessage');
    this.leaderboardList = document.getElementById('leaderboardList'); this.leaderboardSeason = document.getElementById('leaderboardSeason');
    this.nameForm = document.getElementById('gameOverForm'); this.nameInput = document.getElementById('playerNameInput');
    this.overlayOpen = false;
  }

  bind(game) {
    document.getElementById('shopButton').addEventListener('click', () => this.openShop(game));
    document.getElementById('leaderboardButton').addEventListener('click', () => this.openLeaderboard(game));
    document.getElementById('fullscreenButton').addEventListener('click', () => this.toggleFullscreen());
    document.getElementById('shopCloseButton').addEventListener('click', () => this.closeOverlays(game));
    document.getElementById('leaderboardCloseButton').addEventListener('click', () => this.closeOverlays(game));
    this.shopOverlay.addEventListener('click', event => { if (event.target === this.shopOverlay) this.closeOverlays(game); });
    this.leaderboardOverlay.addEventListener('click', event => { if (event.target === this.leaderboardOverlay) this.closeOverlays(game); });
    this.nameInput.value = this.saveManager.data.playerName;
    this.nameInput.addEventListener('input', () => { this.saveManager.data.playerName = this.nameInput.value.trim() || 'Player'; this.saveManager.save(); });
  }

  updateHud(score, seconds) {
    this.scoreLabel.textContent = `Score: ${score}`; this.timeLabel.textContent = `Time: ${formatTime(seconds)}`;
    this.gemsLabel.textContent = `💎 Gems: ${this.saveManager.data.gems}`; this.bestLabel.textContent = `Best: ${this.saveManager.data.bestScore}`;
  }

  showToast(message) { this.toast.textContent = message; this.toast.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toast.classList.remove('show'), 3200); }
  setGameOverForm(visible) { this.nameForm.classList.toggle('hidden', !visible); if (visible) this.nameInput.value = this.saveManager.data.playerName; }

  openShop(game) { game.pauseForOverlay(); this.overlayOpen = true; this.renderShop(game); this.shopOverlay.classList.remove('hidden'); }
  renderShop(game) {
    this.shopMessage.textContent = `Balance: ${this.saveManager.data.gems} gems`;
    this.shopGrid.innerHTML = '';
    for (const skin of this.skinManager.getAll()) {
      const card = document.createElement('div'); card.className = 'skin-card';
      const preview = document.createElement('canvas'); preview.className = 'skin-preview'; preview.width = 94; preview.height = 74;
      this.skinManager.draw(preview.getContext('2d'), 47, 38, 48, skin);
      const title = document.createElement('strong'); title.textContent = skin.name;
      const status = document.createElement('div'); status.className = 'skin-status';
      const button = document.createElement('button'); const unlocked = this.skinManager.isUnlocked(skin.id); const selected = this.saveManager.data.selectedSkinId === skin.id;
      if (selected) { status.textContent = 'Selected'; button.textContent = 'Selected'; button.disabled = true; }
      else if (unlocked) { status.textContent = 'Select'; button.textContent = 'Select'; button.addEventListener('click', () => { this.skinManager.select(skin.id); this.renderShop(game); }); }
      else if (skin.rewardOnly) { status.textContent = 'Reward only'; button.textContent = 'Locked'; button.disabled = true; }
      else { status.textContent = `Buy: ${skin.priceGems} gems`; button.textContent = 'Buy'; button.addEventListener('click', () => { if (this.saveManager.spendGems(skin.priceGems)) { this.saveManager.unlockSkin(skin.id); this.skinManager.select(skin.id); } else this.shopMessage.textContent = 'Not enough gems'; this.renderShop(game); }); }
      card.append(preview, title, status, button); this.shopGrid.append(card);
    }
  }

  openLeaderboard(game) { game.pauseForOverlay(); this.overlayOpen = true; this.renderLeaderboard(); this.leaderboardOverlay.classList.remove('hidden'); }
  renderLeaderboard() {
    const season = getCurrentSeason(); const entries = this.leaderboardManager.getEntries(season);
    this.leaderboardSeason.textContent = `Current season: ${season} · Top 100 local scores`;
    this.leaderboardList.innerHTML = '<div class="leaderboard-row"><span>#</span><span>Name</span><span>Score</span><span>Time</span><span>Date</span></div>';
    if (!entries.length) this.leaderboardList.insertAdjacentHTML('beforeend', '<p>No scores yet. Play a run!</p>');
    entries.forEach((entry, index) => {
      const row = document.createElement('div'); row.className = 'leaderboard-row';
      [index + 1, entry.name, entry.score, formatTime(entry.timeSeconds), new Date(entry.date).toLocaleDateString()].forEach(value => {
        const cell = document.createElement('span');
        cell.textContent = value;
        row.append(cell);
      });
      this.leaderboardList.append(row);
    });
  }

  closeOverlays(game) { this.shopOverlay.classList.add('hidden'); this.leaderboardOverlay.classList.add('hidden'); this.overlayOpen = false; game.resumeFromOverlay(); }
  toggleFullscreen() { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); else if (document.exitFullscreen) document.exitFullscreen(); }
}

class Game {
  constructor(saveManager, skinManager, leaderboardManager, uiManager) {
    this.saveManager = saveManager; this.skinManager = skinManager; this.leaderboardManager = leaderboardManager; this.uiManager = uiManager;
    this.groundHeight = 72; this.gravity = 1200; this.jumpVelocity = -410; this.obstacleSpeed = 230; this.obstacleGap = 185; this.obstacleWidth = 76; this.spawnInterval = 1.45;
    this.parrot = { x: 170, y: 220, width: 54, height: 44, velocityY: 0 };
    this.obstacles = []; this.score = 0; this.obstacleTimer = 0; this.lastTime = 0; this.started = false; this.gameOver = false; this.paused = false; this.survivalSeconds = 0; this.lastGemAwardScore = 0; this.scoreSaved = false;
  }

  resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; this.parrot.x = Math.max(110, Math.min(190, canvas.width * 0.2)); }
  reset() { Object.assign(this.parrot, { y: canvas.height * 0.42, velocityY: 0 }); this.obstacles = []; this.score = 0; this.obstacleTimer = 0; this.started = false; this.gameOver = false; this.paused = false; this.survivalSeconds = 0; this.lastGemAwardScore = 0; this.scoreSaved = false; this.uiManager.setGameOverForm(false); }
  start() { this.started = true; this.paused = false; }
  jump() { this.parrot.velocityY = this.jumpVelocity; }
  pauseForOverlay() { this.paused = true; }
  resumeFromOverlay() { this.paused = false; this.lastTime = 0; }

  handleKeyDown(event) {
    if (event.code === 'Escape' && this.uiManager.overlayOpen) { event.preventDefault(); this.uiManager.closeOverlays(this); return; }
    if (event.code === 'Space') { event.preventDefault(); if (!this.started && !this.gameOver) this.start(); if (this.started && !this.gameOver && !this.paused) this.jump(); }
    if (event.code === 'Enter' && this.gameOver) { event.preventDefault(); this.reset(); }
  }

  update(deltaTime) {
    if (!this.started || this.gameOver || this.paused) return;
    this.survivalSeconds += deltaTime;
    this.parrot.velocityY += this.gravity * deltaTime; this.parrot.y += this.parrot.velocityY * deltaTime;
    this.updateObstacles(deltaTime);
    if (this.checkCollision()) this.endGame();
  }

  createObstacle() {
    const groundTop = canvas.height - this.groundHeight; const minTop = 60; const maxTop = Math.max(minTop + 1, groundTop - this.obstacleGap - 70); const topHeight = minTop + Math.random() * (maxTop - minTop);
    this.obstacles.push({ x: canvas.width, topHeight, bottomY: topHeight + this.obstacleGap, passed: false });
  }

  updateObstacles(deltaTime) {
    this.obstacleTimer += deltaTime; if (this.obstacleTimer >= this.spawnInterval) { this.createObstacle(); this.obstacleTimer = 0; }
    for (const obstacle of this.obstacles) {
      obstacle.x -= this.obstacleSpeed * deltaTime;
      if (!obstacle.passed && obstacle.x + this.obstacleWidth < this.parrot.x) { obstacle.passed = true; this.score += 1; this.awardGems(); }
    }
    this.obstacles = this.obstacles.filter(obstacle => obstacle.x + this.obstacleWidth > 0);
  }

  awardGems() { const threshold = Math.floor(this.score / 10) * 10; if (threshold > 0 && threshold > this.lastGemAwardScore) { this.lastGemAwardScore = threshold; this.saveManager.addGems(1); this.uiManager.showToast('+1 gem earned!'); } }

  endGame() {
    this.gameOver = true; this.started = false; this.paused = false; this.uiManager.setGameOverForm(true);
    if (this.score > this.saveManager.data.bestScore) { this.saveManager.data.bestScore = this.score; this.saveManager.save(); }
    if (!this.scoreSaved && this.score > 0) {
      const name = this.saveManager.data.playerName || 'Player';
      this.leaderboardManager.addEntry({ name, score: this.score, timeSeconds: Math.floor(this.survivalSeconds), date: new Date().toISOString(), season: getCurrentSeason() });
      this.scoreSaved = true;
    }
  }

  checkCollision() {
    const bird = this.parrot; const groundTop = canvas.height - this.groundHeight;
    if (bird.y <= 0 || bird.y + bird.height >= groundTop) return true;
    return this.obstacles.some(obstacle => bird.x < obstacle.x + this.obstacleWidth && bird.x + bird.width > obstacle.x && (bird.y < obstacle.topHeight || bird.y + bird.height > obstacle.bottomY));
  }

  draw() { this.drawSky(); this.drawObstacles(); this.drawGround(); this.drawCharacter(); this.drawMessages(); this.uiManager.updateHud(this.score, Math.floor(this.survivalSeconds)); }
  drawSky() { ctx.fillStyle = '#9fe3ff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'rgba(255,255,255,0.82)'; [[canvas.width*.16,90],[canvas.width*.48,70],[canvas.width*.78,125]].forEach(([x,y]) => this.drawCloud(x,y)); }
  drawCloud(x, y) { ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.arc(x + 24, y - 9, 28, 0, Math.PI * 2); ctx.arc(x + 54, y, 21, 0, Math.PI * 2); ctx.fill(); }
  drawGround() { const y = canvas.height - this.groundHeight; ctx.fillStyle = '#77c84f'; ctx.fillRect(0, y, canvas.width, this.groundHeight); ctx.fillStyle = '#5a9f39'; ctx.fillRect(0, y, canvas.width, 11); }
  drawCharacter() { this.skinManager.draw(ctx, this.parrot.x + this.parrot.width / 2, this.parrot.y + this.parrot.height / 2, this.parrot.width); }
  drawObstacles() { const groundTop = canvas.height - this.groundHeight; for (const o of this.obstacles) { this.drawTree(o.x, 0, this.obstacleWidth, o.topHeight, true); this.drawTree(o.x, o.bottomY, this.obstacleWidth, groundTop - o.bottomY, false); } }
  drawTree(x, y, width, height, inverted) {
    const trunkW = width * 0.34; const trunkX = x + width / 2 - trunkW / 2; ctx.fillStyle = '#8b5a32'; ctx.fillRect(trunkX, y, trunkW, height);
    ctx.fillStyle = '#2f8f3a'; const crownY = inverted ? y + height - 18 : y + 18; const layers = Math.max(2, Math.floor(height / 55));
    for (let i = 0; i < layers; i += 1) { const cy = inverted ? crownY - i * 28 : crownY + i * 28; ctx.beginPath(); ctx.ellipse(x + width / 2, cy, width * 0.58, 25, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#226d2c'; ctx.beginPath(); ctx.ellipse(x + width / 2, inverted ? y + height : y, width * 0.62, 22, 0, 0, Math.PI * 2); ctx.fill();
  }
  drawMessages() {
    ctx.textAlign = 'center';
    if (!this.started && !this.gameOver) { ctx.fillStyle = '#21415a'; ctx.font = `bold ${Math.max(30, canvas.width * 0.035)}px Arial`; ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2); ctx.font = 'bold 20px Arial'; ctx.fillText(`Selected: ${this.skinManager.getSelected().name}`, canvas.width / 2, canvas.height / 2 + 42); }
    if (this.gameOver) { ctx.fillStyle = 'rgba(0,0,0,0.48)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#fff'; ctx.font = 'bold 52px Arial'; ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 72); ctx.font = 'bold 25px Arial'; ctx.fillText(`Score: ${this.score} · Time: ${formatTime(this.survivalSeconds)} · Best: ${this.saveManager.data.bestScore}`, canvas.width / 2, canvas.height / 2 - 28); ctx.fillText('Press Enter to Restart', canvas.width / 2, canvas.height / 2 + 28); }
  }
}

const saveManager = new SaveManager();
const skinManager = new SkinManager(saveManager);
const leaderboardManager = new LeaderboardManager();
const uiManager = new UIManager(saveManager, skinManager, leaderboardManager);
const seasonManager = new SeasonManager(saveManager, leaderboardManager, message => uiManager.showToast(message));
const game = new Game(saveManager, skinManager, leaderboardManager, uiManager);

function gameLoop(timestamp) {
  if (!game.lastTime) game.lastTime = timestamp;
  const deltaTime = Math.min((timestamp - game.lastTime) / 1000, 0.05); game.lastTime = timestamp;
  game.update(deltaTime); game.draw(); requestAnimationFrame(gameLoop);
}

window.addEventListener('resize', () => game.resizeCanvas());
window.addEventListener('keydown', event => game.handleKeyDown(event));
uiManager.bind(game);
seasonManager.checkSeason();
game.resizeCanvas();
game.reset();
requestAnimationFrame(gameLoop);
