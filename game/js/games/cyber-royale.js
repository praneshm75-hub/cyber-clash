/* ==========================================================================
   GAME: CYBER ROYALE (2D Top-Down Battle Royale Shooter)
   30 Players (Player vs 29 AI Bots), Shrinking Storm, Loot, Minimap, Sound FX
   ========================================================================== */

class CyberRoyaleGame {
  constructor(arenaController) {
    this.arena = arenaController;
    this.worldWidth = 3200;
    this.worldHeight = 3200;

    this.canvas = null;
    this.ctx = null;

    this.player = null;
    this.bots = [];
    this.projectiles = [];
    this.lootItems = [];
    this.particles = [];
    this.obstacles = [];
    this.killFeed = [];

    this.storm = {
      cx: 1600,
      cy: 1600,
      radius: 1400,
      targetCx: 1600,
      targetCy: 1600,
      targetRadius: 1400,
      phase: 1,
      maxPhases: 4,
      timer: 45,
      damagePerSec: 3
    };

    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false };
    this.touch = { active: false, moveDx: 0, moveDy: 0, aimDx: 0, aimDy: 0, isFiring: false };

    this.isRunning = false;
    this.animFrameId = null;
    this.lastTime = 0;
    this.matchStats = { kills: 0, damageDealt: 0, startTime: 0 };

    this.weaponTypes = {
      pistol: { name: 'Pistol', damage: 16, fireRate: 260, magSize: 12, speed: 18, color: '#00f3ff', sound: 'playPistol' },
      shotgun: { name: 'Shotgun', damage: 14, fireRate: 750, magSize: 5, speed: 15, pellets: 6, spread: 0.25, color: '#ffb703', sound: 'playShotgun' },
      ar: { name: 'Assault Rifle', damage: 22, fireRate: 130, magSize: 30, speed: 22, color: '#00f5d4', sound: 'playAssaultRifle' },
      sniper: { name: 'Sniper Rifle', damage: 90, fireRate: 1100, magSize: 4, speed: 30, color: '#9d4edd', sound: 'playSniper' },
      rocket: { name: 'Rocket Launcher', damage: 110, fireRate: 1400, magSize: 2, speed: 12, isRocket: true, color: '#ff4d6d', sound: 'playRocket' }
    };

