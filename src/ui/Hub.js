import { MISSIONS, UPCOMING } from '../missions/index.js';

/**
 * Hub — tela de seleção de missões. Lista missões jogáveis e "em breve".
 * Lê o progresso salvo do localStorage para mostrar quais já foram completadas.
 */
export class Hub {
  constructor(root, onSelect) {
    this.root = root;
    this.onSelect = onSelect;
    this._build();
  }

  _completed() {
    try { return JSON.parse(localStorage.getItem('jb-completed') || '[]'); }
    catch { return []; }
  }

  _build() {
    const completed = this._completed();
    this.el = document.createElement('div');
    this.el.className = 'screen hub';
    this.el.innerHTML = `
      <div class="hub-header">
        <h1>Jornada Bíblica</h1>
        <p class="hub-sub">Viva as histórias das Escrituras em 3D. Escolha uma missão.</p>
      </div>
      <div class="mission-grid">
        ${MISSIONS.map(M => {
          const m = M.meta;
          const done = completed.includes(m.id);
          return `
            <button class="mission-card" data-id="${m.id}" style="--accent:${m.accent}">
              <div class="card-icon">${m.icon}</div>
              <div class="card-body">
                <h3>${m.title}${done ? ' <span class="badge">✓ Concluída</span>' : ''}</h3>
                <p>${m.subtitle}</p>
                <span class="card-ref">${m.reference}</span>
              </div>
              <span class="card-play">Jogar →</span>
            </button>`;
        }).join('')}
        ${UPCOMING.map(m => `
          <div class="mission-card locked" style="--accent:${m.accent}">
            <div class="card-icon">${m.icon}</div>
            <div class="card-body">
              <h3>${m.title}</h3>
              <p>Em breve nesta jornada.</p>
              <span class="card-ref">${m.reference}</span>
            </div>
            <span class="card-soon">Em breve</span>
          </div>`).join('')}
      </div>
      <p class="hub-foot">Mais histórias serão acrescentadas ao longo do tempo.</p>
    `;
    this.root.appendChild(this.el);
    this.el.querySelectorAll('.mission-card[data-id]').forEach(card => {
      card.addEventListener('click', () => {
        const M = MISSIONS.find(m => m.meta.id === card.dataset.id);
        if (M) this.onSelect(M);
      });
    });
  }

  show() { this.el.classList.remove('gone'); requestAnimationFrame(() => this.el.classList.remove('hidden')); }
  hide() { this.el.classList.add('hidden'); setTimeout(() => this.el.classList.add('gone'), 600); }
  dispose() { this.el.remove(); }
}
