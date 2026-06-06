/**
 * HUD — overlay reutilizável: painéis de objetivo, contador,
 * versículos flutuantes e toasts. Cada missão controla o conteúdo.
 */
export class HUD {
  constructor(root) {
    this.root = root;
    this._build();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'hud';
    this.el.innerHTML = `
      <div class="hud-top">
        <div class="panel panel-counter">
          <h2 id="hud-counter-label">Progresso</h2>
          <div id="hud-counter" class="counter">0<small>/0</small></div>
          <div id="hud-timer" class="timer"></div>
          <div id="hud-list" class="hud-list"></div>
        </div>
        <div class="hud-right">
          <div class="hud-buttons">
            <button id="btn-sound" class="icon-btn" title="Som">🔊</button>
            <button id="btn-pause" class="icon-btn" title="Pausar">⏸</button>
            <button id="btn-restart" class="icon-btn" title="Reiniciar">↺</button>
            <button id="btn-hub" class="icon-btn" title="Missões">☰</button>
          </div>
          <div class="panel panel-objective">
            <h2>Missão</h2>
            <div id="hud-objective" class="objective"></div>
          </div>
        </div>
      </div>
      <div id="hud-verse" class="verse">
        <p id="hud-verse-text"></p>
        <cite id="hud-verse-ref"></cite>
      </div>
      <div id="hud-controls" class="controls"></div>
      <div id="hud-pause-overlay" class="pause-overlay">
        <div class="pause-card">
          <h2>Pausado</h2>
          <button id="btn-resume" class="btn">Continuar</button>
        </div>
      </div>
    `;
    this.root.appendChild(this.el);
    this.btnSound = this.el.querySelector('#btn-sound');
    this.btnPause = this.el.querySelector('#btn-pause');
    this.btnRestart = this.el.querySelector('#btn-restart');
    this.btnHub = this.el.querySelector('#btn-hub');
    this.btnResume = this.el.querySelector('#btn-resume');
    this.pauseOverlay = this.el.querySelector('#hud-pause-overlay');
    this.counter = this.el.querySelector('#hud-counter');
    this.counterLabel = this.el.querySelector('#hud-counter-label');
    this.list = this.el.querySelector('#hud-list');
    this.objective = this.el.querySelector('#hud-objective');
    this.verse = this.el.querySelector('#hud-verse');
    this.verseText = this.el.querySelector('#hud-verse-text');
    this.verseRef = this.el.querySelector('#hud-verse-ref');
    this.controls = this.el.querySelector('#hud-controls');
    this.timer = this.el.querySelector('#hud-timer');
  }

  show() { this.el.classList.add('visible'); }
  hide() { this.el.classList.remove('visible'); }

  /** Liga os botões a callbacks. Chamado pela missão/Game. */
  bindControls({ onPause, onResume, onRestart, onHub, onToggleSound }) {
    this._paused = false;
    this._muted = false;
    this.btnPause.onclick = () => { this._paused = true; this.pauseOverlay.classList.add('show'); onPause?.(); };
    this.btnResume.onclick = () => { this._paused = false; this.pauseOverlay.classList.remove('show'); onResume?.(); };
    this.btnRestart.onclick = () => onRestart?.();
    this.btnHub.onclick = () => onHub?.();
    this.btnSound.onclick = () => {
      this._muted = !this._muted;
      this.btnSound.textContent = this._muted ? '🔇' : '🔊';
      onToggleSound?.(this._muted);
    };
  }

  setCounterLabel(text) { this.counterLabel.textContent = text; }
  setCounter(current, total) {
    this.counter.innerHTML = `${current}<small>/${total}</small>`;
  }
  setObjective(text) { this.objective.textContent = text; }
  setControls(html) { this.controls.innerHTML = html; }

  /** Atualiza o cronômetro. seconds<0 esconde. */
  setTimer(seconds) {
    if (seconds == null || seconds < 0) { this.timer.style.display = 'none'; return; }
    this.timer.style.display = 'block';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    this.timer.textContent = `⏳ ${m}:${s.toString().padStart(2, '0')}`;
    this.timer.classList.toggle('urgent', seconds <= 30);
  }

  setList(items) {
    // items: [{label, done}]
    this.list.innerHTML = items.map(it =>
      `<div class="${it.done ? 'item-done' : 'item-todo'}">${it.label}</div>`
    ).join('');
  }

  showVerse(text, ref, duration = 6500) {
    this.verseText.textContent = `"${text}"`;
    this.verseRef.textContent = ref;
    this.verse.classList.add('show');
    clearTimeout(this._verseTimer);
    this._verseTimer = setTimeout(() => this.verse.classList.remove('show'), duration);
  }

  dispose() {
    clearTimeout(this._verseTimer);
    this.el.remove();
  }
}
