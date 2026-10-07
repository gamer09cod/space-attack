"use strict";

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

if (!context) {
  throw new Error("Space Attack requires a browser with Canvas 2D support.");
}

let previousTime = null;
const MAX_FUEL = 100;
const FUEL_DRAIN_RATE = 1; // Fuel units per second.
const LOW_FUEL_THRESHOLD = 0.25; // Fraction of maximum fuel.
const FUEL_DROP_CHANCE = 0.15;
const FUEL_PICKUP_AMOUNT = 25;
const FUEL_PICKUP_SPEED = 100; // Pixels per second.
const MAX_FUEL_PICKUPS = 24;
const BASE_ENEMY_DOWN_SPEED = 80;
const ENEMY_DOWN_SPEED_PER_WAVE = 8;
const MAX_ENEMY_DOWN_SPEED = 140;
const ENEMY_DIVE_INTERVAL = 1.5; // Pause before the first/next solo attacker.
const FORMATION_SPEED = 35; // Slower than solo attackers; pixels per second.
const BASE_FORMATION_DOWN_SPEED = 4;
const FORMATION_DOWN_SPEED_PER_WAVE = 1;
const MAX_FORMATION_DOWN_SPEED = 12;
let formationDirection = 1;
let enemyDiveRemaining = ENEMY_DIVE_INTERVAL;
const BASE_ZIGZAG_AMPLITUDE = 35;
const ZIGZAG_AMPLITUDE_PER_WAVE = 4;
const MAX_ZIGZAG_AMPLITUDE = 60;
const BASE_ZIGZAG_FREQUENCY = 1.5;
const ZIGZAG_FREQUENCY_PER_WAVE = 0.15;
const MAX_ZIGZAG_FREQUENCY = 2.5;
const ZIGZAG_AMPLITUDE_VARIATION = 4;
const ZIGZAG_FREQUENCY_VARIATION = 0.08;
const fuelPickups = [];
let fuelGlowRemaining = 0;
const player = { x: canvas.width / 2, y: canvas.height - 48, health: 3, fuel: MAX_FUEL };
const playerSpeed = 300; // Pixels per second.
const movementKeys = new Set([
  "KeyA", "KeyD", "ArrowLeft", "ArrowRight"
]);
const pressedKeys = new Set();
const bullets = [];
const enemyBullets = [];
const enemyBulletSpeed = 260;
let enemyFireRemaining = 0;
let invulnerabilityRemaining = 0;
let score = 0;
let wave = 1;
let waveTransitionRemaining = null;
const bulletWidth = 4;
const bulletHeight = 10;
const enemies = [];
function getWaveDifficulty(waveNumber) {
  const level = Math.max(0, waveNumber - 1);
  return {
    enemyCount: Math.min(7 + level * 2, 21),
    formationDownSpeed: Math.min(BASE_FORMATION_DOWN_SPEED + level * FORMATION_DOWN_SPEED_PER_WAVE,
      MAX_FORMATION_DOWN_SPEED),
    downSpeed: Math.min(BASE_ENEMY_DOWN_SPEED + level * ENEMY_DOWN_SPEED_PER_WAVE, MAX_ENEMY_DOWN_SPEED),
    zigzagAmplitude: Math.min(BASE_ZIGZAG_AMPLITUDE + level * ZIGZAG_AMPLITUDE_PER_WAVE, MAX_ZIGZAG_AMPLITUDE),
    zigzagFrequency: Math.min(BASE_ZIGZAG_FREQUENCY + level * ZIGZAG_FREQUENCY_PER_WAVE, MAX_ZIGZAG_FREQUENCY),
    fireInterval: Math.max(0.5, 1.4 - level * 0.12)
  };
}

let waveDifficulty = getWaveDifficulty(1);
const enemyMargin = 28;
let effectTime = 0;
let shakeRemaining = 0;
let shakeStrength = 0;
let scorePulse = 0;
let waveAnnouncementRemaining = 0;
const particles = [];
const scorePopups = [];
const stars = Array.from({ length: 80 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * canvas.height,
  size: 0.8 + Math.random() * 1.6,
  speed: 15 + Math.random() * 35
}));

