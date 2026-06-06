import { NOAH_LEVELS } from '../missions/noahLevels.js';

/**
 * LevelSelect — tela de escolha de nível para a missão Noé.
 * Mostra os níveis, marca os já concluídos e bloqueia os ainda não liberados
 * (precisa concluir o anterior). Progresso salvo no localStorage.
 */
export class LevelSelect {
  constructor(root, onSelect, onBack) {
    this.root = root;
    this.onSelect = onSelect;
    this.onBack = onBack;
    this._build();
  }

  _maxUnlocked() {
    try {
      const done = JSON.parse(localStorage.getItem('jb-noah-levels') || '[]');
      return done.length + 1; // libera o próximo após concluir
    } catch { return 1; }
  }

  _completedLevels() {
    try { return JSON.parse(localStorage.getItem('jb-noah-levels') || '[]'); }
    catch { return []; }
  }

  _build() {
    const unlocked = this._maxUnlocked();
    const completed = this._completedLevels();
    this.el = document.createElement('div');
    this.el.className = 'screen level-select';
    this.el.innerHTML = `
      <div class="hub-header">
        <h1>Noé e a Arca</h1>
        <p class="hub-sub">Escolha um nível. Cada etapa traz mais espécies e mais urgência.</p>
      </div>
      <div class="level-grid">
        ${NOAH_LEVELS.map(lv => {
          const done = completed.includes(lv.n);
          const locked = lv.n > unlocked;
          return `
            <button class="level-card ${locked ? 'locked' : ''}" data-level="${lv.n}" ${locked ? 'disabled' : ''}>
              <div class="level-num">${locked ? '🔒' : lv.n}</div>
              <div class="level-body">
                <h3>${lv.name}${done ? ' <span class="badge">✓</span>' : ''}</h3>
                <p>${lv.species.length} espécies${lv.timeLimit ? ` · ⏳ ${Math.floor(lv.timeLimit / 60)} min` : ' · sem tempo'}</p>
              </div>
            </button>`;
        }).join('')}
      </div>
      <button class="btn btn-ghost" id="level-back">← Voltar às missões</button>
    `;
    this.root.appendChild(this.el);
    this.el.querySelectorAll('.level-card:not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        const lv = NOAH_LEVELS.find(l => l.n === Number(card.dataset.level));
        if (lv) this.onSelect(lv);
      });
    });
    this.el.querySelector('#level-back').addEventListener('click', () => this.onBack());
  }

  show() { this.el.classList.remove('gone'); requestAnimationFrame(() => this.el.classList.remove('hidden')); }
  hide() { this.el.classList.add('hidden'); setTimeout(() => this.el.classList.add('gone'), 600); }
  dispose() { this.el.remove(); }
}
