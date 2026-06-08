import * as THREE from 'three';
import { Mission } from './Mission.js';
import { createTerrain } from '../engine/WorldBuilder.js';
import { createGoliath, createDavid } from '../engine/Creatures.js';
import { createSky, createMountains, scatterVegetation } from '../engine/Scenery.js';

const VERSES = [
  { t: 'Tu vens a mim com espada... porém eu venho a ti em nome do Senhor dos Exércitos.', r: '1 Samuel 17:45' },
  { t: 'Davi tomou cinco seixos lisos do ribeiro e os pôs no alforje de pastor.', r: '1 Samuel 17:40' },
  { t: 'A batalha é do Senhor, e ele vos entregará nas nossas mãos.', r: '1 Samuel 17:47' },
];

/**
 * DavidMission — Davi e Golias. Mecânica de mira e arremesso com funda.
 *  - Davi fica à frente; Golias avança lentamente.
 *  - O jogador MIRA (mouse/toque) e CARREGA a funda (segurar), depois SOLTA.
 *  - A pedra voa com física (gravidade). Acertar a cabeça de Golias vence.
 *  - 5 pedras (1 Sm 17:40). Se Golias chegar muito perto, derrota.
 */
export class DavidMission extends Mission {
  static meta = {
    id: 'davi',
    title: 'Davi e Golias',
    subtitle: 'Com fé e uma funda, enfrente o gigante. Mire e arremesse a pedra.',
    reference: '1 Samuel 17',
    icon: '🪨',
    accent: '#a9c5d4',
  };

  constructor(engine, ui, audio) {
    super(engine, ui);
    this.audio = audio;
  }

  setup() {
    this.stones = 5;
    this.won = false;
    this.lost = false;
    this.charging = false;
    this.power = 0;
    this.aim = { x: 0, y: 0.5 };       // direção de mira (tela)
    this.projectiles = [];
    this.goliathHP = 1;                // 1 acerto na testa basta

    this.engine.setupAtmosphere({
      skyColor: 0x9ab0c0, fogColor: 0xd8c8a0, fogNear: 70, fogFar: 220,
      sunColor: 0xfff0d0, sunIntensity: 2.4, sunPos: [30, 50, 10],
      ambientColor: 0xffe8c8, ambientIntensity: 0.6,
      hemiSky: 0xcfe0f0, hemiGround: 0x9a8a50, hemiIntensity: 0.5,
    });
    createSky(this.engine.scene, { top: 0x6aa0d0, bottom: 0xe8d0a0 });
    createMountains(this.engine.scene, { radius: 150, count: 20, color: 0x8a7a55 });

    // vale de Elá — terreno árido
    this.engine.scene.add(createTerrain({ size: 220, color: 0x9a8a52, amplitude: 0.5, segments: 60 }));
    scatterVegetation(this.engine.scene, { area: 140, trees: 10, bushes: 16, avoid: (x, z) => Math.abs(x) < 10 });

    // Davi (frente, perto da câmera)
    this.david = createDavid();
    this.david.position.set(0, 0, 18);
    this.engine.scene.add(this.david);

    // Golias (ao fundo, avança)
    this.goliath = createGoliath();
    this.goliath.position.set(0, 0, -40);
    this.goliath.rotation.y = Math.PI; // de frente para Davi
    this.engine.scene.add(this.goliath);

    // funda visual (gira durante o carregamento)
    this.sling = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
    );
    this.sling.visible = false;
    this.engine.scene.add(this.sling);

    // câmera atrás de Davi, olhando Golias
    this.engine.camera.position.set(0, 6, 26);
    this.engine.camera.lookAt(0, 4, -40);

    // mira (retícula) na tela
    this._buildAimUI();

    this.ui.setCounterLabel('Pedras');
    this.ui.setCounter(this.stones, 5);
    this.ui.setObjective('Segure para carregar a funda, mire na cabeça de Golias e solte para arremessar.');
    this.ui.setControls('🖱️/👆 <b>Segure e mire</b> · <b>Solte</b> para arremessar a pedra');
    this.ui.setTimer(-1);
    this.ui.show();
    this.ui.showVerse(VERSES[0].t, VERSES[0].r, 5000);