function burstParticles(x, y, color, count) {
  for (let i = 0; i < count && particles.length < 180; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 110;
    const life = 0.3 + Math.random() * 0.35;
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      life, maxLife: life, color, size: 2 + Math.random() * 2 });
  }
}

function shakeScreen(strength, duration) {
  shakeStrength = Math.max(shakeStrength, strength);
  shakeRemaining = Math.max(shakeRemaining, duration);
}

function updateEffects(deltaTime) {
  effectTime += deltaTime;
  for (const star of stars) star.y = (star.y + star.speed * deltaTime) % canvas.height;
  shakeRemaining = Math.max(0, shakeRemaining - deltaTime);
  if (shakeRemaining === 0) shakeStrength = 0;
  scorePulse = Math.max(0, scorePulse - deltaTime);
  fuelGlowRemaining = Math.max(0, fuelGlowRemaining - deltaTime);
  waveAnnouncementRemaining = Math.max(0, waveAnnouncementRemaining - deltaTime);
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.life -= deltaTime;
    if (particle.life <= 0) { particles.splice(i, 1); continue; }
    particle.x += particle.vx * deltaTime;
    particle.y += particle.vy * deltaTime;
  }
  for (let i = scorePopups.length - 1; i >= 0; i--) {
    scorePopups[i].life -= deltaTime;
    scorePopups[i].y -= 32 * deltaTime;
    if (scorePopups[i].life <= 0) scorePopups.splice(i, 1);
  }
}

function renderStarfield() {
  context.save();
  context.fillStyle = "#b7d9ff";
  for (const star of stars) {
    context.globalAlpha = 0.2 + star.size * 0.15;
    context.fillRect(star.x, star.y, star.size, star.size);
  }
  context.restore();
}

function renderEffects() {
  context.save();
  for (const particle of particles) {
    context.globalAlpha = particle.life / particle.maxLife;
    context.fillStyle = particle.color;
    context.fillRect(particle.x, particle.y, particle.size, particle.size);
  }
  context.textAlign = "center";
  context.font = "bold 18px 'Courier New', monospace";
  context.fillStyle = "#ffdc8a";
  for (const popup of scorePopups) {
    context.globalAlpha = Math.min(1, popup.life / 0.3);
    context.fillStyle = popup.color || "#ffdc8a";
    context.fillText(popup.text || "+100", popup.x, popup.y);
  }
  context.restore();
}

function renderWaveAnnouncement() {
  if (waveAnnouncementRemaining <= 0 || waveTransitionRemaining !== null) return;
  context.save();
  context.globalAlpha = Math.min(1, waveAnnouncementRemaining / 0.3);
  context.textAlign = "center";
  context.font = "bold 28px 'Courier New', monospace";
  context.fillStyle = "#67e8ff";
  context.fillText(`WAVE ${wave}`, canvas.width / 2, 270);
  context.restore();
}

class FuelPickup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 24;
    this.height = 30;
    this.fallSpeed = FUEL_PICKUP_SPEED;
    this.active = true;
  }

  render() {
    context.save();
    context.translate(this.x, this.y);
    context.shadowColor = "#7dffb5";
    context.shadowBlur = 10 + Math.sin(effectTime * 5) * 3;
    context.fillStyle = "#153d34";
    context.fillRect(-12, -15, 24, 30);
    context.strokeStyle = "#7dffb5";
    context.lineWidth = 2;
    context.strokeRect(-12, -15, 24, 30);
    context.fillStyle = "#b5ffce";
    context.fillRect(-5, -19, 10, 4);
    context.beginPath();
    context.moveTo(2, -10);
    context.lineTo(-6, 2);
    context.lineTo(0, 2);
    context.lineTo(-2, 11);
    context.lineTo(7, -2);
    context.lineTo(1, -2);
    context.closePath();
    context.fill();
    context.restore();
  }
}

