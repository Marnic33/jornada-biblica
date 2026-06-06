/**
 * Joystick — controle direcional virtual para toque (celular/tablet).
 * Escreve um vetor normalizado em engine.joystick = {x, y}, que o
 * PlayerController soma ao teclado. Funciona com toque e com mouse.
 *
 * Aparece apenas em dispositivos com toque (ou telas estreitas),
 * para não atrapalhar quem joga no computador.
 */
export class Joystick {
  constructor(root, engine) {
    this.root = root;
    this.engine = engine;
    this.engine.joystick = { x: 0, y: 0 };
    this.active = false;
    this.pointerId = null;
    this._build();
    this._bind();
  }

  static shouldShow() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 820;
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'joystick';
    this.el.innerHTML = `<div class="joystick-base"><div class="joystick-knob"></div></div>`;
    this.root.appendChild(this.el);
    this.base = this.el.querySelector('.joystick-base');
    this.knob = this.el.querySelector('.joystick-knob');
    this.radius = 55; // alcance máximo do knob em px
    if (!Joystick.shouldShow()) this.el.style.display = 'none';
  }

  _bind() {
    const start = (e) => {
      this.active = true;
      const p = this._point(e);
      this.center = this._baseCenter();
      this._move(e);
      e.preventDefault();
    };
    const move = (e) => { if (this.active) { this._move(e); e.preventDefault(); } };
    const end = () => {
      this.active = false;
      this.engine.joystick.x = 0; this.engine.joystick.y = 0;
      this.knob.style.transform = 'translate(-50%, -50%)';
    };

    this.base.addEventListener('touchstart', start, { passive: false });
    this.base.addEventListener('touchmove', move, { passive: false });
    this.base.addEventListener('touchend', end);
    this.base.addEventListener('touchcancel', end);
    // suporte a mouse (útil para testar no computador)
    this.base.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
  }

  _point(e) {
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  _baseCenter() {
    const r = this.base.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  _move(e) {
    const p = this._point(e);
    let dx = p.x - this.center.x;
    let dy = p.y - this.center.y;
    const dist = Math.hypot(dx, dy);
    const max = this.radius;
    if (dist > max) { dx = dx / dist * max; dy = dy / dist * max; }
    // posição visual do knob
    this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    // vetor normalizado (-1..1). y para frente = -z no mundo
    this.engine.joystick.x = dx / max;
    this.engine.joystick.y = dy / max;
  }

  dispose() {
    this.el.remove();
    if (this.engine.joystick) { this.engine.joystick.x = 0; this.engine.joystick.y = 0; }
  }
}
