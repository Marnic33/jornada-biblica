import { SPECIES_INFO } from '../missions/noahLevels.js';

/**
 * ArkCare — fase final: cuidar dos animais durante o dilúvio.
 *
 * Mecânica de gestão de recursos:
 *  - cada espécie tem barras de FOME e SEDE que sobem com o tempo;
 *  - o jogador tem estoque de FENO 🌾 e ÁGUA 💧 que se recarrega devagar;
 *  - clicar num animal com feno/água selecionado o alimenta/hidrata;
 *  - se qualquer barra encher (100%), perde-se saúde do rebanho;
 *  - sobreviver pela duração do dilúvio (chuva) = vitória.
 *
 * Overlay 2D, ótimo no celular.
 */
export class ArkCare {
  constructor(root, species, audio, { onComplete, onFail, onBack }) {
    this.root = root;
    this.species = species;
    this.audio = audio;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.onBack = onBack;

    this.duration = 45 + species.length * 3; // segundos de dilúvio
    this.elapsed = 0;
    this.tool = 'feno';            // ferramenta selecionada
    this.hay = 100;                // estoque de feno
    this.water = 100;              // estoque de água
    this.health = 100;             // saúde do rebanho
    this.animals = species.map(s => ({
      name: s, emoji: SPECIES_INFO[s]?.emoji || '🐾',
      hunger: 20 + Math.random() * 20,
      thirst: 20 + Math.random() * 20,
    }));
    this.running = false;
    this._build();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'screen ark-care';
    const cards = this.animals.map((a, i) => `
      <div class="care-card" data-idx="${i}">
        <div class="care-emoji">${a.emoji}</div>
        <div class="care-name">${a.name}</div>
        <div class="bar-wrap"><span class="bar-label">🍖</span><div class="bar"><div class="bar-fill hunger" id="hunger-${i}"></div></div></div>
        <div class="bar-wrap"><span class="bar-label">💧</span><div class="bar"><div class="bar-fill thirst" id="thirst-${i}"></div></div></div>
      </div>`).join('');

    this.el.innerHTML = `
      <div class="care-header">
        <h1>Cuidar no Dilúvio</h1>
        <p class="hub-sub">Mantenha todos alimentados e hidratados até a chuva passar. Escolha feno ou água e clique no animal.</p>
      </div>
      <div class="care-topbar">
        <div class="care-stat">🌧️ Dilúvio <div class="bar wide"><div class="bar-fill rain" id="rain-bar"></div></div></div>
        <div class="care-stat">❤️ Rebanho <div class="bar wide"><div class="bar-fill health" id="health-bar"></div></div></div>
      </div>
      <div class="care-grid">${cards}</div>
      <div class="care-tools">
        <button class="tool-btn selected" data-tool="feno">🌾 Feno <span id="hay-amt">100</span></button>
        <button class="tool-btn" data-tool="agua">💧 Água <span id="water-amt">100</span></button>
      </div>
      <div class="ark-feedback" id="care-feedback">A chuva começou. Cuide bem do rebanho!</div>
      <button class="btn btn-ghost" id="care-back" style="margin-top:10px">← Sair</button>
    `;
    this.root.appendChild(this.el);

    this.feedback = this.el.querySelector('#care-feedback');
    this.el.querySelectorAll('.tool-btn').forEach(btn => {
      btn.onclick = () => {
        this.tool = btn.dataset.tool;
        this.el.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      };
    });
    this.el.querySelectorAll('.care-card').forEach(card => {
      card.onclick = () => this._feed(Number(card.dataset.idx));
    });
    this.el.querySelector('#care-back').onclick = () => { this.stop(); this.onBack(); };
  }

  _feed(idx) {
    const a = this.animals[idx];
    if (this.tool === 'feno') {
      if (this.hay < 15) { this.feedback.textContent = 'Sem feno! Espere recarregar.'; return; }
      this.hay -= 15; a.hunger = Math.max(0, a.hunger - 45);
    } else {
      if (this.water < 15) { this.feedback.textContent = 'Sem água! Espere recarregar.'; return; }
      this.water -= 15; a.thirst = Math.max(0, a.thirst - 45);
    }
    this.audio?.collect();
  }

  start() {
    this.running = true;
    this.last = performance.now();
    const tick = (now) => {
      if (!this.running) return;
      const dt = Math.min((now - this.last) / 1000, 0.1);
      this.last = now;
      this._update(dt);
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  stop() { this.running = false; cancelAnimationFrame(this._raf); }

  _update(dt) {
    this.elapsed += dt;
    // recarrega recursos — escala com o nº de espécies (mais animais, mais recarga)
    const refill = 6 + this.species.length * 1.6;
    this.hay = Math.min(100, this.hay + dt * refill);
    this.water = Math.min(100, this.water + dt * refill);

    // fome/sede sobem; ritmo cresce um pouco com o nº de espécies (suavizado)
    const rate = 2.0 + this.species.length * 0.1;
    let danger = false;
    for (const a of this.animals) {
      a.hunger = Math.min(100, a.hunger + dt * rate * (0.8 + Math.random() * 0.4));
      a.thirst = Math.min(100, a.thirst + dt * rate * (0.8 + Math.random() * 0.4));
      if (a.hunger >= 100 || a.thirst >= 100) danger = true;
    }
    // perde saúde se algum animal está no limite
    if (danger) this.health = Math.max(0, this.health - dt * 8);

    this._render();

    if (this.health <= 0) { this.stop(); this.feedback.textContent = 'O rebanho não resistiu...'; setTimeout(() => this.onFail(), 600); return; }
    if (this.elapsed >= this.duration) { this.stop(); this.audio?.victory(); this.feedback.textContent = '☀️ A chuva passou! Todos sobreviveram!'; setTimeout(() => this.onComplete(), 1400); }
  }

  _render() {
    this.animals.forEach((a, i) => {
      const h = this.el.querySelector(`#hunger-${i}`);
      const t = this.el.querySelector(`#thirst-${i}`);
      if (h) { h.style.width = a.hunger + '%'; h.classList.toggle('high', a.hunger > 70); }
      if (t) { t.style.width = a.thirst + '%'; t.classList.toggle('high', a.thirst > 70); }
    });
    this.el.querySelector('#hay-amt').textContent = Math.floor(this.hay);
    this.el.querySelector('#water-amt').textContent = Math.floor(this.water);
    this.el.querySelector('#health-bar').style.width = this.health + '%';
    this.el.querySelector('#rain-bar').style.width = (this.elapsed / this.duration * 100) + '%';
  }

  show() { this.el.classList.remove('gone'); requestAnimationFrame(() => this.el.classList.remove('hidden')); }
  hide() { this.el.classList.add('hidden'); setTimeout(() => this.el.classList.add('gone'), 600); }
  dispose() { this.stop(); this.el.remove(); }
}
