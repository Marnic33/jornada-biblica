import { SPECIES_INFO } from '../missions/noahLevels.js';

/**
 * ArkInterior — fase de quebra-cabeça: alojar cada par de animais
 * na baia correta dentro da arca.
 *
 * Regras do quebra-cabeça:
 *  - há uma baia por espécie (rotulada);
 *  - predadores e presas não podem ocupar baias VIZINHAS;
 *  - cada par vai na sua própria baia.
 * O jogador clica num animal (painel inferior) e depois numa baia.
 *
 * É um overlay 2D top-down — leve, claro e ótimo no celular.
 */
export class ArkInterior {
  constructor(root, species, audio, { onComplete, onBack }) {
    this.root = root;
    this.species = species;
    this.audio = audio;
    this.onComplete = onComplete;
    this.onBack = onBack;
    this.selected = null;
    // Baias EXTRAS (vazias) permitem separar predadores de presas.
    // Com folga suficiente, o quebra-cabeça é sempre solucionável.
    const predators = species.filter(s => SPECIES_INFO[s]?.type === 'predador').length;
    this.bayCount = species.length + Math.max(2, predators + 1);
    this.cols = Math.min(this.bayCount, 5);
    this.placement = {}; // bayIndex -> species
    this._build();
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'screen ark-interior';
    const bays = Array.from({ length: this.bayCount }, (_, i) =>
      `<div class="bay" data-bay="${i}"><div class="bay-label">Baia ${i + 1}</div><div class="bay-slot" id="slot-${i}"></div></div>`
    ).join('');
    const tokens = this.species.map(s =>
      `<button class="animal-token" data-species="${s}">
         <span class="token-emoji">${SPECIES_INFO[s]?.emoji || '🐾'}</span>
         <span class="token-name">${s}</span>
         <span class="token-type ${SPECIES_INFO[s]?.type}">${SPECIES_INFO[s]?.type === 'predador' ? 'predador' : 'presa'}</span>
       </button>`
    ).join('');

    this.el.innerHTML = `
      <div class="ark-header">
        <h1>Organize a Arca</h1>
        <p class="hub-sub">Aloje cada par numa baia. <b>Predadores não podem ficar ao lado de presas</b> — use as baias vazias para separá-los.</p>
      </div>
      <div class="bay-grid" style="grid-template-columns: repeat(${this.cols}, 1fr)">${bays}</div>
      <div class="ark-feedback" id="ark-feedback">Escolha um animal abaixo e clique numa baia.</div>
      <div class="token-row">${tokens}</div>
      <div class="win-actions">
        <button class="btn btn-ghost" id="ark-back">← Voltar</button>
        <button class="btn" id="ark-confirm">Confirmar arranjo</button>
      </div>
    `;
    this.root.appendChild(this.el);

    this.feedback = this.el.querySelector('#ark-feedback');
    this.el.querySelectorAll('.animal-token').forEach(tok => {
      tok.onclick = () => this._selectToken(tok);
    });
    this.el.querySelectorAll('.bay').forEach(bay => {
      bay.onclick = () => this._placeInBay(Number(bay.dataset.bay));
    });
    this.el.querySelector('#ark-back').onclick = () => this.onBack();
    this.el.querySelector('#ark-confirm').onclick = () => this._confirm();
  }

  _selectToken(tok) {
    if (tok.classList.contains('placed')) return;
    this.el.querySelectorAll('.animal-token').forEach(t => t.classList.remove('selected'));
    tok.classList.add('selected');
    this.selected = tok.dataset.species;
    this.feedback.textContent = `${this.selected} selecionado — escolha uma baia.`;
  }

  _neighbors(bayIndex) {
    // vizinhança só HORIZONTAL (esquerda/direita na mesma linha):
    // regra intuitiva e sempre solucionável — basta deixar uma baia
    // vazia ou outro predador entre o predador e a presa.
    const r = Math.floor(bayIndex / this.cols), c = bayIndex % this.cols;
    const out = [];
    for (const cc of [c - 1, c + 1]) {
      if (cc < 0 || cc >= this.cols) continue;
      const idx = r * this.cols + cc;
      if (idx < this.bayCount) out.push(idx);
    }
    return out;
  }

