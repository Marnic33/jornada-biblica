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
          <div id="hud-list" class="hud-list"></div>
        </div>
        <div class="panel panel-objective">
          <h2>Missão</h2>
          <div id="hud-objective" class="objective"></div>
        </div>
      </div>
      <div id="hud-verse" class="verse">
        <p id="hud-verse-text"></p>
        <cite id="hud-verse-ref"></cite>
      </div>
      <div id="hud-controls" class="controls"></div>
    `;
    this.root.appendChild(this.el);
    this.counter = this.el.querySelector('#hud-counter');
    this.counterLabel = this.el.querySelector('#hud-counter-label');
    this.list = this.el.querySelector('#hud-list');
    this.objective = this.el.querySelector('#hud-objective');
    this.verse = this.el.querySelector('#hud-verse');
    this.verseText = this.el.querySelector('#hud-verse-text');
    this.verseRef = this.el.querySelector('#hud-verse-ref');
    this.controls = this.el.querySelector('#hud-controls');
  }

  show() { this.el.classList.add('visible'); }
  hide() { this.el.classList.remove('visible'); }

  setCounterLabel(text) { this.counterLabel.textContent = text; }
  setCounter(current, total) {
    this.counter.innerHTML = `${current}<small>/${total}</small>`;
  }
  setObjective(text) { this.objective.textContent = text; }
  setControls(html) { this.controls.innerHTML = html; }

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