function updateFuelPickups(deltaTime) {
  if (gameState !== GameState.PLAYING) return;
  const playerBounds = { x: player.x - 14, y: player.y - 20, width: 28, height: 34 };
  for (let i = fuelPickups.length - 1; i >= 0; i--) {
    const pickup = fuelPickups[i];
    if (pickup.active) {
      pickup.y += pickup.fallSpeed * deltaTime;
      if (pickup.y - pickup.height / 2 - 4 > canvas.height) pickup.active = false;
      else if (overlaps(playerBounds, {
        x: pickup.x - pickup.width / 2, y: pickup.y - pickup.height / 2,
        width: pickup.width, height: pickup.height
      })) {
        const fuelBefore = player.fuel;
        player.fuel = Math.min(MAX_FUEL, player.fuel + FUEL_PICKUP_AMOUNT);
        pickup.active = false;
        burstParticles(pickup.x, pickup.y, "#7dffb5", 14);
        fuelGlowRemaining = 0.5;
        if (scorePopups.length < 24) scorePopups.push({
          x: player.x, y: player.y - 30, life: 0.8, color: "#b5ffce",
          text: player.fuel === fuelBefore ? "FUEL FULL" :
            `+${Math.round(player.fuel - fuelBefore)} FUEL`
        });
      }
    }
    if (!pickup.active) fuelPickups.splice(i, 1);
  }
}

function renderFuelPickups() {
  for (const pickup of fuelPickups) if (pickup.active) pickup.render();
}

class Enemy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 44;
    this.height = 32;
    this.elapsedTime = 0;
    this.diving = false;
    // Related phases keep neighboring ships readable, with subtle variation.
    this.phaseOffset = x / canvas.width * 0.9 + Math.random() * 0.2;
    this.zigzagAmplitude = waveDifficulty.zigzagAmplitude +
      (Math.random() * 2 - 1) * ZIGZAG_AMPLITUDE_VARIATION;
    this.zigzagFrequency = waveDifficulty.zigzagFrequency +
      (Math.random() * 2 - 1) * ZIGZAG_FREQUENCY_VARIATION;
    this.downSpeed = waveDifficulty.downSpeed;
    // Compensate for the initial phase so the spawn formation stays aligned.
    this.baseX = x - Math.sin(this.phaseOffset) * this.zigzagAmplitude;
  }

  update(deltaTime) {
    if (!this.diving) return;
    this.elapsedTime += deltaTime;
    this.y += this.downSpeed * deltaTime;
    const desiredX = this.baseX + Math.sin(this.elapsedTime * this.zigzagFrequency +
      this.phaseOffset) * this.zigzagAmplitude;
    this.x = Math.max(enemyMargin + this.width / 2,
      Math.min(canvas.width - enemyMargin - this.width / 2, desiredX));
  }

  render() {
    context.save();
    context.translate(this.x, this.y);
    context.shadowColor = "#f472b6";
    context.shadowBlur = 12;
    context.fillStyle = "#a855b8";
    context.strokeStyle = "#f9a8d4";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(-22, -12);
    context.lineTo(-9, -6);
    context.lineTo(0, -16);
    context.lineTo(9, -6);
    context.lineTo(22, -12);
    context.lineTo(18, 10);
    context.lineTo(8, 16);
    context.lineTo(0, 10);
    context.lineTo(-8, 16);
    context.lineTo(-18, 10);
    context.closePath();
    context.fill();
    context.stroke();
    context.shadowBlur = 0;
    context.fillStyle = "#251638";
    context.fillRect(-10, -3, 20, 9);
    context.fillStyle = "#ffdc8a";
    context.fillRect(-7, -1, 4, 4);
    context.fillRect(3, -1, 4, 4);
    context.restore();
  }
}

function spawnEnemies() {
  enemies.length = 0;
  formationDirection = 1;
  enemyDiveRemaining = ENEMY_DIVE_INTERVAL;
  waveDifficulty = getWaveDifficulty(wave);
  enemyFireRemaining = waveDifficulty.fireInterval;
  waveAnnouncementRemaining = 1.1;
  const count = waveDifficulty.enemyCount;
  const columns = Math.min(count, 7);
  const spacing = 80;
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / columns);
    const rowCount = Math.min(columns, count - row * columns);
    const startX = (canvas.width - (rowCount - 1) * spacing) / 2;
    enemies.push(new Enemy(startX + (i % columns) * spacing, 80 + row * 56));
  }
}

