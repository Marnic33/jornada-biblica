/**
 * WinScreen — telas de conclusão e de falha de nível, reutilizáveis.
 */
export class WinScreen {
  constructor(root) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'screen win gone';
    this.root.appendChild(this.el);
  }

  show(meta, { level, hasNext, onReplay, onNext, onHub }) {
    const title = level ? `Nível ${level.n} Concluído` : 'Missão Cumprida';
    const sub = level
      ? `"${level.name}" — todos os animais a salvo!`
      : `${meta.title} — concluída. As Escrituras ganham vida quando as vivemos.`;
    this.el.innerHTML = `
      <div class="win-icon">🌈</div>
      <h1>${title}</h1>
      <p class="screen-sub">${sub}</p>
      <div class="screen-ref">${meta.reference}</div>
      <div class="win-actions">
        <button class="btn btn-ghost" id="win-replay">Repetir</button>
        ${hasNext ? '<button class="btn" id="win-next">Próximo nível →</button>' : ''}
        <button class="btn ${hasNext ? 'btn-ghost' : ''}" id="win-hub">Níveis</button>
      </div>
    `;
    this._reveal();
    this.el.querySelector('#win-replay').onclick = () => { this.hide(); onReplay(); };
    if (hasNext) this.el.querySelector('#win-next').onclick = () => { this.hide(); onNext(); };
    this.el.querySelector('#win-hub').onclick = () => { this.hide(); onHub(); };
  }

  showFail(level, { onRetry, onHub }) {
    this.el.innerHTML = `
      <div class="win-icon">🌧️</div>
      <h1>O Tempo Esgotou</h1>
      <p class="screen-sub">As águas chegaram antes de "${level.name}" ser concluído. Tente novamente — você consegue!</p>
      <div class="screen-ref">Gênesis 7:17</div>
      <div class="win-actions">
        <button class="btn" id="win-retry">Tentar de novo</button>
        <button class="btn btn-ghost" id="win-hub">Níveis</button>
      </div>
    `;
    this._reveal();
    this.el.querySelector('#win-retry').onclick = () => { this.hide(); onRetry(); };
    this.el.querySelector('#win-hub').onclick = () => { this.hide(); onHub(); };
  }

  _reveal() {
    this.el.classList.remove('gone');
    requestAnimationFrame(() => this.el.classList.remove('hidden'));
  }

  hide() {
    this.el.classList.add('hidden');
    setTimeout(() => this.el.classList.add('gone'), 600);
  }
}
