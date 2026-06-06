import * as THREE from 'three';

/**
 * PlayerController — movimento WASD/setas + câmera em terceira pessoa.
 * Reutilizável por qualquer missão que tenha um avatar controlável.
 */
export class PlayerController {
  constructor(engine, mesh, { speed = 8, bounds = 58, camHeight = 13, camDist = 17, radius = 0.8 } = {}) {
    this.engine = engine;
    this.mesh = mesh;
    this.speed = speed;
    this.bounds = bounds;
    this.camHeight = camHeight;
    this.camDist = camDist;
    this.radius = radius;
    this.moving = false;
    this.enabled = true;
    this.obstacles = []; // [{x, z, r}]
  }

  /** Registra obstáculos sólidos: array de {x, z, r}. */
  setObstacles(list) { this.obstacles = list || []; }

  /** Empurra uma posição para fora de qualquer obstáculo (colisão circular). */
  resolveCollisions(pos, selfRadius = this.radius) {
    for (const o of this.obstacles) {
      const dx = pos.x - o.x, dz = pos.z - o.z;
      const minDist = o.r + selfRadius;
      const d2 = dx * dx + dz * dz;
      if (d2 < minDist * minDist && d2 > 0.0001) {
        const d = Math.sqrt(d2);
        const push = (minDist - d) / d;
        pos.x += dx * push;
        pos.z += dz * push;
      }
    }
  }

  update(dt) {
    if (!this.enabled) return;
    const k = this.engine.keys;
    let mx = 0, mz = 0;
    if (k['w'] || k['arrowup']) mz -= 1;
    if (k['s'] || k['arrowdown']) mz += 1;
    if (k['a'] || k['arrowleft']) mx -= 1;
    if (k['d'] || k['arrowright']) mx += 1;
    // input do joystick virtual (toque), se houver
    const j = this.engine.joystick;
    if (j && (j.x !== 0 || j.y !== 0)) { mx += j.x; mz += j.y; }
    const len = Math.hypot(mx, mz);
    this.moving = len > 0;
    if (this.moving) {
      mx /= len; mz /= len;
      this.mesh.position.x += mx * this.speed * dt;
      this.mesh.position.z += mz * this.speed * dt;
      const b = this.bounds;
      this.mesh.position.x = Math.max(-b, Math.min(b, this.mesh.position.x));
      this.mesh.position.z = Math.max(-b, Math.min(b, this.mesh.position.z));
      // colisão com obstáculos sólidos
      this.resolveCollisions(this.mesh.position);
      // rotação suave para a direção do movimento
      const targetAngle = Math.atan2(mx, mz);
      this.mesh.rotation.y = this._lerpAngle(this.mesh.rotation.y, targetAngle, 0.2);
    }
    this._updateCamera();
  }

  _updateCamera() {
    const p = this.mesh.position;
    const desired = new THREE.Vector3(p.x, p.y + this.camHeight, p.z + this.camDist);
    this.engine.camera.position.lerp(desired, 0.08);
    this.engine.camera.lookAt(p.x, p.y + 1.5, p.z - 2);
  }

  _lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  }
}