function updateEnemies(deltaTime) {
  if (gameState !== GameState.PLAYING) return;
  const formation = enemies.filter(enemy => !enemy.diving);
  if (formation.length > 0) {
    const left = Math.min(...formation.map(enemy => enemy.x - enemy.width / 2));
    const right = Math.max(...formation.map(enemy => enemy.x + enemy.width / 2));
    const distance = FORMATION_SPEED * deltaTime * formationDirection;
    const boundary = formationDirection === 1
      ? canvas.width - enemyMargin - right : enemyMargin - left;
    const reachedBoundary = formationDirection === 1 ? distance >= boundary : distance <= boundary;
    const movement = reachedBoundary ? boundary : distance;
    for (const enemy of formation) {
      enemy.x += movement;
      enemy.y += waveDifficulty.formationDownSpeed * deltaTime;
    }
    if (reachedBoundary) formationDirection *= -1;
  }
  // The formation sweeps slowly; only one ship at a time follows a dive path.
  if (!enemies.some(enemy => enemy.diving)) {
    enemyDiveRemaining = Math.max(0, enemyDiveRemaining - deltaTime);
    if (enemyDiveRemaining <= 0.000001 && enemies.length > 0) {
      // Front-most ship leaves first, with ties favoring the player's lane.
      const attacker = enemies.reduce((front, enemy) =>
        enemy.y > front.y || (enemy.y === front.y &&
          Math.abs(enemy.x - player.x) < Math.abs(front.x - player.x)) ? enemy : front);
      attacker.diving = true;
      attacker.elapsedTime = 0;
      attacker.baseX = attacker.x - Math.sin(attacker.phaseOffset) * attacker.zigzagAmplitude;
      enemyDiveRemaining = ENEMY_DIVE_INTERVAL;
    }
  }
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.update(deltaTime);
    if (enemy.y - enemy.height / 2 > canvas.height) {
      enemies.splice(i, 1);
      damagePlayer(); // One attempt per escaped ship; existing invulnerability applies.
      if (gameState !== GameState.PLAYING) break;
    }
  }
}

function renderEnemies() {
  for (const enemy of enemies) enemy.render();
}
const fireCooldown = 0.25; // Seconds between shots.
const bulletSpeed = 600; // Pixels per second.
let firing = false;
let cooldownRemaining = 0;
const GameState = {
  START: "START",
  PLAYING: "PLAYING",
  GAME_OVER: "GAME_OVER"
};
let gameState = GameState.START;
let gameOverReason = "";

function endGame(reason) {
  if (gameState !== GameState.PLAYING) return;
  gameOverReason = reason;
  clearInput();
  gameState = GameState.GAME_OVER;
  arcadeAudio.play("gameOver");
}

function updateFuel(deltaTime) {
  if (gameState !== GameState.PLAYING) return;
  player.fuel = Math.max(0, Math.min(MAX_FUEL, player.fuel - FUEL_DRAIN_RATE * deltaTime));
  if (player.fuel === 0) endGame("OUT OF FUEL");
}

function startGame() {
  arcadeAudio.reset();
  player.x = canvas.width / 2;
  player.y = canvas.height - 48;
  player.health = 3;
  player.fuel = MAX_FUEL;
  gameOverReason = "";
  invulnerabilityRemaining = 0;
  enemyBullets.length = 0;
  bullets.length = 0;
  score = 0;
  wave = 1;
  waveTransitionRemaining = null;
  particles.length = 0;
  scorePopups.length = 0;
  fuelPickups.length = 0;
  fuelGlowRemaining = 0;
  shakeRemaining = 0;
  shakeStrength = 0;
  scorePulse = 0;
  spawnEnemies();
  cooldownRemaining = 0;
  firing = false;
  pressedKeys.clear();
  previousTime = null;
  gameState = GameState.PLAYING;
  arcadeAudio.play("wave");
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Enter" || event.code === "KeyR" || event.code === "Space" ||
      event.code === "KeyM" || movementKeys.has(event.code)) arcadeAudio.unlock();
  if (event.code === "KeyM" && !event.repeat) {
    event.preventDefault();
    arcadeAudio.toggleMute();
  }
  if (movementKeys.has(event.code)) {
    event.preventDefault();
    if (gameState === GameState.PLAYING) pressedKeys.add(event.code);
  }
  if (event.code === "Enter" && !event.repeat && gameState === GameState.START) {
    event.preventDefault();
    startGame();
  }
  if (event.code === "KeyR" && !event.repeat && gameState === GameState.GAME_OVER) {
    event.preventDefault();
    startGame();
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (gameState === GameState.PLAYING) firing = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (movementKeys.has(event.code)) {
    event.preventDefault();
    pressedKeys.delete(event.code);
  }
  if (event.code === "Space") {
    event.preventDefault();
    firing = false;
  }
});