    this.botNames = [
      'Viper_99', 'Ghost_Rider', 'Cyber_Blade', 'Neon_Wolf', 'Shadow_Ex', 
      'Apex_Hunter', 'Zero_Cool', 'Rogue_One', 'Slayer_X', 'Titan_Bot',
      'Phoenix_9', 'Matrix_Zen', 'Reaper_404', 'Spectre_V', 'Kratos_Bot',
      'Echo_Pulse', 'Hyper_Ion', 'Nova_Strike', 'Omega_Zero', 'Storm_Rider',
      'Vortex_7', 'Sentinel_X', 'Falcon_Eye', 'Blaze_Runner', 'Quantum_Ph',
      'Cyber_Sam', 'Alpha_Dog', 'Iron_Claw', 'Zeus_Bot'
    ];
  }

  start() {
    this.isRunning = true;
    this.matchStats = { kills: 0, damageDealt: 0, startTime: Date.now() };

    this.setupStageCanvas();
    this.generateObstacles();
    this.spawnLoot();
    this.spawnEntities();
    this.initStorm();

    this.bindControls();
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    this.animFrameId = requestAnimationFrame(this.loop);

    this.addKillFeed("Match Started! 30 Fighters Dropped.");
  }

  setupStageCanvas() {
    const stage = this.arena.stageEl;
    stage.innerHTML = `
      <canvas id="royale-canvas" style="position: absolute; top:0; left:0; width:100%; height:100%; background:#0b1120; cursor:crosshair;"></canvas>
      
      <!-- Battle Royale HUD Overlay -->
      <div id="royale-hud" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; padding:1rem; display:flex; flex-direction:column; justify-content:space-between; box-sizing:border-box;">
        
        <!-- Top HUD Row -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <!-- Alive & Kills Counter -->
          <div style="display:flex; gap:0.75rem;">
            <div class="hud-card" style="background:rgba(15,23,42,0.85); backdrop-filter:blur(10px); border:1px solid var(--glass-border); padding:0.5rem 1rem; border-radius:12px; font-weight:800; font-family:var(--font-mono); color:#fff; font-size:1.1rem;">
              👥 ALIVE: <span id="hud-alive" style="color:var(--primary-cyan);">30</span> / 30
            </div>
            <div class="hud-card" style="background:rgba(15,23,42,0.85); backdrop-filter:blur(10px); border:1px solid var(--glass-border); padding:0.5rem 1rem; border-radius:12px; font-weight:800; font-family:var(--font-mono); color:#fff; font-size:1.1rem;">
              🎯 KILLS: <span id="hud-kills" style="color:var(--emerald-accent);">0</span>
            </div>
          </div>

          <!-- Kill Feed -->
          <div id="royale-killfeed" style="display:flex; flex-direction:column; gap:0.3rem; align-items:flex-end; max-width:280px;"></div>
        </div>

        <!-- Bottom HUD Row -->
        <div style="display:flex; justify-content:space-between; align-items:flex-end;">
          <!-- Player Health & Shield -->
          <div style="display:flex; flex-direction:column; gap:0.4rem; min-width:240px; background:rgba(15,23,42,0.85); padding:0.85rem; border-radius:14px; border:1px solid var(--glass-border);">
            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700;">
              <span>SHIELD</span>
              <span id="txt-shield">100 / 100</span>
            </div>
            <div style="width:100%; height:10px; background:rgba(255,255,255,0.1); border-radius:6px; overflow:hidden;">
              <div id="bar-shield" style="width:100%; height:100%; background:linear-gradient(90deg, #00f3ff, #00b4d8); transition:width 0.2s;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.8rem; font-weight:700; margin-top:0.2rem;">
              <span>HEALTH</span>
              <span id="txt-health">100 / 100</span>
            </div>
            <div style="width:100%; height:12px; background:rgba(255,255,255,0.1); border-radius:6px; overflow:hidden;">
              <div id="bar-health" style="width:100%; height:100%; background:linear-gradient(90deg, #00f5d4, #38b000); transition:width 0.2s;"></div>
            </div>
          </div>

          <!-- Weapon & Ammo Display -->
          <div style="background:rgba(15,23,42,0.85); padding:0.85rem 1.25rem; border-radius:14px; border:1px solid var(--glass-border); display:flex; align-items:center; gap:1rem;">
            <div style="text-align:right;">
              <div id="txt-weapon-name" style="font-weight:800; font-size:1.1rem; color:var(--primary-cyan);">Pistol</div>
              <div id="txt-ammo" style="font-family:var(--font-mono); font-weight:700; font-size:1rem; color:var(--text-muted);">12 / ∞</div>
            </div>
            <div id="weapon-icon-box" style="width:44px; height:44px; background:rgba(0,243,255,0.15); border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">🔫</div>
          </div>
        </div>

      </div>
    `;

    this.canvas = document.getElementById('royale-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    this.canvas.width = this.arena.stageEl.clientWidth;
    this.canvas.height = this.arena.stageEl.clientHeight;
  }

  generateObstacles() {
    this.obstacles = [];
    // Buildings & Structures
    for (let i = 0; i < 25; i++) {
      this.obstacles.push({
        x: Math.random() * (this.worldWidth - 400) + 200,
        y: Math.random() * (this.worldHeight - 400) + 200,
        w: Math.random() * 120 + 80,
        h: Math.random() * 120 + 80,
        type: 'building'
      });
    }

    // Trees & Crates Cover
    for (let i = 0; i < 60; i++) {
      this.obstacles.push({
        x: Math.random() * (this.worldWidth - 200) + 100,
        y: Math.random() * (this.worldHeight - 200) + 100,
        r: Math.random() * 20 + 15,
        type: 'tree'
      });
    }
  }

  spawnLoot() {
    this.lootItems = [];
    const types = ['shotgun', 'ar', 'sniper', 'rocket', 'medkit', 'shield'];
    for (let i = 0; i < 75; i++) {
      const lootType = types[Math.floor(Math.random() * types.length)];
      this.lootItems.push({
        id: Math.random(),
        x: Math.random() * (this.worldWidth - 200) + 100,
        y: Math.random() * (this.worldHeight - 200) + 100,
        type: lootType
      });
    }
  }

  spawnEntities() {
    // Player
    this.player = {
      id: 'player',
      name: 'YOU (Agent)',
      x: this.worldWidth / 2 + (Math.random() - 0.5) * 400,
      y: this.worldHeight / 2 + (Math.random() - 0.5) * 400,
      radius: 16,
      health: 100,
      maxHealth: 100,
      shield: 50,
      maxShield: 100,
      speed: 4.5,
      angle: 0,
      weapon: { ...this.weaponTypes.pistol, ammo: 12 },
      inventory: ['pistol'],
      kills: 0,
      lastShotTime: 0,
      isReloading: false
    };

    // 29 AI Bots
    this.bots = [];
    for (let i = 0; i < 29; i++) {
      const bName = this.botNames[i] || `Bot_${i+1}`;
      this.bots.push({
        id: `bot_${i}`,
        name: bName,
        x: Math.random() * (this.worldWidth - 300) + 150,
        y: Math.random() * (this.worldHeight - 300) + 150,
        radius: 16,
        health: 100,
        maxHealth: 100,
        shield: 25,
        speed: 3.8 + Math.random() * 0.4,
        angle: Math.random() * Math.PI * 2,
        weapon: { ...this.weaponTypes[Math.random() > 0.4 ? 'pistol' : 'ar'], ammo: 20 },
        kills: 0,
        lastShotTime: 0,
        target: null,
        changeDirTimer: 0
      });
    }
  }

  initStorm() {
    this.storm = {
      cx: this.worldWidth / 2,
      cy: this.worldHeight / 2,
      radius: 1550,
      targetCx: this.worldWidth / 2,
      targetCy: this.worldHeight / 2,
      targetRadius: 1550,
      phase: 1,
      maxPhases: 4,
      timer: 35,
      damagePerSec: 4
    };
    this.nextStormPhase();
  }

  nextStormPhase() {
    const nextR = Math.max(100, this.storm.radius * 0.6);
    const offsetMax = (this.storm.radius - nextR) * 0.7;
    const nextCx = Math.max(nextR + 100, Math.min(this.worldWidth - nextR - 100, this.storm.cx + (Math.random() - 0.5) * offsetMax));
    const nextCy = Math.max(nextR + 100, Math.min(this.worldHeight - nextR - 100, this.storm.cy + (Math.random() - 0.5) * offsetMax));

    this.storm.targetCx = nextCx;
    this.storm.targetCy = nextCy;
    this.storm.targetRadius = nextR;
  }

  bindControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const slot = parseInt(e.key) - 1;
        if (this.player.inventory[slot]) {
          const wKey = this.player.inventory[slot];
          this.player.weapon = { ...this.weaponTypes[wKey], ammo: this.weaponTypes[wKey].magSize };
          this.updateHUD();
          window.soundEngine.playTap();
        }
      }
      if (e.key.toLowerCase() === 'r') {
        this.reloadPlayerWeapon();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    if (this.canvas) {
      this.canvas.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      });

      this.canvas.addEventListener('mousedown', () => {
        this.mouse.isDown = true;
      });

      window.addEventListener('mouseup', () => {
        this.mouse.isDown = false;
      });
    }
  }

  reloadPlayerWeapon() {
    if (this.player.isReloading) return;
    this.player.isReloading = true;
    window.soundEngine.playReload();
    setTimeout(() => {
      this.player.weapon.ammo = this.player.weapon.magSize;
      this.player.isReloading = false;
      this.updateHUD();
    }, 1200);
  }

  loop(now) {
    if (!this.isRunning) return;
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Update Storm
    this.updateStorm(dt);

    // 2. Update Player Movement & Aiming
    this.updatePlayer(dt);

    // 3. Update AI Bots Logic & Combat
    this.updateBots(dt);

    // 4. Update Projectiles & Explosions
    this.updateProjectiles(dt);

    // 5. Update Particles
    this.updateParticles(dt);

    // 6. Check Loot Pickup
    this.checkLootPickup();

    // 7. Update HUD Counters
    this.updateHUD();
  }

  updateStorm(dt) {
    this.storm.timer -= dt;
    if (this.storm.timer <= 0) {
      if (this.storm.phase < this.storm.maxPhases) {
        this.storm.phase++;
        this.storm.timer = 40;
        this.nextStormPhase();
        this.addKillFeed(`⚠️ STORM IS SHRINKING! Phase ${this.storm.phase}`);
      } else {
        this.storm.timer = 30;
      }
    }

    // Move storm circle smoothly towards target
    const rate = 0.05 * dt;
    this.storm.cx += (this.storm.targetCx - this.storm.cx) * rate;
    this.storm.cy += (this.storm.targetCy - this.storm.cy) * rate;
    this.storm.radius += (this.storm.targetRadius - this.storm.radius) * rate;

    // Storm Damage to Player
    const pDist = Math.hypot(this.player.x - this.storm.cx, this.player.y - this.storm.cy);
    if (pDist > this.storm.radius) {
      this.damageEntity(this.player, this.storm.damagePerSec * dt, 'The Storm');
    }

    // Storm Damage to Bots
    this.bots.forEach(b => {
      const bDist = Math.hypot(b.x - this.storm.cx, b.y - this.storm.cy);
      if (bDist > this.storm.radius) {
        this.damageEntity(b, this.storm.damagePerSec * dt, 'The Storm');
      }
    });
  }

  updatePlayer(dt) {
    if (this.player.health <= 0) return;

    let moveX = 0;
    let moveY = 0;

    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

    if (moveX !== 0 || moveY !== 0) {
      const len = Math.hypot(moveX, moveY);
      const newX = this.player.x + (moveX / len) * this.player.speed * 60 * dt;
      const newY = this.player.y + (moveY / len) * this.player.speed * 60 * dt;

      if (!this.checkObstacleCollision(newX, this.player.y, this.player.radius)) {
        this.player.x = Math.max(50, Math.min(this.worldWidth - 50, newX));
      }
      if (!this.checkObstacleCollision(this.player.x, newY, this.player.radius)) {
        this.player.y = Math.max(50, Math.min(this.worldHeight - 50, newY));
      }
    }

    // Aim towards mouse cursor
    const screenCenterX = this.canvas.width / 2;
    const screenCenterY = this.canvas.height / 2;
    this.player.angle = Math.atan2(this.mouse.y - screenCenterY, this.mouse.x - screenCenterX);

    // Shooting
    if (this.mouse.isDown && !this.player.isReloading) {
      this.shootWeapon(this.player);
    }
  }

  updateBots(dt) {
    const allAlive = [this.player, ...this.bots].filter(e => e.health > 0);

    this.bots.forEach(bot => {
      if (bot.health <= 0) return;

      // 1. Storm Avoidance priority
      const distToStormCenter = Math.hypot(bot.x - this.storm.cx, bot.y - this.storm.cy);
      if (distToStormCenter > this.storm.radius * 0.85) {
        bot.angle = Math.atan2(this.storm.cy - bot.y, this.storm.cx - bot.x);
      } else {
        // 2. Find Nearest Enemy Target
        let nearestEnemy = null;
        let minDist = 450; // Sight range

        allAlive.forEach(other => {
          if (other.id !== bot.id) {
            const d = Math.hypot(other.x - bot.x, other.y - bot.y);
            if (d < minDist) {
              minDist = d;
              nearestEnemy = other;
            }
          }
        });

        if (nearestEnemy) {
          bot.angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
          // Shoot at target
          this.shootWeapon(bot);
        } else {
          // Patrol wander
          bot.changeDirTimer -= dt;
          if (bot.changeDirTimer <= 0) {
            bot.angle += (Math.random() - 0.5) * 1.5;
            bot.changeDirTimer = Math.random() * 3 + 1;
          }
        }
      }

      // Move bot forward
      const moveX = Math.cos(bot.angle) * bot.speed * 60 * dt;
      const moveY = Math.sin(bot.angle) * bot.speed * 60 * dt;

      const newX = bot.x + moveX;
      const newY = bot.y + moveY;

      if (!this.checkObstacleCollision(newX, bot.y, bot.radius)) {
        bot.x = Math.max(50, Math.min(this.worldWidth - 50, newX));
      }
      if (!this.checkObstacleCollision(bot.x, newY, bot.radius)) {
        bot.y = Math.max(50, Math.min(this.worldHeight - 50, newY));
      }
    });
  }

  shootWeapon(entity) {
    const now = performance.now();
    const w = entity.weapon;

    if (now - entity.lastShotTime < w.fireRate) return;
    if (w.ammo <= 0) {
      if (entity.id === 'player') this.reloadPlayerWeapon();
      return;
    }

    entity.lastShotTime = now;
    w.ammo -= 1;

    // Play synthesized sound
    if (entity.id === 'player') {
      if (window.soundEngine[w.sound]) window.soundEngine[w.sound]();
    }

    if (w.pellets) {
      // Shotgun spread
      for (let i = 0; i < w.pellets; i++) {
        const spreadAngle = entity.angle + (Math.random() - 0.5) * w.spread;
        this.projectiles.push({
          ownerId: entity.id,
          ownerName: entity.name,
          x: entity.x + Math.cos(entity.angle) * 20,
          y: entity.y + Math.sin(entity.angle) * 20,
          vx: Math.cos(spreadAngle) * w.speed,
          vy: Math.sin(spreadAngle) * w.speed,
          damage: w.damage,
          color: w.color,
          range: 350
        });
      }
    } else {
      // Standard bullet or rocket
      this.projectiles.push({
        ownerId: entity.id,
        ownerName: entity.name,
        x: entity.x + Math.cos(entity.angle) * 22,
        y: entity.y + Math.sin(entity.angle) * 22,
        vx: Math.cos(entity.angle) * w.speed,
        vy: Math.sin(entity.angle) * w.speed,
        damage: w.damage,
        color: w.color,
        isRocket: w.isRocket,
        range: 750
      });
    }

    // Muzzle Flash Particle
    this.particles.push({
      x: entity.x + Math.cos(entity.angle) * 25,
      y: entity.y + Math.sin(entity.angle) * 25,
      radius: 8,
      color: '#fff',
      life: 0.05
    });
  }

  updateProjectiles(dt) {
    const targets = [this.player, ...this.bots].filter(e => e.health > 0);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * 60 * dt;
      p.y += p.vy * 60 * dt;
      p.range -= Math.hypot(p.vx, p.vy) * 60 * dt;

      // Obstacle collision
      if (this.checkObstacleCollision(p.x, p.y, 4) || p.range <= 0) {
        if (p.isRocket) this.explodeRocket(p.x, p.y, p.ownerId, p.ownerName, p.damage);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Entity hit check
      for (let t of targets) {
        if (t.id !== p.ownerId) {
          const dist = Math.hypot(t.x - p.x, t.y - p.y);
          if (dist < t.radius + 6) {
            if (p.isRocket) {
              this.explodeRocket(p.x, p.y, p.ownerId, p.ownerName, p.damage);
            } else {
              this.damageEntity(t, p.damage, p.ownerName, p.ownerId);
              // Blood/Spark Particles
              this.particles.push({
                x: p.x, y: p.y, radius: 4, color: '#ff4d6d', life: 0.2
              });
            }
            this.projectiles.splice(i, 1);
            break;
          }
        }
      }
    }
  }

  explodeRocket(x, y, ownerId, ownerName, maxDmg) {
    window.soundEngine.playExplosion();
    // Explosion particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        radius: Math.random() * 12 + 6,
        color: Math.random() > 0.5 ? '#ffb703' : '#ff4d6d',
        life: 0.4
      });
    }

    // Splash damage to nearby entities
    const targets = [this.player, ...this.bots].filter(e => e.health > 0);
    targets.forEach(t => {
      const dist = Math.hypot(t.x - x, t.y - y);
      if (dist < 120) {
        const dmg = maxDmg * (1 - dist / 120);
        this.damageEntity(t, dmg, ownerName, ownerId);
      }
    });
  }

  damageEntity(entity, amount, attackerName, attackerId) {
    if (entity.health <= 0) return;

    if (attackerId === 'player') {
      this.matchStats.damageDealt += Math.round(amount);
    }

    // Apply shield absorb first
    if (entity.shield > 0) {
      if (entity.shield >= amount) {
        entity.shield -= amount;
        amount = 0;
      } else {
        amount -= entity.shield;
        entity.shield = 0;
      }
    }

    entity.health -= amount;

    if (entity.health <= 0) {
      entity.health = 0;
      this.handleElimination(entity, attackerName, attackerId);
    }
  }

  handleElimination(victim, attackerName, attackerId) {
    this.addKillFeed(`☠️ ${attackerName} eliminated ${victim.name}`);

    if (attackerId === 'player') {
      this.player.kills += 1;
      this.matchStats.kills += 1;
      window.soundEngine.playCorrect();
    }

    // Drop loot where entity died
    this.lootItems.push({
      id: Math.random(),
      x: victim.x,
      y: victim.y,
      type: Math.random() > 0.5 ? 'medkit' : 'shield'
    });

    const aliveCount = [this.player, ...this.bots].filter(e => e.health > 0).length;

    // Check Victory or Game Over
    if (victim.id === 'player') {
      this.finishMatch(false, aliveCount + 1);
    } else if (aliveCount === 1 && this.player.health > 0) {
      this.finishMatch(true, 1);
    }
  }

  checkLootPickup() {
    if (this.player.health <= 0) return;

    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const loot = this.lootItems[i];
      const dist = Math.hypot(this.player.x - loot.x, this.player.y - loot.y);

      if (dist < this.player.radius + 15) {
        if (loot.type === 'medkit') {
          this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
          window.soundEngine.playLootPickup();
          this.arena.showComboBanner('+50 HEALTH!');
        } else if (loot.type === 'shield') {
          this.player.shield = Math.min(this.player.maxShield, this.player.shield + 50);
          window.soundEngine.playLootPickup();
          this.arena.showComboBanner('+50 SHIELD!');
        } else if (this.weaponTypes[loot.type]) {
          const w = this.weaponTypes[loot.type];
          if (!this.player.inventory.includes(loot.type)) {
            this.player.inventory.push(loot.type);
          }
          this.player.weapon = { ...w, ammo: w.magSize };
          window.soundEngine.playLootPickup();
          this.arena.showComboBanner(`Looted ${w.name}!`);
        }

        this.lootItems.splice(i, 1);
      }
    }
  }

  checkObstacleCollision(x, y, radius) {
    for (let obs of this.obstacles) {
      if (obs.type === 'building') {
        if (x + radius > obs.x && x - radius < obs.x + obs.w &&
            y + radius > obs.y && y - radius < obs.y + obs.h) {
          return true;
        }
      } else if (obs.type === 'tree') {
        if (Math.hypot(x - obs.x, y - obs.y) < radius + obs.r) {
          return true;
        }
      }
    }
    return false;
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  updateHUD() {
    const aliveCount = [this.player, ...this.bots].filter(e => e.health > 0).length;
    const hudAlive = document.getElementById('hud-alive');
    const hudKills = document.getElementById('hud-kills');
    const barHealth = document.getElementById('bar-health');
    const barShield = document.getElementById('bar-shield');
    const txtHealth = document.getElementById('txt-health');
    const txtShield = document.getElementById('txt-shield');
    const txtWeaponName = document.getElementById('txt-weapon-name');
    const txtAmmo = document.getElementById('txt-ammo');

    if (hudAlive) hudAlive.textContent = aliveCount;
    if (hudKills) hudKills.textContent = this.player.kills;

    if (barHealth) barHealth.style.width = `${Math.max(0, this.player.health)}%`;
    if (barShield) barShield.style.width = `${Math.max(0, this.player.shield)}%`;

    if (txtHealth) txtHealth.textContent = `${Math.round(Math.max(0, this.player.health))} / 100`;
    if (txtShield) txtShield.textContent = `${Math.round(Math.max(0, this.player.shield))} / 100`;

    if (txtWeaponName) txtWeaponName.textContent = this.player.weapon.name;
    if (txtAmmo) txtAmmo.textContent = `${this.player.weapon.ammo} / ∞ ${this.player.isReloading ? '(Reloading...)' : ''}`;
  }

  addKillFeed(text) {
    this.killFeed.unshift(text);
    if (this.killFeed.length > 5) this.killFeed.pop();

    const feedBox = document.getElementById('royale-killfeed');
    if (feedBox) {
      feedBox.innerHTML = this.killFeed.map(msg => `
        <div style="background:rgba(15,23,42,0.85); backdrop-filter:blur(8px); padding:0.35rem 0.75rem; border-radius:8px; border:1px solid var(--glass-border); font-size:0.75rem; font-weight:700; color:#fff;">
          ${msg}
        </div>
      `).join('');
    }
  }

  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const cw = this.canvas.width;
    const ch = this.canvas.height;

    // Camera follow player
    const camX = this.player.x - cw / 2;
    const camY = this.player.y - ch / 2;

    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.translate(-camX, -camY);

    // World Grid Terrain
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 100;
    for (let x = 0; x < this.worldWidth; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.worldHeight); ctx.stroke();
    }
    for (let y = 0; y < this.worldHeight; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.worldWidth, y); ctx.stroke();
    }

    // World Boundary
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, this.worldWidth, this.worldHeight);

    // 1. Draw Storm Circle
    ctx.beginPath();
    ctx.arc(this.storm.cx, this.storm.cy, this.storm.radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00f3ff';
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Outer storm hazard area overlay
    ctx.fillStyle = 'rgba(255, 77, 109, 0.15)';
    ctx.beginPath();
    ctx.rect(0, 0, this.worldWidth, this.worldHeight);
    ctx.arc(this.storm.cx, this.storm.cy, this.storm.radius, 0, Math.PI * 2, true);
    ctx.fill();

    // 2. Draw Loot Items
    this.lootItems.forEach(loot => {
      ctx.beginPath();
      ctx.arc(loot.x, loot.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = loot.type === 'medkit' ? '#00f5d4' : loot.type === 'shield' ? '#00f3ff' : '#ffb703';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // 3. Draw Obstacles (Buildings & Trees)
    this.obstacles.forEach(obs => {
      if (obs.type === 'building') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      } else if (obs.type === 'tree') {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 245, 212, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // 4. Draw Projectiles
    this.projectiles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.isRocket ? 6 : 3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // 5. Draw Bots
    this.bots.forEach(bot => {
      if (bot.health <= 0) return;
      this.drawAvatar(ctx, bot, '#ff4d6d');
    });

    // 6. Draw Player
    if (this.player.health > 0) {
      this.drawAvatar(ctx, this.player, '#00f3ff');
    }

    // 7. Draw Particles
    this.particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    ctx.restore();

    // 8. Render Top-Right Minimap overlay
    this.renderMinimap(ctx, cw, ch);
  }

  drawAvatar(ctx, entity, colorHex) {
    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.rotate(entity.angle);

    // Gun Barrel
    ctx.fillStyle = '#64748b';
    ctx.fillRect(10, 4, 16, 6);

    // Body Circle
    ctx.beginPath();
    ctx.arc(0, 0, entity.radius, 0, Math.PI * 2);
    ctx.fillStyle = colorHex;
    ctx.shadowBlur = 12;
    ctx.shadowColor = colorHex;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();

    // Health Overhead Bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(entity.x - 20, entity.y - 28, 40, 5);
    ctx.fillStyle = colorHex;
    ctx.fillRect(entity.x - 20, entity.y - 28, (entity.health / 100) * 40, 5);
  }

  renderMinimap(ctx, cw, ch) {
    const mapSize = 130;
    const margin = 15;
    const mx = cw - mapSize - margin;
    const my = margin;
    const scale = mapSize / this.worldWidth;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'var(--glass-border)';
    ctx.lineWidth = 2;
    ctx.fillRect(mx, my, mapSize, mapSize);
    ctx.strokeRect(mx, my, mapSize, mapSize);

    // Minimap Storm Circle
    ctx.beginPath();
    ctx.arc(mx + this.storm.cx * scale, my + this.storm.cy * scale, this.storm.radius * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Minimap Player Dot
    ctx.beginPath();
    ctx.arc(mx + this.player.x * scale, my + this.player.y * scale, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00f3ff';
    ctx.fill();

    ctx.restore();
  }

  finishMatch(isVictory, rank) {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const scoreGained = (31 - rank) * 100 + this.matchStats.kills * 250;

    if (isVictory) {
      window.soundEngine.playVictoryRoyale();
    } else {
      window.soundEngine.playGameOver();
    }

    this.arena.endGame('cyberRoyale', scoreGained, 'speed');
  }

  stop() {
    this.isRunning = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }
}

window.CyberRoyaleGame = CyberRoyaleGame;
