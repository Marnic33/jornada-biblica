/**
 * WinScreen — tela de conclusão de missão, reutilizável.
 */
export class WinScreen {
  constructor(root) {
    this.root = root;
    this.el = document.createElement('div');
    this.el.className = 'screen win gone';
    this.root.appendChild(this.el);
  }

  show(meta, { onReplay, onHub }) {
    this.el.innerHTML = `
      <div class="win-icon">🌈</div>
      <h1>Missão Cumprida</h1>
      <p class="screen-sub">${meta.title} — concluída. As Escrituras ganham vida quando as vivemos.</p>
      <div class="screen-ref">${meta.reference}</div>
      <div class="win-actions">
        <button class="btn btn-ghost" id="win-replay">Jogar de novo</button>
        <button class="btn" id="win-hub">Escolher missão</button>
      </div>
    `;
    this.el.classList.remove('gone');
    requestAnimationFrame(() => this.el.classList.remove('hidden'));
    this.el.querySelector('#win-replay').addEventListener('click', () => { this.hide(); onReplay(); });
    this.el.querySelector('#win-hub').addEventListener('click', () => { this.hide(); onHub(); });
  }

  hide() {
    this.el.classList.add('hidden');
    setTimeout(() => this.el.classList.add('gone'), 600);
  }
}