function clearInput() {
  firing = false;
  pressedKeys.clear();
}

window.addEventListener("blur", () => {
  clearInput();
  previousTime = null;
  arcadeAudio.pause();
});
window.addEventListener("focus", () => {
  if (arcadeAudio.context) arcadeAudio.unlock();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) { clearInput(); arcadeAudio.pause(); }
  else if (arcadeAudio.context) arcadeAudio.unlock();
  previousTime = null;
});

function updatePlayer(deltaTime) {
  const horizontal = Number(pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight")) -
    Number(pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft"));
  player.x += horizontal * playerSpeed * deltaTime;
  player.x = Math.max(14, Math.min(canvas.width - 14, player.x));
}

function updateBullets(deltaTime) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y -= bulletSpeed * deltaTime;
    // Keep the projectile until its trailing end leaves the canvas.
    if (bullets[i].y + 24 < 0) bullets.splice(i, 1);
  }
}

function updateShooting(deltaTime) {
  cooldownRemaining = Math.max(0, cooldownRemaining - deltaTime);
  // One shot at most per frame; key repeat never creates bullets directly.
  if (firing && cooldownRemaining === 0 && bullets.length < 32) {
    bullets.push({ x: player.x, y: player.y - 20 });
    arcadeAudio.play("fire");
    cooldownRemaining = fireCooldown;
  }
}

function overlaps(a, b) {
  return a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y;
}

function updateEnemyAttacks(deltaTime) {
  enemyFireRemaining = Math.max(0, enemyFireRemaining - deltaTime);
  if (enemyFireRemaining === 0 && enemies.length > 0) {
    if (enemyBullets.length < 32) {
      const enemy = enemies[Math.floor(Math.random() * enemies.length)];
      enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.height / 2 });
    }
    // One formation-wide shot per interval, regardless of enemy count.
    enemyFireRemaining = waveDifficulty.fireInterval * (0.85 + Math.random() * 0.3);
  }
}

function updateEnemyBullets(deltaTime) {
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].y += enemyBulletSpeed * deltaTime;
    if (enemyBullets[i].y - 14 > canvas.height) enemyBullets.splice(i, 1);
  }
}

function damagePlayer() {
  if (gameState !== GameState.PLAYING || invulnerabilityRemaining > 0) return;
  player.health = Math.max(0, player.health - 1);
  invulnerabilityRemaining = 1;
  arcadeAudio.play("playerHit");
  burstParticles(player.x, player.y, "#67e8ff", 24);
  shakeScreen(4, 0.22);
  if (player.health === 0) {
    endGame("SHIP DESTROYED");
  }
}

function checkPlayerCollisions() {
  const playerBounds = { x: player.x - 14, y: player.y - 20, width: 28, height: 34 };
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const bullet = enemyBullets[i];
    if (overlaps(playerBounds, { x: bullet.x - 3, y: bullet.y, width: 6, height: 12 })) {
      enemyBullets.splice(i, 1);
      damagePlayer();
    }
  }
  for (const enemy of enemies) {
    if (overlaps(playerBounds, {
      x: enemy.x - enemy.width / 2, y: enemy.y - enemy.height / 2,
      width: enemy.width, height: enemy.height
    })) damagePlayer();
  }
}

function renderEnemyBullets() {
  context.save();
  context.shadowColor = "#ff7866";
  context.shadowBlur = 10;
  for (const bullet of enemyBullets) {
    context.fillStyle = "#ff786644";
    context.fillRect(bullet.x - 2, bullet.y - 14, 4, 14);
    context.fillStyle = "#ffb38a";
    context.fillRect(bullet.x - 3, bullet.y, 6, 12);
  }
  context.restore();
}

