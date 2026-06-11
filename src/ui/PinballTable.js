/**
 * PinballTable — pinball 2D em Canvas sobre a ARTE REAL da mesa (Arca de Noé).
 * A ilustração é o fundo; os elementos jogáveis ficam por cima, sobre os animais.
 * Posições em FRAÇÃO (0..1) da imagem, funcionam em qualquer tamanho.
 */
export class PinballTable {
  constructor(root, audio, { onExit } = {}) {
    this.root = root;
    this.audio = audio;
    this.onExit = onExit;
    this.W = 512; this.H = 768; // 2:3
    this.score = 0;
    this.balls = 3;
    this.savedPairs = 0;
    this.running = false;
    this.particles = [];
    this.imgReady = false;
    this._build();
    this._loadArt();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'screen pinball';
    this.el.innerHTML = `
      <div class="pinball-frame">
        <div class="pinball-hud">
          <div class="pb-stat"><span class="pb-label">Pontos</span><span id="pb-score">0</span></div>
          <div class="pb-stat center"><span class="pb-label">Pares salvos</span><span id="pb-pairs">0 / 9</span></div>
          <div class="pb-stat right"><span class="pb-label">Bolas</span><span id="pb-balls">3</span></div>
        </div>
        <canvas id="pb-canvas" width="${this.W}" height="${this.H}"></canvas>
        <div class="pinball-controls">
          <button class="pb-flip-btn" id="pb-left">◀</button>
          <button class="pb-exit" id="pb-exit">Sair</button>
          <button class="pb-flip-btn" id="pb-right">▶</button>
        </div>
        <div class="pinball-msg" id="pb-msg"></div>
      </div>
    `;
    this.root.appendChild(this.el);
    this.canvas = this.el.querySelector('#pb-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.msg = this.el.querySelector('#pb-msg');
  }

  _loadArt() {
    this.art = new Image();
    this.art.onload = () => { this.imgReady = true; };
    this.art.onerror = () => { this.imgReady = false; };
    this.art.src = 'mesa-noe.png';
    this._initTable();
    this._bind();
  }

  _fx(f) { return f * this.W; }
  _fy(f) { return f * this.H; }

  _initTable() {
    const W = this.W, H = this.H;
    this.ball = { x: W - 24, y: H - 110, vx: 0, vy: 0, r: 9, onLauncher: true };
    this.gravity = 0.22;

    const flY = H * 0.9;
    this.flippers = {
      left:  { x: W * 0.32, y: flY, len: W * 0.2, angle: 0.5, rest: 0.5, up: -0.45, active: false },
      right: { x: W * 0.68, y: flY, len: W * 0.2, angle: Math.PI - 0.5, rest: Math.PI - 0.5, up: Math.PI + 0.45, active: false },
    };
    this.walls = [
      { x1: W * 0.05, y1: H * 0.78, x2: W * 0.32 - 30, y2: flY + 4 },
      { x1: W * 0.95, y1: H * 0.78, x2: W * 0.68 + 30, y2: flY + 4 },
    ];
    this.bumpers = [
      { fx: 0.13, fy: 0.52, label: 'Leões',     emoji: '🦁' },
      { fx: 0.14, fy: 0.40, label: 'Elefantes', emoji: '🐘' },
      { fx: 0.30, fy: 0.49, label: 'Ursos',     emoji: '🐻' },
      { fx: 0.40, fy: 0.58, label: 'Zebras',    emoji: '🦓' },
      { fx: 0.80, fy: 0.56, label: 'Girafas',   emoji: '🦒' },
      { fx: 0.82, fy: 0.46, label: 'Rinocerontes', emoji: '🦏' },
      { fx: 0.17, fy: 0.74, label: 'Pandas',    emoji: '🐼' },
      { fx: 0.47, fy: 0.80, label: 'Flamingos', emoji: '🦩' },
      { fx: 0.68, fy: 0.82, label: 'Macacos',   emoji: '🐒' },
    ].map(b => ({ x: this._fx(b.fx), y: this._fy(b.fy), r: 26, ...b, lit: false, hitFlash: 0 }));
    this.arkGate = { x: this._fx(0.5), y: this._fy(0.30), w: this._fx(0.26), h: this._fy(0.05) };
  }

  _bind() {
    this._keydown = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.flippers.left.active = true;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.flippers.right.active = true;
      if (e.key === ' ' && this.ball.onLauncher) this._launch();
    };
    this._keyup = (e) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.flippers.left.active = false;
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.flippers.right.active = false;
    };
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);

    const L = this.el.querySelector('#pb-left'), R = this.el.querySelector('#pb-right');
    const press = (fl, v) => (e) => { e.preventDefault(); this.flippers[fl].active = v; if (v && this.ball.onLauncher) this._launch(); };
    L.addEventListener('touchstart', press('left', true), { passive: false });
    L.addEventListener('touchend', press('left', false));
    L.addEventListener('mousedown', press('left', true));
    L.addEventListener('mouseup', press('left', false));
    R.addEventListener('touchstart', press('right', true), { passive: false });
    R.addEventListener('touchend', press('right', false));
    R.addEventListener('mousedown', press('right', true));
    R.addEventListener('mouseup', press('right', false));
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      for (const t of e.touches) {
        const side = (t.clientX - rect.left) < rect.width / 2 ? 'left' : 'right';
        this.flippers[side].active = true;
      }
      if (this.ball.onLauncher) this._launch();
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => { this.flippers.left.active = false; this.flippers.right.active = false; });

    this.el.querySelector('#pb-exit').onclick = () => { this.stop(); this.onExit?.(); };
    this._showMsg('Toque ou ESPAÇO para lançar');
  }

  _launch() {
    if (!this.ball.onLauncher) return;
    this.ball.onLauncher = false;
    this.ball.vx = -2 - Math.random() * 1.5;
    this.ball.vy = -15;
    this._showMsg('');
  }

  start() {
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 16.67, 2);
      this.last = now;
      this._update(dt); this._draw();
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false; cancelAnimationFrame(this._raf);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
  }

  _update(dt) {
    const b = this.ball, W = this.W, H = this.H;
    for (const key of ['left', 'right']) {
      const f = this.flippers[key];
      const target = f.active ? f.up : f.rest;
      f.angle += (target - f.angle) * 0.4 * dt;
    }
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.2 * dt; p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    if (b.onLauncher) return;

    b.vy += this.gravity * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;

    if (b.x < b.r) { b.x = b.r; b.vx *= -0.7; }
    if (b.x > W - b.r) { b.x = W - b.r; b.vx *= -0.7; }
    if (b.y < b.r) { b.y = b.r; b.vy *= -0.7; }

    const ag = this.arkGate;
    if (b.y < ag.y + ag.h && Math.abs(b.x - ag.x) < ag.w / 2 && b.vy < 0) {
      this._addScore(500); this._showMsg('🛟 +500 Arca!'); this._burst(b.x, b.y, '#e8c878');
      b.vy = Math.abs(b.vy) * 0.6; setTimeout(() => this._showMsg(''), 900);
    }

    for (const bm of this.bumpers) {
      const dx = b.x - bm.x, dy = b.y - bm.y, d = Math.hypot(dx, dy);
      if (d < b.r + bm.r) {
        const nx = dx / (d || 1), ny = dy / (d || 1);
        b.x = bm.x + nx * (b.r + bm.r); b.y = bm.y + ny * (b.r + bm.r);
        const dot = b.vx * nx + b.vy * ny;
        b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.vx *= 1.05; b.vy *= 1.05;
        bm.hitFlash = 12; this._burst(bm.x, bm.y, '#fff0a0'); this.audio?.collect?.();
        if (!bm.lit) { bm.lit = true; this.savedPairs++; this._addScore(300); this._updatePairs(); this._checkWin(); }
        else this._addScore(100);
      }
      if (bm.hitFlash > 0) bm.hitFlash -= dt;
    }

    for (const w of this.walls) this._segmentBounce(b, w);
    this._flipperBounce(this.flippers.left, b, +1);
    this._flipperBounce(this.flippers.right, b, -1);

    if (b.y > H + 30) this._loseBall();
  }

  _segmentBounce(b, w) {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len2 = dx * dx + dy * dy;
    let t = ((b.x - w.x1) * dx + (b.y - w.y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = w.x1 + t * dx, py = w.y1 + t * dy;
    const ddx = b.x - px, ddy = b.y - py, d = Math.hypot(ddx, ddy);
    if (d < b.r) {
      const nx = ddx / (d || 1), ny = ddy / (d || 1);
      b.x = px + nx * b.r; b.y = py + ny * b.r;
      const dot = b.vx * nx + b.vy * ny;
      b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny; b.vx *= 0.9; b.vy *= 0.9;
    }
  }

  _flipperBounce(f, b, side) {
    const ex = f.x + Math.cos(f.angle) * f.len, ey = f.y + Math.sin(f.angle) * f.len;
    const dx = ex - f.x, dy = ey - f.y, len2 = dx * dx + dy * dy;
    let t = ((b.x - f.x) * dx + (b.y - f.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = f.x + t * dx, py = f.y + t * dy;
    const ddx = b.x - px, ddy = b.y - py, d = Math.hypot(ddx, ddy);
    if (d < b.r + 6) {
      const nx = ddx / (d || 1), ny = ddy / (d || 1);
      b.x = px + nx * (b.r + 6); b.y = py + ny * (b.r + 6);
      const dot = b.vx * nx + b.vy * ny;
      b.vx -= 2 * dot * nx; b.vy -= 2 * dot * ny;
      if (f.active) { b.vy -= 9; b.vx += side * 3; this.audio?.collect?.(); }
      b.vx *= 0.96; b.vy *= 0.96;
    }
  }

  _loseBall() {
    this.balls--; this._updateBalls();
    if (this.balls <= 0) this._gameOver(false);
    else {
      this.ball.onLauncher = true;
      this.ball.x = this.W - 24; this.ball.y = this.H - 110; this.ball.vx = 0; this.ball.vy = 0;
      this._showMsg('Bola perdida! Toque para lançar');
    }
  }

  _checkWin() {
    if (this.savedPairs >= this.bumpers.length) { this._addScore(2000); setTimeout(() => this._gameOver(true), 800); }
  }

  _gameOver(win) {
    this.running = false; cancelAnimationFrame(this._raf);
    this.msg.innerHTML = `
      <div class="pb-over">
        <h2>${win ? '🌈 Todos a salvo!' : 'Fim de jogo'}</h2>
        <p>Pontuação: <b>${this.score}</b></p>
        <button class="btn" id="pb-again">Jogar de novo</button>
        <button class="btn btn-ghost" id="pb-back">Voltar</button>
      </div>`;
    this.msg.classList.add('show');
    this.msg.querySelector('#pb-again').onclick = () => { this.msg.classList.remove('show'); this._reset(); };
    this.msg.querySelector('#pb-back').onclick = () => { this.stop(); this.onExit?.(); };
  }

  _reset() {
    this.score = 0; this.balls = 3; this.savedPairs = 0; this.particles = [];
    this.bumpers.forEach(b => { b.lit = false; b.hitFlash = 0; });
    this._updateScore(); this._updatePairs(); this._updateBalls();
    this.ball.onLauncher = true; this.ball.x = this.W - 24; this.ball.y = this.H - 110; this.ball.vx = 0; this.ball.vy = 0;
    this._showMsg('Toque para lançar'); this.running = true; this.last = performance.now();
    const loop = (now) => { if (!this.running) return; const dt = Math.min((now - this.last) / 16.67, 2); this.last = now; this._update(dt); this._draw(); this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
  }

  _addScore(n) { this.score += n; this._updateScore(); }
  _updateScore() { this.el.querySelector('#pb-score').textContent = this.score; }
  _updatePairs() { this.el.querySelector('#pb-pairs').textContent = `${this.savedPairs} / ${this.bumpers.length}`; }
  _updateBalls() { this.el.querySelector('#pb-balls').textContent = this.balls; }
  _showMsg(t) { this.msg.textContent = t; this.msg.classList.toggle('show', !!t); }

  _burst(x, y, color) {
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 4;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 18 + Math.random() * 14, color });
    }
  }

  _draw() {
    const ctx = this.ctx, W = this.W, H = this.H;
    if (this.imgReady) ctx.drawImage(this.art, 0, 0, W, H);
    else { ctx.fillStyle = '#1a2330'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(8,10,20,0.18)'; ctx.fillRect(0, 0, W, H);

    const ag = this.arkGate;
    ctx.save();
    ctx.strokeStyle = 'rgba(232,200,120,0.9)'; ctx.lineWidth = 3; ctx.shadowColor = '#e8c878'; ctx.shadowBlur = 16;
    this._roundRect(ag.x - ag.w / 2, ag.y - ag.h / 2, ag.w, ag.h, 10); ctx.stroke();
    ctx.restore();

    ctx.strokeStyle = 'rgba(232,200,120,0.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const w of this.walls) { ctx.beginPath(); ctx.moveTo(w.x1, w.y1); ctx.lineTo(w.x2, w.y2); ctx.stroke(); }

    for (const bm of this.bumpers) {
      ctx.save();
      const glow = bm.hitFlash > 0 ? 28 : (bm.lit ? 16 : 8);
      ctx.shadowColor = bm.lit ? '#7fff9f' : '#8fd0ff'; ctx.shadowBlur = glow;
      ctx.lineWidth = bm.lit ? 4 : 3;
      ctx.strokeStyle = bm.lit ? 'rgba(127,255,159,0.95)' : 'rgba(143,208,255,0.85)';
      ctx.beginPath(); ctx.arc(bm.x, bm.y, bm.r, 0, Math.PI * 2); ctx.stroke();
      if (bm.lit) {
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(127,255,159,0.95)';
        ctx.font = 'bold 16px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('✓', bm.x + bm.r - 2, bm.y - bm.r + 4);
      }
      ctx.restore();
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life / 30); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const key of ['left', 'right']) {
      const f = this.flippers[key];
      const ex = f.x + Math.cos(f.angle) * f.len, ey = f.y + Math.sin(f.angle) * f.len;
      ctx.save();
      ctx.strokeStyle = '#e8c878'; ctx.lineWidth = 15; ctx.lineCap = 'round';
      ctx.shadowColor = '#cf9f43'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(ex, ey); ctx.stroke();
      ctx.restore();
    }

    const b = this.ball;
    ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 12;
    const bg = ctx.createRadialGradient(b.x - 3, b.y - 3, 1, b.x, b.y, b.r);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#9aa8b8'); ctx.fillStyle = bg;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  _roundRect(x, y, w, h, r) {
    const ctx = this.ctx;
    ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  show() { this.el.classList.remove('gone'); requestAnimationFrame(() => this.el.classList.remove('hidden')); }
  hide() { this.el.classList.add('hidden'); setTimeout(() => this.el.classList.add('gone'), 400); }
  dispose() { this.stop(); this.canvas?.remove(); this.el?.remove(); }
}