    this.engine.onUpdate((dt, t) => this.update(dt, t));
  }

  _buildAimUI() {
    this.aimEl = document.createElement('div');
    this.aimEl.className = 'aim-layer';
    this.aimEl.innerHTML = `
      <div class="reticle" id="reticle"></div>
      <div class="power-bar"><div class="power-fill" id="power-fill"></div></div>
      <div class="aim-hint" id="aim-hint">Segure para carregar</div>
    `;
    document.getElementById('app').appendChild(this.aimEl);
    this.reticle = this.aimEl.querySelector('#reticle');
    this.powerFill = this.aimEl.querySelector('#power-fill');
    this.aimHint = this.aimEl.querySelector('#aim-hint');

    const getXY = (e) => {
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX, y: t.clientY };
    };
    this._down = (e) => {
      if (this.won || this.lost || this.stones <= 0) return;
      this.charging = true; this.power = 0;
      this._updateAim(getXY(e));
      e.preventDefault();
    };
    this._move = (e) => { if (this.charging) { this._updateAim(getXY(e)); e.preventDefault(); } };
    this._up = () => { if (this.charging) this._release(); };

    this.aimEl.addEventListener('mousedown', this._down);
    window.addEventListener('mousemove', this._move);
    window.addEventListener('mouseup', this._up);
    this.aimEl.addEventListener('touchstart', this._down, { passive: false });
    window.addEventListener('touchmove', this._move, { passive: false });
    window.addEventListener('touchend', this._up);
  }

  _updateAim(p) {
    // posição da retícula na tela
    this.reticle.style.left = p.x + 'px';
    this.reticle.style.top = p.y + 'px';
    // converte para direção de mira normalizada (centro da tela = referência)
    const w = window.innerWidth, h = window.innerHeight;
    this.aim.x = (p.x / w - 0.5) * 2;      // -1 (esq) .. 1 (dir)
    this.aim.y = (1 - p.y / h);            // 0 (baixo) .. 1 (topo)
  }

  _release() {
    this.charging = false;
    this.aimHint.textContent = 'Segure para carregar';
    if (this.stones <= 0) return;
    this.stones--;
    this.ui.setCounter(this.stones, 5);

    // cria a pedra
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.22, 0),
      new THREE.MeshStandardMaterial({ color: 0x9a9a90, roughness: 1, flatShading: true })
    );
    stone.position.set(this.david.position.x, 2.2, this.david.position.z);
    stone.castShadow = true;
    this.engine.scene.add(stone);

    // velocidade a partir da mira e da potência (calibrado p/ ser justo)
    const power = 22 + this.power * 22;        // força do arremesso
    const vx = this.aim.x * 16;
    const vy = 9 + this.aim.y * 14;            // arco mais alto
    const vz = -power;                          // sempre em direção a Golias
    this.projectiles.push({ mesh: stone, vel: new THREE.Vector3(vx, vy, vz), life: 0 });
    this.audio?.collect?.();
    this.power = 0;
    this.powerFill.style.width = '0%';

    if (this.stones === 0) {
      setTimeout(() => { if (!this.won) this._checkLastChance(); }, 2500);
    }
  }

  _checkLastChance() {
    if (!this.won && this.projectiles.length === 0) this._lose();
  }

  update(dt, t) {
    this.david.userData.animate?.(t, false);
    if (!this.lost && !this.won) {
      this.goliath.userData.animate?.(t, true);
      // Golias avança devagar
      this.goliath.position.z += 1.6 * dt;
      if (this.goliath.position.z > 12) this._lose();
    }

    // carregando a funda
    if (this.charging) {
      this.power = Math.min(1, this.power + dt * 0.9);
      this.powerFill.style.width = (this.power * 100) + '%';
      this.aimHint.textContent = 'Solte para arremessar!';
      // funda girando ao lado de Davi
      this.sling.visible = true;
      const a = t * 12;
      this.sling.position.set(
        this.david.position.x + Math.cos(a) * 0.8,
        2.4 + Math.sin(a) * 0.8,
        this.david.position.z
      );
    } else {
      this.sling.visible = false;
    }

    // física dos projéteis
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life += dt;
      p.vel.y -= 13 * dt;                     // gravidade (suavizada p/ jogabilidade)
      p.mesh.position.x += p.vel.x * dt;
      p.mesh.position.y += p.vel.y * dt;
      p.mesh.position.z += p.vel.z * dt;
      p.mesh.rotation.x += dt * 8; p.mesh.rotation.y += dt * 6;

      // colisão com a cabeça de Golias (área generosa)
      const target = new THREE.Vector3();
      this.goliath.userData.targetWorld.getWorldPosition(target);
      if (p.mesh.position.distanceTo(target) < 1.8) {
        this._hitGoliath(p, i);
        continue;
      }
      // saiu do mundo ou caiu no chão
      if (p.mesh.position.y < 0 || p.life > 4) {
        this.engine.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        if (this.stones === 0 && this.projectiles.length === 0 && !this.won) this._lose();
      }
    }
  }

  _hitGoliath(p, idx) {
    this.engine.scene.remove(p.mesh);
    this.projectiles.splice(idx, 1);
    this.won = true;
    this.audio?.victory?.();
    this.ui.showVerse(VERSES[2].t, VERSES[2].r, 6000);
    // Golias cai
    this._fallStart = 0;
    this._falling = true;
    this.engine.onUpdate((dt) => {
      if (!this._falling) return;
      this._fallStart += dt;
      this.goliath.rotation.x = Math.min(Math.PI / 2, this.goliath.rotation.x + dt * 2);
      this.goliath.position.y = -Math.min(2, this._fallStart * 2);
      if (this._fallStart > 1.5) { this._falling = false; setTimeout(() => this.complete(), 800); }
    });
  }

  _lose() {
    if (this.lost || this.won) return;
    this.lost = true;
    this.onFail?.({ n: 1, name: 'Davi e Golias' });
  }

  dispose() {
    super.dispose();
    // remove listeners e UI de mira
    if (this.aimEl) {
      window.removeEventListener('mousemove', this._move);
      window.removeEventListener('mouseup', this._up);
      window.removeEventListener('touchmove', this._move);
      window.removeEventListener('touchend', this._up);
      this.aimEl.remove();
    }
  }
}