function checkBulletEnemyCollisions() {
  // Reverse iteration keeps remaining indices valid after each removal.
  for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex--) {
    const bullet = bullets[bulletIndex];
    // Only the bright projectile core collides, not its decorative trail.
    const bulletBounds = {
      x: bullet.x - bulletWidth / 2,
      y: bullet.y,
      width: bulletWidth,
      height: bulletHeight
    };
    for (let enemyIndex = enemies.length - 1; enemyIndex >= 0; enemyIndex--) {
      const enemy = enemies[enemyIndex];
      const enemyBounds = {
        x: enemy.x - enemy.width / 2,
        y: enemy.y - enemy.height / 2,
        width: enemy.width,
        height: enemy.height
      };
      if (overlaps(bulletBounds, enemyBounds)) {
        if (fuelPickups.length < MAX_FUEL_PICKUPS && Math.random() < FUEL_DROP_CHANCE) {
          fuelPickups.push(new FuelPickup(enemy.x, enemy.y));
        }
        burstParticles(enemy.x, enemy.y, "#f9a8d4", 16);
        if (scorePopups.length < 24) scorePopups.push({ x: enemy.x, y: enemy.y - 20, life: 0.65 });
        scorePulse = 0.25;
        shakeScreen(1.5, 0.09);
        enemies.splice(enemyIndex, 1);
        bullets.splice(bulletIndex, 1);
        score += 100;
        arcadeAudio.play("enemyHit");
        break; // A consumed bullet cannot hit another enemy.
      }
    }
  }
}

function renderScore() {
  if (gameState !== GameState.PLAYING) return;
  context.save();
  context.fillStyle = "#070c18ed";
  context.fillRect(0, 0, canvas.width, 62);
  context.fillStyle = "#345779";
  context.fillRect(20, 61, canvas.width - 40, 1);
  context.textAlign = "left";
  context.textBaseline = "top";
  context.font = "bold 12px 'Courier New', monospace";
  context.fillStyle = "#9bb7ce";
  context.fillText("SCORE", 24, 10);
  context.textAlign = "center";
  context.fillText("WAVE", 310, 10);
  context.textAlign = "right";
  context.fillText("HEALTH", canvas.width - 24, 10);
  context.font = "bold 26px 'Courier New', monospace";
  context.textAlign = "left";
  context.fillStyle = scorePulse > 0 ? "#ffdc8a" : "#d8f6ff";
  context.fillText(String(score), 24, 27, 230);
  context.textAlign = "center";
  context.fillStyle = "#67e8ff";
  context.fillText(String(wave), 310, 27, 100);
  context.textAlign = "right";
  context.fillStyle = player.health <= 1 ? "#ff7866" : "#67e8ff";
  context.fillText(`${player.health} / 3`, canvas.width - 24, 27);
  const fuelFraction = player.fuel / MAX_FUEL;
  const lowFuel = fuelFraction < LOW_FUEL_THRESHOLD;
  context.textAlign = "left";
  context.font = "bold 12px 'Courier New', monospace";
  context.fillStyle = lowFuel ? "#ffb38a" : "#9bb7ce";
  context.fillText(lowFuel ? "FUEL · LOW FUEL" : "FUEL", 460, 10);
  context.fillStyle = "#243b50";
  context.fillRect(460, 33, 112, 14);
  context.fillStyle = lowFuel ? "#ff9a70" : "#67e8ff";
  context.fillRect(460, 33, 112 * fuelFraction, 14);
  context.strokeStyle = "#6a8da8";
  context.lineWidth = 1;
  context.strokeRect(460, 33, 112, 14);
  context.font = "bold 20px 'Courier New', monospace";
  context.fillText(`${Math.round(fuelFraction * 100)}%`, 586, 29);
  context.restore();
}

function renderSoundHint() {
  context.save();
  context.textAlign = "right";
  context.textBaseline = "bottom";
  context.font = "14px 'Courier New', monospace";
  context.fillStyle = "#9bb7ce";
  context.fillText(arcadeAudio.unavailable ? "AUDIO UNAVAILABLE" :
    `M · SOUND ${arcadeAudio.muted ? "OFF" : "ON"}`, canvas.width - 20, canvas.height - 16);
  context.restore();
}