  _placeInBay(bayIndex) {
    // clicar numa baia ocupada devolve o animal ao painel
    if (this.placement[bayIndex]) {
      const sp = this.placement[bayIndex];
      delete this.placement[bayIndex];
      const slot = this.el.querySelector(`#slot-${bayIndex}`);
      slot.textContent = ''; slot.classList.remove('filled');
      const tok = this.el.querySelector(`.animal-token[data-species="${sp}"]`);
      tok.classList.remove('placed');
      this.feedback.textContent = `${sp} removido. Reposicione onde quiser.`;
      this._highlightConflicts();
      return;
    }
    if (!this.selected) { this.feedback.textContent = 'Escolha um animal abaixo, depois clique numa baia.'; return; }
    // coloca
    this.placement[bayIndex] = this.selected;
    const slot = this.el.querySelector(`#slot-${bayIndex}`);
    slot.textContent = SPECIES_INFO[this.selected]?.emoji || '🐾';
    slot.classList.add('filled');
    const tok = this.el.querySelector(`.animal-token[data-species="${this.selected}"]`);
    tok.classList.add('placed'); tok.classList.remove('selected');
    this.audio?.collect();
    this.selected = null;
    this._highlightConflicts();
    const remaining = this.species.length - Object.keys(this.placement).length;
    const hasConflict = this._findConflicts().size > 0;
    if (hasConflict) {
      this.feedback.textContent = '🔴 As baias vermelhas têm predador e presa lado a lado. Afaste-os!';
    } else {
      this.feedback.textContent = remaining > 0 ? `Faltam ${remaining} par(es). Dica: ponha os predadores juntos, longe das presas.` : 'Tudo certo! Pode confirmar. ✓';
    }
  }

  /** Retorna o conjunto de índices de baias em conflito (predador ao lado de presa). */
  _findConflicts() {
    const bad = new Set();
    for (const [idxStr, sp] of Object.entries(this.placement)) {
      const idx = Number(idxStr);
      const type = SPECIES_INFO[sp]?.type;
      for (const nb of this._neighbors(idx)) {
        const nbSp = this.placement[nb];
        if (!nbSp) continue;
        const nbType = SPECIES_INFO[nbSp]?.type;
        if ((type === 'predador' && nbType === 'presa') || (type === 'presa' && nbType === 'predador')) {
          bad.add(idx); bad.add(nb);
        }
      }
    }
    return bad;
  }

  /** Pinta de vermelho, em tempo real, as baias em conflito. */
  _highlightConflicts() {
    const bad = this._findConflicts();
    this.el.querySelectorAll('.bay').forEach(bay => {
      const idx = Number(bay.dataset.bay);
      bay.classList.toggle('conflict', bad.has(idx));
    });
  }

  _confirm() {
    if (Object.keys(this.placement).length < this.species.length) {
      this.feedback.textContent = 'Aloje todos os pares antes de confirmar.';
      this.feedback.classList.remove('error');
      return;
    }
    const bad = this._findConflicts();
    if (bad.size > 0) {
      this.feedback.innerHTML = '⚠️ Ainda há predador e presa lado a lado (baias vermelhas). Afaste-os e confirme de novo.';
      this.feedback.classList.add('error');
      this._highlightConflicts();
    } else {
      this.audio?.victory();
      this.feedback.classList.remove('error');
      this.feedback.textContent = '✓ Arranjo perfeito! A arca está organizada.';
      setTimeout(() => this.onComplete(), 1200);
    }
  }

  _reset() {
    this.placement = {};
    this.selected = null;
    this.feedback.classList.remove('error');
    this.feedback.textContent = 'Tente outro arranjo — escolha um animal e uma baia.';
    this.el.querySelectorAll('.bay-slot').forEach(s => { s.textContent = ''; s.classList.remove('filled'); });
    this.el.querySelectorAll('.animal-token').forEach(t => t.classList.remove('placed', 'selected'));
  }

  show() { this.el.classList.remove('gone'); requestAnimationFrame(() => this.el.classList.remove('hidden')); }
  hide() { this.el.classList.add('hidden'); setTimeout(() => this.el.classList.add('gone'), 600); }
  dispose() { this.el.remove(); }
}