function updateWaveProgression(deltaTime) {
  if (gameState !== GameState.PLAYING) return;
  if (waveTransitionRemaining !== null) {
    waveTransitionRemaining = Math.max(0, waveTransitionRemaining - deltaTime);
    if (waveTransitionRemaining < 0.000001) {
      wave++;
      waveTransitionRemaining = null;
      cooldownRemaining = 0;
      spawnEnemies();
      arcadeAudio.play("wave");
    }
  } else if (enemies.length === 0) {
    waveTransitionRemaining = 1;
    arcadeAudio.play("complete");
    // Give the player a safe breather and keep old shots out of the next wave.
    bullets.length = 0;
    enemyBullets.length = 0;
  }
}

function renderWaveComplete() {
  if (waveTransitionRemaining === null) return;
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "bold 36px 'Courier New', monospace";
  context.fillStyle = "#67e8ff";
  context.shadowColor = "#39bfff";
  context.shadowBlur = 14;
  context.fillText("WAVE COMPLETE", canvas.width / 2, canvas.height / 2);
  context.restore();
}

function renderPlayer() {
  if (fuelGlowRemaining > 0) {
    context.save();
    context.globalAlpha = fuelGlowRemaining / 0.5;
    context.strokeStyle = "#7dffb5";
    context.shadowColor = "#7dffb5";
    context.shadowBlur = 14;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(player.x, player.y, 26, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  if (invulnerabilityRemaining > 0 && Math.floor(invulnerabilityRemaining * 10) % 2 === 0) return;
  context.save();
  const flameLength = 12 + Math.sin(effectTime * 28) * 3;
  context.shadowColor = "#39bfff";
  context.shadowBlur = 14;
  context.fillStyle = "#67e8ff";
  context.beginPath();
  context.moveTo(player.x - 5, player.y + 10);
  context.lineTo(player.x, player.y + 10 + flameLength);
  context.lineTo(player.x + 5, player.y + 10);
  context.closePath();
  context.fill();
  context.shadowBlur = 5;
  context.fillStyle = "#d8f6ff";
  context.beginPath();
  context.moveTo(player.x, player.y - 20);
  context.lineTo(player.x + 14, player.y + 14);
  context.lineTo(player.x, player.y + 7);
  context.lineTo(player.x - 14, player.y + 14);
  context.closePath();
  context.fill();
  context.restore();
}

function renderBullets() {
  context.save();
  for (const bullet of bullets) {
    const trail = context.createLinearGradient(0, bullet.y, 0, bullet.y + 24);
    trail.addColorStop(0, "#67e8ff");
    trail.addColorStop(1, "#67e8ff00");
    context.fillStyle = trail;
    context.fillRect(bullet.x - 2, bullet.y, 4, 24);
    context.shadowColor = "#67e8ff";
    context.shadowBlur = 10;
    context.fillStyle = "#e8fcff";
    context.fillRect(bullet.x - bulletWidth / 2, bullet.y, bulletWidth, bulletHeight);
    context.shadowBlur = 0;
  }
  context.restore();
}

function renderMenuPanel() {
  context.save();
  context.fillStyle = "#070c18d9";
  context.fillRect(150, 82, 600, 446);
  context.strokeStyle = "#345779";
  context.lineWidth = 1;
  context.strokeRect(150, 82, 600, 446);
  context.fillStyle = "#67e8ff";
  context.fillRect(canvas.width / 2 - 28, 82, 56, 2);
  context.restore();
}

function renderMenuPrompt(text) {
  context.save();
  context.fillStyle = "#102c40";
  context.fillRect(246, 454, 408, 46);
  context.strokeStyle = "#3986a5";
  context.strokeRect(246, 454, 408, 46);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#b9f4ff";
  context.font = "bold 22px 'Courier New', monospace";
  context.fillText(text, canvas.width / 2, 477);
  context.restore();
}

function renderStartScreen() {
  renderMenuPanel();
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  const centerX = canvas.width / 2;
  context.fillStyle = "#d8f6ff";
  context.font = "bold 52px 'Courier New', monospace";
  context.shadowColor = "#39bfff";
  context.shadowBlur = 18 + Math.sin(effectTime * 2) * 4;
  context.fillText("SPACE ATTACK", centerX, 154 + Math.sin(effectTime * 1.5) * 3);
  context.shadowBlur = 0;
  context.font = "20px 'Courier New', monospace";
  context.fillText("Destroy the invading enemy ships.", centerX, 222);
  context.fillText("Survive as many waves as possible.", centerX, 250);
  context.fillStyle = "#9bb7ce";
  context.font = "bold 13px 'Courier New', monospace";
  context.fillText("CONTROLS", centerX, 305);
  context.font = "20px 'Courier New', monospace";
  context.fillStyle = "#d8f6ff";
  context.fillText("A / D or Left / Right - Move", centerX, 340);
  context.fillText("SPACE - Fire", centerX, 371);
  context.fillText("M - Toggle sound", centerX, 402);
  context.restore();
  renderMenuPrompt("PRESS ENTER TO START");
}

function renderGameOverScreen() {
  renderMenuPanel();
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  const centerX = canvas.width / 2;
  context.fillStyle = "#ff9ca8";
  context.font = "bold 52px 'Courier New', monospace";
  context.fillText("GAME OVER", centerX, 170);
  context.font = "bold 20px 'Courier New', monospace";
  context.fillStyle = "#ffb38a";
  context.fillText(gameOverReason, centerX, 218);
  context.font = "bold 13px 'Courier New', monospace";
  context.fillStyle = "#9bb7ce";
  context.fillText("FINAL SCORE", centerX, 250);
  context.fillStyle = "#d8f6ff";
  context.font = "bold 40px 'Courier New', monospace";
  context.fillText(String(score), centerX, 291, 500);
  context.font = "20px 'Courier New', monospace";
  context.fillStyle = "#67e8ff";
  context.fillText(`Wave Reached: ${wave}`, centerX, 365);
  context.restore();
  renderMenuPrompt("PRESS R TO RESTART");
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#070c18";
  context.fillRect(0, 0, canvas.width, canvas.height);
  renderStarfield();
  context.save();
  if (shakeRemaining > 0) {
    const strength = shakeStrength * Math.min(1, shakeRemaining / 0.1);
    context.translate(Math.sin(effectTime * 91) * strength, Math.cos(effectTime * 113) * strength);
  }
  // Shake only world rendering; the HUD and announcements remain steady.
  if (gameState === GameState.PLAYING) {
    renderEnemies();
    renderPlayer();
    renderBullets();
    renderEnemyBullets();
    renderFuelPickups();
  }
  renderEffects();
  context.restore();
  switch (gameState) {
    case GameState.START:
      renderStartScreen();
      break;
    case GameState.PLAYING:
      renderWaveComplete();
      renderWaveAnnouncement();
      break;
    case GameState.GAME_OVER:
      renderGameOverScreen();
      break;
  }
  renderScore();
  renderSoundHint();
}

function gameLoop(timestamp) {
  if (document.hidden) {
    previousTime = null;
    requestAnimationFrame(gameLoop);
    return;
  }
  const elapsedTime = previousTime === null ? 0 : Math.max(0, (timestamp - previousTime) / 1000);
  const deltaTime = Math.min(elapsedTime, 0.05);
  previousTime = timestamp;
  // Fuel uses elapsed seconds; the motion cap must not slow its drain at low FPS.
  updateFuel(elapsedTime);
  updateEffects(deltaTime);
  arcadeAudio.update(gameState === GameState.PLAYING && waveTransitionRemaining === null);

  if (gameState === GameState.PLAYING) {
    if (waveTransitionRemaining === null) {
      updateShooting(deltaTime);
      updateEnemyAttacks(deltaTime);
    }
    // Small motion steps keep fast bullets from skipping enemy hitboxes.
    const steps = Math.max(1, Math.ceil(deltaTime / (1 / 120)));
    const stepTime = deltaTime / steps;
    for (let step = 0; step < steps; step++) {
      invulnerabilityRemaining = Math.max(0, invulnerabilityRemaining - stepTime);
      updatePlayer(stepTime);
      updateFuelPickups(stepTime);
      if (waveTransitionRemaining !== null) {
        updateWaveProgression(stepTime);
        continue;
      }
      updateEnemies(stepTime);
      if (gameState !== GameState.PLAYING) break;
      updateBullets(stepTime);
      updateEnemyBullets(stepTime);
      checkBulletEnemyCollisions();
      checkPlayerCollisions();
      if (gameState !== GameState.PLAYING) break;
      updateWaveProgression(0);
    }
  }
  render();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
